'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import TopNavbar from "@/components/TopNavbar";
import UserMenu from "@/components/UserMenu";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import OfflineIndicator from '@/components/OfflineIndicator';
import AIChatAssistant from '@/components/AIChatAssistant';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <html lang="es">
      <head>
        <title>THE BEAR - Sistema POS</title>
        <meta name="description" content="Sistema de Punto de Venta para THE BEAR" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#caf0f8',
                color: '#03045e',
                border: '2px solid #0077b6',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                iconTheme: {
                  primary: '#0077b6',
                  secondary: '#caf0f8',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#caf0f8',
                },
                style: {
                  border: '2px solid #ef4444',
                },
              },
            }}
          />
          <OfflineIndicator />
          {isLoginPage ? (
            // Login page sin navegacion
            <main className="min-h-screen">
              {children}
            </main>
          ) : (
            // Páginas normales con TopNavbar
            <div id="app-root" className="min-h-screen bg-slate-100 flex flex-col">
              <TopNavbar />

              <main className="flex-1 pt-20 pb-10 px-4 max-w-7xl mx-auto w-full print:pt-0">
                {children}
              </main>
            </div>
          )}
          <AIChatAssistant />
        </AuthProvider>
      </body>
    </html >
  );
}

