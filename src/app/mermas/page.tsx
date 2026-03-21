'use client';

import { useState, useEffect } from 'react';
import { supabase, obtenerFechaHoy } from '@/lib/supabase';
import type { Merma } from '@/lib/database.types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Trash2, ArrowRight, TrendingDown, ClipboardX } from 'lucide-react';
import toast from 'react-hot-toast';

const INSUMOS_COMUNES = ['pescado', 'mixtura', 'pota', 'limon', 'cebolla'];
const MOTIVOS_COMUNES = ['Consumo personal', 'Mal estado', 'Error en preparación', 'Caída/Accidente', 'Otros'];

function MermasContent() {
    const [mermas, setMermas] = useState<Merma[]>([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');

    // Form state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [insumo, setInsumo] = useState('');
    const [cantidad, setCantidad] = useState('');
    const [motivo, setMotivo] = useState('');

    const cargarMermas = async () => {
        try {
            const fechaHoy = obtenerFechaHoy();
            const { data, error } = await supabase
                .from('mermas')
                .select('*')
                .eq('fecha', fechaHoy)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMermas(data || []);
        } catch (error) {
            console.error('Error al cargar mermas:', error);
            toast.error('Error al cargar mermas del día');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarMermas();
    }, []);

    const registrarMerma = async (e: React.FormEvent) => {
        e.preventDefault();

        const insumoClean = insumo.trim().toLowerCase();
        const cantidadNum = parseFloat(cantidad);

        if (!insumoClean || isNaN(cantidadNum) || cantidadNum <= 0) {
            toast.error('Ingresa un insumo y una cantidad válida');
            return;
        }

        setIsSubmitting(true);
        try {
            const { data: userData } = await supabase.auth.getUser();
            const usuario_id = userData.user?.id;

            const nuevaMerma = {
                fecha: obtenerFechaHoy(),
                insumo: insumoClean,
                cantidad: cantidadNum,
                motivo: motivo.trim() || 'No especificado',
                usuario_id
            };

            const { data, error } = await supabase
                .from('mermas')
                .insert(nuevaMerma)
                .select()
                .single();

            if (error) throw error;

            toast.success('Merma registrada correctamente');
            setMermas([data, ...mermas]);

            // Reset form
            setInsumo('');
            setCantidad('');
            setMotivo('');
        } catch (error) {
            console.error('Error al registrar merma:', error);
            toast.error('No se pudo registrar la merma');
        } finally {
            setIsSubmitting(false);
        }
    };

    const eliminarMerma = async (id: string) => {
        if (!window.confirm('¿Eliminar este registro de merma? Esta acción restaurará el inventario.')) return;

        try {
            const { error } = await supabase
                .from('mermas')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setMermas(prev => prev.filter(m => m.id !== id));
            toast.success('Registro eliminado');
        } catch (error) {
            console.error('Error al eliminar merma:', error);
            toast.error('No se pudo eliminar el registro');
        }
    };

    const mermasFiltradas = mermas.filter(m =>
        m.insumo.toLowerCase().includes(busqueda.toLowerCase()) ||
        (m.motivo && m.motivo.toLowerCase().includes(busqueda.toLowerCase()))
    );

    const totalMermasKg = mermas.reduce((sum, m) => sum + Number(m.cantidad), 0);

    return (
        <div className="p-3 sm:p-6 lg:p-8 max-w-5xl mx-auto pb-32">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                            <TrendingDown size={24} className="text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tighter uppercase">
                                Control de Mermas
                            </h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Registro de Consumo y Pérdidas del Día
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-red-50 px-6 py-3 rounded-2xl border border-red-100 flex items-center gap-4">
                    <div>
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Total Perdido Hoy</p>
                        <p className="text-2xl font-black text-red-600 tracking-tighter">{totalMermasKg.toFixed(2)} <span className="text-base text-red-400/50">Kg/Und</span></p>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Formulario de Ingreso */}
                <div className="md:col-span-1">
                    <form onSubmit={registrarMerma} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 sticky top-6">
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
                            <Plus size={16} className="text-slate-400" /> Nuevo Registro
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Insumo (ej. pescado)</label>
                                <input
                                    type="text"
                                    list="insumos-comunes"
                                    value={insumo}
                                    onChange={(e) => setInsumo(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                                    placeholder="¿Qué se perdió?"
                                    required
                                />
                                <datalist id="insumos-comunes">
                                    {INSUMOS_COMUNES.map(i => <option key={i} value={i} />)}
                                </datalist>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Cantidad (Kg o Und)</label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    min="0"
                                    value={cantidad}
                                    onChange={(e) => setCantidad(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Motivo</label>
                                <input
                                    type="text"
                                    list="motivos-comunes"
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                                    placeholder="Opcional..."
                                />
                                <datalist id="motivos-comunes">
                                    {MOTIVOS_COMUNES.map(m => <option key={m} value={m} />)}
                                </datalist>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full mt-2 py-4 bg-thebear-dark-blue hover:bg-thebear-blue text-white rounded-xl font-black uppercase tracking-widest text-xs transition-colors disabled:opacity-50 shadow-lg shadow-thebear-blue/20 flex flex-col items-center justify-center gap-1"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>Registrar Merma</span>
                                        <span className="text-[9px] text-thebear-light-blue opacity-70">Descuenta del stock</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Lista de Mermas */}
                <div className="md:col-span-2">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Registro de Hoy</h2>
                            <div className="relative w-64">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar insumo..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-300 transition-all"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-400 rounded-full animate-spin mb-4" />
                                <p className="text-xs font-bold uppercase tracking-widest">Cargando registros...</p>
                            </div>
                        ) : mermasFiltradas.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-300 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                <ClipboardX size={40} className="mb-4 opacity-50" />
                                <p className="font-bold text-slate-400">Todo Perfecto</p>
                                <p className="text-xs max-w-xs text-center mt-2">No se han registrado mermas ni consumo de personal el día de hoy.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {mermasFiltradas.map((merma) => (
                                        <motion.div
                                            key={merma.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm group hover:border-red-100 hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                                    <span className="text-xs font-black">{merma.insumo.charAt(0).toUpperCase()}</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 capitalize">{merma.insumo}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{merma.motivo}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {new Date(merma.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <p className="text-lg font-black text-red-500">{merma.cantidad} <span className="text-[10px] text-red-300 uppercase tracking-widest">Kg/Und</span></p>
                                                <button
                                                    onClick={() => eliminarMerma(merma.id)}
                                                    className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all focus:opacity-100"
                                                    title="Eliminar registro (restaurar stock)"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function MermasPage() {
    return (
        <ProtectedRoute requiredPermission="mermas">
            <MermasContent />
        </ProtectedRoute>
    );
}
