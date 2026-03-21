'use client';

import { useState, useEffect } from 'react';
import { supabase, obtenerFechaHoy } from '@/lib/supabase';
import type { StockActual, BebidasDetalle } from '@/lib/database.types';

interface UseInventarioResult {
    stock: StockActual | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

// Estructura por defecto - siempre se muestra, aunque todo sea 0
const DEFAULT_BEBIDAS: BebidasDetalle = {
    inca_kola: { personal_retornable: 0, descartable: 0, gordita: 0, litro: 0, litro_medio: 0, tres_litros: 0 },
    coca_cola: { personal_retornable: 0, descartable: 0, litro: 0, litro_medio: 0, tres_litros: 0 },
    fanta: { descartable: 0 },
    agua_mineral: { personal: 0 },
};

/** Resta las bebidas vendidas del stock inicial */
function calcularBebidasActuales(inicial: BebidasDetalle, ventasArray: BebidasDetalle[]): BebidasDetalle {
    // Clonar para no mutar
    const resultado: BebidasDetalle = JSON.parse(JSON.stringify(inicial));

    for (const venta of ventasArray) {
        if (!venta) continue;
        for (const marcaKey of Object.keys(venta)) {
            const marca = marcaKey as keyof BebidasDetalle;
            const tiposVenta = venta[marca];
            if (!tiposVenta || !resultado[marca]) continue;

            for (const tipoKey of Object.keys(tiposVenta)) {
                const cantidadVendida = (tiposVenta as Record<string, number>)[tipoKey] || 0;
                const actual = ((resultado[marca] as Record<string, number>)[tipoKey]) || 0;
                (resultado[marca] as Record<string, number>)[tipoKey] = Math.max(0, actual - cantidadVendida);
            }
        }
    }

    return resultado;
}

/**
 * Hook personalizado para obtener el stock actual del día
 * Obtiene datos DIRECTAMENTE de las tablas, sin depender de funciones RPC
 */
export const useInventario = (): UseInventarioResult => {
    const [stock, setStock] = useState<StockActual | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStock = async () => {
        try {
            setLoading(true);
            setError(null);

            const fechaHoy = obtenerFechaHoy();

            // 1. Obtener inventario del día directamente de la tabla
            const { data: inventario, error: invError } = await supabase
                .from('inventario_diario')
                .select('*')
                .eq('fecha', fechaHoy)
                .single();

            // Si no hay inventario para hoy, no hay apertura
            if (invError || !inventario) {
                setStock(null);
                if (invError && invError.code !== 'PGRST116') {
                    setError(`Error verificando apertura: ${invError.message}`);
                } else {
                    setError('No se ha realizado la apertura del día');
                }
                return;
            }

            // Si el inventario está cerrado
            if (inventario.estado === 'cerrado') {
                setStock(null);
                setError('La jornada ha finalizado. Realiza una nueva apertura para el siguiente día.');
                return;
            }

            // 2. Obtener TODAS las ventas del día, productos (recetas) y mermas
            const [ventasRes, productosRes, mermasRes] = await Promise.all([
                supabase.from('ventas').select('insumos_restados, gaseosas_restadas, chicha_restada, bebidas_detalle, items').eq('fecha', fechaHoy),
                supabase.from('productos').select('id, nombre, receta_detalle'),
                supabase.from('mermas').select('insumo, cantidad').eq('fecha', fechaHoy)
            ]);

            const ventasDelDia = ventasRes.data;
            const productos = productosRes.data || [];
            const mermasDelDia = mermasRes.data || [];

            if (ventasRes.error) console.error('Error obteniendo ventas:', ventasRes.error.message || ventasRes.error);
            if (mermasRes.error) console.error('Error obteniendo mermas:', mermasRes.error.message || mermasRes.error);

            // Crear mapa de recetas para búsqueda rápida
            const recetasMap = new Map<string, Record<string, number>>();
            productos.forEach(p => {
                if (p.receta_detalle) recetasMap.set(p.id, p.receta_detalle as Record<string, number>);
            });

            // 3. Calcular totales de platos, gaseosas y consumo de insumos (recetas)
            let insumosVendidos = 0;
            let gaseosasVendidas = 0;
            let chichaVendida = 0;
            const ventasBebidasArray: BebidasDetalle[] = [];
            const insumosDetalleVendido: Record<string, number> = {};

            if (ventasDelDia) {
                for (const v of ventasDelDia) {
                    insumosVendidos += (v as any).insumos_restados || 0;
                    gaseosasVendidas += v.gaseosas_restadas || 0;
                    chichaVendida += v.chicha_restada || 0;
                    if (v.bebidas_detalle) {
                        ventasBebidasArray.push(v.bebidas_detalle as BebidasDetalle);
                    }

                    // Calcular consumo de insumos por receta
                    if (v.items) {
                        const items = v.items as any[];
                        for (const item of items) {
                            if (!item.producto_id) continue;
                            const receta = recetasMap.get(item.producto_id);
                            const cantidadVendida = item.cantidad || 1;

                            if (receta && Object.keys(receta).length > 0) {
                                // Multiplicar cada ingrediente por la cantidad vendida
                                Object.entries(receta).forEach(([ingrediente, cantIngrediente]) => {
                                    if (!insumosDetalleVendido[ingrediente]) {
                                        insumosDetalleVendido[ingrediente] = 0;
                                    }
                                    insumosDetalleVendido[ingrediente] += (cantIngrediente * cantidadVendida);
                                });
                            }
                            // Lógica de respaldo por si no hay receta pero sí hay nombre (legado para pescado)
                            else if (item.nombre) {
                                const nombre = item.nombre.toLowerCase();
                                if (nombre.includes('dúo') || nombre.includes('duo') || nombre.includes('trío') || nombre.includes('trio') || nombre.includes('triple')) {
                                    insumosDetalleVendido.pescado = (insumosDetalleVendido.pescado || 0) + (0.130 * cantidadVendida);
                                } else if (nombre.includes('ceviche') || nombre.includes('cebiche')) {
                                    insumosDetalleVendido.pescado = (insumosDetalleVendido.pescado || 0) + (0.150 * cantidadVendida);
                                }
                            }
                        }
                    }
                }
            }

            // Sumar Mermas
            const insumosMermados: Record<string, number> = {};
            mermasDelDia.forEach(m => {
                insumosMermados[m.insumo] = (insumosMermados[m.insumo] || 0) + Number(m.cantidad);
            });

            // 4. Calcular bebidas actuales (inicial - vendidas)
            const bebidasInicial: BebidasDetalle = inventario.bebidas_detalle
                ? (inventario.bebidas_detalle as BebidasDetalle)
                : { ...JSON.parse(JSON.stringify(DEFAULT_BEBIDAS)) };

            const bebidasActuales = ventasBebidasArray.length > 0
                ? calcularBebidasActuales(bebidasInicial, ventasBebidasArray)
                : bebidasInicial;

            // 5. Armar el stock completo
            const insumosDetalleInicial = (inventario.insumos_detalle as Record<string, number>) || {};
            const insumosDetalleDisponible: Record<string, number> = {};

            // Consolidar todos los insumos únicos (de apertura, ventas y mermas)
            const todosLosInsumos = new Set([
                ...Object.keys(insumosDetalleInicial),
                ...Object.keys(insumosDetalleVendido),
                ...Object.keys(insumosMermados)
            ]);

            todosLosInsumos.forEach(insumo => {
                const inicial = insumosDetalleInicial[insumo] || 0;
                const vendido = insumosDetalleVendido[insumo] || 0;
                const mermado = insumosMermados[insumo] || 0;
                insumosDetalleDisponible[insumo] = Math.max(0, inicial - vendido - mermado);
            });

            // Calcular platos basados en Pescado (si no hay platos_dia definidos o es 0)
            // Usamos 150g (0.150kg) como promedio de referencia
            const pescadoInicial = insumosDetalleInicial.pescado || 0;
            const pescadoDisponible = insumosDetalleDisponible.pescado || 0;

            const platosInicialesEstimados = Math.floor(pescadoInicial / 0.150);
            const platosDisponiblesEstimados = Math.floor(pescadoDisponible / 0.150);

            const stockCalculado: StockActual = {
                fecha: inventario.fecha,
                platos_dia: inventario.platos_dia || platosInicialesEstimados,
                gaseosas: inventario.gaseosas || 0,
                platos_disponibles: inventario.platos_dia ? (inventario.platos_dia - insumosVendidos) : platosDisponiblesEstimados,
                gaseosas_disponibles: (inventario.gaseosas || 0) - gaseosasVendidas,
                platos_iniciales: inventario.platos_dia || platosInicialesEstimados,
                gaseosas_iniciales: inventario.gaseosas || 0,
                platos_vendidos: insumosVendidos,
                gaseosas_vendidas: gaseosasVendidas,
                insumos_principales_inicial: inventario.insumos_principales_inicial || 0,
                insumos_detalle_inicial: insumosDetalleInicial,
                insumos_detalle_vendido: insumosDetalleVendido,
                insumos_detalle_disponible: insumosDetalleDisponible,
                dinero_inicial: inventario.dinero_inicial || 0,
                chicha_inicial: inventario.chicha_inicial || 0,
                chicha_vendida: chichaVendida,
                chicha_disponible: (inventario.chicha_inicial || 0) - chichaVendida,
                estado: 'abierto',
                bebidas_detalle: bebidasActuales,
            };

            setStock(stockCalculado);

        } catch (err) {
            console.error('Error al obtener stock:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
            setStock(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStock();

        // Suscribirse a cambios en tiempo real
        const channel = supabase
            .channel('stock-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'ventas',
                },
                () => {
                    fetchStock();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'inventario_diario',
                },
                () => {
                    fetchStock();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'mermas',
                },
                () => {
                    fetchStock();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return {
        stock,
        loading,
        error,
        refetch: fetchStock,
    };
};
