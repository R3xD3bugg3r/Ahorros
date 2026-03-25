'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Lock } from 'lucide-react'

export default function LoginForm() {
    const [mode, setMode] = useState<'login' | 'register'>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [householdCode, setHouseholdCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [info, setInfo] = useState('')
    const router = useRouter()
    const supabase = createClient()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')
        setInfo('')

        if (mode === 'login') {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) setError(error.message)
            else router.push('/dashboard')
        } else {
            const displayName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: displayName,
                    }
                }
            })
            if (authError) { setError(authError.message); setLoading(false); return }

            if (data.user) {
                // Insert user profile
                const { error: profileError } = await supabase.from('users').insert({
                    id: data.user.id,
                    email: data.user.email,
                    display_name: displayName || email.split('@')[0],
                    household_id: null,
                })

                if (householdCode) {
                    // Try to join existing household
                    const { data: household } = await supabase
                        .from('households')
                        .select('id')
                        .eq('id', householdCode)
                        .single()

                    if (household) {
                        await supabase.from('users').update({ household_id: household.id }).eq('id', data.user.id)
                    }
                } else {
                    // Create new household
                    const { data: newHousehold } = await supabase
                        .from('households')
                        .insert({ name: `Hogar de ${displayName || email.split('@')[0]}` })
                        .select()
                        .single()

                    if (newHousehold) {
                        await supabase.from('users').update({ household_id: newHousehold.id }).eq('id', data.user.id)
                    }
                }

                if (profileError) setError(profileError.message)
                else {
                    setInfo('¡Registro exitoso! Por favor verificá tu email (revisá tu bandeja de entrada) y luego iniciá sesión.')
                    setMode('login')
                }
            }
        }
        setLoading(false)
    }

    return (
        <div className="glass rounded-2xl p-6 shadow-2xl">
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setMode('login')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'login' ? 'bg-primary text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'text-slate-400 hover:text-white'}`}
                >
                    Iniciar sesión
                </button>
                <button
                    onClick={() => setMode('register')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'register' ? 'bg-primary text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'text-slate-400 hover:text-white'}`}
                >
                    Registrarse
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="firstName">Nombre</Label>
                            <Input id="firstName" placeholder="Ej: Juan" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="lastName">Apellido</Label>
                            <Input id="lastName" placeholder="Ej: Pérez" value={lastName} onChange={e => setLastName(e.target.value)} required />
                        </div>
                    </div>
                )}

                <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input id="email" type="email" placeholder="tu@email.com" className="pl-9" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input id="password" type="password" placeholder="••••••••" className="pl-9" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                </div>

                {mode === 'register' && (
                    <div className="space-y-1.5">
                        <Label htmlFor="householdCode">Código de hogar de tu pareja <span className="text-slate-400 font-normal">(opcional)</span></Label>
                        <Input id="householdCode" placeholder="Dejá vacío para crear un nuevo hogar" value={householdCode} onChange={e => setHouseholdCode(e.target.value)} />
                        <p className="text-xs text-slate-500">Si tu pareja ya tiene cuenta, pedile su Household ID desde su perfil.</p>
                    </div>
                )}

                {error && <p className="text-red-400 text-sm">{error}</p>}
                {info && <p className="text-emerald-400 text-sm">{info}</p>}

                <Button type="submit" className="w-full text-base font-semibold h-11" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
                </Button>
            </form>
        </div>
    )
}
