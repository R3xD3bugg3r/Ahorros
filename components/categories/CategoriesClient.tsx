'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
    Plus, Search, Edit2, Trash2, ChevronLeft, 
    Save, X, TrendingDown, TrendingUp, Landmark, PiggyBank 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { transactionService } from '@/lib/services/transactions'
import { Category, TransactionType } from '@/lib/types'

export default function CategoriesClient({ categories }: { categories: Category[] }) {
    const [search, setSearch] = useState('')
    const [filterType, setFilterType] = useState<'all' | TransactionType>('all')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [editDesc, setEditDesc] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const filtered = categories.filter(c => {
        const matchType = filterType === 'all' || c.type === filterType
        const q = search.toLowerCase()
        const matchSearch = !q || c.name.toLowerCase().includes(q)
        return matchType && matchSearch
    })

    async function handleSave(id: string) {
        setLoading(true)
        try {
            await transactionService.updateCategory(id, {
                name: editName,
                default_description: editDesc || null
            })
            setEditingId(null)
            router.refresh()
        } catch (err) {
            alert('Error al guardar cambios')
        } finally {
            setLoading(false)
        }
    }

    function startEdit(c: Category) {
        setEditingId(c.id)
        setEditName(c.name)
        setEditDesc(c.default_description || '')
    }

    return (
        <div className="p-4 space-y-4 pb-24">
            <div className="flex items-center gap-3 pt-2">
                <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold">Categorías</h1>
            </div>

            <p className="text-slate-400 text-sm px-1">
                Gestioná tus categorías personalizadas y configurá descripciones automáticas para tus gastos recurrentes.
            </p>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-slate-500" />
                <Input placeholder="Buscar categoría..." className="pl-9 bg-white/5 border-white/10" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {[
                    ['all', 'Todas'], 
                    ['expense', 'Gastos'], 
                    ['income', 'Ingresos'],
                    ['investment', 'Inversión'],
                    ['savings', 'Ahorro']
                ].map(([v, l]) => (
                    <button key={v} onClick={() => setFilterType(v as any)}
                        className={`whitespace-nowrap px-4 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterType === v ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'}`}>
                        {l}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="space-y-3">
                {filtered.map(c => {
                    const isEditing = editingId === c.id
                    const typeIcon = c.type === 'income' ? <TrendingUp size={14} /> : c.type === 'expense' ? <TrendingDown size={14} /> : c.type === 'investment' ? <Landmark size={14} /> : <PiggyBank size={14} />
                    const typeColor = c.type === 'income' ? 'text-emerald-400' : c.type === 'expense' ? 'text-red-400' : 'text-violet-400'

                    return (
                        <div key={c.id} className={`glass rounded-2xl p-4 border transition-all ${isEditing ? 'border-primary shadow-lg shadow-primary/10 scale-[1.02]' : 'border-white/5'}`}>
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] uppercase text-slate-500 font-bold">Nombre</Label>
                                            <Input value={editName} onChange={e => setEditName(e.target.value)} className="bg-white/5 text-sm h-9" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] uppercase text-slate-500 font-bold">Tipo</Label>
                                            <div className={`flex items-center gap-2 text-xs font-bold py-2 ${typeColor}`}>
                                                {typeIcon} <span className="capitalize">{c.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase text-slate-500 font-bold">Descripción Predeterminada (Harcodear)</Label>
                                        <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Ej: Pago mensual, Débito automático..." className="bg-white/5 text-sm h-9" />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <Button onClick={() => handleSave(c.id)} disabled={loading} size="sm" className="flex-1 font-bold">
                                            <Save size={14} className="mr-2" /> Guardar
                                        </Button>
                                        <Button onClick={() => setEditingId(null)} variant="outline" size="sm" className="flex-1 bg-white/5">
                                            <X size={14} className="mr-2" /> Cancelar
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/5 ${typeColor}`}>
                                            {typeIcon}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold capitalize">{c.name}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">
                                                {c.default_description ? `Harcodear: ${c.default_description}` : 'Sin descripción fija'}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => startEdit(c)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-20 text-slate-600 italic">
                    No se encontraron categorías.
                </div>
            )}
        </div>
    )
}
