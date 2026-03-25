'use client'
import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { TrendingUp, TrendingDown, Wallet, FilterX, Pencil } from 'lucide-react'
import TransactionEditModal from '@/components/transactions/TransactionEditModal'

const ARS = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#a3e635']
const USER_COLORS = ['#10b981', '#ec4899', '#3b82f6', '#f59e0b'] // Emerald, Pink, Blue, Amber

interface Props {
    user: any
    profile: any
    transactions: any[]
    totalIncome: number
    totalExpense: number
    balance: number
    categorySummary: { name: string; total: number }[]
    uniqueUsers: string[]
    memberSummary: { name: string; income: number; expense: number }[]
    incomeCategorySummary: any[]
    month: string
}

export default function DashboardClient({ user, profile, transactions, totalIncome, totalExpense, balance, categorySummary, uniqueUsers, memberSummary, incomeCategorySummary, month }: Props) {
    const [filterCategory, setFilterCategory] = useState<string | null>(null)
    const [filterUser, setFilterUser] = useState<string | null>(null)
    const [editingTx, setEditingTx] = useState<any>(null)

    const getRealName = (name: string) => {
        if (name.toLowerCase() === 'john.towr') return 'Juan Torres'
        if (name.toLowerCase() === 'ka20_03') return 'Romina Fernandez'
        return name
    }

    const email = profile?.email || user?.email || ''
    const baseName = profile?.display_name || (email ? email.split('@')[0] : 'Usuario')
    const displayName = getRealName(baseName)
    const initials = displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()

    const greeting = () => {
        const h = new Date().getHours()
        if (h < 12) return '🌅 Buenos días'
        if (h < 19) return '☀️ Buenas tardes'
        return '🌙 Buenas noches'
    }

    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    const [y, m] = month.split('-')
    const monthLabel = `${months[parseInt(m) - 1]} ${y}`

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pt-2">
                <div>
                    <p className="text-slate-400 text-sm">{greeting()}</p>
                    <h2 className="text-xl font-bold capitalize">{displayName}</h2>
                    {profile?.households?.name && (
                        <p className="text-xs text-slate-500">{profile.households.name}</p>
                    )}
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-lg font-bold shadow-md">
                    {initials}
                </div>
            </div>

            {/* Balance Card */}
            <div className="glass rounded-2xl p-5 bg-gradient-to-br from-primary/10 to-blue-500/10 border border-primary/20">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Balance · {monthLabel}</p>
                <p className={`text-4xl font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{ARS(balance)}</p>
                <div className="flex gap-4 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <TrendingUp size={14} className="text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400">Ingresos</p>
                            <p className="text-sm font-semibold text-emerald-400">{ARS(totalIncome)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                            <TrendingDown size={14} className="text-red-400" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400">Gastos</p>
                            <p className="text-sm font-semibold text-red-400">{ARS(totalExpense)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Layout Grid for Desktop and side-by-side preference */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pie Chart (Gastos) */}
                {categorySummary.length > 0 && (
                    <div className="glass rounded-2xl p-4 flex flex-col">
                        <h3 className="text-sm font-semibold text-slate-300 mb-3">Gastos por categoría</h3>
                        <div className="flex items-center justify-between gap-1 flex-1 min-h-[120px]">
                            <div className="w-[85px] h-[85px] flex-shrink-0 -ml-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={categorySummary} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={28} outerRadius={42} paddingAngle={2}>
                                            {categorySummary.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} onClick={() => setFilterCategory(prev => prev === categorySummary[i].name ? null : categorySummary[i].name)} style={{ cursor: 'pointer', outline: 'none' }} fillOpacity={filterCategory && filterCategory !== categorySummary[i].name ? 0.3 : 1} />)}
                                        </Pie>
                                        <Tooltip formatter={(v: any) => ARS(v)} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex-1 space-y-0.5 overflow-hidden pl-1">
                                {categorySummary.slice(0, 5).map((c, i) => (
                                    <div key={c.name} onClick={() => setFilterCategory(prev => prev === c.name ? null : c.name)} className={`flex items-center gap-1.5 cursor-pointer p-1 rounded transition-colors ${filterCategory === c.name ? 'bg-white/10' : 'hover:bg-white/5'} ${filterCategory && filterCategory !== c.name ? 'opacity-40' : 'opacity-100'}`}>
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                        <span className="text-[11px] text-slate-400 truncate flex-1 leading-tight">{c.name}</span>
                                        <span className="text-[11px] font-medium text-slate-200">{ARS(c.total)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Income Stacked Bar Chart */}
                {incomeCategorySummary.length > 0 && (
                    <div className="glass rounded-2xl p-4 flex flex-col">
                        <h3 className="text-sm font-semibold text-slate-300 mb-3">Orígenes de ingresos</h3>
                        <div className="flex-1 min-h-[120px] text-[10px] font-medium mt-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={incomeCategorySummary} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                    <YAxis width={40} stroke="#64748b" tickFormatter={(v) => `$${v / 1000}k`} tick={{ fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: '#1e293b' }} formatter={(v: any) => ARS(v)} contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', zIndex: 50 }} />
                                    {uniqueUsers.map((u, i) => (
                                        <Bar key={u} dataKey={u} stackId="a" fill={USER_COLORS[i % USER_COLORS.length]} radius={i === uniqueUsers.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} barSize={26} fillOpacity={filterUser && filterUser !== u ? 0.3 : 1} onClick={() => setFilterUser(prev => prev === u ? null : u)} style={{ cursor: 'pointer' }} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            {/* Member Summary (Combined compact cards) */}
            {memberSummary.length > 0 && (
                <div className="glass rounded-2xl p-4">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">Gestión por integrante</h3>
                    <div className="flex flex-col space-y-2">
                        {memberSummary.map((m, i) => {
                            const repName = getRealName(m.name)
                            const repInitials = repName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

                            return (
                                <div key={m.name} onClick={() => setFilterUser(prev => prev === repName ? null : repName)} className={`flex justify-between items-center p-3 rounded-xl border border-white/5 cursor-pointer transition-all ${filterUser === repName ? 'bg-slate-700/60 ring-1 ring-white/20' : 'bg-slate-800/40 hover:bg-slate-800/60'} ${filterUser && filterUser !== repName ? 'opacity-40' : 'opacity-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm" style={{ backgroundColor: USER_COLORS[i % USER_COLORS.length] }}>
                                            {repInitials}
                                        </div>
                                        <p className="text-sm font-medium capitalize">{repName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-emerald-400 font-bold leading-tight">+{ARS(m.income)}</p>
                                        <p className="text-xs text-red-400/90 font-semibold leading-tight">-{ARS(m.expense)}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Recent Transactions */}
            <div className="glass rounded-2xl p-4">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-slate-300">Últimos movimientos</h3>
                    {(filterCategory || filterUser) && (
                        <button onClick={() => { setFilterCategory(null); setFilterUser(null) }} className="flex items-center gap-1 text-[10px] text-red-400 bg-red-400/10 px-2 py-1 rounded hover:bg-red-400/20 transition-colors">
                            <FilterX size={10} /> Quitar filtros
                        </button>
                    )}
                </div>

                {(() => {
                    const filteredTxs = transactions.filter(t => {
                        if (filterCategory && ((t.categories as any)?.name || 'Sin categoría') !== filterCategory) return false
                        if (filterUser && getRealName((t.users as any)?.display_name || 'Alguien') !== filterUser) return false
                        return true
                    })

                    if (filteredTxs.length === 0) {
                        return (
                            <div className="text-center py-6">
                                <Wallet size={32} className="mx-auto text-slate-600 mb-2" />
                                <p className="text-slate-500 text-sm">{transactions.length > 0 ? 'No hay movimientos para este filtro.' : 'Aún no hay transacciones.'}</p>
                                {transactions.length === 0 && <p className="text-slate-600 text-xs">Tocá el botón + para agregar</p>}
                            </div>
                        )
                    }

                    return (
                        <div className="space-y-2">
                            {filteredTxs.slice(0, 8).map(t => {
                                const personName = getRealName((t.users as any)?.display_name || 'Alguien')
                                const dateStr = new Date(t.date || t.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
                                const description = t.description ? `${t.description} • ${personName} • ${dateStr}` : `${personName} • ${dateStr}`

                                return (
                                    <div key={t.id} onClick={() => setEditingTx(t)} className="flex items-center gap-3 py-1.5 cursor-pointer hover:bg-white/5 rounded-lg px-2 -mx-2 transition-colors group">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${t.type === 'income' ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                                            {t.type === 'income' ? '↑' : '↓'}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-2">
                                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{(t.categories as any)?.name || 'Sin categoría'} <Pencil size={10} className="inline opacity-0 group-hover:opacity-100 transition-opacity ml-1" /></p>
                                            <p className="text-[11px] text-slate-500 truncate capitalize">{description}</p>
                                        </div>
                                        <p className={`text-sm font-semibold flex-shrink-0 ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {t.type === 'income' ? '+' : '-'}{ARS(t.amount)}
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
