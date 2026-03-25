'use client'
import { Bug, TrendingDown, AlertTriangle } from 'lucide-react'

const ARS = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

interface HormigaItem {
    category_name: string
    description: string | null
    count: number
    total_amount: number
    average_amount: number
    transactions: any[]
}

export default function HormigaClient({ items }: { items: HormigaItem[] }) {
    return (
        <div className="p-4 space-y-5">
            {/* Header */}
            <div className="pt-2">
                <div className="flex items-center gap-2 mb-1">
                    <Bug size={22} className="text-amber-400" />
                    <h1 className="text-2xl font-bold">Gasto Hormiga</h1>
                </div>
                <p className="text-slate-400 text-sm">Gastos repetidos entre $500 y $50.000 en los últimos 30 días.</p>
            </div>

            {/* Alert */}
            {items.length > 0 && (
                <div className="glass rounded-xl p-3 border border-amber-500/30 bg-amber-500/5 flex gap-3 items-start">
                    <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-amber-300">
                            Detectamos {items.length} patrón{items.length > 1 ? 'es' : ''} de gasto hormiga
                        </p>
                        <p className="text-xs text-amber-400/70 mt-0.5">
                            Impacto total: {ARS(items.reduce((s, i) => s + i.total_amount, 0))}
                        </p>
                    </div>
                </div>
            )}

            {/* Items */}
            {items.length === 0 ? (
                <div className="text-center py-16 glass rounded-2xl">
                    <Bug size={48} className="mx-auto text-slate-600 mb-3" />
                    <p className="text-slate-400 font-medium">¡Sin gastos hormiga!</p>
                    <p className="text-slate-600 text-sm mt-1">No encontramos gastos repetidos en este período.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item, i) => (
                        <div key={i} className="glass rounded-2xl p-4 border border-amber-500/10">
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <div>
                                    <p className="font-semibold">{item.category_name}</p>
                                    {item.description && <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>}
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-lg font-bold text-amber-400">{ARS(item.total_amount)}</p>
                                    <p className="text-xs text-slate-500">total</p>
                                </div>
                            </div>

                            <div className="flex gap-3 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                    <TrendingDown size={11} /> {item.count} veces
                                </span>
                                <span>·</span>
                                <span>Promedio {ARS(item.average_amount)} c/u</span>
                            </div>

                            {/* Mini transaction list */}
                            <div className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
                                {item.transactions.slice(0, 4).map(t => (
                                    <div key={t.id} className="flex items-center justify-between text-xs">
                                        <span className="text-slate-500">{new Date(t.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                                        <span className="text-red-400">{ARS(t.amount)}</span>
                                    </div>
                                ))}
                                {item.transactions.length > 4 && (
                                    <p className="text-xs text-slate-600">+{item.transactions.length - 4} más</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
