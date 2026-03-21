-- ESQUEMA DE BASE DE DATOS PARA THE BEAR POS (Supabase) - REFACTORIZADO MARÍTIMO

-- 1. Perfiles de Usuario
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('administrador', 'cajera', 'mozo', 'cocina')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Mesas
CREATE TABLE IF NOT EXISTS public.mesas (
    id SERIAL PRIMARY KEY,
    numero INTEGER NOT NULL UNIQUE,
    estado TEXT DEFAULT 'libre' CHECK (estado IN ('libre', 'ocupada')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Productos (Carta)
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('plato', 'bebida', 'complemento', 'promocion')),
    precio NUMERIC NOT NULL,
    activo BOOLEAN DEFAULT true,
    marca_gaseosa TEXT, -- Opcional para bebidas
    tipo_gaseosa TEXT, -- Opcional para bebidas
    imagen_url TEXT,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Inventario Diario (Apertura y Cierre)
CREATE TABLE IF NOT EXISTS public.inventario_diario (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
    platos_dia NUMERIC DEFAULT 0, -- Stock inicial de porciones/platos preparados
    gaseosas INTEGER DEFAULT 0,
    dinero_inicial NUMERIC DEFAULT 0,
    bebidas_detalle JSONB DEFAULT '{}',
    estado TEXT DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado')),
    stock_platos_real NUMERIC,
    stock_gaseosas_real INTEGER,
    insumos_principales_inicial NUMERIC DEFAULT 0, -- Ej: Kg de pescado inicial
    insumos_principales_final NUMERIC DEFAULT 0,   -- Ej: Kg de pescado final
    insumos_detalle JSONB DEFAULT '{}',           -- Desglose (Pescado, Mixtura, Pota)
    consumo_personal NUMERIC DEFAULT 0,
    merma_platos NUMERIC DEFAULT 0,
    dinero_cierre_real NUMERIC,
    chicha_inicial NUMERIC DEFAULT 0,
    chicha_disponible NUMERIC DEFAULT 0,
    observaciones_cierre TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Ventas
CREATE TABLE IF NOT EXISTS public.ventas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    total NUMERIC NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    insumos_restados NUMERIC DEFAULT 0, -- Cantidad de insumo/platos restados
    gaseosas_restadas INTEGER DEFAULT 0,
    chicha_restada NUMERIC DEFAULT 0,
    bebidas_detalle JSONB DEFAULT '{}',
    metodo_pago TEXT NOT NULL, -- efectivo, tarjeta, yape, plin, mixto
    pago_dividido JSONB,
    estado_pedido TEXT DEFAULT 'entregado',
    estado_pago TEXT DEFAULT 'pagado',
    mesa_id INTEGER REFERENCES public.mesas(id),
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Gastos
CREATE TABLE IF NOT EXISTS public.gastos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    descripcion TEXT NOT NULL,
    monto NUMERIC NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    metodo_pago TEXT DEFAULT 'efectivo',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Configuración del Negocio
CREATE TABLE IF NOT EXISTS public.configuracion_negocio (
    id SERIAL PRIMARY KEY,
    ruc TEXT,
    razon_social TEXT DEFAULT 'THE BEAR',
    direccion TEXT,
    telefono TEXT,
    mensaje_boleta TEXT DEFAULT '¡Gracias por su preferencia!',
    serie_boleta TEXT DEFAULT 'B001',
    numero_correlativo INTEGER DEFAULT 0,
    serie_ticket TEXT DEFAULT 'T001',
    numero_ticket INTEGER DEFAULT 0,
    printer_ip TEXT DEFAULT '192.168.123.100',
    printer_port INTEGER DEFAULT 9100,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Trigger para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, nombre, email, rol, activo)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'nombre', 'Usuario Nuevo'), new.email, 'mozo', true);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- INSERCIONES INICIALES
INSERT INTO public.mesas (numero) 
SELECT generate_series(1, 25)
ON CONFLICT (numero) DO NOTHING;

INSERT INTO public.configuracion_negocio (razon_social)
VALUES ('THE BEAR')
ON CONFLICT DO NOTHING;

-- 9. Cola de Impresión (Para Vercel + Local Bridge)
CREATE TABLE IF NOT EXISTS public.cola_impresion (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contenido JSONB NOT NULL,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'impreso', 'error')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar tiempo real para la cola
ALTER TABLE public.cola_impresion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo en cola" ON public.cola_impresion FOR ALL USING (true);
