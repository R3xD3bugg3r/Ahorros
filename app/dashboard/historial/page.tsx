import { createClient } from '@/lib/supabase/server'
import HistorialClient from '@/components/historial/HistorialClient'

export default async function HistorialPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: transactions } = await supabase
        .from('transactions')
        .select('*, categories(name, type), users(display_name)')
        .order('date', { ascending: false })
        .limit(100)

    return <HistorialClient transactions={transactions || []} currentUserId={user!.id} />
}
