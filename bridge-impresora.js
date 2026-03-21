const { createClient } = require('@supabase/supabase-js');
const net = require('net');
try {
    require('dotenv').config({ path: '.env.local' });
} catch (e) {
    // Si no está dotenv, asumimos que se pasó --env-file o las variables ya están
    console.log('💡 Info: No se encontró "dotenv", usando variables de entorno nativas.');
}

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
        table: 'cola_impresion'
    }, async (payload) => {
        const job = payload.new;
        console.log(`🔔 Nuevo trabajo recibido: ${job.id} (Estado: ${job.estado})`);

        if (job.estado !== 'pendiente') {
            console.log(`⚠️ Ignorando trabajo ${job.id} porque no está pendiente.`);
            return;
        }

        // Verificación atómica: Intentar marcar como 'impreso' primero.
        // Si el update tiene éxito (row count > 0), significa que nadie más lo ha impreso.
        const { data: lock, error: lockError } = await supabase
            .from('cola_impresion')
            .update({ estado: 'impreso' })
            .eq('id', job.id)
            .eq('estado', 'pendiente')
            .select();

        if (lockError || !lock || lock.length === 0) {
            console.log(`⏩ Trabajo ${job.id} ya fue procesado por otra instancia.`);
            return;
        }

        try {
            await imprimir(job);
        } catch (error) {
            console.error(`❌ Fallo crítico imprimiendo trabajo ${job.id}:`, error.message);
            await supabase
                .from('cola_impresion')
                .update({ estado: 'error' })
                .eq('id', job.id);
        }
    })
    .subscribe((status) => {
        console.log(`📡 Estado de la conexión Realtime: ${status}`);
        if (status === 'SUBSCRIBED') {
            console.log('✅ Suscrito con éxito a la tabla cola_impresion.');
        } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Error de canal: Asegúrate de que el Realtime esté habilitado para cola_impresion en Supabase.');
        }
    });

// Periodic Heartbeat
setInterval(() => {
    if (channel.state === 'joined') {
        // console.log('💓 Puente activo y conectado...');
    }
}, 30000);

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
            // Re-verificar estado atómicamente antes de imprimir
            const { data: lock } = await supabase
                .from('cola_impresion')
                .update({ estado: 'impreso' })
                .eq('id', job.id)
                .eq('estado', 'pendiente')
                .select();

            if (lock && lock.length > 0) {
                try {
                    await imprimir(job);
                } catch (err) {
                    await supabase.from('cola_impresion').update({ estado: 'error' }).eq('id', job.id);
                }
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
