'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
    Plus, ChevronLeft, CreditCard as CardIcon, Trash2, X, Save, 
    Loader2, Edit3, ChevronDown, ChevronUp, Calendar, AlertCircle, Pencil
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { transactionService } from '@/lib/services/transactions'
import { CreditCard, Transaction } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import TransactionEditModal from '@/components/transactions/TransactionEditModal'
import TransactionModal from '@/components/transactions/TransactionModal'

const ARS = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
const ARS_SHORT = (n: number) => `$${(n / 1000).toFixed(0)}k`

export default function CardsClient({ initialCards }: { initialCards: CreditCard[] }) {
    const [cards, setCards] = useState<CreditCard[]>(initialCards)
    const [isAdding, setIsAdding] = useState(false)
    const [editingCardId, setEditingCardId] = useState<string | null>(null)
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
    const [cardTransactions, setCardTransactions] = useState<Transaction[]>([])
    const [loadingTxs, setLoadingTxs] = useState(false)
    
    // Card Form State (Add/Edit)
    const [name, setName] = useState('')
    const [bank, setBank] = useState('')
    const [closingDay, setClosingDay] = useState('25')
    const [dueDay, setDueDay] = useState('5')
    
    // Transaction UI State
    const [editingTx, setEditingTx] = useState<Transaction | null>(null)
    const [showAddTxModal, setShowAddTxModal] = useState(false)
    
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    // Fetch transactions when expanding
    useEffect(() => {
        if (expandedCardId) {
            setLoadingTxs(true)
            transactionService.getTransactionsByCard(expandedCardId)
                .then(setCardTransactions)
                .catch(console.error)
                .finally(() => setLoadingTxs(false))
        } else {
            setCardTransactions([])
        }
    }, [expandedCardId])

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No user')
            
            const { data: profile } = await supabase.from('users').select('household_id').eq('id', user.id).single()
            
            const { data, error } = await supabase.from('credit_cards').insert({
                household_id: profile?.household_id,
                name,
                bank,
                closing_day: parseInt(closingDay),
                due_day: parseInt(dueDay)
            }).select().single()

            if (error) throw error
            setCards([...cards, data])
            setIsAdding(false)
            resetForm()
            router.refresh()
        } catch (err) {
            alert('Error al agregar tarjeta')
        } finally {
            setLoading(false)
        }
    }

    async function handleEdit(e: React.FormEvent) {
        e.preventDefault()
        if (!editingCardId) return
        setLoading(true)
        try {
            const updated = await transactionService.updateCreditCard(editingCardId, {
                name,
                bank,
                closing_day: parseInt(closingDay),
                due_day: parseInt(dueDay)
            })
            setCards(cards.map(c => c.id === editingCardId ? updated : c))
            setEditingCardId(null)
            resetForm()
            router.refresh()
        } catch (err) {
            alert('Error al editar')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Estás seguro de borrar esta tarjeta?')) return
        try {
            const { error } = await supabase.from('credit_cards').delete().eq('id', id)
            if (error) throw error
            setCards(cards.filter(c => c.id !== id))
            router.refresh()
        } catch (err) {
            alert('Error al borrar. Podría tener transacciones asociadas.')
        }
    }

    function resetForm() {
        setName('')
        setBank('')
        setClosingDay('25')
        setDueDay('5')
    }

    function prepareEdit(card: CreditCard) {
        setEditingCardId(card.id)
        setName(card.name)
        setBank(card.bank || '')
        setClosingDay(card.closing_day?.toString() || '25')
        setDueDay(card.due_day?.toString() || '5')
    }

    // Group transactions by month for the breakdown
    const groupedTxs = useMemo(() => {
        const groups: Record<string, Transaction[]> = {}
        cardTransactions.forEach(t => {
            const month = t.statement_month || 'Sin mes'
            if (!groups[month]) groups[month] = []
            groups[month].push(t)
        })
        return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
    }, [cardTransactions])

    return (
        <div className="p-4 space-y-4 pb-24">
            <div className="flex items-center gap-3 pt-2">
                <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold">Mis Tarjetas</h1>
            </div>

            <div className="space-y-4">
                {cards.map(card => {
                    const isEditing = editingCardId === card.id
                    const isExpanded = expandedCardId === card.id

                    return (
                        <div key={card.id} className={`glass rounded-2xl overflow-hidden border transition-all ${isExpanded ? 'border-primary/40 ring-1 ring-primary/20' : 'border-white/5'}`}>
                            {isEditing ? (
                                <form onSubmit={handleEdit} className="p-5 space-y-4 bg-primary/5">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-primary flex items-center gap-2 text-sm uppercase tracking-wider"><Edit3 size={14} /> Editando Tarjeta</h3>
                                        <button type="button" onClick={() => setEditingCardId(null)} className="text-slate-500 hover:text-white"><X size={18} /></button>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] text-slate-500 font-bold uppercase">Nombre</Label>
                                            <Input value={name} onChange={e => setName(e.target.value)} required className="bg-white/5" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] text-slate-500 font-bold uppercase">Banco</Label>
                                            <Input value={bank} onChange={e => setBank(e.target.value)} className="bg-white/5" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-slate-500 font-bold uppercase">Cierre (Día)</Label>
                                                <Input type="number" min="1" max="31" value={closingDay} onChange={e => setClosingDay(e.target.value)} className="bg-white/5" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-slate-500 font-bold uppercase">Vencimiento (Día)</Label>
                                                <Input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} className="bg-white/5" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="submit" className="flex-1 font-bold h-11" disabled={loading}>
                                            <Save size={16} className="mr-2" /> Guardar
                                        </Button>
                                        <Button type="button" variant="outline" className="bg-white/5 h-11" onClick={() => setEditingCardId(null)}>Cancelar</Button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="p-5 relative group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white shadow-lg shadow-primary/20 flex-shrink-0">
                                                <CardIcon size={24} />
                                            </div>
                                            <div className="flex-1 min-w-0 pointer-events-auto" onClick={() => setExpandedCardId(isExpanded ? null : card.id)}>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-lg leading-tight truncate">{card.name}</p>
                                                    {isExpanded ? <ChevronUp size={14} className="text-primary" /> : <ChevronDown size={14} className="text-slate-500" />}
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium">{card.bank || 'Sin banco'} • Cierre: {card.closing_day ?? '-'} • Vto: {card.due_day ?? '-'}</p>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); prepareEdit(card); }} className="p-2 text-slate-400 hover:text-primary transition-colors">
                                                    <Edit3 size={18} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(card.id); }} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Detail View */}
                                    {isExpanded && (
                                        <div className="bg-black/20 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                                            <div className="p-4 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                        <Calendar size={12} /> Desglose de Gastos
                                                    </h4>
                                                    <button 
                                                        onClick={() => setShowAddTxModal(true)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all text-[11px] font-bold"
                                                    >
                                                        <Plus size={14} /> Agregar Gasto
                                                    </button>
                                                </div>

                                                {loadingTxs ? (
                                                    <div className="py-10 flex flex-col items-center justify-center text-slate-500 gap-3">
                                                        <Loader2 className="animate-spin" size={24} />
                                                        <p className="text-xs font-medium">Buscando consumos...</p>
                                                    </div>
                                                ) : cardTransactions.length === 0 ? (
                                                    <div className="py-12 text-center text-slate-500 italic text-sm bg-white/5 rounded-xl border border-dashed border-white/5 mx-2">
                                                        No hay gastos registrados con esta tarjeta.
                                                    </div>
                                                ) : (
                                                    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-1 no-scrollbar pb-4">
                                                        {groupedTxs.map(([month, txs]) => (
                                                            <div key={month} className="space-y-2">
                                                                <div className="sticky top-0 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-primary border border-primary/20 inline-block">
                                                                    Resumen {month}
                                                                </div>
                                                                <div className="space-y-1 mt-2">
                                                                    {txs.map(t => (
                                                                        <div key={t.id} onClick={() => setEditingTx(t)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group/tx">
                                                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs border border-white/5 text-slate-400 group-hover/tx:border-primary/30 group-hover/tx:text-primary transition-colors">
                                                                                {t.installments_count && t.installments_count > 1 ? `${t.installment_number}/${t.installments_count}` : '1/1'}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-xs font-bold truncate group-hover/tx:text-primary transition-colors">{t.categories?.name || t.description || 'Gasto'}</p>
                                                                                <p className="text-[10px] text-slate-500 font-medium">{t.description ? `${t.description} • ` : ''}{new Date(t.date).toLocaleDateString('es-AR')}</p>
                                                                            </div>
                                                                            <p className="text-xs font-black text-red-400">
                                                                                -{t.currency === 'USD' ? `U$S ${t.amount}` : ARS(t.amount)}
                                                                            </p>
                                                                            <Pencil size={10} className="text-slate-600 opacity-0 group-hover/tx:opacity-100" />
                                                                        </div>
                                                                    ))}
                                                                    <div className="pt-2 px-2 flex justify-between items-center border-t border-white/5 mt-1">
                                                                        <span className="text-[10px] text-slate-500 font-bold uppercase">Total del Resumen</span>
                                                                        <span className="text-sm font-black text-primary">{ARS(txs.reduce((s,t) => s+t.amount, 0))}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )
                })}

                {cards.length === 0 && !isAdding && (
                    <div className="text-center py-16 px-6 glass rounded-2xl border border-dashed border-white/10 text-slate-500">
                        <AlertCircle className="mx-auto mb-3 opacity-20" size={40} />
                        <p className="text-sm font-medium">No tenés tarjetas cargadas aún.</p>
                        <p className="text-xs opacity-60">Agregá tu primera tarjeta para empezar a trackear cuotas.</p>
                    </div>
                )}

                {isAdding ? (
                    <form onSubmit={handleAdd} className="glass rounded-2xl p-6 border border-primary/30 space-y-4 animate-in zoom-in-95 duration-200">
                        <h3 className="font-bold text-primary flex items-center gap-2"><Plus size={18} /> Nueva Tarjeta</h3>
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-400">Nombre (ej: Visa ICBC)</Label>
                                <Input value={name} onChange={e => setName(e.target.value)} required className="bg-white/5 border-white/10" placeholder="Visa / Mastercard..." />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-400">Banco <span className="opacity-50">(opcional)</span></Label>
                                <Input value={bank} onChange={e => setBank(e.target.value)} className="bg-white/5 border-white/10" placeholder="Banco Galicia, BBVA..." />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-slate-400">Día de Cierre</Label>
                                    <Input type="number" min="1" max="31" value={closingDay} onChange={e => setClosingDay(e.target.value)} className="bg-white/5 border-white/10" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-slate-400">Día de Vencimiento</Label>
                                    <Input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} className="bg-white/5 border-white/10" />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button type="submit" className="flex-1 font-bold h-12" disabled={loading}>
                                {loading && <Loader2 size={14} className="mr-2 animate-spin" />}
                                Guardar Tarjeta
                            </Button>
                            <Button type="button" variant="outline" className="flex-1 bg-white/5 h-12 border-white/10" onClick={() => setIsAdding(false)}>
                                Cancelar
                            </Button>
                        </div>
                    </form>
                ) : (
                    <Button 
                        onClick={() => setIsAdding(true)}
                        className="w-full h-14 rounded-2xl border-dashed border-2 bg-transparent hover:bg-primary/5 text-primary border-primary/30 font-bold transition-all hover:border-primary/60"
                    >
                        <Plus size={20} className="mr-2" /> Agregar Nueva Tarjeta
                    </Button>
                )}
            </div>

            {/* Modals */}
            {editingTx && (
                <TransactionEditModal 
                    transaction={editingTx} 
                    isOpen={!!editingTx} 
                    onClose={() => {
                        setEditingTx(null);
                        // Refresh transactions for the expanded card
                        if (expandedCardId) {
                            transactionService.getTransactionsByCard(expandedCardId).then(setCardTransactions);
                        }
                    }} 
                />
            )}

            {showAddTxModal && expandedCardId && (
                <TransactionModal 
                    initialOpen={true}
                    hideFab={true}
                    defaultPaymentMethod="credit_card"
                    defaultCreditCardId={expandedCardId}
                    onClose={() => setShowAddTxModal(false)}
                />
            )}
        </div>
    )
}
