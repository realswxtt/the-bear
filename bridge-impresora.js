const { createClient } = require('@supabase/supabase-js');
const net = require('net');
require('dotenv').config({ path: '.env.local' });

// Configuración desde .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Faltan las credenciales de Supabase en .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Agente de Impresión "The Bear" iniciado...');
console.log('📡 Escuchando cola de impresión en Supabase Realtime...');

// Función para imprimir
async function imprimir(job) {
    const { id, contenido } = job;

    // Obtener config de impresora desde la DB (por si cambió)
    const { data: config } = await supabase
        .from('configuracion_negocio')
        .select('printer_ip, printer_port')
        .maybeSingle();

    const ip = config?.printer_ip || '192.168.123.100';
    const port = config?.printer_port || 9100;

    console.log(`🖨️  Imprimiendo trabajo ${id} en ${ip}:${port}...`);

    return new Promise((resolve, reject) => {
        const client = new net.Socket();

        client.setTimeout(5000);

        client.connect(port, ip, () => {
            const buffer = Buffer.from(contenido, 'base64');
            client.write(buffer, () => {
                console.log(`✅ Trabajo ${id} enviado con éxito.`);
                client.end();
                resolve();
            });
        });

        client.on('error', (err) => {
            console.error(`❌ Error en trabajo ${id}:`, err.message);
            client.destroy();
            reject(err);
        });

        client.on('timeout', () => {
            console.error(`⏳ Timeout en trabajo ${id}`);
            client.destroy();
            reject(new Error('Timeout'));
        });
    });
}

// Suscribirse a cambios en tiempo real
const channel = supabase
    .channel('cola-impresion')
    .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'cola_impresion',
        filter: 'estado=eq.pendiente'
    }, async (payload) => {
        const job = payload.new;
        try {
            await imprimir(job);
            await supabase
                .from('cola_impresion')
                .update({ estado: 'impreso' })
                .eq('id', job.id);
        } catch (error) {
            await supabase
                .from('cola_impresion')
                .update({ estado: 'error' })
                .eq('id', job.id);
        }
    })
    .subscribe();

// Procesar pendientes al iniciar
async function procesarPendientes() {
    console.log('🔍 Revisando trabajos pendientes previos...');
    const { data: pendientes } = await supabase
        .from('cola_impresion')
        .select('*')
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: true });

    if (pendientes && pendientes.length > 0) {
        console.log(`📝 Encontrados ${pendientes.length} trabajos pendientes.`);
        for (const job of pendientes) {
            try {
                await imprimir(job);
                await supabase.from('cola_impresion').update({ estado: 'impreso' }).eq('id', job.id);
            } catch (err) {
                await supabase.from('cola_impresion').update({ estado: 'error' }).eq('id', job.id);
            }
        }
    }
}

procesarPendientes();

// Mantener el proceso vivo
process.on('SIGINT', () => {
    console.log('👋 Cerrando agente de impresión...');
    process.exit();
});
