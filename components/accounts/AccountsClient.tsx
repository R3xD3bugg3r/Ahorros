'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Landmark, Wallet, Banknote, ChevronRight } from 'lucide-react'
import { transactionService } from '@/lib/services/transactions'
import { Account } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'

export default function AccountsClient() {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingAccount, setEditingAccount] = useState<Account | null>(null)
    
    // Form state
    const [name, setName] = useState('')
    const [type, setType] = useState<'bank' | 'cash' | 'virtual_wallet'>('bank')
    const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS')
    const [initialBalance, setInitialBalance] = useState('0')
    
    const router = useRouter()

    useEffect(() => {
        loadAccounts()
    }, [])

    const loadAccounts = async () => {
        try {
            const data = await transactionService.getAccounts()
            setAccounts(data as Account[])
        } catch (error) {
            console.error('Error loading accounts:', error)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setName('')
        setType('bank')
        setCurrency('ARS')
        setInitialBalance('0')
        setEditingAccount(null)
    }

    const handleEdit = (account: Account) => {
        setEditingAccount(account)
        setName(account.name)
        setType(account.type)
        setCurrency(account.currency)
        setInitialBalance(account.initial_balance.toString())
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta cuenta?')) return
        try {
            await transactionService.deleteAccount(id)
            loadAccounts()
        } catch (error) {
            console.error('Error deleting account:', error)
            alert('Error al eliminar la cuenta')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const payload = {
                name,
                type,
                currency,
                initial_balance: parseFloat(initialBalance)
            }

            if (editingAccount) {
                await transactionService.updateAccount(editingAccount.id, payload)
            } else {
                await transactionService.createAccount(payload)
            }
            
            setIsModalOpen(false)
            resetForm()
            loadAccounts()
            router.refresh()
        } catch (error: any) {
            console.error('Error saving account:', error)
            alert('Error al guardar la cuenta: ' + (error.message || JSON.stringify(error)))
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'bank': return <Landmark size={20} className="text-blue-400" />
            case 'virtual_wallet': return <Wallet size={20} className="text-purple-400" />
            case 'cash': return <Banknote size={20} className="text-green-400" />
            default: return <Landmark size={20} />
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando cuentas...</div>

    return (
        <div className="space-y-6 pb-24">
            <div className="flex items-center justify-between px-1">
                <div>
                    <h1 className="text-2xl font-bold">Mis Cuentas</h1>
                    <p className="text-sm text-slate-500">Bancos, efectivo y billeteras</p>
                </div>
                <button 
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary"
                >
                    <Plus size={24} />
                </button>
            </div>

            <div className="grid gap-3">
                {accounts.length === 0 ? (
                    <div className="p-8 text-center glass rounded-3xl border-dashed border-white/10">
                        <p className="text-slate-500 text-sm">No tenés cuentas configuradas todavía.</p>
                    </div>
                ) : (
                    accounts.map(account => (
                        <div key={account.id} className="glass p-4 rounded-3xl border border-white/5 flex items-center justify-between group active:scale-[0.98] transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                                    {getIcon(account.type)}
                                </div>
                                <div>
                                    <h3 className="font-bold">{account.name}</h3>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">
                                        {account.type === 'bank' ? 'Banco' : account.type === 'cash' ? 'Efectivo' : 'Billetera'} • {account.currency}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(account)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                                    <Pencil size={18} />
                                </button>
                                <button onClick={() => handleDelete(account.id)} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Cuenta */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-md glass rounded-t-3xl sm:rounded-3xl p-6 border-t sm:border border-white/10 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
                        <h2 className="text-xl font-bold mb-6">{editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}</h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-slate-400 text-xs uppercase tracking-wider ml-1">Nombre de la cuenta</Label>
                                <Input 
                                    placeholder="Ej: Santander Río, Efectivo, Mercado Pago" 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    className="bg-white/5 border-white/10 h-12 rounded-2xl px-4"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-slate-400 text-xs uppercase tracking-wider ml-1">Tipo</Label>
                                    <select 
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-sm"
                                        value={type}
                                        onChange={e => setType(e.target.value as any)}
                                    >
                                        <option value="bank">Banco</option>
                                        <option value="virtual_wallet">Billetera Virtual</option>
                                        <option value="cash">Efectivo</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-400 text-xs uppercase tracking-wider ml-1">Moneda</Label>
                                    <select 
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-sm"
                                        value={currency}
                                        onChange={e => setCurrency(e.target.value as any)}
                                    >
                                        <option value="ARS">Peso ARS</option>
                                        <option value="USD">Dólar USD</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-400 text-xs uppercase tracking-wider ml-1">Saldo Inicial (Opcional)</Label>
                                <Input 
                                    type="number"
                                    placeholder="0.00" 
                                    value={initialBalance}
                                    onChange={e => setInitialBalance(e.target.value)}
                                    className="bg-white/5 border-white/10 h-12 rounded-2xl px-4"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button type="button" variant="ghost" className="flex-1 h-12 rounded-2xl" onClick={() => setIsModalOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold">
                                    {editingAccount ? 'Guardar Cambios' : 'Crear Cuenta'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
