import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // format: YYYY-MM

    let query = supabase
        .from('transactions')
        .select('amount, type, date, categories(name)')
        .eq('type', 'expense')

    if (month) {
        const start = `${month}-01T00:00:00.000Z`
        const end = new Date(new Date(start).setMonth(new Date(start).getMonth() + 1)).toISOString()
        query = query.gte('date', start).lt('date', end)
    }

    const { data: transactions, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const totalIncome = (
        await supabase
            .from('transactions')
            .select('amount')
            .eq('type', 'income')
            .gte('date', month ? `${month}-01T00:00:00.000Z` : '2000-01-01')
            .lt('date', month ? new Date(new Date(`${month}-01T00:00:00.000Z`).setMonth(new Date(`${month}-01T00:00:00.000Z`).getMonth() + 1)).toISOString() : '2100-01-01')
    ).data?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0

    const totalExpense = transactions?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0

    // Category summary for pie chart
    const categoryMap: Record<string, { name: string; total: number; count: number }> = {}
    transactions?.forEach((t: any) => {
        const name = t.categories?.name || 'Sin categoría'
        if (!categoryMap[name]) categoryMap[name] = { name, total: 0, count: 0 }
        categoryMap[name].total += t.amount
        categoryMap[name].count += 1
    })

    const categorySummary = Object.values(categoryMap)
        .sort((a, b) => b.total - a.total)
        .map(c => ({
            ...c,
            percentage: totalExpense > 0 ? Math.round((c.total / totalExpense) * 100) : 0,
        }))

    // Monthly evolution (last 6 months)
    const now = new Date()
    const monthlyEvolution = []
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        monthlyEvolution.push({ month: mKey, income: 0, expense: 0 })
    }

    return NextResponse.json({
        balance: totalIncome - totalExpense,
        totalIncome,
        totalExpense,
        categorySummary,
        monthlyEvolution,
    })
}
