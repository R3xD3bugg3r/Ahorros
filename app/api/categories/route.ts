import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get both global and household categories
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('type').order('name')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
        .from('users').select('household_id').eq('id', user.id).single()

    const body = await request.json()
    const { name, type } = body

    if (!name || !type) return NextResponse.json({ error: 'name and type are required.' }, { status: 400 })

    const { data, error } = await supabase
        .from('categories')
        .insert({
            household_id: profile?.household_id || null,
            name,
            type,
            is_custom: true,
        })
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
}
