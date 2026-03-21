
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { EscPosEncoder } from '@/lib/printer';
import net from 'net';

export async function POST(request: Request) {
    let printerIp = '192.168.123.100';
    let printerPort = 9100;

    try {
        const body = await request.json();
        const { mesa, items, notas, id, tipo, fecha } = body;

        // Intentar obtener configuración de la base de datos
        const { data: config } = await supabase
            .from('configuracion_negocio')
            .select('printer_ip, printer_port')
            .maybeSingle();

        printerIp = config?.printer_ip || process.env.PRINTER_IP || '192.168.123.100';
        printerPort = parseInt(config?.printer_port || process.env.PRINTER_PORT || '9100');

        console.error('--- [DEBUG] INICIO DE IMPRESIÓN ---');
        console.error(`[DEBUG] IP Objetivo: ${printerIp}, Puerto: ${printerPort}`);


        // Validar datos mínimos
        if (!items || items.length === 0) {
            return NextResponse.json({ success: false, message: 'No hay items para imprimir' }, { status: 400 });
        }

        const encoder = new EscPosEncoder();

        // 1. Inicializar
        const fechaObj = fecha ? new Date(fecha) : new Date();
        const fechaFormat = fechaObj.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

        const buffer = encoder
            .initialize()
            .align('center')
            .bold(true)
            .size(1, 1)
            .text("THE BEAR")
            .newline()
            .text("COCINA")
            .newline()
            .bold(false)
            .size(0, 0)
            .text(fechaFormat)
            .newline()
            .line()
            .align('left')
            .bold(true)
            .size(1, 1)
            .text(`PEDIDO #${id?.slice(0, 8) || '???'}`)
            .newline()
            .text(tipo === 'llevar' ? 'PARA LLEVAR' : `MESA: ${mesa}`)
            .newline()
            .size(0, 0)
            .bold(false)
            .line()
            .align('left');

        // 2. Items
        items.forEach((item: any) => {
            encoder
                .bold(true)
                .size(2, 2) // TRIPLE TAMAÃ‘O (Gigante)
                .text(`${item.cantidad}x ${item.nombre}`)
                .newline()
                .size(0, 0); // Reset

            // Detalles más grandes (Doble tamaño) para que se lean bien
            if (item.detalles?.parte || item.detalles?.trozado || item.detalles?.notas) {
                encoder.size(1, 1).bold(false);

                if (item.detalles?.parte) {
                    encoder.text(`   Parte: ${item.detalles.parte}`).newline();
                }
                if (item.detalles?.trozado) {
                    encoder.text(`   Corte: ${item.detalles.trozado}`).newline();
                }
                if (item.detalles?.notas) {
                    encoder.bold(true).text(`   NOTA: ${item.detalles.notas}`).newline();
                }
                encoder.size(0, 0); // Reset
            }
            encoder.newline();
        });

        // 3. Notas Generales
        if (notas) {
            encoder.line()
                .bold(true)
                .text('NOTAS GENERALES:')
                .newline()
                .bold(false)
                .size(1, 1)
                .text(notas)
                .size(0, 0)
                .newline();
        }

        // 4. Corte
        const data = encoder
            .line()
            .feed(4)
            .cut()
            .encode();


        // 5. ¿Enviar directo o a la cola (Vercel)?
        const useCloudPrint = process.env.USE_CLOUD_PRINT === 'true' || process.env.NEXT_PUBLIC_VERCEL_ENV;

        if (useCloudPrint) {
            console.error('[DEBUG] Modo CLOUD detectado. Insertando en cola de impresión...');
            const { error: insertError } = await supabase
                .from('cola_impresion')
                .insert({
                    contenido: Buffer.from(data).toString('base64'),
                    estado: 'pendiente'
                });

            if (insertError) throw insertError;
            return NextResponse.json({ success: true, message: 'Pedido enviado a la cola de impresión (Vercel Mode)' });
        }

        // 6. Enviar a la impresora localmente (Modo Tradicional)
        await new Promise<void>((resolve, reject) => {
            const client = new net.Socket();

            // Timeout de conexión 5s (un poco más)
            client.setTimeout(5000);

            console.error(`[DEBUG] Intentando conectar a ${printerIp}:${printerPort}...`);

            client.connect(printerPort, printerIp, () => {
                console.error(`[DEBUG] ¡Conectado! Enviando datos...`);
                client.write(Buffer.from(data), (err) => {
                    if (err) {
                        console.error(`[DEBUG] Error al escribir:`, err);
                        client.destroy();
                        reject(err);
                    } else {
                        console.error(`[DEBUG] Datos enviados correctamente.`);
                        client.end(); // Cerrar conexión
                        resolve();
                    }
                });
            });

            client.on('error', (err) => {
                console.error(`[DEBUG] Error de socket:`, err);
                client.destroy();
                reject(err);
            });

            client.on('timeout', () => {
                console.error(`[DEBUG] Timeout alcanzado.`);
                client.destroy();
                reject(new Error('Tiempo de espera agotado.'));
            });
        });

        return NextResponse.json({ success: true, message: 'Impreso correctamente en cocina' });

    } catch (error: any) {
        console.error('Error de impresión (CATCH BLOCK):', error);

        let errorMessage = 'Error desconocido';
        if (error instanceof Error) {
            errorMessage = error.message;
            console.error('Stack:', error.stack);
        } else if (typeof error === 'string') {
            errorMessage = error;
        } else {
            try {
                errorMessage = JSON.stringify(error);
            } catch (e) {
                errorMessage = 'Error no serializable';
            }
        }

        return NextResponse.json({
            success: false,
            message: `Error al conectar con la impresora: ${errorMessage}. Asegúrate de que la impresora esté en ${printerIp}:${printerPort} y sea accesible desde el servidor.`
        }, { status: 500 });
    }
}
