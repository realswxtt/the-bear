'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Usuario } from '@/lib/roles';
import toast from 'react-hot-toast';

interface AuthContextType {
    user: Usuario | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<Usuario | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Load user session on mount
    useEffect(() => {
        loadUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                loadUserProfile(session.user.id);
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const loadUser = async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                throw error;
            }


            if (session?.user) {
                await loadUserProfile(session.user.id);
            } else {
                setUser(null);
            }
        } catch (error: any) {
            console.error('[AuthContext] Error loading user:', error);

            // Si el error es de token invalido, cerramos sesión para limpiar el estado
            if (error?.message?.includes('Refresh Token Not Found') ||
                error?.message?.includes('Invalid Refresh Token')) {
                await supabase.auth.signOut();
            }

            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const loadUserProfile = async (userId: string) => {
        try {
            const { data: profile, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                throw error;
            }

            if (profile) {
                setUser({
                    id: profile.id,
                    nombre: profile.nombre,
                    email: profile.email,
                    rol: profile.rol,
                    activo: true,
                    created_at: profile.created_at
                });
            }
        } catch (error) {
            setUser(null);
        }
    };

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            if (data.user) {
                // Cargar el perfil directamente y establecer el usuario
                const { data: profile, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (profileError) {
                    throw profileError;
                }

                if (profile) {
                    // Establecer el usuario directamente para evitar race conditions
                    setUser({
                        id: profile.id,
                        nombre: profile.nombre,
                        email: profile.email,
                        rol: profile.rol,
                        activo: true,
                        created_at: profile.created_at
                    });
                    toast.success(`¡Bienvenido, ${profile.nombre}!`);
                    return true;
                }
            }

            return false;
        } catch (error: any) {
            toast.error(error.message || 'Error al iniciar sesión');
            return false;
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            toast.success('Sesión cerrada');
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Error al cerrar sesión');
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                isAuthenticated: user !== null
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
