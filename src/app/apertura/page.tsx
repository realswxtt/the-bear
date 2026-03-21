'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, RefreshCw, ArrowRight } from 'lucide-react';
import { supabase, obtenerFechaHoy } from '@/lib/supabase';
import toast from 'react-hot-toast';
import type { BebidasDetalle } from '@/lib/database.types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// Configuración de marcas con sus tamaños reales en Perú
const MARCAS_CONFIG = [
    {
        key: 'inca_kola',
        name: 'Inca Kola',
        dot: 'bg-yellow-500',
        sizes: [
            { key: 'personal_retornable', label: 'Personal Ret.', desc: '296ml' },
            { key: 'descartable', label: 'Descartable', desc: '600ml' },
            { key: 'gordita', label: 'Gordita', desc: '625ml' },
            { key: 'litro', label: '1 Litro', desc: '1L' },
            { key: 'litro_medio', label: '1.5 Litros', desc: '1.5L' },
            { key: 'tres_litros', label: '3 Litros', desc: '3L' },
        ],
    },
    {
        key: 'coca_cola',
        name: 'Coca Cola',
        dot: 'bg-red-600',
        sizes: [
            { key: 'personal_retornable', label: 'Personal Ret.', desc: '296ml' },
            { key: 'descartable', label: 'Descartable', desc: '600ml' },
            { key: 'litro', label: '1 Litro', desc: '1L' },
            { key: 'litro_medio', label: '1.5 Litros', desc: '1.5L' },
            { key: 'tres_litros', label: '3 Litros', desc: '3L' },
        ],
    },
    {
        key: 'fanta',
        name: 'Fanta',
        dot: 'bg-orange-500',
        sizes: [
            { key: 'descartable', label: 'Personal', desc: '500ml' },
        ],
    },
    {
        key: 'agua_mineral',
        name: 'Agua Mineral',
        dot: 'bg-sky-400',
        sizes: [
            { key: 'personal', label: 'Personal', desc: '600ml' },
        ],
    },
] as const;



export default function AperturaPage() {
    return (
        <ProtectedRoute>
            <AperturaContent />
        </ProtectedRoute>
    );
}

