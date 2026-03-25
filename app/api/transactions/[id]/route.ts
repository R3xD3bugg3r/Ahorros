import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { amount, type, category_name, description, date } = body

    // 1. Get user profile for household_id
    const { data: profile } = await supabase.from('users').select('household_id').eq('id', user.id).single()
    const household_id = profile?.household_id

    // 2. Resolve category_name to category_id
    let categoryId = null
    if (category_name) {
        let { data: cat } = await supabase
            .from('categories')
            .select('id')
            .eq('name', category_name)
            .eq('type', type)
            .limit(1)
            .single()

        if (!cat && household_id) {
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
        .update({ 
            amount: amount ? parseFloat(amount) : undefined, 
            type, 
            category_id: categoryId, 
            description, 
            date 
        })
        .eq('id', params.id)
        .select('*, categories(*)')
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}
