'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ChevronLeft, CreditCard as CardIcon, Trash2, X, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { transactionService } from '@/lib/services/transactions'
import { CreditCard } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

export default function CardsClient({ initialCards }: { initialCards: CreditCard[] }) {
    const [cards, setCards] = useState<CreditCard[]>(initialCards)
    const [isAdding, setIsAdding] = useState(false)
    const [name, setName] = useState('')
    const [bank, setBank] = useState('')
    const [closingDay, setClosingDay] = useState('25')
    const [dueDay, setDueDay] = useState('5')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

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
            console.error(err)
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

    return (
        <div className="p-4 space-y-4 pb-24">
            <div className="flex items-center gap-3 pt-2">
                <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold">Mis Tarjetas</h1>
            </div>

            <p className="text-slate-400 text-sm px-1">
                Configurá tus tarjetas para trackear gastos a futuro y cuotas.
            </p>

            <div className="space-y-4">
                {cards.map(card => (
                    <div key={card.id} className="glass rounded-2xl p-5 border border-white/5 relative group bg-gradient-to-br from-white/5 to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                                <CardIcon size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-lg">{card.name}</p>
                                <p className="text-xs text-slate-500 font-medium">{card.bank || 'Sin banco'}</p>
                            </div>
                            <button 
                                onClick={() => handleDelete(card.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 transition-all"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                            <div>
                                <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Cierre aprox.</p>
                                <p className="text-sm font-mono">Día {card.closing_day}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Vencimiento aprox.</p>
                                <p className="text-sm font-mono">Día {card.due_day}</p>
                            </div>
                        </div>
                    </div>
                ))}

                {cards.length === 0 && !isAdding && (
                    <div className="text-center py-12 glass rounded-2xl border border-dashed border-white/10 text-slate-500 italic">
                        No tenés tarjetas cargadas aún.
                    </div>
                )}

                {isAdding ? (
                    <form onSubmit={handleAdd} className="glass rounded-2xl p-6 border border-primary/30 space-y-4 animate-in zoom-in-95 duration-200">
                        <h3 className="font-bold text-primary">Nueva Tarjeta</h3>
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-400">Nombre (ej: Visa ICBC)</Label>
                                <Input value={name} onChange={e => setName(e.target.value)} required className="bg-white/5 border-white/10" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-400">Banco <span className="opacity-50">(opcional)</span></Label>
                                <Input value={bank} onChange={e => setBank(e.target.value)} className="bg-white/5 border-white/10" />
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
                            <Button type="submit" className="flex-1 font-bold" disabled={loading}>
                                {loading && <Loader2 size={14} className="mr-2 animate-spin" />}
                                <Save size={14} className="mr-2" /> Guardar
                            </Button>
                            <Button type="button" variant="outline" className="flex-1 bg-white/5" onClick={() => setIsAdding(false)}>
                                <X size={14} className="mr-2" /> Cancelar
                            </Button>
                        </div>
                    </form>
                ) : (
                    <Button 
                        onClick={() => setIsAdding(true)}
                        className="w-full h-14 rounded-2xl border-dashed border-2 bg-transparent hover:bg-white/5 text-primary border-primary/30 font-bold"
                    >
                        <Plus size={20} className="mr-2" /> Agregar Tarjeta
                    </Button>
                )}
            </div>
        </div>
    )
}
