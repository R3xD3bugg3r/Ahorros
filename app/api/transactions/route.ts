import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // format: YYYY-MM
    const type = searchParams.get('type')

    let query = supabase
        .from('transactions')
        .select('*, categories(*), users(display_name, email)')
        .order('date', { ascending: false })

    if (month) {
        const start = `${month}-01T00:00:00.000Z`
        const end = new Date(new Date(start).setMonth(new Date(start).getMonth() + 1)).toISOString()
        query = query.gte('date', start).lt('date', end)
    }
    if (type) {
        query = query.eq('type', type)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
        .from('users').select('household_id').eq('id', user.id).single()

    if (!profile?.household_id) {
        return NextResponse.json({ error: 'No household found. Complete your onboarding.' }, { status: 400 })
    }

    const body = await request.json()
    const { amount, type, category_id, description, date } = body

    if (!amount || !type) {
        return NextResponse.json({ error: 'amount and type are required.' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('transactions')
        .insert({
            household_id: profile.household_id,
            user_id: user.id,
            amount: parseFloat(amount),
            type,
            category_id: category_id || null,
            description: description || null,
            date: date || new Date().toISOString(),
        })
        .select('*, categories(*)')
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
}
