import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { GastoHormiga, Transaction } from '@/lib/types'

// Gasto Hormiga detection algorithm:
// Groups expense transactions by category+description
// If a group has >= 2 transactions AND avg amount is between $500 and $50,000 ARS
// it is flagged as "gasto hormiga"
const MIN_AMOUNT = 500
const MAX_AMOUNT = 50000
const MIN_OCCURRENCES = 2

export async function GET(request: NextRequest) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*, categories(*), users(display_name, email)')
        .eq('type', 'expense')
        .gte('date', since.toISOString())
        .order('date', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Group by category_id + normalized description
    const groups: Record<string, Transaction[]> = {}
    transactions?.forEach((t: Transaction) => {
        const key = `${t.category_id || 'sin-cat'}::${(t.description || '').toLowerCase().trim()}`
        if (!groups[key]) groups[key] = []
        groups[key].push(t)
    })

    const gastoHormiga: GastoHormiga[] = []

    Object.values(groups).forEach((group) => {
        if (group.length < MIN_OCCURRENCES) return

        const total = group.reduce((s, t) => s + t.amount, 0)
        const avg = total / group.length

        if (avg < MIN_AMOUNT || avg > MAX_AMOUNT) return

        gastoHormiga.push({
            category_id: group[0].category_id,
            category_name: (group[0].categories as any)?.name || 'Sin categoría',
            description: group[0].description,
            count: group.length,
            total_amount: total,
            average_amount: avg,
            transactions: group,
        })
    })

    // Sort by total impact desc
    gastoHormiga.sort((a, b) => b.total_amount - a.total_amount)

    return NextResponse.json(gastoHormiga)
}
