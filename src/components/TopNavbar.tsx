'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingCart, BarChart, Lock as LockIcon, ClipboardList, ChefHat, Package, Settings, Menu, X, ChevronDown, BookOpen, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/roles';
import UserMenu from './UserMenu';

interface MenuItem {
    icon: any;
    label: string;
    href: string;
    permission: string;
}

const NAV_ITEMS: MenuItem[] = [
    { icon: Home, label: 'Inicio', href: '/', permission: 'dashboard' },
    { icon: ClipboardList, label: 'Apertura', href: '/apertura', permission: 'apertura' },
    { icon: ShoppingCart, label: 'Pedidos', href: '/pos', permission: 'pos' },
    { icon: ChefHat, label: 'Cocina', href: '/cocina', permission: 'cocina' },
    { icon: Package, label: 'Caja', href: '/ventas', permission: 'ventas' },
    { icon: BarChart, label: 'Reportes', href: '/reportes', permission: 'reportes' },
    { icon: LockIcon, label: 'Cierre', href: '/cierre', permission: 'cierre' },
    { icon: BookOpen, label: 'Recetas', href: '/recetas', permission: 'recetas' },
    { icon: TrendingDown, label: 'Mermas', href: '/mermas', permission: 'mermas' },
    { icon: Settings, label: 'Config', href: '/configuracion', permission: 'configuracion' },
];

export default function TopNavbar() {
    const pathname = usePathname();
    const { user, loading } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    if (loading || !user) return null;

    const filteredItems = NAV_ITEMS.filter(item => hasPermission(user.rol, item.permission));

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-thebear-blue/90 backdrop-blur-md border-b-2 border-white/20 h-20 shadow-xl print:hidden">
            <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">

                {/* Logo Section */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative w-32 h-24">
                        <Image
                            src="/images/logo-the-bear-icon.png"
                            alt="THE BEAR"
                            fill
                            className="object-contain"
                        />
                    </div>

                    <div className="hidden sm:block">
                        <span className="text-white font-black text-xl tracking-tighter block leading-none">
                            THE BEAR
                        </span>
                        <span className="text-thebear-light-blue text-[10px] font-bold tracking-widest uppercase">
                            Cevichería POS
                        </span>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-1">
                    {filteredItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href}>
                                <motion.div
                                    whileHover={{ y: -2 }}
                                    whileTap={{ y: 0 }}
                                    className={`
                                        px-3 py-2 rounded-xl flex items-center gap-2 transition-all duration-200 relative group
                                        ${isActive
                                            ? 'bg-white text-thebear-blue shadow-inner'
                                            : 'text-white/80 hover:text-white hover:bg-white/10'
                                        }
                                    `}
                                >
                                    <Icon size={18} />
                                    <span className="text-sm font-bold">{item.label}</span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute -bottom-[22px] left-2 right-2 h-1.5 bg-thebear-light-blue rounded-t-full shadow-[0_0_10px_rgba(202,240,248,0.8)]"
                                        />
                                    )}
                                </motion.div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <UserMenu />

                    {/* Mobile Hamburger Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="lg:hidden p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
                    >
                        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="lg:hidden fixed inset-0 top-20 bg-black/60 backdrop-blur-sm z-40"
                        />
                        <motion.nav
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                            className="lg:hidden absolute top-20 left-0 right-0 bg-thebear-blue border-b-2 border-white/20 shadow-2xl z-50 p-4 grid grid-cols-2 gap-2"
                        >
                            {filteredItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                                        <div className={`
                                            p-4 rounded-2xl flex flex-col items-center gap-2 transition-all border-2
                                            ${isActive
                                                ? 'bg-white text-thebear-blue border-white shadow-lg'
                                                : 'bg-white/10 text-white border-white/10'
                                            }
                                        `}>
                                            <Icon size={24} />
                                            <span className="text-xs font-black uppercase tracking-tight">{item.label}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </motion.nav>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
}
