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

    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const { data: transactions } = await supabase
        .from('transactions')
        .select('*, categories(name, icon, type), users(display_name)')
        .gte('date', `${month}-01T00:00:00.000Z`)
        .order('date', { ascending: false })
        .limit(20)

    const totalIncome = (transactions || [])
        .filter(t => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0)

    const totalExpense = (transactions || [])
        .filter(t => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0)

    // Category summary for donut chart (Expenses)
    const catMap: Record<string, number> = {}
        ; (transactions || []).filter(t => t.type === 'expense').forEach(t => {
            const name = (t.categories as any)?.name || 'Sin categoría'
            catMap[name] = (catMap[name] || 0) + t.amount
        })
    const categorySummary = Object.entries(catMap).map(([name, total]) => ({ name, total }))

    const getRealName = (name: string) => {
        if (!name) return 'Alguien'
        if (name.toLowerCase() === 'john.towr') return 'Juan Torres'
        if (name.toLowerCase() === 'ka20_03') return 'Romina Fernandez'
        return name
    }

    const currentUserEmail = profile?.email || user?.email || ''
    const baseName = profile?.display_name || (currentUserEmail ? currentUserEmail.split('@')[0] : 'Usuario')
    const currentUserName = getRealName(baseName)

    // Identify all unique users that have transactions
    const uniqueUsersSet = new Set<string>()
        ; (transactions || []).forEach(t => {
            uniqueUsersSet.add(getRealName((t.users as any)?.display_name))
        })
    // Sort so the current logged-in user is ALWAYS first (gets Emerald color)
    const uniqueUsers = Array.from(uniqueUsersSet).sort((a, b) => {
        if (a === currentUserName) return -1
        if (b === currentUserName) return 1
        return a.localeCompare(b)
    })

    // Member Summary (Combine Income & Expense per user to save screen space)
    const memberMap: Record<string, { income: number, expense: number }> = {}
    uniqueUsers.forEach(u => memberMap[u] = { income: 0, expense: 0 })

        ; (transactions || []).forEach(t => {
            const userName = getRealName((t.users as any)?.display_name)
            if (t.type === 'income') memberMap[userName].income += t.amount
            if (t.type === 'expense') memberMap[userName].expense += t.amount
        })
    const memberSummary = Object.entries(memberMap).map(([name, data]) => ({ name, ...data }))

    // Income Multi-Bar Chart (Category -> Users)
    const incomeCatUserMap: Record<string, Record<string, number>> = {}
        ; (transactions || []).filter(t => t.type === 'income').forEach(t => {
            const catName = (t.categories as any)?.name || 'Sin categoría'
            const userName = getRealName((t.users as any)?.display_name)

            if (!incomeCatUserMap[catName]) {
                incomeCatUserMap[catName] = {}
                uniqueUsers.forEach(u => incomeCatUserMap[catName][u] = 0)
            }
            incomeCatUserMap[catName][userName] += t.amount
        })
    const incomeCategorySummary = Object.entries(incomeCatUserMap).map(([name, users]) => ({ name, ...users }))

    return (
        <DashboardClient
            user={user}
            profile={profile}
            transactions={transactions || []}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            balance={totalIncome - totalExpense}
            categorySummary={categorySummary}
            uniqueUsers={uniqueUsers}
            memberSummary={memberSummary}
            incomeCategorySummary={incomeCategorySummary}
            month={month}
        />
    )
}
