import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('users')
        .select('*, households(name)')
        .eq('id', user!.id)
        .single()

    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const { data: transactions } = await supabase
        .from('transactions')
        .select('*, categories(name, icon, type), users(display_name)')
        .gte('date', `${month}-01T00:00:00.000Z`)
        .order('date', { ascending: false })
        .limit(20)

    const totalIncome = (transactions || [])
        .filter(t => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0)

    const totalExpense = (transactions || [])
        .filter(t => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0)

    // Category summary for donut chart
    const catMap: Record<string, number> = {}
        ; (transactions || []).filter(t => t.type === 'expense').forEach(t => {
            const name = (t.categories as any)?.name || 'Sin categoría'
            catMap[name] = (catMap[name] || 0) + t.amount
        })
    const categorySummary = Object.entries(catMap).map(([name, total]) => ({ name, total }))

    return (
        <DashboardClient
            profile={profile}
            transactions={transactions || []}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            balance={totalIncome - totalExpense}
            categorySummary={categorySummary}
            month={month}
        />
    )
}
