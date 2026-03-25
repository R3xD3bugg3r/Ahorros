'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'

const ARS = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#a3e635']

interface Props {
    profile: any
    transactions: any[]
    totalIncome: number
    totalExpense: number
    balance: number
    categorySummary: { name: string; total: number }[]
    month: string
}

export default function DashboardClient({ profile, transactions, totalIncome, totalExpense, balance, categorySummary, month }: Props) {
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
        <div className="p-4 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pt-2">
                <div>
                    <p className="text-slate-400 text-sm">{greeting()}</p>
                    <h2 className="text-xl font-bold">{profile?.display_name || 'Usuario'}</h2>
                    {profile?.households?.name && (
                        <p className="text-xs text-slate-500">{profile.households.name}</p>
                    )}
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-lg font-bold">
                    {(profile?.display_name || 'U')[0].toUpperCase()}
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

            {/* Pie Chart */}
            {categorySummary.length > 0 && (
                <div className="glass rounded-2xl p-4">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">Gastos por categoría</h3>
                    <div className="flex items-center gap-4">
                        <ResponsiveContainer width={130} height={130}>
                            <PieChart>
                                <Pie data={categorySummary} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2}>
                                    {categorySummary.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(v: any) => ARS(v)} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-1.5 overflow-hidden">
                            {categorySummary.slice(0, 5).map((c, i) => (
                                <div key={c.name} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                    <span className="text-xs text-slate-400 truncate flex-1">{c.name}</span>
                                    <span className="text-xs font-medium text-slate-300">{ARS(c.total)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Transactions */}
            <div className="glass rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Últimos movimientos</h3>
                {transactions.length === 0 ? (
                    <div className="text-center py-6">
                        <Wallet size={32} className="mx-auto text-slate-600 mb-2" />
                        <p className="text-slate-500 text-sm">Aún no hay transacciones.</p>
                        <p className="text-slate-600 text-xs">Tocá el botón + para agregar</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {transactions.slice(0, 8).map(t => (
                            <div key={t.id} className="flex items-center gap-3 py-1.5">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${t.type === 'income' ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                                    {t.type === 'income' ? '↑' : '↓'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{(t.categories as any)?.name || 'Sin categoría'}</p>
                                    <p className="text-xs text-slate-500 truncate">{t.description || (t.users as any)?.display_name || '—'}</p>
                                </div>
                                <p className={`text-sm font-semibold flex-shrink-0 ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {t.type === 'income' ? '+' : '-'}{ARS(t.amount)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
