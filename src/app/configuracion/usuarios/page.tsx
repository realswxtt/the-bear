'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Usuario } from '@/lib/roles';
import { UserRole, ROLE_NAMES } from '@/lib/roles';
import ProtectedRoute from '@/components/ProtectedRoute';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, Save, X, Pencil, Shield, CheckCircle2, UserX, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function UsuariosPage() {
    return (
        <ProtectedRoute requiredPermission="configuracion">
            <UsuariosContent />
        </ProtectedRoute>
    );
}

function UsuariosContent() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [editingUser, setEditingUser] = useState<Usuario | null>(null);
    const [saving, setSaving] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    const cargarUsuarios = async () => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .order('nombre', { ascending: true });

            if (error) throw error;
            setUsuarios(data || []);
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            toast.error('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const iniciarEdicion = (usuario: Usuario) => {
        setEditingUser({ ...usuario });
    };

    const cancelarEdicion = () => {
        setEditingUser(null);
    };

    const guardarEdicion = async () => {
        if (!editingUser) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({
                    nombre: editingUser.nombre,
                    rol: editingUser.rol,
                    activo: editingUser.activo
                })
                .eq('id', editingUser.id);

            if (error) throw error;

            setUsuarios(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
            toast.success('Usuario actualizado correctamente');
            cancelarEdicion();
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            toast.error('Error al actualizar el usuario');
        } finally {
            setSaving(false);
        }
    };

    const usuariosFiltrados = usuarios.filter(u =>
        u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.email.toLowerCase().includes(busqueda.toLowerCase()) ||
        ROLE_NAMES[u.rol].toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div className="min-h-screen p-3 sm:p-6 lg:p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Link href="/configuracion" className="inline-flex items-center text-slate-500 hover:text-thebear-blue transition-colors mb-2 text-sm font-medium">
                        <ArrowLeft size={16} className="mr-1" /> Volver a Configuración
                    </Link>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Shield className="text-thebear-blue" /> Gestión de Personal
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Administra roles, nombres y accesos de los usuarios
                    </p>
                </div>
                <button
                    onClick={() => setShowInstructions(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-thebear-blue to-thebear-light-blue text-white px-4 py-2.5 rounded-lg font-bold shadow-md hover:shadow-lg transition-all text-sm"
                >
                    <UserPlus size={18} />
                    Crear Nuevo Usuario
                </button>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o rol..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-thebear-blue/20 focus:border-thebear-blue transition-all"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="w-8 h-8 border-4 border-slate-300 border-t-thebear-blue rounded-full animate-spin" />
                    </div>
                ) : usuariosFiltrados.length === 0 ? (
                    <div className="text-center p-12 text-slate-400">
                        <UserX size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium text-slate-600 mb-1">No hay usuarios encontrados</p>
                        <p className="text-sm">Intenta con otra búsqueda o crea uno nuevo.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                                    <th className="p-4 font-semibold">Usuario</th>
                                    <th className="p-4 font-semibold">Rol</th>
                                    <th className="p-4 font-semibold text-center">Estado</th>
                                    <th className="p-4 font-semibold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {usuariosFiltrados.map((usuario) => (
                                    <tr key={usuario.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4">
                                            {editingUser?.id === usuario.id ? (
                                                <input
                                                    type="text"
                                                    value={editingUser.nombre}
                                                    onChange={(e) => setEditingUser({ ...editingUser, nombre: e.target.value })}
                                                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-thebear-blue/30 focus:border-thebear-blue"
                                                />
                                            ) : (
                                                <div>
                                                    <p className="font-bold text-slate-800">{usuario.nombre}</p>
                                                    <p className="text-xs text-slate-500">{usuario.email}</p>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {editingUser?.id === usuario.id ? (
                                                <select
                                                    value={editingUser.rol}
                                                    onChange={(e) => setEditingUser({ ...editingUser, rol: e.target.value as UserRole })}
                                                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-thebear-blue/30 focus:border-thebear-blue"
                                                >
                                                    {Object.entries(ROLE_NAMES).map(([val, label]) => (
                                                        <option key={val} value={val}>{label}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                                                    ${usuario.rol === 'administrador' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                        usuario.rol === 'cajera' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            usuario.rol === 'cocina' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    }
                                                `}>
                                                    {ROLE_NAMES[usuario.rol]}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {editingUser?.id === usuario.id ? (
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={editingUser.activo}
                                                        onChange={(e) => setEditingUser({ ...editingUser, activo: e.target.checked })}
                                                    />
                                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-thebear-blue"></div>
                                                </label>
                                            ) : (
                                                usuario.activo ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold px-2 py-1 bg-emerald-50 rounded-md">
                                                        <CheckCircle2 size={12} /> Activo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-slate-500 text-xs font-bold px-2 py-1 bg-slate-100 rounded-md">
                                                        <X size={12} /> Inactivo
                                                    </span>
                                                )
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {editingUser?.id === usuario.id ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={guardarEdicion} disabled={saving} className="p-2 bg-thebear-blue text-white rounded-md hover:bg-thebear-dark-blue transition-colors disabled:opacity-50">
                                                        <Save size={16} />
                                                    </button>
                                                    <button onClick={cancelarEdicion} className="p-2 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => iniciarEdicion(usuario)} className="p-2 text-slate-400 hover:text-thebear-blue hover:bg-slate-100 rounded-md transition-all">
                                                    <Pencil size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Instructions Modal */}
            <AnimatePresence>
                {showInstructions && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex py-10 overflow-y-auto"
                            onClick={() => setShowInstructions(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white m-auto p-6 md:p-8 rounded-2xl w-full max-w-2xl shadow-2xl mx-4"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-black text-slate-800">Crear Nuevos Usuarios</h2>
                                    <button onClick={() => setShowInstructions(false)} className="text-slate-400 hover:text-slate-600 p-2">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="prose prose-slate max-w-none text-sm leading-relaxed">
                                    <p className="text-slate-600 mb-4">
                                        Por motivos de seguridad, la creación inicial de cuentas requiere acceso al panel de control de Supabase. Sigue estos pasos para crear cuentas como <strong>Cocina</strong>, <strong>Mozo</strong> o <strong>Cajera</strong>:
                                    </p>

                                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl mb-4 space-y-3">
                                        <h3 className="font-bold text-slate-800 text-base mb-2">1. Crear la cuenta en Supabase</h3>
                                        <ol className="list-decimal pl-5 space-y-2 text-slate-700 font-medium">
                                            <li>Abre el <strong>Supabase Dashboard</strong> de tu proyecto.</li>
                                            <li>Ve a la sección <strong>Authentication &rarr; Users</strong>.</li>
                                            <li>Haz clic en <strong>Add User</strong> &rarr; <strong>Create New User</strong>.</li>
                                            <li>Ingresa el correo (ej: <code>cocina@thebear.com</code>), una contraseña segura y asegúrate de marcar <strong>Auto Confirm User</strong>.</li>
                                        </ol>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl mb-4">
                                        <h3 className="font-bold text-blue-900 text-base mb-2">2. Vincular el Perfil (SQL)</h3>
                                        <p className="text-blue-800 mb-3">Si no aparecen automáticamente en esta tabla, ejecuta este SQL en el <strong>SQL Editor</strong> de Supabase:</p>
                                        <pre className="bg-slate-800 text-slate-100 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                                            {`-- Reemplaza con los datos del usuario recién creado
INSERT INTO user_profiles (id, email, nombre, rol)
VALUES (
    'EL-UUID-DEL-USUARIO-AQUI', -- Cópialo de la vista Users
    'cocina@thebear.com', 
    'Chef THE BEAR', 
    'cocina' -- Puede ser: administrador, cajera, mozo, cocina
);`}
                                        </pre>
                                    </div>

                                    <p className="text-slate-500 text-xs mt-6 text-center italic">
                                        Una vez ejecutado, recarga esta página y el usuario aparecerá en la tabla, donde podrás editar su nombre y rol directamente.
                                    </p>
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

