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

    let { data: profile } = await supabase
        .from('users').select('household_id, display_name').eq('id', user.id).single()

    let household_id = profile?.household_id

    // Auto-recovery mechanism: if user reached here without a household, create one automatically
    if (!household_id) {
        const userName = profile?.display_name || user.email?.split('@')[0] || 'Usuario'
        const { data: newHh } = await supabase.from('households').insert({ name: `Hogar de ${userName}` }).select('id').single()

        if (newHh) {
            household_id = newHh.id
            if (profile) {
                await supabase.from('users').update({ household_id }).eq('id', user.id)
            } else {
                if (user.email) {
                    await supabase.from('users').insert({ id: user.id, email: user.email, display_name: userName, household_id })
                }
            }
        } else {
            return NextResponse.json({ error: 'No se pudo generar el hogar automáticamente.' }, { status: 500 })
        }
    }

    const body = await request.json()
    const { amount, type, category_name, description, date } = body

    if (!amount || !type) {
        return NextResponse.json({ error: 'amount and type are required.' }, { status: 400 })
    }

    let categoryId = null
    if (category_name) {
        let { data: cat } = await supabase
            .from('categories')
            .select('id')
            .eq('name', category_name)
            .eq('type', type)
            .limit(1)
            .single()

        if (!cat) {
            const { data: newCat } = await supabase
                .from('categories')
                .insert({ name: category_name, type, is_custom: true, household_id: household_id })
                .select('id')
                .single()
            if (newCat) cat = newCat
        }
        if (cat) categoryId = cat.id
    }

    const { data, error } = await supabase
        .from('transactions')
        .insert({
            household_id: household_id,
            user_id: user.id,
            amount: parseFloat(amount),
            type,
            category_id: categoryId,
            description: description || null,
            date: date || new Date().toISOString(),
        })
        .select('*, categories(*)')
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
}
