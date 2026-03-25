'use client'
import { useState, useEffect } from 'react'
import { X, TrendingDown, TrendingUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'

const CATEGORIES = {
    expense: ['Supermercado', 'Alquiler', 'Servicios', 'Salidas', 'Transporte', 'Salud', 'Ropa', 'Educación', 'Entretenimiento', 'Otro'],
    income: ['Sueldo', 'Inversiones', 'Freelance', 'Otros ingresos'],
}

interface TransactionProps {
    id: string
    amount: number
    type: 'expense' | 'income'
    description: string
    date: string
    categories: { name: string; icon: string; type: string }
    users: { display_name: string }
}

interface EditModalProps {
    transaction: TransactionProps | null
    isOpen: boolean
    onClose: () => void
}

export default function TransactionEditModal({ transaction, isOpen, onClose }: EditModalProps) {
    const [type, setType] = useState<'expense' | 'income'>('expense')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('')
    const [customCategory, setCustomCategory] = useState('')
    const [date, setDate] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        if (transaction && isOpen) {
            setType(transaction.type)
            setAmount(transaction.amount.toString())
            setDescription(transaction.description || '')
            const catName = transaction.categories?.name || 'Sin categoría'
            
            // Check if it's a predefined category or custom
            if (CATEGORIES[transaction.type].includes(catName)) {
                setCategory(catName)
                setCustomCategory('')
            } else {
                setCategory('__custom__')
                setCustomCategory(catName)
            }
            
            // Fix datetime to simple date string
            setDate(new Date(transaction.date || new Date().toISOString()).toISOString().split('T')[0])
        }
    }, [transaction, isOpen])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!transaction) return

        setLoading(true)
        const categoryName = category === '__custom__' ? customCategory : category
        
        try {
            const res = await fetch(`/api/transactions/${transaction.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    amount: parseFloat(amount), 
                    type, 
                    description, 
                    category_name: categoryName, 
                    date 
                }),
            })
            
            if (res.ok) {
                onClose()
                router.refresh()
            } else {
                const err = await res.json()
                alert('Error al actualizar: ' + (err.error || 'Ocurrió un problema'))
            }
        } catch (err) {
            alert('Fallo de conexión al editar.')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen || !transaction) return null

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative glass rounded-t-3xl p-6 pb-safe max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold">Editar Transacción</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X size={22} />
                    </button>
                </div>

                <div className="flex gap-2 mb-5">
                    {(['expense', 'income'] as const).map(t => (
                        <button key={t} onClick={() => setType(t)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border ${type === t
                                ? t === 'expense' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                : 'border-white/10 text-slate-500'}`}
                        >
                            {t === 'expense' ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                            {t === 'expense' ? 'Gasto' : 'Ingreso'}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="edit-amount">Monto (ARS)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400 font-semibold">$</span>
                            <Input id="edit-amount" type="number" min="0" step="0.01" placeholder="0,00"
                                className="pl-7 text-lg font-bold" value={amount} onChange={e => setAmount(e.target.value)} required />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="edit-date" className="text-xs">Fecha</Label>
                        <Input id="edit-date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="edit-category">Categoría</Label>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES[type].map(cat => (
                                <button key={cat} type="button" onClick={() => setCategory(cat)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${category === cat ? 'bg-primary/20 border-primary/50 text-primary' : 'border-white/10 text-slate-400 hover:border-white/30'}`}
                                >{cat}</button>
                            ))}
                            <button type="button" onClick={() => setCategory('__custom__')}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${category === '__custom__' ? 'bg-violet-500/20 border-violet-500/50 text-violet-400' : 'border-white/10 text-slate-400 hover:border-white/30'}`}
                            >+ Nueva</button>
                        </div>
                        {category === '__custom__' && (
                            <Input placeholder="Nombre de la categoría..." value={customCategory} onChange={e => setCustomCategory(e.target.value)} />
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="edit-desc">Descripción <span className="text-slate-500 font-normal">(opcional)</span></Label>
                        <Input id="edit-desc" placeholder="Ej: Café en Starbucks" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>

                    <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading || !amount || !category}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Guardar Cambios
                    </Button>
                </form>
            </div>
        </div>
    )
}