function AperturaContent() {
    const router = useRouter();
    const [insumosPrincipalesInicial, setInsumosPrincipalesInicial] = useState('');
    const [chichaInicial, setChichaInicial] = useState('');
    const [maracuyaInicial, setMaracuyaInicial] = useState('');
    const [maracumangoInicial, setMaracumangoInicial] = useState('');
    const [limonadaInicial, setLimonadaInicial] = useState('');

    const [pescadoInicial, setPescadoInicial] = useState('');
    const [mixturaInicial, setMixturaInicial] = useState('');
    const [potaInicial, setPotaInicial] = useState('');

    const [dineroInicial, setDineroInicial] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingPrevious, setLoadingPrevious] = useState(true);
    const [previousDayLoaded, setPreviousDayLoaded] = useState(false);

    // Detailed beverage state
    const [bebidasDetalle, setBebidasDetalle] = useState<BebidasDetalle>({
        inca_kola: { personal_retornable: 0, descartable: 0, gordita: 0, litro: 0, litro_medio: 0, tres_litros: 0 },
        coca_cola: { personal_retornable: 0, descartable: 0, litro: 0, litro_medio: 0, tres_litros: 0 },
        fanta: { descartable: 0 },
        agua_mineral: { personal: 0 },
        chicha: { litro: 0 },
        maracuya: { litro: 0 },
        maracumango: { litro: 0 },
        limonada: { litro: 0 },
    });
    const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());

    // Cargar stock del día anterior al montar
    useEffect(() => {
        loadPreviousDayStock();
    }, []);

    const loadPreviousDayStock = async () => {
        setLoadingPrevious(true);
        try {
            const { data } = await supabase
                .from('inventario_diario')
                .select('bebidas_detalle')
                .eq('estado', 'cerrado')
                .not('bebidas_detalle', 'is', null) // Asegurar que tenga detalle
                .order('fecha', { ascending: false })
                .limit(1)
                .single();

            if (data) {
                if (data.bebidas_detalle) {
                    const detail = data.bebidas_detalle as BebidasDetalle;
                    setBebidasDetalle(detail);

                    // Cargar bebidas naturales individuales si existen en el detalle
                    if (detail.chicha?.litro) setChichaInicial(detail.chicha.litro.toString());
                    if (detail.maracuya?.litro) setMaracuyaInicial(detail.maracuya.litro.toString());
                    if (detail.maracumango?.litro) setMaracumangoInicial(detail.maracumango.litro.toString());
                    if (detail.limonada?.litro) setLimonadaInicial(detail.limonada.litro.toString());
                }
                // Si hay stock de gaseosas disponible, lo usamos como base, pero el detalle es la fuente de verdad.
                // El usuario pidió que se cargue solo una vez y se guarde para el día siguiente.
                // Al cargar el detalle del cierre anterior, ya estamos cumpliendo esto.
                // Solo falta confirmar que esto se guarde como "stock inicial" del nuevo día.
                // En `handleGuardarApertura` se usa `bebidasDetalle` para init.

                setPreviousDayLoaded(true);
                toast.success('Stock de bebidas del día anterior cargado automáticamente (Continuidad)', { icon: '📦' });
            }
        } catch {
            console.log('No se encontró stock previo de bebidas');
        } finally {
            setLoadingPrevious(false);
        }
    };

    const updateBeverage = (brand: keyof BebidasDetalle, size: string, value: string) => {
        const numValue = value === '' ? 0 : parseInt(value) || 0;
        setBebidasDetalle(prev => ({
            ...prev,
            [brand]: {
                ...prev[brand],
                [size]: numValue
            }
        }));
    };

    const calculateTotalBeverages = (): number => {
        let total = 0;
        Object.values(bebidasDetalle).forEach(brand => {
            if (brand) {
                Object.values(brand).forEach(qty => {
                    total += (qty as number) || 0;
                });
            }
        });
        return total;
    };

    // Efecto para actualizar el total visual si se carga el detalle
    // No necesitamos state extra, usamos la función en el render.

    const resetBeverages = () => {
        setBebidasDetalle({
            inca_kola: { personal_retornable: 0, descartable: 0, gordita: 0, litro: 0, litro_medio: 0, tres_litros: 0 },
            coca_cola: { personal_retornable: 0, descartable: 0, litro: 0, litro_medio: 0, tres_litros: 0 },
            fanta: { descartable: 0 },
            agua_mineral: { personal: 0 },
            chicha: { litro: 0 },
            maracuya: { litro: 0 },
            maracumango: { litro: 0 },
            limonada: { litro: 0 },
        });
        setChichaInicial('');
        setMaracuyaInicial('');
        setMaracumangoInicial('');
        setLimonadaInicial('');
        setPreviousDayLoaded(false);
        toast.success('Stock de bebidas reiniciado');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const platos = 0; // Removido por el usuario, ahora se basa en pescado
        const insumos = parseFloat(insumosPrincipalesInicial) || 0;
        const chicha = parseFloat(chichaInicial) || 0;
        const maracuya = parseFloat(maracuyaInicial) || 0;
        const maracumango = parseFloat(maracumangoInicial) || 0;
        const limonada = parseFloat(limonadaInicial) || 0;

        const pescado = parseFloat(pescadoInicial) || 0;
        const mixtura = parseFloat(mixturaInicial) || 0;
        const pota = parseFloat(potaInicial) || 0;

        const totalBebidas = calculateTotalBeverages();



        setLoading(true);

        try {
            const fechaHoy = obtenerFechaHoy();

            // Verificar si ya existe apertura para hoy
            const { data: existente } = await supabase
                .from('inventario_diario')
                .select('*')
                .eq('fecha', fechaHoy)
                .single();

            if (existente) {
                const updateData = {
                    platos_dia: platos,
                    insumos_principales_inicial: pescado + mixtura + pota, // Total Kg for backward compatibility
                    insumos_detalle: { pescado, mixtura, pota },
                    chicha_inicial: chicha,
                    gaseosas: totalBebidas,
                    dinero_inicial: parseFloat(dineroInicial) || 0,
                    bebidas_detalle: {
                        ...bebidasDetalle,
                        chicha: { ...bebidasDetalle.chicha, litro: chicha },
                        maracuya: { ...bebidasDetalle.maracuya, litro: maracuya },
                        maracumango: { ...bebidasDetalle.maracumango, litro: maracumango },
                        limonada: { ...bebidasDetalle.limonada, litro: limonada },
                    },
                };

                const { error: updateError } = await supabase
                    .from('inventario_diario')
                    .update(updateData)
                    .eq('fecha', fechaHoy);

                if (updateError) throw updateError;

                toast.success(
                    `¡Apertura ACTUALIZADA!\nDatos corregidos para el día de hoy.`,
                    { duration: 4000, icon: '🔄' }
                );

                setTimeout(() => {
                    router.push('/');
                }, 1500);
                return;
            }

            const insertData = {
                fecha: fechaHoy,
                platos_dia: platos,
                insumos_principales_inicial: pescado + mixtura + pota,
                insumos_detalle: { pescado, mixtura, pota },
                chicha_inicial: chicha,
                gaseosas: totalBebidas,
                dinero_inicial: parseFloat(dineroInicial) || 0,
                bebidas_detalle: {
                    ...bebidasDetalle,
                    chicha: { ...bebidasDetalle.chicha, litro: chicha },
                    maracuya: { ...bebidasDetalle.maracuya, litro: maracuya },
                    maracumango: { ...bebidasDetalle.maracumango, litro: maracumango },
                    limonada: { ...bebidasDetalle.limonada, litro: limonada },
                },
            };

            const { error } = await supabase
                .from('inventario_diario')
                .insert(insertData)
                .select()
                .single();

            if (error) throw error;

            toast.success(
                `¡Día iniciado exitosamente!\nChicha: ${chicha}L | Bebidas: ${totalBebidas}`,
                { duration: 3000, icon: '✅' }
            );

            setTimeout(() => {
                router.push('/');
            }, 1500);

        } catch (error: any) {
            console.error('Error al guardar apertura:', error);
            const errorMessage = error?.message || (typeof error === 'string' ? error : 'Error desconocido');
            toast.error(`Error al iniciar el día: ${errorMessage}`, { duration: 8000 });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-3 sm:p-4 md:p-8 max-w-6xl mx-auto pb-32">
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-3">
                        <div className="relative w-24 h-20">
                            <Image
                                src="/images/logo-the-bear-icon.png"
                                alt="THE BEAR"
                                fill
                                className="object-contain"
                            />
                        </div>

                        <div>
                            <span className="text-thebear-dark-blue font-black text-2xl tracking-tighter block leading-none">
                                THE BEAR
                            </span>
                            <span className="text-thebear-blue text-[10px] font-bold tracking-widest uppercase">
                                Cevichería POS
                            </span>
                        </div>
                    </div>
                    <div className="ml-auto text-right">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-thebear-dark-blue tracking-tighter uppercase leading-none">
                            Apertura Diaria
                        </h1>
                        <p className="text-[10px] font-bold text-thebear-blue/60 uppercase tracking-widest">
                            Configuración del inventario inicial
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Métricas Críticas de Inicio */}
                <div className="grid md:grid-cols-3 gap-6">


                    {/* Insumos de Pescado */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="ocean-card border-l-4 border-l-amber-500 md:col-span-3"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center shadow-inner">
                                <span className="text-3xl">🐟</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-thebear-dark-blue uppercase tracking-tight">Insumos de Cocina</h2>
                                <p className="text-[10px] font-bold text-amber-600/50 uppercase tracking-widest">Peso en Crudo para el Día</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="relative">
                                <p className="text-[10px] font-bold text-amber-600 mb-1 uppercase tracking-widest text-center">Pescado</p>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    min="0"
                                    step="0.1"
                                    value={pescadoInicial}
                                    onChange={(e) => setPescadoInicial(e.target.value)}
                                    placeholder="0.0"
                                    disabled={loading}
                                    className="ocean-input w-full text-2xl sm:text-3xl font-black text-thebear-dark-blue text-center py-3 sm:py-4 border-amber-100 focus:border-amber-500"
                                />
                                <div className="absolute right-3 bottom-4 text-amber-500/20 font-black text-xs uppercase italic">Kg</div>
                            </div>
                            <div className="relative">
                                <p className="text-[10px] font-bold text-amber-600 mb-1 uppercase tracking-widest text-center">Mixtura</p>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={mixturaInicial}
                                    onChange={(e) => setMixturaInicial(e.target.value)}
                                    placeholder="0.0"
                                    disabled={loading}
                                    className="ocean-input w-full text-3xl font-black text-thebear-dark-blue text-center py-4 border-amber-100 focus:border-amber-500"
                                />
                                <div className="absolute right-3 bottom-4 text-amber-500/20 font-black text-xs uppercase italic">Kg</div>
                            </div>
                            <div className="relative">
                                <p className="text-[10px] font-bold text-amber-600 mb-1 uppercase tracking-widest text-center">Pota</p>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={potaInicial}
                                    onChange={(e) => setPotaInicial(e.target.value)}
                                    placeholder="0.0"
                                    disabled={loading}
                                    className="ocean-input w-full text-3xl font-black text-thebear-dark-blue text-center py-4 border-amber-100 focus:border-amber-500"
                                />
                                <div className="absolute right-3 bottom-4 text-amber-500/20 font-black text-xs uppercase italic">Kg</div>
                            </div>
                        </div>

                        {/* Predicciones de Pescado */}
                        {parseFloat(pescadoInicial) > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-6 pt-6 border-t border-amber-500/10 overflow-hidden"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-amber-500">✨</span>
                                    <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest">Predicción de Producción</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Ceviches Puros</p>
                                            <p className="text-[8px] font-bold text-amber-600/50 uppercase tracking-tighter">150g por plato</p>
                                        </div>
                                        <p className="text-2xl font-black text-amber-700">{Math.floor((parseFloat(pescadoInicial) * 1000) / 150)}</p>
                                    </div>
                                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Dúos o Tríos</p>
                                            <p className="text-[8px] font-bold text-amber-600/50 uppercase tracking-tighter">130g por plato</p>
                                        </div>
                                        <p className="text-2xl font-black text-amber-700">{Math.floor((parseFloat(pescadoInicial) * 1000) / 130)}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Bebidas Naturales */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="ocean-card border-l-4 border-l-purple-500 md:col-span-3"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center shadow-inner">
                                <span className="text-3xl">🟣</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-thebear-dark-blue uppercase tracking-tight">Bebidas Naturales</h2>
                                <p className="text-[10px] font-bold text-purple-600/50 uppercase tracking-widest">Preparación Fresca en Litros</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="relative">
                                <p className="text-[10px] font-bold text-purple-600 mb-1 uppercase tracking-widest text-center">Chicha</p>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={chichaInicial}
                                    onChange={(e) => setChichaInicial(e.target.value)}
                                    placeholder="0.00"
                                    disabled={loading}
                                    className="ocean-input w-full text-2xl font-black text-thebear-dark-blue text-center py-4 border-purple-100 focus:border-purple-500"
                                />
                                <div className="absolute right-3 bottom-4 text-purple-500/20 font-black text-[10px] uppercase italic">Lt</div>
                            </div>
                            <div className="relative">
                                <p className="text-[10px] font-bold text-purple-600 mb-1 uppercase tracking-widest text-center">Maracuya</p>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={maracuyaInicial}
                                    onChange={(e) => setMaracuyaInicial(e.target.value)}
                                    placeholder="0.00"
                                    disabled={loading}
                                    className="ocean-input w-full text-2xl font-black text-thebear-dark-blue text-center py-4 border-purple-100 focus:border-purple-500"
                                />
                                <div className="absolute right-3 bottom-4 text-purple-500/20 font-black text-[10px] uppercase italic">Lt</div>
                            </div>
                            <div className="relative">
                                <p className="text-[10px] font-bold text-purple-600 mb-1 uppercase tracking-widest text-center">Maracumango</p>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={maracumangoInicial}
                                    onChange={(e) => setMaracumangoInicial(e.target.value)}
                                    placeholder="0.00"
                                    disabled={loading}
                                    className="ocean-input w-full text-2xl font-black text-thebear-dark-blue text-center py-4 border-purple-100 focus:border-purple-500"
                                />
                                <div className="absolute right-3 bottom-4 text-purple-500/20 font-black text-[10px] uppercase italic">Lt</div>
                            </div>
                            <div className="relative">
                                <p className="text-[10px] font-bold text-purple-600 mb-1 uppercase tracking-widest text-center">Limonada</p>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={limonadaInicial}
                                    onChange={(e) => setLimonadaInicial(e.target.value)}
                                    placeholder="0.00"
                                    disabled={loading}
                                    className="ocean-input w-full text-2xl font-black text-thebear-dark-blue text-center py-4 border-purple-100 focus:border-purple-500"
                                />
                                <div className="absolute right-3 bottom-4 text-purple-500/20 font-black text-[10px] uppercase italic">Lt</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Sección de Bebidas Embotelladas */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="ocean-card"
                >
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-thebear-cream/30">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-thebear-blue/10 rounded-2xl flex items-center justify-center">
                                <span className="text-2xl">🥤</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-thebear-dark-blue uppercase tracking-tight">Control de Helada</h2>
                                <p className="text-[10px] font-bold text-thebear-blue/60 uppercase tracking-widest">
                                    Total: <span className="text-thebear-blue">{calculateTotalBeverages()}</span> Unidades
                                    {previousDayLoaded && <span className="ml-2 text-emerald-600 font-black">✓ Herencia del Cierre</span>}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={resetBeverages}
                            className="p-3 text-thebear-blue/40 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-red-100"
                            title="Reiniciar a cero"
                        >
                            <RefreshCw size={20} className={loadingPrevious ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {loadingPrevious ? (
                        <div className="py-20 flex flex-col items-center justify-center text-thebear-blue/30 italic">
                            <div className="w-12 h-12 border-4 border-thebear-cream border-t-thebear-blue rounded-full animate-spin mb-4"></div>
                            <p className="font-bold uppercase tracking-widest text-xs">Consultando el Cierre del Capitán...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {MARCAS_CONFIG.map((marca) => {
                                const brandData = bebidasDetalle[marca.key as keyof BebidasDetalle] as Record<string, number> | undefined;
                                const brandTotal = marca.sizes.reduce((sum, s) => sum + ((brandData?.[s.key]) || 0), 0);
                                const isOpen = expandedBrands.has(marca.key);

                                return (
                                    <div key={marca.key} className={`rounded-3xl border-2 transition-all duration-300 overflow-hidden ${isOpen ? 'border-thebear-blue shadow-lg bg-thebear-cream/10' : 'border-thebear-cream bg-white hover:border-thebear-blue/30'}`}>
                                        <button
                                            type="button"
                                            onClick={() => setExpandedBrands(prev => {
                                                const next = new Set(prev);
                                                if (next.has(marca.key)) next.delete(marca.key);
                                                else next.add(marca.key);
                                                return next;
                                            })}
                                            className="w-full flex items-center gap-3 p-4 text-left"
                                        >
                                            <div className={`w-3 h-3 rounded-full ${marca.dot} shadow-sm animate-pulse`}></div>
                                            <div className="flex-1">
                                                <p className="text-xs font-black text-thebear-dark-blue uppercase tracking-tight">{marca.name}</p>
                                                <p className="text-[10px] font-bold text-thebear-blue/50 tracking-widest">{brandTotal} UND</p>
                                            </div>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-thebear-blue text-white' : 'bg-thebear-cream text-thebear-blue'}`}>
                                                <ArrowRight size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
                                            </div>
                                        </button>

                                        <AnimatePresence>
                                            {isOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="px-4 pb-4 space-y-3"
                                                >
                                                    {marca.sizes.map((size) => {
                                                        const val = (brandData?.[size.key]) || 0;
                                                        return (
                                                            <div key={size.key} className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-thebear-cream shadow-sm">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[10px] font-black text-thebear-dark-blue uppercase truncate">{size.label}</p>
                                                                    <p className="text-[8px] font-bold text-thebear-blue/40 uppercase">{size.desc}</p>
                                                                </div>
                                                                <input
                                                                    type="number"
                                                                    inputMode="numeric"
                                                                    min="0"
                                                                    value={val === 0 ? '' : val}
                                                                    placeholder="0"
                                                                    onChange={(e) => updateBeverage(marca.key as keyof BebidasDetalle, size.key, e.target.value)}
                                                                    onFocus={(e) => e.target.select()}
                                                                    className="w-16 px-2 py-2 text-center text-sm font-black text-thebear-blue bg-thebear-cream/30 border-2 border-transparent focus:border-thebear-blue rounded-xl transition-all focus:outline-none placeholder:text-thebear-blue/20"
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>

                {/* Caja Chica */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="ocean-card border-l-4 border-l-emerald-500"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-inner">
                            <span className="text-3xl">💵</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-thebear-dark-blue uppercase tracking-tight">Caja de Bahía</h2>
                            <p className="text-[10px] font-bold text-emerald-600/50 uppercase tracking-widest">Fondo Inicial en Soles</p>
                        </div>
                    </div>
                    <div className="relative max-w-md mx-auto">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-emerald-500/30">S/</div>
                        <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            value={dineroInicial}
                            onChange={(e) => setDineroInicial(e.target.value)}
                            placeholder="0.00"
                            disabled={loading}
                            className="ocean-input w-full text-3xl sm:text-5xl font-black text-thebear-dark-blue text-center py-6 sm:py-8 pl-10 sm:pl-14 border-emerald-100 focus:border-emerald-500"
                        />
                    </div>
                </motion.div>

                {/* Botón de Lanzamiento */}
                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    type="submit"
                    disabled={loading || loadingPrevious}
                    className="w-full relative group overflow-hidden py-6 rounded-[2.5rem] shadow-2xl transition-all active:scale-95 disabled:opacity-50"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-thebear-blue via-thebear-light-blue to-thebear-blue bg-[length:200%_auto] animate-gradient transition-all group-hover:scale-105"></div>
                    <div className="relative z-10 flex items-center justify-center gap-4 text-white">
                        {loading ? (
                            <>
                                <Loader2 size={32} className="animate-spin" />
                                <span className="text-2xl font-black uppercase tracking-widest">Tripulando...</span>
                            </>
                        ) : (
                            <>
                                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                    <Check size={24} className="text-white" />
                                </div>
                                <span className="text-2xl font-black uppercase tracking-[0.2em]">Arrancar Día</span>
                            </>
                        )}
                    </div>
                </motion.button>
            </form>
        </div>
    );
}
