'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Producto } from '@/lib/database.types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Trash2, Check, X, BookOpen, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const INGREDIENTES_SUGERIDOS = ['pescado', 'mixtura', 'pota', 'limon', 'cebolla', 'aji', 'camote', 'choclo'];

function RecetasContent() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
    const [recetaActiva, setRecetaActiva] = useState<Record<string, number>>({});
    const [nuevoIngrediente, setNuevoIngrediente] = useState('');
    const [nuevaCantidad, setNuevaCantidad] = useState('');
    const [saving, setSaving] = useState(false);

    const cargarProductos = async () => {
        try {
            const { data, error } = await supabase
                .from('productos')
                .select('*')
                .eq('tipo', 'plato') // Solo platos tienen recetas complejas por ahora
                .order('nombre', { ascending: true });

            if (error) throw error;
            setProductos(data || []);
        } catch (error) {
            console.error('Error al cargar productos:', error);
            toast.error('Error al cargar platos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarProductos();
    }, []);

    const iniciarEdicion = (producto: Producto) => {
        setEditingProducto(producto);
        setRecetaActiva(producto.receta_detalle || {});
        setNuevoIngrediente('');
        setNuevaCantidad('');
    };

    const cancelarEdicion = () => {
        setEditingProducto(null);
        setRecetaActiva({});
    };

    const agregarIngrediente = (e: React.FormEvent) => {
        e.preventDefault();
        const ingrediente = nuevoIngrediente.trim().toLowerCase();
        const cantidad = parseFloat(nuevaCantidad);

        if (!ingrediente || isNaN(cantidad) || cantidad <= 0) {
            toast.error('Ingresa un ingrediente y una cantidad válida (mayor a 0)');
            return;
        }

        setRecetaActiva(prev => ({
            ...prev,
            [ingrediente]: cantidad
        }));
        setNuevoIngrediente('');
        setNuevaCantidad('');
    };

    const removerIngrediente = (ingrediente: string) => {
        setRecetaActiva(prev => {
            const nuevo = { ...prev };
            delete nuevo[ingrediente];
            return nuevo;
        });
    };

    const guardarReceta = async () => {
        if (!editingProducto) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('productos')
                .update({ receta_detalle: recetaActiva })
                .eq('id', editingProducto.id);

            if (error) throw error;

            setProductos(prev => prev.map(p =>
                p.id === editingProducto.id ? { ...p, receta_detalle: recetaActiva } : p
            ));

            toast.success('Receta guardada con éxito');
            setEditingProducto(null);
        } catch (error) {
            console.error('Error al guardar receta:', error);
            toast.error('Error al guardar la receta');
        } finally {
            setSaving(false);
        }
    };

    const productosFiltrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div className="min-h-screen p-3 sm:p-6 lg:p-8 max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
            {/* Lista de Platos */}
            <div className="flex-1 max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[calc(100vh-6rem)]">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                            <BookOpen size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 tracking-tight">Recetario</h1>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Escandallos y Consumo</p>
                        </div>
                    </div>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar plato..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
                        </div>
                    ) : productosFiltrados.length === 0 ? (
                        <div className="text-center p-8 text-slate-400">
                            <p className="font-semibold text-sm">No hay platos registrados</p>
                        </div>
                    ) : (
                        productosFiltrados.map(producto => {
                            const numIngredientes = Object.keys(producto.receta_detalle || {}).length;
                            return (
                                <button
                                    key={producto.id}
                                    onClick={() => iniciarEdicion(producto)}
                                    className={`w-full text-left p-4 rounded-2xl transition-all border ${editingProducto?.id === producto.id
                                        ? 'bg-amber-50 border-amber-200 shadow-sm'
                                        : 'bg-white border-slate-100 hover:border-amber-100 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-slate-700">{producto.nombre}</span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${numIngredientes > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                            {numIngredientes > 0 ? `${numIngredientes} Ingred.` : 'Sin Receta'}
                                        </span>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Editor de Receta */}
            <div className="flex-1 w-full bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[calc(100vh-6rem)]">
                {editingProducto ? (
                    <>
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-3xl">
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Editando Receta para</h2>
                            <p className="text-2xl font-black text-slate-800 tracking-tight">{editingProducto.nombre}</p>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 mb-6">
                                <h3 className="text-xs font-black text-amber-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Plus size={14} /> Añadir Ingrediente
                                </h3>
                                <form onSubmit={agregarIngrediente} className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-widest mb-1">Nombre (ej. pescado)</label>
                                        <input
                                            type="text"
                                            list="ingredientes-sugeridos"
                                            value={nuevoIngrediente}
                                            onChange={(e) => setNuevoIngrediente(e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium"
                                            placeholder="Ingrediente..."
                                        />
                                        <datalist id="ingredientes-sugeridos">
                                            {INGREDIENTES_SUGERIDOS.map(i => <option key={i} value={i} />)}
                                        </datalist>
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-widest mb-1">Cant. (Kg/Unid)</label>
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            step="0.001"
                                            min="0"
                                            value={nuevaCantidad}
                                            onChange={(e) => setNuevaCantidad(e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium text-center"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-lg transition-colors">
                                        <Plus size={20} />
                                    </button>
                                </form>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    Tabla de Composición
                                </h3>
                                {Object.keys(recetaActiva).length === 0 ? (
                                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                                        <p className="text-sm font-semibold">Este plato no tiene ingredientes configurados</p>
                                        <p className="text-xs mt-1">Si se vende, no descontará insumos detallados.</p>
                                    </div>
                                ) : (
                                    <AnimatePresence>
                                        {Object.entries(recetaActiva).map(([ingrediente, cantidad]) => (
                                            <motion.div
                                                key={ingrediente}
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl group hover:border-amber-200 transition-colors"
                                            >
                                                <span className="font-bold text-slate-700 capitalize">{ingrediente}</span>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-sm font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                                                        {cantidad} {cantidad < 3 && ingrediente !== 'limon' ? 'Kg' : 'Und'}
                                                    </span>
                                                    <button
                                                        onClick={() => removerIngrediente(ingrediente)}
                                                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 flex gap-3">
                            <button
                                onClick={cancelarEdicion}
                                className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm uppercase tracking-wider"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={guardarReceta}
                                disabled={saving}
                                className="flex-1 px-4 py-3 bg-thebear-blue text-white font-bold rounded-xl hover:bg-thebear-dark-blue transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wider disabled:opacity-50"
                            >
                                {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                                Guardar Receta
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center bg-slate-50/30 rounded-3xl">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <BookOpen size={32} className="text-slate-300" />
                        </div>
                        <p className="font-bold text-lg text-slate-600 mb-2">Selecciona un Plato</p>
                        <p className="text-sm max-w-sm">
                            Haz clic en cualquier plato de la lista izquierda para configurar qué ingredientes consume al ser vendido.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function RecetasPage() {
    return (
        <ProtectedRoute requiredPermission="recetas">
            <RecetasContent />
        </ProtectedRoute>
    );
}
