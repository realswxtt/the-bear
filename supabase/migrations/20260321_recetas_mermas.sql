-- Migración para el Sistema Avanzado de Recetas y Control de Mermas

-- 1. Añadir receta_detalle a productos
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS receta_detalle JSONB DEFAULT '{}';

-- 2. Crear tabla de mermas
CREATE TABLE IF NOT EXISTS public.mermas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    insumo VARCHAR(50) NOT NULL,
    cantidad NUMERIC NOT NULL,
    motivo TEXT,
    usuario_id UUID REFERENCES auth.users ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Permisos RLS para Mermas
ALTER TABLE public.mermas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura a usuarios" ON public.mermas
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserción a usuarios" ON public.mermas
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización a usuarios" ON public.mermas
    FOR UPDATE USING (true);
