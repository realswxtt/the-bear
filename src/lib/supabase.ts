import { createClient } from '@supabase/supabase-js';

// Validar que las variables de entorno estén configuradas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn(
        '⚠️ Advertencia: Faltan las variables de entorno de Supabase. ' +
        'Si estás en local, asegúrate de configurar .env.local. ' +
        'Si estás en Vercel, agrégalas en el panel de configuración.'
    );
}

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true, // IMPORTANTE: Habilitar persistencia de sesión
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
    },
});

// Helper para formatear fechas en formato YYYY-MM-DD usando hora LOCAL (no UTC)
export const formatearFecha = (fecha: Date = new Date()): string => {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper para obtener la fecha actual en hora LOCAL
export const obtenerFechaHoy = (): string => {
    return formatearFecha(new Date());
};
