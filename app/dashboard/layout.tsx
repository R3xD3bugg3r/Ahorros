import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import TransactionModal from '@/components/transactions/TransactionModal'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/')

    return (
        <div className="min-h-screen flex flex-col max-w-md mx-auto relative">
            <main className="flex-1 overflow-y-auto pb-24">
                {children}
            </main>
            <TransactionModal />
            <BottomNav />
        </div>
    )
}
