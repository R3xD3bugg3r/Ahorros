'use client'
import { useState } from 'react'
import { Search, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'

const ARS = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

interface Props { transactions: any[]; currentUserId: string }

export default function HistorialClient({ transactions, currentUserId }: Props) {
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
    const router = useRouter()

    const filtered = transactions.filter(t => {
        const matchType = filter === 'all' || t.type === filter
        const q = search.toLowerCase()
        const matchSearch = !q || (t.categories?.name || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
        return matchType && matchSearch
    })

    async function handleDelete(id: string) {
        if (!confirm('¿Eliminar esta transacción?')) return
        await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
        router.refresh()
    }

    // Group by date
    const groups: Record<string, any[]> = {}
    filtered.forEach(t => {
        const d = new Date(t.date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
        if (!groups[d]) groups[d] = []
        groups[d].push(t)
    })

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-2xl font-bold pt-2">Historial</h1>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                <Input placeholder="Buscar..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Filter chips */}
            <div className="flex gap-2">
                {[['all', 'Todos'], ['expense', 'Gastos'], ['income', 'Ingresos']].map(([v, l]) => (
                    <button key={v} onClick={() => setFilter(v as any)}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${filter === v ? 'bg-primary/20 border-primary/50 text-primary' : 'border-white/10 text-slate-400'}`}>
                        {l}
                    </button>
                ))}
            </div>

            {/* Grouped list */}
            {Object.keys(groups).length === 0 ? (
                <div className="text-center py-12 text-slate-500">Sin resultados</div>
            ) : (
                Object.entries(groups).map(([date, items]) => (
                    <div key={date}>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 capitalize">{date}</p>
                        <div className="glass rounded-xl overflow-hidden divide-y divide-white/5">
                            {items.map(t => (
                                <div key={t.id} className="flex items-center gap-3 p-3">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${t.type === 'income' ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                                        {t.type === 'income' ? <TrendingUp size={15} className="text-emerald-400" /> : <TrendingDown size={15} className="text-red-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{t.categories?.name || 'Sin categoría'}</p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {t.description || '—'} · {t.users?.display_name === currentUserId ? 'Vos' : (t.users?.display_name || '?')}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {t.type === 'income' ? '+' : '-'}{ARS(t.amount)}
                                        </p>
                                        <button onClick={() => handleDelete(t.id)} className="text-slate-600 hover:text-red-400 ml-2">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}
