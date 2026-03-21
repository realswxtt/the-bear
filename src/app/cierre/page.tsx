'use client';
import Image from "next/image";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock as LockIcon, DollarSign, Package, TrendingDown, AlertCircle, Check, Loader2, Share2, Calculator, FileSpreadsheet } from 'lucide-react';
import { useInventario } from '@/hooks/useInventario';
import { useVentas } from '@/hooks/useVentas';
import { useMetricas } from '@/hooks/useMetricas';
import { formatearCantidadProductos, formatearFraccionProducto } from '@/lib/utils';
import { generarReporteExcel } from '@/lib/excelReport';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import AnimatedCard from '@/components/AnimatedCard';
import { supabase, obtenerFechaHoy } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function CierreCajaPage() {
    return (
        <ProtectedRoute>
            <CierreCajaContent />
        </ProtectedRoute>
    );
}

function CierreCajaContent() {
    const router = useRouter();
    const { stock, loading } = useInventario();
    const { ventas } = useVentas();
    const metricas = useMetricas(ventas);

    // Estado para gastos del día
    const [gastosDelDia, setGastosDelDia] = useState<{ descripcion: string; monto: number; metodo_pago?: string }[]>([]);
    const totalGastos = gastosDelDia.reduce((sum, g) => sum + g.monto, 0);
    const gastosEfectivo = gastosDelDia.filter(g => !g.metodo_pago || g.metodo_pago === 'efectivo').reduce((sum, g) => sum + g.monto, 0);
    const gastosYape = gastosDelDia.filter(g => g.metodo_pago === 'yape').reduce((sum, g) => sum + g.monto, 0);
    const gastosPlin = gastosDelDia.filter(g => g.metodo_pago === 'plin').reduce((sum, g) => sum + g.monto, 0);

    // Estados para inputs manuales
    const [platosSobrantes, setPlatosSobrantes] = useState('');
    const [platosEnCaja, setPlatosEnCaja] = useState('');
    const [consumoPersonal, setConsumoPersonal] = useState('');
    const [mermaPlatos, setMermaPlatos] = useState('');
    const [stockGaseosasReal, setStockGaseosasReal] = useState('');
    const [stockInsumosFinal, setStockInsumosFinal] = useState('');
    const [dineroCajaReal, setDineroCajaReal] = useState('');
    const [observaciones, setObservaciones] = useState('');

    // Total de platos sobrantes
    const stockPlatosReal = (parseFloat(platosSobrantes || '0') + parseFloat(platosEnCaja || '0')).toString();

    const [procesando, setProcesando] = useState(false);
    const [cierreCompletado, setCierreCompletado] = useState(false);
    const [resumenWhatsApp, setResumenWhatsApp] = useState('');

    // Cargar gastos del día
    useEffect(() => {
        const cargarGastos = async () => {
            const { data } = await supabase
                .from('gastos')
                .select('descripcion, monto, metodo_pago')
                .eq('fecha', obtenerFechaHoy());
            setGastosDelDia(data || []);
        };
        cargarGastos();
    }, []);

    // Agrupar ventas por método de pago
    const ventasPorMetodo = ventas.reduce((acc, venta) => {
        if (venta.pago_dividido && venta.metodo_pago === 'mixto') {
            for (const [metodo, monto] of Object.entries(venta.pago_dividido)) {
                if (monto && monto > 0) {
                    acc[metodo] = (acc[metodo] || 0) + monto;
                }
            }
        } else {
            const metodo = venta.metodo_pago || 'efectivo';
            acc[metodo] = (acc[metodo] || 0) + venta.total;
        }
        return acc;
    }, {} as Record<string, number>);

    // Resumen de platos vendidos
    const desglosePlatos = { enteros: 0, medios: 0, cuartos: 0, octavos: 0, especiales: 0 };

    const ventasResumen = ventas.reduce((acc, venta) => {
        venta.items.forEach(item => {
            acc[item.nombre] = (acc[item.nombre] || 0) + item.cantidad;
        });
        return acc;
    }, {} as Record<string, number>);

    const listaPlatosVendidos = Object.entries(ventasResumen)
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);

    const calcularDiferencias = () => {
        if (!stock) return { diffPlatos: 0, diffGaseosas: 0 };
        const platosEsperados = stock.platos_disponibles;
        const gaseosasEsperadas = stock.gaseosas_disponibles;
        const stockFisico = parseFloat(stockPlatosReal || '0');
        const personalConsumo = parseFloat(consumoPersonal || '0');
        const merma = parseFloat(mermaPlatos || '0');
        const diffPlatos = (stockFisico + personalConsumo + merma) - platosEsperados;
        const diffGaseosas = parseInt(stockGaseosasReal || '0') - gaseosasEsperadas;
        return { diffPlatos, diffGaseosas };
    };

    const { diffPlatos, diffGaseosas } = calcularDiferencias();

    const handleConfetti = () => {
        const duration = 3000;
        const end = Date.now() + duration;
        (function frame() {
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#0077b6', '#00b4d8'] });
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#0077b6', '#00b4d8'] });
            if (Date.now() < end) requestAnimationFrame(frame);
        })();
    };

    const confirmarCierre = async () => {
        if (!stock) return;
        setProcesando(true);
        try {
            const { error } = await supabase
                .from('inventario_diario')
                .update({
                    estado: 'cerrado',
                    stock_platos_real: parseFloat(stockPlatosReal || '0'),
                    stock_gaseosas_real: parseInt(stockGaseosasReal || '0'),
                    insumos_principales_final: parseFloat(stockInsumosFinal || '0'),
                    dinero_cierre_real: parseFloat(dineroCajaReal || '0'),
                    consumo_personal: parseFloat(consumoPersonal || '0'),
                    merma_platos: parseFloat(mermaPlatos || '0'),
                    observaciones_cierre: observaciones,
                    bebidas_detalle: stock.bebidas_detalle || null,
                })
                .eq('fecha', obtenerFechaHoy());

            if (error) throw error;

            const totalEfectivoEsperado = (ventasPorMetodo['efectivo'] || 0) + (stock?.dinero_inicial || 0) - gastosEfectivo;
            const gastosTexto = gastosDelDia.length > 0 ? gastosDelDia.map(g => `- ${g.descripcion}: S/ ${g.monto.toFixed(2)}`).join('\n') : 'No hubo gastos registrados.';
            const platillosTexto = listaPlatosVendidos.length > 0 ? listaPlatosVendidos.map(item => `- ${item.nombre}: ${item.cantidad}`).join('\n') : 'No se vendieron platillos hoy.';

            const MARCA_LABEL: Record<string, string> = { inca_kola: 'Inca Kola', coca_cola: 'Coca Cola', sprite: 'Sprite', fanta: 'Fanta', agua_mineral: 'Agua Mineral' };
            const TIPO_LABEL: Record<string, string> = { personal_retornable: 'Pers. Ret.', descartable: 'Descartable', gordita: 'Gordita', litro: '1L', litro_medio: '1.5L', tres_litros: '3L', mediana: '2.25L', personal: '600ml', grande: '2.5L' };
            let bebidasTexto = '';
            if (stock?.bebidas_detalle) {
                const lineas: string[] = [];
                for (const [marca, tipos] of Object.entries(stock.bebidas_detalle)) {
                    const items = Object.entries(tipos as Record<string, number>).filter(([, qty]) => qty > 0);
                    if (items.length > 0) {
                        lineas.push(`*${MARCA_LABEL[marca] || marca}*`);
                        for (const [tipo, qty] of items) lineas.push(`   ${TIPO_LABEL[tipo] || tipo}: ${qty}`);
                    }
                }
                bebidasTexto = lineas.join('\n');
            }

            const mensaje = `🌊 *RESUMEN THE BEAR - ${new Date().toLocaleDateString('es-PE')}* 🌊

💰 *VENTAS TOTALES: S/ ${metricas.totalIngresos.toFixed(2)}*
--------------------------------
💵 Efectivo: S/ ${(ventasPorMetodo['efectivo'] || 0).toFixed(2)}
💳 Tarjeta: S/ ${(ventasPorMetodo['tarjeta'] || 0).toFixed(2)}
📲 Yape: S/ ${(ventasPorMetodo['yape'] || 0).toFixed(2)}
📲 Plin: S/ ${(ventasPorMetodo['plin'] || 0).toFixed(2)}

🤲 *EFECTIVO + BASE: S/ ${totalEfectivoEsperado.toFixed(2)}*

📤 *GASTOS DEL DÍA: S/ ${totalGastos.toFixed(2)}*
--------------------------------
${gastosTexto}

🐟 *DESGLOSE DE PLATOS*
--------------------------------
🍽️ Platos Iniciales: ${stock?.platos_dia || 0}
✅ Vendidos (Total): ${formatearCantidadProductos(metricas.platosVendidos)}
❌ Sobrantes Total: ${stockPlatosReal}
🍽️ Consumo Personal: ${consumoPersonal || '0'}
💥 Merma Platos: ${mermaPlatos || '0'}
📊 Platos Finales Netos: ${formatearFraccionProducto(parseFloat(stockPlatosReal || '0') - parseFloat(consumoPersonal || '0') - parseFloat(mermaPlatos || '0'))}

🐟 *INSUMO BASE (PESCADO)*
--------------------------------
Inicial: ${stock?.insumos_principales_inicial || 0} Kg
Final: ${stockInsumosFinal || 0} Kg
Consumo: ${((stock?.insumos_principales_inicial || 0) - (parseFloat(stockInsumosFinal) || 0)).toFixed(1)} Kg

📋 *PLATILLOS VENDIDOS*
--------------------------------
${platillosTexto}

🥤 *BEBIDAS SOBRANTES*
--------------------------------
${bebidasTexto || 'Sin bebidas restantes.'}

📊 *CUADRE DE STOCK*
--------------------------------
Platos Diff: ${diffPlatos > 0 ? '+' : ''}${formatearFraccionProducto(diffPlatos)} ${(parseFloat(consumoPersonal || '0') > 0 || parseFloat(mermaPlatos || '0') > 0) ? '(Inc. Justificados)' : ''}
Gaseosas Total: ${stockGaseosasReal} (Diff: ${diffGaseosas > 0 ? '+' : ''}${diffGaseosas})

_Generado por THE BEAR POS_`;

            setResumenWhatsApp(mensaje);
            setCierreCompletado(true);
            handleConfetti();
            toast.success('¡Jornada finalizada exitosamente!', { duration: 5000 });
        } catch (error: any) {
            console.error('Error al cerrar caja:', error);
            toast.error('Error al cerrar la caja: ' + error.message);
        } finally {
            setProcesando(false);
        }
    };

    const copiarWhatsApp = () => {
        navigator.clipboard.writeText(resumenWhatsApp);
        toast.success('Resumen copiado al portapapeles');
        window.open(`https://wa.me/?text=${encodeURIComponent(resumenWhatsApp)}`, '_blank');
    };

    const descargarExcel = async () => {
        if (!stock) return;
        try {
            const fileName = await generarReporteExcel({
                fecha: new Date().toLocaleDateString('es-PE'),
                stock,
                metricas,
                ventasPorMetodo,
                desglosePlatos,
                listaPlatosVendidos,
                gastosDelDia,
                totalGastos,
                stockPlatosReal,
                platosSobrantes,
                platosEnCaja,
                consumoPersonal,
                mermaPlatos,
                stockGaseosasReal,
                stockInsumosFinal,
                dineroCajaReal,
                observaciones,
                diffPlatos,
                diffGaseosas,
            });
            toast.success(`Excel descargado: ${fileName}`, { icon: '📊' });
        } catch (error) {
            console.error('Error al generar Excel:', error);
            toast.error('Error al generar el reporte Excel');
        }
    };

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-thebear-blue" /></div>;

    if (cierreCompletado) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-thebear-cream/50">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="text-green-600" size={40} />
                    </div>
                    <h1 className="text-3xl font-bold text-thebear-dark-blue mb-2">¡Cierre Exitoso!</h1>
                    <p className="text-thebear-dark-blue/60 mb-8">La jornada ha finalizado correctamente.</p>
                    <button onClick={copiarWhatsApp} className="w-full py-4 bg-[#25D366] text-white font-bold rounded-xl shadow-lg hover:brightness-105 transition-all flex items-center justify-center gap-2 mb-3">
                        <Share2 size={20} /> Compartir en WhatsApp
                    </button>
                    <button onClick={descargarExcel} className="w-full py-4 bg-[#217346] text-white font-bold rounded-xl shadow-lg hover:brightness-105 transition-all flex items-center justify-center gap-2 mb-3">
                        <FileSpreadsheet size={20} /> Descargar Reporte Excel
                    </button>
                    <button onClick={() => router.push('/')} className="w-full py-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all">
                        Volver al Inicio
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-4 md:p-8 max-w-4xl mx-auto pb-32">
            <header className="mb-4 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-thebear-dark-blue flex items-center gap-3">
                    <LockIcon className="text-thebear-blue" /> Cierre de Jornada
                </h1>
                <p className="text-sm sm:text-base text-thebear-dark-blue/60 mt-2">Verifica los montos y el inventario antes de finalizar el día.</p>
            </header>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <AnimatedCard delay={0.1}>
                        <div className="glass-card p-6 rounded-2xl shadow-3d">
                            <h2 className="text-xl font-bold text-thebear-dark-blue mb-4 flex items-center gap-2">
                                <span className="text-[18px] font-bold leading-none">S/</span> Resumen Financiero
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-yellow-50 border border-thebear-light-blue/20 rounded-xl">
                                    <span className="text-thebear-dark-blue/70 font-medium">Base Inicial</span>
                                    <span className="font-bold text-thebear-dark-blue">S/ {((stock?.dinero_inicial || 0)).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                                    <span className="text-thebear-dark-blue/70">Efectivo en Caja</span>
                                    <span className="font-bold text-thebear-dark-blue">S/ {(ventasPorMetodo['efectivo'] || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                                    <span className="text-thebear-dark-blue/70">Tarjeta (POS)</span>
                                    <span className="font-bold text-thebear-dark-blue">S/ {(ventasPorMetodo['tarjeta'] || 0).toFixed(2)}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex justify-between items-center p-3 bg-purple-50 border border-purple-100 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <Image src="/images/yape-logo.png" alt="Yape" width={20} height={20} className="object-contain" />
                                            <span className="text-purple-700 text-xs font-bold">Yape</span>
                                        </div>
                                        <span className="font-bold text-purple-900">S/ {((ventasPorMetodo['yape'] || 0) - gastosYape).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-cyan-50 border border-cyan-100 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <Image src="/images/plin-logo.png" alt="Plin" width={20} height={20} className="object-contain" />
                                            <span className="text-cyan-700 text-xs font-bold">Plin</span>
                                        </div>
                                        <span className="font-bold text-cyan-900">S/ {((ventasPorMetodo['plin'] || 0) - gastosPlin).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="border-t-2 border-dashed border-thebear-dark-blue/20 my-2 pt-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-lg text-thebear-dark-blue">TOTAL VENTAS</span>
                                        <span className="font-bold text-2xl text-thebear-blue">S/ {metricas.totalIngresos.toFixed(2)}</span>
                                    </div>
                                </div>
                                {gastosDelDia.length > 0 && (
                                    <div className="border-t border-thebear-dark-blue/10 pt-3 mt-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-red-600">📤 Gastos del Día</span>
                                            <span className="font-bold text-red-600">- S/ {totalGastos.toFixed(2)}</span>
                                        </div>
                                        <div className="space-y-1 max-h-24 overflow-y-auto">
                                            {gastosDelDia.map((g, i) => (
                                                <div key={i} className="flex justify-between text-xs text-thebear-dark-blue/60 bg-red-50 px-2 py-1 rounded">
                                                    <span>{g.descripcion}</span>
                                                    <span>S/ {g.monto.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </AnimatedCard>
                    <AnimatedCard delay={0.2}>
                        <div className="glass-card p-6 rounded-2xl shadow-3d bg-white/80">
                            <h2 className="text-xl font-bold text-thebear-dark-blue mb-4 flex items-center gap-2">
                                <Calculator className="text-thebear-blue" /> Cuadre de Caja (Efectivo)
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-thebear-dark-blue mb-1 block">Dinero Físico Contado (S/)</label>
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        value={dineroCajaReal}
                                        onChange={e => setDineroCajaReal(e.target.value)}
                                        className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-thebear-blue focus:outline-none text-xl font-bold text-thebear-dark-blue"
                                        placeholder="0.00"
                                    />
                                </div>
                                {dineroCajaReal && (
                                    <div className={`p-3 rounded-xl flex justify-between items-center ${parseFloat(dineroCajaReal) - ((ventasPorMetodo['efectivo'] || 0) + (stock?.dinero_inicial || 0) - gastosEfectivo) === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        <span className="font-medium">Diferencia:</span>
                                        <span className="font-bold">S/ {(parseFloat(dineroCajaReal) - ((ventasPorMetodo['efectivo'] || 0) + (stock?.dinero_inicial || 0) - gastosEfectivo)).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </AnimatedCard>
                </div>

                <div className="space-y-6">
                    <AnimatedCard delay={0.3}>
                        <div className="glass-card p-6 rounded-2xl shadow-3d">
                            <h2 className="text-xl font-bold text-thebear-dark-blue mb-4 flex items-center gap-2">
                                <Package className="text-thebear-dark-blue" /> Control de Stock Físico
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between mb-3 text-sm">
                                        <span className="text-thebear-dark-blue/60">Platos (Sistema): {formatearCantidadProductos(stock?.platos_disponibles || 0)}</span>
                                    </div>
                                    <div className="mb-4">
                                        <label className="text-sm font-medium text-thebear-dark-blue mb-1 block">Platos Sobrantes (Venta de Mañana)</label>
                                        <input type="number" step="1" value={platosSobrantes} onChange={e => setPlatosSobrantes(e.target.value)} className="w-full p-3 rounded-xl border-2 border-orange-200 bg-orange-50 focus:border-orange-400 focus:outline-none text-lg font-bold" placeholder="0" />
                                    </div>
                                    <div className="mb-3">
                                        <label className="text-sm font-medium text-thebear-dark-blue mb-1 block">Merma Platos (No Aptos)</label>
                                        <input type="number" step="1" value={mermaPlatos} onChange={e => setMermaPlatos(e.target.value)} className="w-full p-3 rounded-xl border-2 border-red-200 bg-red-50 focus:border-red-400 focus:outline-none text-lg font-bold" placeholder="0" />
                                    </div>
                                    <div className="mb-4">
                                        <label className="text-sm font-medium text-thebear-dark-blue mb-1 block">Consumo Personal (Platos)</label>
                                        <input type="number" step="1" value={consumoPersonal} onChange={e => setConsumoPersonal(e.target.value)} className="w-full p-3 rounded-xl border-2 border-purple-200 bg-purple-50 focus:border-purple-400 focus:outline-none text-lg font-bold" placeholder="0" />
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-100 rounded-xl">
                                        <span className="font-medium text-thebear-dark-blue">Total Físico (Sobrantes):</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg text-thebear-blue">{formatearFraccionProducto(parseFloat(stockPlatosReal || '0'))}</span>
                                            {stockPlatosReal && diffPlatos !== 0 && (
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${diffPlatos > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {diffPlatos > 0 ? '+' : ''}{formatearFraccionProducto(Math.abs(diffPlatos))}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="flex justify-between mb-2 text-sm">
                                        <span className="text-thebear-dark-blue/60">Insumos Iniciales: {stock?.insumos_principales_inicial || 0} Kg</span>
                                    </div>
                                    <label className="text-sm font-medium text-thebear-dark-blue mb-1 block">🐟 Stock Final Insumo Base (Kg)</label>
                                    <div className="relative">
                                        <input type="number" step="0.1" value={stockInsumosFinal} onChange={e => setStockInsumosFinal(e.target.value)} className="w-full p-3 rounded-xl border-2 border-blue-200 focus:border-blue-400 focus:outline-none text-lg font-bold" placeholder="0.0" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-thebear-dark-blue/40 text-sm font-bold">Kg</span>
                                    </div>
                                    {stock?.insumos_principales_inicial && stockInsumosFinal && (
                                        <p className="text-xs text-blue-700 mt-2 font-medium">📉 Consumo: {((stock.insumos_principales_inicial) - (parseFloat(stockInsumosFinal) || 0)).toFixed(1)} Kg</p>
                                    )}
                                </div>

                                <div>
                                    <div className="flex justify-between mb-2 text-sm">
                                        <span className="text-thebear-dark-blue/60">Gaseosas (Sistema): {stock?.gaseosas_disponibles || 0}</span>
                                    </div>
                                    <div className="flex gap-4 items-center">
                                        <div className="flex-1">
                                            <label className="text-sm font-medium text-thebear-dark-blue mb-1 block">Gaseosas Reales (Físico)</label>
                                            <input type="number" value={stockGaseosasReal} onChange={e => setStockGaseosasReal(e.target.value)} className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-thebear-light-blue focus:outline-none text-lg font-bold" placeholder="0" />
                                        </div>
                                        {stockGaseosasReal && diffGaseosas !== 0 && (
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${diffGaseosas > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {diffGaseosas > 0 ? '+' : ''}{diffGaseosas}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AnimatedCard>

                    <AnimatedCard delay={0.4}>
                        <div className="glass-card p-6 rounded-2xl shadow-3d bg-white">
                            <h2 className="text-lg font-bold text-thebear-dark-blue mb-3 flex items-center gap-2">
                                <Package className="text-thebear-blue" size={20} /> Detalle de Ventas
                            </h2>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {listaPlatosVendidos.length > 0 ? listaPlatosVendidos.map((plato, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                        <span className="text-sm text-thebear-dark-blue/80 font-medium">{plato.nombre}</span>
                                        <span className="bg-thebear-cream px-3 py-1 rounded-full text-sm font-black text-thebear-blue">x{plato.cantidad}</span>
                                    </div>
                                )) : (
                                    <p className="text-center py-4 text-thebear-dark-blue/40 italic text-sm">No hay ventas registradas</p>
                                )}
                            </div>
                        </div>
                    </AnimatedCard>

                    <AnimatedCard delay={0.5}>
                        <div className="glass-card p-6 rounded-2xl shadow-3d">
                            <label className="text-sm font-medium text-thebear-dark-blue mb-2 block">Observaciones Finales</label>
                            <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-thebear-blue/50 focus:outline-none h-24 resize-none" placeholder="Incidencias o notas..." />
                        </div>
                    </AnimatedCard>
                    <div className="h-24"></div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-gray-100 flex justify-end z-40">
                <motion.button
                    onClick={confirmarCierre}
                    disabled={procesando || (platosSobrantes === '' && platosEnCaja === '' && stockPlatosReal === '0') || !stockGaseosasReal || !dineroCajaReal}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-thebear-blue text-white font-bold py-4 px-8 rounded-2xl shadow-lg flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {procesando ? <><Loader2 className="animate-spin" /> Finalizando...</> : <><LockIcon /> FINALIZAR JORNADA</>}
                </motion.button>
            </div>
        </div>
    );
}
