'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/roles';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredPermission?: string;
}

export default function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Solo redirigir si ya terminó de cargar 
        if (!loading) {
            if (!isAuthenticated) {
                router.push('/login');
            } else if (requiredPermission && user && !hasPermission(user.rol, requiredPermission)) {
                // Redirigir según rol si intentan acceder a rutas no permitidas
                if (user.rol === 'cocina') {
                    router.push('/cocina');
                } else if (user.rol === 'mozo') {
                    router.push('/pos');
                } else {
                    router.push('/');
                }
            }
        }
    }, [loading, isAuthenticated, user, requiredPermission, router]);

    // Mostrar loader mientras carga la sesión
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-thebear-cream/30">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-thebear-blue mx-auto mb-4"></div>
                    <p className="text-thebear-dark-blue font-semibold">Verificando sesión...</p>
                </div>
            </div>
        );
    }

    // Si no está autenticado, no mostrar nada (se redirigirá)
    if (!isAuthenticated) {
        return null;
    }

    // Si requiere permiso y no lo tiene, no mostrar nada (se redirigirá)
    if (requiredPermission && user && !hasPermission(user.rol, requiredPermission)) {
        return null;
    }

    // Todo bien, mostrar el contenido
    return <>{children}</>;
}
