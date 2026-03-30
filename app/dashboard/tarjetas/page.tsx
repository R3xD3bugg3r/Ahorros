import { createClient } from '@/lib/supabase/server'
import CardsClient from '@/components/categories/CardsClient'

export default async function TarjetasPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('users')
        .select('household_id')
        .eq('id', user!.id)
        .single()

    const { data: cards } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('household_id', profile?.household_id)
        .order('name', { ascending: true })

    return <CardsClient initialCards={cards || []} />
}
