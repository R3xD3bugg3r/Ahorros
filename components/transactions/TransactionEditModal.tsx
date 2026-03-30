'use client'
import { useState, useEffect } from 'react'
import { X, TrendingDown, TrendingUp, Loader2, Landmark, PiggyBank, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { transactionService } from '@/lib/services/transactions'
import { Category, Transaction, TransactionType, CreditCard } from '@/lib/types'

interface TransactionEditModalProps {
    transaction: Transaction | null
    isOpen: boolean
    onClose: () => void
}

export default function TransactionEditModal({ transaction, isOpen, onClose }: TransactionEditModalProps) {
    const [type, setType] = useState<TransactionType>('expense')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('')
    const [customCategory, setCustomCategory] = useState('')
    const [date, setDate] = useState('')
    const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS')
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'debit' | 'credit_card'>('cash')
    const [creditCardId, setCreditCardId] = useState('')
    const [selectedAccount, setSelectedAccount] = useState('')
    const [accounts, setAccounts] = useState<any[]>([])
    const [creditCards, setCreditCards] = useState<CreditCard[]>([])
    const [installments, setInstallments] = useState('1')
    const [statementMonth, setStatementMonth] = useState('')
    const [loading, setLoading] = useState(false)
    const [allCategories, setAllCategories] = useState<Category[]>([])
    const router = useRouter()

    useEffect(() => {
        if (isOpen) {
            transactionService.getCategories().then(setAllCategories).catch(console.error)
            transactionService.getCreditCards().then(setCreditCards).catch(console.error)
            transactionService.getAccounts().then(setAccounts).catch(console.error)
        }
    }, [isOpen])

    useEffect(() => {
        if (transaction && isOpen) {
            setType(transaction.type)
            setAmount(transaction.amount.toString())
            setDescription(transaction.description || '')
            const catName = transaction.categories?.name || 'Sin categoría'
            setCategory(catName)
            setCurrency(transaction.currency || 'ARS')
            
            // Fix datetime to simple date string
            setDate(new Date(transaction.date || new Date().toISOString()).toISOString().split('T')[0])
            
            setPaymentMethod(transaction.payment_method || 'cash')
            setCreditCardId(transaction.credit_card_id || '')
            setSelectedAccount(transaction.account_id || '')
            setInstallments(transaction.installments_count?.toString() || '1')
            setStatementMonth(transaction.statement_month || '')
        }
    }, [transaction, isOpen])

    const filteredCategories = allCategories.filter(c => c.type === type)

    async function handleDelete() {
        if (!transaction) return
        if (!confirm('¿Estás seguro de que querés eliminar esta transacción?')) return
        
        setLoading(true)
        try {
            await transactionService.deleteTransaction(transaction.id)
            onClose()
            router.refresh()
        } catch (err) {
            alert('Error al eliminar')
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!transaction) return

        setLoading(true)
        const categoryName = category === '__custom__' ? customCategory : category
        
        try {
            await transactionService.updateTransaction(transaction.id, {
                amount: parseFloat(amount),
                type,
                description,
                category_name: categoryName,
                date,
                currency,
                payment_method: paymentMethod,
                credit_card_id: paymentMethod === 'credit_card' ? creditCardId : null,
                account_id: selectedAccount || null,
                installments_count: parseInt(installments),
                statement_month: paymentMethod === 'credit_card' ? statementMonth : null
            } as any)
            
            onClose()
            router.refresh()
        } catch (err) {
            alert('Fallo al editar la transacción.')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen || !transaction) return null

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative glass rounded-t-3xl p-6 pb-safe max-h-[90vh] overflow-y-auto border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold">Editar Transacción</h2>
                    <div className="flex items-center gap-3">
                        <button onClick={handleDelete} className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                            <Trash2 size={18} />
                        </button>
                        <button onClick={onClose} className="text-slate-400 hover:text-white">
                            <X size={22} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-5">
                    {([
                        { v: 'expense', l: 'Gasto', i: TrendingDown, c: 'text-red-400', bg: 'bg-red-500/10' },
                        { v: 'income', l: 'Ingreso', i: TrendingUp, c: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        { v: 'investment', l: 'Inversión', i: Landmark, c: 'text-violet-400', bg: 'bg-violet-500/10' },
                        { v: 'savings', l: 'Ahorro', i: PiggyBank, c: 'text-blue-400', bg: 'bg-blue-500/10' },
                    ] as const).map(t => (
                        <button key={t.v} type="button" onClick={() => { setType(t.v); setCategory(''); }}
                            className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all border ${type === t.v
                                ? `${t.bg} border-${t.c.replace('text-', '')}/50 ${t.c}`
                                : 'border-white/5 text-slate-500'}`}
                        >
                            <t.i size={14} />
                            {t.l}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-1.5">
                            <Label htmlFor="edit-amount" className="text-xs text-slate-400">Monto</Label>
                            <div className="relative">
                                <span className="absolute left-4 top-2.5 text-slate-500 font-bold">{currency === 'ARS' ? '$' : 'US$'}</span>
                                <Input id="edit-amount" type="number" min="0" step="0.01" placeholder="0,00"
                                    className="pl-12 text-xl font-black bg-white/5 border-white/10 h-12" value={amount} onChange={e => setAmount(e.target.value)} required />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs text-slate-400">Moneda</Label>
                            <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10 h-12">
                                {(['ARS', 'USD'] as const).map(curr => (
                                    <button
                                        key={curr}
                                        type="button"
                                        onClick={() => setCurrency(curr)}
                                        className={`px-3 rounded-lg text-xs font-black transition-all ${currency === curr ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        {curr}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Account Selector (for Income or non-Credit expenses) */}
                    {(transaction?.type === 'income' || (transaction?.type === 'expense' && paymentMethod !== 'credit_card')) && (
                        <div className="space-y-1.5 p-4 rounded-2xl bg-white/5 border border-white/10 animate-in fade-in slide-in-from-top-2">
                            <Label className="text-xs text-slate-400">
                                {transaction?.type === 'income' ? 'Cuenta de destino' : 'Cuenta de origen'}
                            </Label>
                            <select 
                                className="w-full h-10 bg-slate-800 border border-white/10 rounded-xl px-3 text-sm focus:border-primary/50 transition-all outline-none text-white appearance-none cursor-pointer"
                                value={selectedAccount}
                                onChange={e => setSelectedAccount(e.target.value)}
                                required={transaction?.type === 'income'}
                            >
                                <option value="" className="bg-slate-800 text-slate-400">{transaction?.type === 'income' ? 'Seleccionar cuenta...' : 'Seleccionar cuenta (opcional)...'}</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id} className="bg-slate-800 text-white">
                                        {acc.name} — Dispon.: {acc.currency === 'ARS' ? '$' : 'u$s'} {acc.balance?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="edit-date" className="text-xs text-slate-400">Fecha de impacto</Label>
                        <Input id="edit-date" type="date" className="bg-white/5 border-white/10" value={date} onChange={e => setDate(e.target.value)} required />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-slate-400">Método de Pago</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { v: 'cash', l: 'Efectivo' },
                                { v: 'debit', l: 'Débito' },
                                { v: 'credit_card', l: 'Tarjeta' }
                            ].map(method => (
                                <button
                                    key={method.v}
                                    type="button"
                                    onClick={() => setPaymentMethod(method.v as any)}
                                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${paymentMethod === method.v ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-white/5 border-white/5 text-slate-500'}`}
                                >
                                    {method.l}
                                </button>
                            ))}
                        </div>
                    </div>

                    {paymentMethod === 'credit_card' && (
                        <div className="space-y-4 p-4 rounded-2xl bg-white/5 border border-white/10 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-400">Tarjeta</Label>
                                <select 
                                    className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-sm"
                                    value={creditCardId}
                                    onChange={e => setCreditCardId(e.target.value)}
                                    required
                                >
                                    <option value="">Seleccionar tarjeta...</option>
                                    {creditCards.map(card => (
                                        <option key={card.id} value={card.id}>{card.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-slate-400">Cuotas</Label>
                                    <Input 
                                        type="number" 
                                        min="1" 
                                        max="24" 
                                        value={installments} 
                                        onChange={e => setInstallments(e.target.value)}
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-slate-400">Mes de Pago</Label>
                                    <Input 
                                        type="month" 
                                        value={statementMonth} 
                                        onChange={e => setStatementMonth(e.target.value)}
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label className="text-xs text-slate-400">Categoría</Label>
                        <div className="flex flex-wrap gap-1.5">
                            {filteredCategories.map(cat => (
                                <button key={cat.id} type="button" onClick={() => setCategory(cat.name)}
                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${category === cat.name ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20'}`}
                                >{cat.name}</button>
                            ))}
                            <button type="button" onClick={() => setCategory('__custom__')}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${category === '__custom__' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20'}`}
                            >+ Nueva</button>
                        </div>
                        {category === '__custom__' && (
                            <Input placeholder="Nombre de la categoría..." className="mt-2 bg-white/5 border-white/10" value={customCategory} onChange={e => setCustomCategory(e.target.value)} />
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="edit-desc" className="text-xs text-slate-400">Descripción <span className="opacity-50">(opcional)</span></Label>
                        <Input id="edit-desc" placeholder="Ej: Pago tarjeta..." className="bg-white/5 border-white/10" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" className="flex-1 h-14 text-base font-black shadow-lg shadow-primary/20 rounded-2xl" disabled={loading || !amount || !category}>
                            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
