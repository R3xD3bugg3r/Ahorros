import { createClient } from '@/lib/supabase/server'
import HormigaClient from '@/components/hormiga/HormigaClient'

export default async function HormigaPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: transactions } = await supabase
        .from('transactions')
        .select('*, categories(name, type), users(display_name)')
        .eq('type', 'expense')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('date', { ascending: false })

    // Gasto hormiga logic
    const MIN = 500, MAX = 50000, MIN_OCC = 2
    const groups: Record<string, any[]> = {}
        ; (transactions || []).forEach(t => {
            const key = `${t.category_id || 'nc'}::${(t.description || '').toLowerCase().trim()}`
            if (!groups[key]) groups[key] = []
            groups[key].push(t)
        })

    const gastoHormiga = Object.values(groups)
        .filter(g => g.length >= MIN_OCC)
        .map(g => {
            const total = g.reduce((s, t) => s + t.amount, 0)
            const avg = total / g.length
            return { category_name: g[0].categories?.name || 'Sin categoría', description: g[0].description, count: g.length, total_amount: total, average_amount: avg, transactions: g }
        })
        .filter(g => g.average_amount >= MIN && g.average_amount <= MAX)
        .sort((a, b) => b.total_amount - a.total_amount)

    return <HormigaClient items={gastoHormiga} />
}
