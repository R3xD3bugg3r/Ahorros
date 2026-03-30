'use client'
import { useState, useEffect } from 'react'
import { Plus, X, TrendingDown, TrendingUp, Loader2, Landmark, PiggyBank } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { transactionService } from '@/lib/services/transactions'
import { Category, TransactionType, CreditCard } from '@/lib/types'

interface TransactionModalProps {
    initialOpen?: boolean
    defaultPaymentMethod?: 'cash' | 'debit' | 'credit_card'
    defaultCreditCardId?: string
    onClose?: () => void
    hideFab?: boolean
}

export default function TransactionModal({ initialOpen = false, defaultPaymentMethod, defaultCreditCardId, onClose, hideFab = false }: TransactionModalProps = {}) {
    const [open, setOpen] = useState(initialOpen)
    const [type, setType] = useState<TransactionType>('expense')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('')
    const [customCategory, setCustomCategory] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS')
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'debit' | 'credit_card'>('cash')
    const [creditCards, setCreditCards] = useState<CreditCard[]>([])
    const [selectedCreditCard, setSelectedCreditCard] = useState('')
    const [accounts, setAccounts] = useState<any[]>([])
    const [selectedAccount, setSelectedAccount] = useState('')
    const [installments, setInstallments] = useState('1')
    const [statementMonth, setStatementMonth] = useState(new Date().toISOString().slice(0, 7)) // 'YYYY-MM'
    const [loading, setLoading] = useState(false)
    const [allCategories, setAllCategories] = useState<Category[]>([])
    const router = useRouter()

    useEffect(() => {
        if (open) {
            transactionService.getCategories().then(setAllCategories).catch(console.error)
            transactionService.getCreditCards().then(setCreditCards).catch(console.error)
            transactionService.getAccounts().then(setAccounts).catch(console.error)
            
            if (defaultPaymentMethod) setPaymentMethod(defaultPaymentMethod)
            if (defaultCreditCardId) setSelectedCreditCard(defaultCreditCardId)
        }
    }, [open, defaultPaymentMethod, defaultCreditCardId])

    const filteredCategories = allCategories.filter(c => c.type === type)

    function handleCategorySelect(catName: string) {
        setCategory(catName)
        const cat = allCategories.find(c => c.name === catName && c.type === type)
        if (cat?.default_description) {
            setDescription(cat.default_description)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        const categoryName = category === '__custom__' ? customCategory : category
        
        try {
            await transactionService.createTransaction({
                amount: parseFloat(amount),
                type,
                description,
                category_name: categoryName,
                date,
                currency,
                payment_method: paymentMethod,
                credit_card_id: paymentMethod === 'credit_card' ? selectedCreditCard : null,
                account_id: selectedAccount || null,
                installments_count: parseInt(installments),
                statement_month: paymentMethod === 'credit_card' ? statementMonth : null
            })
            
            setOpen(false)
            resetForm()
            router.refresh()
        } catch (err: any) {
            alert('Error al guardar: ' + (err.message || 'Ocurrió un problema'))
        } finally {
            setLoading(false)
        }
    }

    function resetForm() {
        setAmount('')
        setDescription('')
        setCategory('')
        setCustomCategory('')
        setDate(new Date().toISOString().split('T')[0])
        setCurrency('ARS')
        setPaymentMethod('cash')
        setInstallments('1')
    }

    return (
        <>
            {/* FAB Button */}
            {!hideFab && (
                <button
                    onClick={() => setOpen(true)}
                    className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/40 flex items-center justify-center text-white hover:bg-primary/90 transition-all active:scale-95"
                    aria-label="Agregar transacción"
                >
                    <Plus size={26} />
                </button>
            )}

            {/* Modal */}
            {open && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setOpen(false); onClose?.(); }} />
                    <div className="relative glass rounded-t-3xl p-6 pb-safe max-h-[90vh] overflow-y-auto border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-bold">Nueva Transacción</h2>
                            <button onClick={() => { setOpen(false); onClose?.(); }} className="text-slate-400 hover:text-white"><X size={22} /></button>
                        </div>

                        {/* Type toggle */}
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
                                {/* Amount & Currency */}
                                <div className="flex-1 space-y-1.5">
                                    <Label htmlFor="amount" className="text-xs text-slate-400">Monto</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-2.5 text-slate-500 font-bold">{currency === 'ARS' ? '$' : 'US$'}</span>
                                        <Input id="amount" type="number" min="0" step="0.01" placeholder="0,00"
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

                            {/* Payment Method */}
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

                            {/* Credit Card Details */}
                            {paymentMethod === 'credit_card' && (
                                <div className="space-y-4 p-4 rounded-2xl bg-white/5 border border-white/10 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-400">Tarjeta</Label>
                                        <select 
                                            className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-sm"
                                            value={selectedCreditCard}
                                            onChange={e => setSelectedCreditCard(e.target.value)}
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

                            {/* Account Selector (for Income or non-Credit expenses) */}
                            {(type === 'income' || (type === 'expense' && paymentMethod !== 'credit_card')) && (
                                <div className="space-y-1.5 p-4 rounded-2xl bg-white/5 border border-white/10 animate-in fade-in slide-in-from-top-2">
                                    <Label className="text-xs text-slate-400">
                                        {type === 'income' ? 'Cuenta de destino' : 'Cuenta de origen'}
                                    </Label>
                                    <select 
                                        className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-sm focus:border-primary/50 transition-all outline-none"
                                        value={selectedAccount}
                                        onChange={e => setSelectedAccount(e.target.value)}
                                        required={type === 'income'}
                                    >
                                        <option value="">{type === 'income' ? 'Seleccionar cuenta...' : 'Seleccionar cuenta (opcional)...'}</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Date */}
                            <div className="space-y-1.5">
                                <Label htmlFor="date" className="text-xs text-slate-400">Fecha de compra/consumo</Label>
                                <Input id="date" type="date" className="bg-white/5 border-white/10" value={date} onChange={e => setDate(e.target.value)} required />
                            </div>

                            {/* Category */}
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-400">Categoría</Label>
                                <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                                    {filteredCategories.map(cat => (
                                        <button key={cat.id} type="button" onClick={() => handleCategorySelect(cat.name)}
                                            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${category === cat.name ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20'}`}
                                        >{cat.name}</button>
                                    ))}
                                    <button type="button" onClick={() => setCategory('__custom__')}
                                        className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${category === '__custom__' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20'}`}
                                    >+ Nueva</button>
                                </div>
                                {category === '__custom__' && (
                                    <Input placeholder="Nombre de la categoría..." className="mt-2 bg-white/5 border-white/10" value={customCategory} onChange={e => setCustomCategory(e.target.value)} />
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <Label htmlFor="desc" className="text-xs text-slate-400">Descripción <span className="opacity-50">(opcional)</span></Label>
                                <div className="relative">
                                    <Input id="desc" placeholder="Ej: Pago tarjeta, Café, etc." className="bg-white/5 border-white/10" value={description} onChange={e => setDescription(e.target.value)} />
                                    {parseInt(installments) > 1 && (
                                        <div className="absolute right-3 top-2.5 px-2 py-0.5 rounded-md bg-primary/20 text-primary text-[10px] font-bold">
                                            {installments} Cuotas
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-14 text-base font-black shadow-lg shadow-primary/20 mt-4 rounded-2xl" disabled={loading || !amount || !category || (paymentMethod === 'credit_card' && !selectedCreditCard)}>
                                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                                Guardar {type === 'expense' ? 'Gasto' : type === 'income' ? 'Ingreso' : type === 'investment' ? 'Inversión' : 'Ahorro'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
