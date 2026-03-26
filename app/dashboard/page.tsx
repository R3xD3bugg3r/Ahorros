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

    const { data: transactions } = await supabase
        .from('transactions')
        .select('*, categories(name, icon, type, default_description), users(display_name)')
        .order('date', { ascending: false })
        .limit(500)

    return (
        <DashboardClient
            user={user}
            profile={profile}
            initialTransactions={transactions || []}
        />
    )
}
