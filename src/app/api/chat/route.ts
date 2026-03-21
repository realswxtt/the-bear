import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// THE BEAR - AI CHAT ASSISTANT
// Priority: 1) Groq (free, fast) → 2) Gemini → 3) Smart Fallback
// ============================================================

function getToday() {
    const formatter = new Intl.DateTimeFormat('es-PE', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const parts = formatter.formatToParts(new Date());
    const day = parts.find(p => p.type === 'day')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const year = parts.find(p => p.type === 'year')?.value;
    return `${year}-${month}-${day}`;
}

const SYSTEM_KNOWLEDGE = `
Eres "The Bear Analyst", el asistente inteligente del restaurante **THE BEAR**, una cevichería premium especializada en pescados y mariscos.
Responde SIEMPRE en español. Sé amable, profesional y útil. Usa emojis para hacer las respuestas más visuales.
Responde cualquier pregunta - sobre el negocio, cálculos matemáticos o cultura general.

## CONOCIMIENTO DEL SISTEMA POS

### APERTURA DEL DÍA (/apertura)
- Se registra: platos del día (base), insumos principales (kg de pescado/base), caja chica y stock de bebidas.
- Sin apertura, no hay ventas.

### CIERRE DE JORNADA (/cierre)
- Se registra: stock final de platos e insumos, consumo personal, merma y efectivo real.
- Genera reportes detallados y resumen para WhatsApp.

### CARTA THE BEAR
- Entradas: Leches de Tigre, Causas Acevichadas, Papa Rellena Acevichada.
- Ceviches: Pescado, Mixto, The Bear, Palteado, Conchas Negras.
- Arroces/Chaufas: Mariscos, Pescado, Salvaje.
- Crujientes: Chicharrones (Pota, Mixto, Pescado), Jaleas.
- Sopas: Chilcanos, Chupes, Parihuelas.
- Tacu Tacus y Fetuchinis marinados.
`;

function getSmartResponse(query: string, dbData: any): string {
    const lower = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (lower.includes('apertura') || lower.includes('abrir')) {
        return `📋 **Apertura de Día**\n\n` +
            `1️⃣ Ve a **Apertura**\n` +
            `2️⃣ Registra **Platos del Día** (cantidad base)\n` +
            `3️⃣ Registra **Insumos (Kg)** (pescado/base)\n` +
            `4️⃣ Registra **Caja Inicial** y **Bebidas**\n` +
            `5️⃣ Confirma para habilitar el POS.`;
    }

    if (lower.includes('cierre') || lower.includes('cerrar')) {
        return `🔒 **Cierre de Jornada**\n\n` +
            `1️⃣ Ve a **Cierre de Caja**\n` +
            `2️⃣ Registra sobrantes de platos e insumos (Kg)\n` +
            `3️⃣ Indica **Consumo Personal** y **Merma**\n` +
            `4️⃣ Cuenta el **efectivo real** y cierra.\n` +
            `📊 Descarga tu Excel al finalizar.`;
    }

    if (lower.includes('venta') || lower.includes('vendimos')) {
        if (dbData.ventas) {
            const v = dbData.ventas;
            if (v.length === 0) return `📈 No hay ventas hoy todavía.`;
            const total = v.reduce((s: number, x: any) => s + (x.total || 0), 0);
            return `📈 **Ventas de Hoy**\n\n` +
                `Pedidos: ${v.length}\n` +
                `Total: **S/ ${total.toFixed(2)}**`;
        }
    }

    if (lower.includes('inventario') || lower.includes('insumo') || lower.includes('pescado')) {
        if (dbData.inventario) {
            const inv = dbData.inventario;
            return `📦 **Inventario**\n\n` +
                `🐟 Platos iniciales: ${inv.platos_dia ?? '0'}\n` +
                `⚖️ Insumos base: ${inv.insumos_principales_inicial ?? '0'} Kg\n` +
                `💰 Caja: S/ ${(inv.dinero_inicial || 0).toFixed(2)}`;
        }
    }

    return `¡Hola! 🐟 Soy **The Bear Analyst**. ¿En qué puedo ayudarte hoy?`;
}

async function fetchDatabaseContext(supabase: any, today: string) {
    const result: any = { ventas: null, inventario: null, gastos: null, hasApertura: false };
    try {
        const { data: inv } = await supabase.from('inventario_diario').select('*').eq('fecha', today).maybeSingle();
        if (inv) { result.inventario = inv; result.hasApertura = true; }
        const { data: ventas } = await supabase.from('ventas').select('total, metodo_pago').gte('created_at', today);
        result.ventas = ventas || [];
        const { data: gastos } = await supabase.from('gastos').select('monto').eq('fecha', today);
        result.gastos = gastos || [];
    } catch { }
    return result;
}

async function callGroq(query: string, apiKey: string, today: string, dbContext: string): Promise<string | null> {
    try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: SYSTEM_KNOWLEDGE + `\n\nFecha: ${today}\nDatos: ${dbContext}` },
                    { role: 'user', content: query }
                ]
            })
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.choices?.[0]?.message?.content || null;
    } catch { return null; }
}

async function callGemini(query: string, apiKey: string, today: string, dbContext: string): Promise<string | null> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: query }] }],
                systemInstruction: { parts: [{ text: SYSTEM_KNOWLEDGE + `\n\nFecha: ${today}\nDatos: ${dbContext}` }] }
            })
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts[0]?.text || null;
    } catch { return null; }
}

export async function POST(req: Request) {
    try {
        const { query } = await req.json();
        const authHeader = req.headers.get('authorization');
        const today = getToday();
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            authHeader ? { global: { headers: { Authorization: authHeader } } } : {});

        const dbData = await fetchDatabaseContext(supabase, today);
        const dbContext = JSON.stringify({
            apertura: dbData.hasApertura,
            inventario: dbData.inventario ? {
                platos: dbData.inventario.platos_dia,
                insumos_kg: dbData.inventario.insumos_principales_inicial,
                caja: dbData.inventario.dinero_inicial
            } : null,
            ventas: { count: dbData.ventas.length, total: dbData.ventas.reduce((s: number, v: any) => s + v.total, 0) }
        });

        const groq = process.env.GROQ_API_KEY ? await callGroq(query, process.env.GROQ_API_KEY, today, dbContext) : null;
        if (groq) return NextResponse.json({ reply: groq });

        const gemini = process.env.GEMINIAI_API_KEY ? await callGemini(query, process.env.GEMINIAI_API_KEY, today, dbContext) : null;
        if (gemini) return NextResponse.json({ reply: gemini });

        return NextResponse.json({ reply: getSmartResponse(query, dbData) });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
