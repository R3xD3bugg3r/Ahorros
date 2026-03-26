'use client'

import { useState, useMemo } from 'react'
import { 
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList 
} from 'recharts'
import { 
    TrendingUp, TrendingDown, Wallet, FilterX, Pencil, 
    ChevronLeft, ChevronRight, Landmark, History
} from 'lucide-react'
import TransactionEditModal from '@/components/transactions/TransactionEditModal'
import { Transaction, UserProfile } from '@/lib/types'

const ARS = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
const USD = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const ARS_SHORT = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}MM`
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`
    return `$${n}`
}
const USD_SHORT = (n: number) => {
    if (n >= 1000) return `U$S ${(n / 1000).toFixed(1)}k`
    return `U$S ${n}`
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#a3e635']
const USER_COLORS = ['#10b981', '#ec4899', '#3b82f6', '#f59e0b']

interface Props {
    user: any
    profile: any
    initialTransactions: any[]
}

export default function DashboardClient({ user, profile, initialTransactions }: Props) {
    const [transactions, setTransactions] = useState<any[]>(initialTransactions)
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })
    const [filterCategory, setFilterCategory] = useState<string | null>(null)
    const [filterUser, setFilterUser] = useState<string | null>(null)
    const [editingTx, setEditingTx] = useState<any>(null)
    const [showHistory, setShowHistory] = useState(false)

    // Month Navigation
    const changeMonth = (delta: number) => {
        const [y, m] = currentMonth.split('-').map(Number)
        const d = new Date(y, m - 1 + delta, 1)
        setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }

    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    const [y, m] = currentMonth.split('-')
    const monthLabel = `${months[parseInt(m) - 1]} ${y}`

    const getRealName = (name: string) => {
        if (!name) return 'Alguien'
        const n = name.toLowerCase()
        if (n === 'john.towr' || n === 'juan torres') return 'Juan Torres'
        if (n === 'ka20_03' || n === 'romina fernandez') return 'Romina Fernandez'
        return name
    }

    const displayName = getRealName(profile?.display_name || user?.email?.split('@')[0] || 'Usuario')
    const initials = displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()

    // Filter transactions by current month
    const monthTransactions = useMemo(() => {
        return transactions.filter(t => (t.date || t.created_at).startsWith(currentMonth))
    }, [transactions, currentMonth])

    // Calculations
    const stats = useMemo(() => {
        const income = monthTransactions.filter(t => t.type === 'income' && (t.currency === 'ARS' || !t.currency)).reduce((s, t) => s + t.amount, 0)
        const expense = monthTransactions.filter(t => t.type === 'expense' && (t.currency === 'ARS' || !t.currency)).reduce((s, t) => s + t.amount, 0)
        const investment = monthTransactions.filter(t => t.type === 'investment' && (t.currency === 'ARS' || !t.currency)).reduce((s, t) => s + t.amount, 0)
        const savings = monthTransactions.filter(t => t.type === 'savings' && (t.currency === 'ARS' || !t.currency)).reduce((s, t) => s + t.amount, 0)
        
        const incomeUSD = monthTransactions.filter(t => t.type === 'income' && t.currency === 'USD').reduce((s, t) => s + t.amount, 0)
        const expenseUSD = monthTransactions.filter(t => t.type === 'expense' && t.currency === 'USD').reduce((s, t) => s + t.amount, 0)
        const investmentUSD = monthTransactions.filter(t => t.type === 'investment' && t.currency === 'USD').reduce((s, t) => s + t.amount, 0)
        const savingsUSD = monthTransactions.filter(t => t.type === 'savings' && t.currency === 'USD').reduce((s, t) => s + t.amount, 0)

        return { 
            income, expense, investment, savings, balance: income - expense,
            incomeUSD, expenseUSD, investmentUSD, savingsUSD, balanceUSD: incomeUSD - expenseUSD
        }
    }, [monthTransactions])

    // Yearly Stats
    const yearlyStats = useMemo(() => {
        const currentYear = currentMonth.substring(0, 4)
        const yearTxs = transactions.filter(t => (t.date || t.created_at).startsWith(currentYear))
        
        const expense = yearTxs.filter(t => t.type === 'expense' && (t.currency === 'ARS' || !t.currency)).reduce((s, t) => s + t.amount, 0)
        const savings = yearTxs.filter(t => (t.type === 'savings' || t.type === 'investment') && (t.currency === 'ARS' || !t.currency)).reduce((s, t) => s + t.amount, 0)
        
        const expenseUSD = yearTxs.filter(t => t.type === 'expense' && t.currency === 'USD').reduce((s, t) => s + t.amount, 0)
        const savingsUSD = yearTxs.filter(t => (t.type === 'savings' || t.type === 'investment') && t.currency === 'USD').reduce((s, t) => s + t.amount, 0)
        
        return { expense, savings, expenseUSD, savingsUSD }
    }, [transactions, currentMonth])

    // Category Summary (Expenses)
    const categorySummary = useMemo(() => {
        const map: Record<string, number> = {}
        monthTransactions.filter(t => t.type === 'expense').forEach(t => {
            const name = t.categories?.name || 'Sin categoría'
            map[name] = (map[name] || 0) + t.amount
        })
        return Object.entries(map).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total)
    }, [monthTransactions])

    // Member Summary
    const uniqueUsers = useMemo(() => {
        const set = new Set<string>()
        monthTransactions.forEach(t => set.add(getRealName(t.users?.display_name)))
        const list = Array.from(set).sort((a, b) => a === displayName ? -1 : b === displayName ? 1 : a.localeCompare(b))
        return list
    }, [monthTransactions, displayName])

    const memberSummary = useMemo(() => {
        const map: Record<string, { name: string, income: number, expense: number }> = {}
        uniqueUsers.forEach(u => map[u] = { name: u, income: 0, expense: 0 })
        monthTransactions.forEach(t => {
            const u = getRealName(t.users?.display_name)
            if (t.type === 'income') map[u].income += t.amount
            if (t.type === 'expense') map[u].expense += t.amount
        })
        return Object.values(map)
    }, [monthTransactions, uniqueUsers])

    // Income Sources
    const incomeCategorySummary = useMemo(() => {
        const map: Record<string, any> = {}
        monthTransactions.filter(t => t.type === 'income').forEach(t => {
            const cat = t.categories?.name || 'Sin categoría'
            const user = getRealName(t.users?.display_name)
            if (!map[cat]) {
                map[cat] = { name: cat }
                uniqueUsers.forEach(u => map[cat][u] = 0)
            }
            map[cat][user] += t.amount
        })
        return Object.values(map)
    }, [monthTransactions, uniqueUsers])

    // Historical Data (Last 6 months)
    const historicalData = useMemo(() => {
        const data: Record<string, any> = {}
        const last6Months = []
        for (let i = 5; i >= 0; i--) {
            const d = new Date()
            d.setMonth(d.getMonth() - i)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            last6Months.push(key)
            data[key] = { label: months[d.getMonth()], full: key, income: 0, expense: 0, investment: 0 }
        }

        transactions.forEach(t => {
            const key = (t.date || t.created_at).substring(0, 7)
            if (data[key]) {
                if (t.type === 'income') data[key].income += t.amount
                if (t.type === 'expense') data[key].expense += t.amount
                if (t.type === 'investment' || t.type === 'savings') data[key].investment += t.amount
            }
        })
        return last6Months.map(k => data[k])
    }, [transactions])

    const greeting = () => {
        const h = new Date().getHours()
        if (h < 12) return '🌅 Buenos días'
        if (h < 19) return '☀️ Buenas tardes'
        return '🌙 Buenas noches'
    }

    return (
        <div className="p-4 space-y-4 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between pt-2">
                <div>
                    <p className="text-slate-400 text-sm">{greeting()}</p>
                    <h2 className="text-xl font-bold capitalize">{displayName}</h2>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-lg font-bold shadow-md">
                    {initials}
                </div>
            </div>

            {/* Month Selector */}
            <div className="flex items-center justify-between glass rounded-xl px-4 py-2 border border-white/5">
                <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={20} /></button>
                <div className="text-center">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-tighter">Periodo Seleccionado</p>
                    <p className="text-sm font-bold text-primary">{monthLabel}</p>
                </div>
                <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white/10 rounded-full transition-colors"><ChevronRight size={20} /></button>
            </div>

            {/* Main Stats Card */}
            <div className="glass rounded-2xl p-5 bg-gradient-to-br from-primary/10 to-blue-500/10 border border-primary/20 shadow-xl shadow-primary/5">
                <div className="flex justify-between items-start mb-1">
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Balance Disponible</p>
                    <button onClick={() => setShowHistory(!showHistory)} className="text-slate-500 hover:text-primary transition-colors">
                        <History size={16} />
                    </button>
                </div>
                <p className={`text-4xl font-bold ${stats.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{ARS(stats.balance)}</p>
                
                <div className="grid grid-cols-2 gap-4 mt-5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <TrendingUp size={16} className="text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-slate-500 font-medium uppercase truncate">Ingresos</p>
                            <p className="text-sm font-bold text-emerald-400 truncate">{ARS(stats.income)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                            <TrendingDown size={16} className="text-red-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-slate-500 font-medium uppercase truncate">Gastos</p>
                            <p className="text-sm font-bold text-red-400 truncate">{ARS(stats.expense)}</p>
                        </div>
                    </div>
                </div>

                {/* Reserves Row */}
                {(stats.investment > 0 || stats.savings > 0 || stats.investmentUSD > 0 || stats.savingsUSD > 0) && (
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Landmark size={14} className="text-violet-400" />
                                <span className="text-xs text-slate-400 font-medium font-mono uppercase tracking-tighter">Reservas del Periodo</span>
                            </div>
                            <div className="flex gap-2">
                                {(stats.investment + stats.savings > 0) && (
                                    <span className="text-xs font-bold text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded-lg border border-violet-400/20">
                                        {ARS(stats.investment + stats.savings)}
                                    </span>
                                )}
                                {(stats.investmentUSD + stats.savingsUSD > 0) && (
                                    <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-lg border border-blue-400/20">
                                        {USD(stats.investmentUSD + stats.savingsUSD)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="glass rounded-2xl p-4 border border-zinc-500/10 bg-gradient-to-br from-amber-500/5 to-transparent">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black text-amber-500/70 uppercase tracking-[0.2em] flex items-center gap-2">
                        <TrendingUp size={12} /> Acumulado Anual {y}
                    </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Total Gastado</p>
                        <p className="text-sm font-black text-red-400">{ARS(yearlyStats.expense)}</p>
                        {yearlyStats.expenseUSD > 0 && <p className="text-[10px] font-bold text-red-400/70">{USD(yearlyStats.expenseUSD)}</p>}
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Total Reservado</p>
                        <p className="text-sm font-black text-violet-400">{ARS(yearlyStats.savings)}</p>
                        {yearlyStats.savingsUSD > 0 && <p className="text-[10px] font-bold text-violet-400/70">{USD(yearlyStats.savingsUSD)}</p>}
                    </div>
                </div>
            </div>

            {/* Historical Charts (MoM) */}
            {showHistory && (
                <div className="glass rounded-2xl p-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                        <TrendingUp size={14} className="text-primary"/> Tendencia de Gastos
                    </h3>
                    <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={historicalData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                <XAxis dataKey="label" stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                                <YAxis stroke="#475569" tickFormatter={ARS_SHORT} tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: '#ffffff05' }} formatter={(v: any) => ARS(v)} contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '11px' }} />
                                <Bar dataKey="expense" fill="url(#gradient-red)" radius={[4, 4, 0, 0]} barSize={20}>
                                    <LabelList dataKey="expense" position="top" content={(props) => {
                                        const { x, y, value, width } = props as any;
                                        return <text x={x + width / 2} y={y - 8} fill="#ef4444" fontSize={10} fontWeight="bold" textAnchor="middle">{ARS_SHORT(value)}</text>;
                                    }} />
                                </Bar>
                                <defs>
                                    <linearGradient id="gradient-red" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.2} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gastos por Categoría - Horizontal Bar Chart */}
                {categorySummary.length > 0 && (
                    <div className="glass rounded-2xl p-4 flex flex-col min-h-[260px] md:col-span-2">
                        <h3 className="text-sm font-semibold text-slate-300 mb-6 flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-red-400" /> Distribución de Gastos
                        </h3>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height={Math.max(160, categorySummary.length * 35)}>
                                <BarChart
                                    layout="vertical"
                                    data={categorySummary}
                                    margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#ffffff05" />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        type="category" 
                                        dataKey="name" 
                                        stroke="#94a3b8" 
                                        fontSize={11} 
                                        tickLine={false} 
                                        axisLine={false}
                                        width={80}
                                        tickFormatter={(v) => v.length > 12 ? v.substring(0, 10) + '..' : v}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: '#ffffff05' }} 
                                        formatter={(v: any) => ARS(v)} 
                                        contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '11px' }} 
                                    />
                                    <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={16}>
                                        {categorySummary.map((_, i) => (
                                            <Cell 
                                                key={i} 
                                                fill={COLORS[i % COLORS.length]} 
                                                fillOpacity={filterCategory && filterCategory !== categorySummary[i].name ? 0.3 : 1}
                                                onClick={() => setFilterCategory(prev => prev === categorySummary[i].name ? null : categorySummary[i].name)}
                                                style={{ cursor: 'pointer', outline: 'none' }}
                                            />
                                        ))}
                                        <LabelList 
                                            dataKey="total" 
                                            position="right" 
                                            formatter={(v: any) => ARS_SHORT(v)} 
                                            style={{ fill: '#cbd5e1', fontSize: '10px', fontWeight: 'bold' }} 
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Origen de Ingresos */}
                {incomeCategorySummary.length > 0 && (
                    <div className="glass rounded-2xl p-4 flex flex-col min-h-[180px]">
                        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Facturación
                        </h3>
                        <div className="flex-1 min-h-[120px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={incomeCategorySummary} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} interval={0} angle={-15} textAnchor="end" height={35} />
                                    <YAxis stroke="#475569" tickFormatter={ARS_SHORT} tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: '#ffffff05' }} formatter={(v: any) => ARS(v)} contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '11px' }} />
                                    {uniqueUsers.map((u, i) => (
                                        <Bar key={u} dataKey={u} stackId="a" fill={USER_COLORS[i % USER_COLORS.length]} radius={i === uniqueUsers.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} barSize={20} fillOpacity={filterUser && filterUser !== u ? 0.3 : 1} onClick={() => setFilterUser(prev => prev === u ? null : u)} style={{ cursor: 'pointer' }}>
                                            {i === uniqueUsers.length - 1 && <LabelList dataKey={(d: any) => {
                                                let sum = 0;
                                                uniqueUsers.forEach(userKey => sum += (d[userKey] || 0));
                                                return sum;
                                            }} position="top" content={(props) => {
                                                const { x, y, value, width } = props as any;
                                                return <text x={x + width / 2} y={y - 8} fill="#10b981" fontSize={10} fontWeight="bold" textAnchor="middle">{ARS_SHORT(value)}</text>;
                                            }} />}
                                        </Bar>
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            {/* Member Summary */}
            {memberSummary.length > 0 && (
                <div className="glass rounded-2xl p-4">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">Gestión por integrante</h3>
                    <div className="flex flex-col space-y-2">
                        {memberSummary.map((m, i) => (
                            <div key={m.name} onClick={() => setFilterUser(prev => prev === m.name ? null : m.name)} className={`flex justify-between items-center p-3 rounded-xl border border-white/5 cursor-pointer transition-all ${filterUser === m.name ? 'bg-slate-700/60 ring-1 ring-white/20' : 'bg-slate-800/40 hover:bg-slate-800/60'} ${filterUser && filterUser !== m.name ? 'opacity-40' : 'opacity-100'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm" style={{ backgroundColor: USER_COLORS[i % USER_COLORS.length] }}>
                                        {m.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                                    </div>
                                    <p className="text-sm font-medium capitalize">{m.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-emerald-400 font-bold leading-tight">+{ARS(m.income)}</p>
                                    <p className="text-xs text-red-400/90 font-semibold leading-tight">-{ARS(m.expense)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Transactions */}
            <div className="glass rounded-2xl p-4">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-slate-300">Movimientos de {monthLabel}</h3>
                    {(filterCategory || filterUser) && (
                        <button onClick={() => { setFilterCategory(null); setFilterUser(null) }} className="flex items-center gap-1 text-[10px] text-red-400 bg-red-400/10 px-2 py-1 rounded hover:bg-red-400/20 transition-colors">
                            <FilterX size={10} /> Quitar filtros
                        </button>
                    )}
                </div>

                {(() => {
                    const filteredTxs = monthTransactions.filter(t => {
                        if (filterCategory && (t.categories?.name || 'Sin categoría') !== filterCategory) return false
                        if (filterUser && getRealName(t.users?.display_name || 'Alguien') !== filterUser) return false
                        return true
                    })

                    if (filteredTxs.length === 0) {
                        return (
                            <div className="text-center py-6">
                                <Wallet size={32} className="mx-auto text-slate-600 mb-2" />
                                <p className="text-slate-500 text-sm">Sin movimientos</p>
                            </div>
                        )
                    }

                    return (
                        <div className="space-y-2">
                            {filteredTxs.slice(0, 10).map(t => {
                                const personName = getRealName(t.users?.display_name || 'Alguien')
                                const dateStr = new Date(t.date || t.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
                                const typeIcon = t.type === 'income' ? '↑' : t.type === 'expense' ? '↓' : t.type === 'investment' ? '🏦' : '🐷'
                                const typeColor = t.type === 'income' ? 'bg-emerald-500/15 text-emerald-400' : t.type === 'expense' ? 'bg-red-500/15 text-red-400' : 'bg-violet-500/15 text-violet-400'
                                
                                return (
                                    <div key={t.id} onClick={() => setEditingTx(t)} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-white/5 rounded-lg px-2 -mx-2 transition-colors group">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${typeColor}`}>
                                            {typeIcon}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-2">
                                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors capitalize">
                                                {t.categories?.name || 'Sin categoría'} <Pencil size={8} className="inline opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                                            </p>
                                            <p className="text-[11px] text-slate-500 truncate capitalize">
                                                {t.description ? `${t.description} • ` : ''}{personName} • {dateStr}
                                            </p>
                                        </div>
                                        <p className={`text-sm font-bold flex-shrink-0 ${t.type === 'income' ? 'text-emerald-400' : t.type === 'expense' ? 'text-red-400' : 'text-violet-300'}`}>
                                            {t.type === 'income' ? '+' : '-'}{t.currency === 'USD' ? USD_SHORT(t.amount) : ARS_SHORT(t.amount)}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                    )
                })()}
            </div>
            
            <TransactionEditModal transaction={editingTx} isOpen={!!editingTx} onClose={() => setEditingTx(null)} />
        </div>
    )
}
