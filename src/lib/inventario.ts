import { supabase, obtenerFechaHoy } from './supabase';

/**
 * Ajusta el stock de platos para el día actual sumando la cantidad proporcionada.
 */
export async function ajustarStockPlatos(cantidad: number): Promise<{ success: boolean; message: string }> {
    try {
        const fechaHoy = obtenerFechaHoy();

        // 1. Obtener registro actual
        const { data, error: fetchError } = await supabase
            .from('inventario_diario')
            .select('platos_dia')
            .eq('fecha', fechaHoy)
            .single();

        if (fetchError || !data) {
            return { success: false, message: 'No se encontró la apertura del día.' };
        }

        const nuevoTotal = (data.platos_dia || 0) + cantidad;

        // 2. Actualizar
        const { error: updateError } = await supabase
            .from('inventario_diario')
            .update({ platos_dia: nuevoTotal })
            .eq('fecha', fechaHoy);

        if (updateError) throw updateError;

        return { success: true, message: `Se añadieron ${cantidad} platos al stock.` };
    } catch (error: any) {
        console.error('Error al ajustar stock de platos:', error);
        return { success: false, message: error.message || 'Error al actualizar el stock.' };
    }
}

/**
 * Ajusta el dinero inicial (Caja Chica) sumando el monto proporcionado.
 */
export async function ajustarCajaChica(monto: number): Promise<{ success: boolean; message: string }> {
    try {
        const fechaHoy = obtenerFechaHoy();

        // 1. Obtener registro actual
        const { data, error: fetchError } = await supabase
            .from('inventario_diario')
            .select('dinero_inicial')
            .eq('fecha', fechaHoy)
            .single();

        if (fetchError || !data) {
            return { success: false, message: 'No se encontró la apertura del día.' };
        }

        const nuevoTotal = (data.dinero_inicial || 0) + monto;

        // 2. Actualizar
        const { error: updateError } = await supabase
            .from('inventario_diario')
            .update({ dinero_inicial: nuevoTotal })
            .eq('fecha', fechaHoy);

        if (updateError) throw updateError;

        return { success: true, message: `Se añadieron S/ ${monto.toFixed(2)} a la caja chica.` };
    } catch (error: any) {
        console.error('Error al ajustar caja chica:', error);
        return { success: false, message: error.message || 'Error al actualizar la caja.' };
    }
}

/**
 * Ajusta el stock de chicha (litros) sumando la cantidad proporcionada.
 */
export async function ajustarStockChicha(cantidad: number): Promise<{ success: boolean; message: string }> {
    try {
        const fechaHoy = obtenerFechaHoy();

        // 1. Obtener registro actual
        const { data, error: fetchError } = await supabase
            .from('inventario_diario')
            .select('chicha_inicial')
            .eq('fecha', fechaHoy)
            .single();

        if (fetchError || !data) {
            return { success: false, message: 'No se encontró la apertura del día.' };
        }

        const nuevoTotal = (data.chicha_inicial || 0) + cantidad;

        // 2. Actualizar
        const { error: updateError } = await supabase
            .from('inventario_diario')
            .update({ chicha_inicial: nuevoTotal })
            .eq('fecha', fechaHoy);

        if (updateError) throw updateError;

        return { success: true, message: `Se añadieron ${cantidad.toFixed(2)}L de chicha al stock.` };
    } catch (error: any) {
        console.error('Error al ajustar stock de chicha:', error);
        return { success: false, message: error.message || 'Error al actualizar el stock.' };
    }
}
/**
 * Ajusta el stock de insumos principales (Kg) sumando la cantidad proporcionada.
 */
export async function ajustarStockInsumos(cantidad: number): Promise<{ success: boolean; message: string }> {
    try {
        const fechaHoy = obtenerFechaHoy();

        // 1. Obtener registro actual
        const { data, error: fetchError } = await supabase
            .from('inventario_diario')
            .select('insumos_principales_inicial')
            .eq('fecha', fechaHoy)
            .single();

        if (fetchError || !data) {
            return { success: false, message: 'No se encontró la apertura del día.' };
        }

        const nuevoTotal = (data.insumos_principales_inicial || 0) + cantidad;

        // 2. Actualizar
        const { error: updateError } = await supabase
            .from('inventario_diario')
            .update({ insumos_principales_inicial: nuevoTotal })
            .eq('fecha', fechaHoy);

        if (updateError) throw updateError;

        return { success: true, message: `Se añadieron ${cantidad.toFixed(1)}Kg de insumo al stock.` };
    } catch (error: any) {
        console.error('Error al ajustar stock de insumos:', error);
        return { success: false, message: error.message || 'Error al actualizar el stock.' };
    }
}
