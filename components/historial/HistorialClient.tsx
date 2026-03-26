'use client'
import { useState } from 'react'
import { Search, Trash2, TrendingUp, TrendingDown, Landmark, PiggyBank, FilterX, Pencil } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { transactionService } from '@/lib/services/transactions'
import { TransactionType } from '@/lib/types'
import TransactionEditModal from '@/components/transactions/TransactionEditModal'

const ARS = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

interface Props { transactions: any[]; currentUserId: string }

export default function HistorialClient({ transactions, currentUserId }: Props) {
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<'all' | TransactionType>('all')
    const [editingTx, setEditingTx] = useState<any>(null)
    const router = useRouter()

    const filtered = transactions.filter(t => {
        const matchType = filter === 'all' || t.type === filter
        const q = search.toLowerCase()
        const matchSearch = !q || (t.categories?.name || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
        return matchType && matchSearch
    })

    async function handleDelete(e: React.MouseEvent, id: string) {
        e.stopPropagation()
        if (!confirm('¿Eliminar esta transacción?')) return
        try {
            await transactionService.deleteTransaction(id)
            router.refresh()
        } catch (err) {
            alert('Error al eliminar')
        }
    }

    const groups: Record<string, any[]> = {}
    filtered.forEach(t => {
        const d = new Date(t.date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
        if (!groups[d]) groups[d] = []
        groups[d].push(t)
    })

    return (
        <div className="p-4 space-y-4 pb-24">
            <h1 className="text-2xl font-bold pt-2">Historial</h1>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-slate-500" />
                <Input placeholder="Buscar por categoría o detalle..." className="pl-9 bg-white/5 border-white/10" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
                {[
                    ['all', 'Todos'], 
                    ['expense', 'Gastos'], 
                    ['income', 'Ingresos'],
                    ['investment', 'Inversiones'],
                    ['savings', 'Ahorros']
                ].map(([v, l]) => (
                    <button key={v} onClick={() => setFilter(v as any)}
                        className={`whitespace-nowrap px-4 py-1.5 rounded-xl text-xs font-bold border transition-all ${filter === v ? 'bg-primary/20 border-primary/50 text-primary shadow-sm' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'}`}>
                        {l}
                    </button>
                ))}
            </div>

            {/* Grouped list */}
            {Object.keys(groups).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                    <FilterX size={32} className="mb-2 opacity-50" />
                    <p className="text-sm">No se encontraron movimientos</p>
                </div>
            ) : (
                Object.entries(groups).map(([date, items]) => (
                    <div key={date}>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1 capitalize">{date}</p>
                        <div className="glass rounded-2xl overflow-hidden divide-y divide-white/5 border border-white/5">
                            {items.map(t => {
                                const typeIcon = t.type === 'income' ? <TrendingUp size={14} /> : t.type === 'expense' ? <TrendingDown size={14} /> : t.type === 'investment' ? <Landmark size={14} /> : <PiggyBank size={14} />
                                const typeColor = t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : t.type === 'expense' ? 'bg-red-500/10 text-red-400' : 'bg-violet-500/10 text-violet-400'
                                
                                return (
                                    <div key={t.id} onClick={() => setEditingTx(t)} className="flex items-center gap-3 p-3.5 hover:bg-white/5 transition-colors group cursor-pointer active:bg-white/10">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeColor}`}>
                                            {typeIcon}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-2">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm font-bold truncate capitalize">{t.categories?.name || 'Sin categoría'}</p>
                                                <Pencil size={8} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <p className="text-[11px] text-slate-500 truncate capitalize leading-tight">
                                                {t.description && <span className="text-slate-400 font-medium">{t.description} • </span>}
                                                {t.users?.display_name || 'Desconocido'}
                                            </p>
                                        </div>
                                        <div className="text-right flex items-center gap-3">
                                            <p className={`text-sm font-black tabular-nums ${t.type === 'income' ? 'text-emerald-400' : t.type === 'expense' ? 'text-red-400' : 'text-violet-300'}`}>
                                                {t.type === 'income' ? '+' : '-'}{ARS(t.amount)}
                                            </p>
                                            <button onClick={(e) => handleDelete(e, t.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors -mr-1">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))
            )}
            
            <TransactionEditModal transaction={editingTx} isOpen={!!editingTx} onClose={() => setEditingTx(null)} />
        </div>
    )
}
