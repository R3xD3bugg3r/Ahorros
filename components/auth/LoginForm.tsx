'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, User, Lock } from 'lucide-react'

// Convert a display name to a fake email for Supabase auth
function nameToEmail(name: string) {
    return `${name.toLowerCase().trim().replace(/\s+/g, '.')}@santaclara.app`
}

export default function LoginForm() {
    const [mode, setMode] = useState<'login' | 'register'>('login')
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [householdCode, setHouseholdCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const supabase = createClient()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const email = nameToEmail(name)

        if (mode === 'login') {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) {
                setError('Nombre o contraseña incorrectos.')
            } else {
                router.push('/dashboard')
            }
        } else {
            // Register
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { display_name: name } },
            })

            if (authError) {
                setError(authError.message)
                setLoading(false)
                return
            }

            if (data.user) {
                // Insert user profile
                await supabase.from('users').insert({
                    id: data.user.id,
                    email,
                    display_name: name,
                    household_id: null,
                })

                // Join or create household
                if (householdCode.trim()) {
                    const { data: hh } = await supabase
                        .from('households')
                        .select('id')
                        .eq('id', householdCode.trim())
                        .single()

                    if (hh) {
                        await supabase.from('users').update({ household_id: hh.id }).eq('id', data.user.id)
                    } else {
                        setError('Código de hogar no encontrado. Dejá el campo vacío para crear uno nuevo.')
                        setLoading(false)
                        return
                    }
                } else {
                    // Create new household
                    const { data: newHh } = await supabase
                        .from('households')
                        .insert({ name: `Hogar de ${name}` })
                        .select()
                        .single()

                    if (newHh) {
                        await supabase.from('users').update({ household_id: newHh.id }).eq('id', data.user.id)
                    }
                }

                // Auto-login (only works if Supabase "Confirm email" is disabled)
                if (data.session) {
                    router.push('/dashboard')
                } else {
                    // Session not ready — try signing in immediately
                    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password })
                    if (loginErr) {
                        setError('Cuenta creada. Ahora iniciá sesión con tu nombre y contraseña.')
                        setMode('login')
                    } else {
                        router.push('/dashboard')
                    }
                }
            }
        }

        setLoading(false)
    }

    return (
        <div className="glass rounded-2xl p-6 shadow-2xl">
            <div className="flex gap-2 mb-6">
                {(['login', 'register'] as const).map(m => (
                    <button
                        key={m}
                        onClick={() => { setMode(m); setError('') }}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === m ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="name">Tu nombre</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            id="name"
                            placeholder="Ej: Juan"
                            className="pl-9"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            autoComplete="username"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            className="pl-9"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            required
                        />
                    </div>
                </div>

                {mode === 'register' && (
                    <div className="space-y-1.5">
                        <Label htmlFor="householdCode">
                            Código de hogar de tu pareja{' '}
                            <span className="text-slate-400 font-normal">(opcional)</span>
                        </Label>
                        <Input
                            id="householdCode"
                            placeholder="Dejá vacío para crear un nuevo hogar"
                            value={householdCode}
                            onChange={e => setHouseholdCode(e.target.value)}
                        />
                        <p className="text-xs text-slate-500">
                            Si tu pareja ya tiene cuenta, pegá el Household ID desde Perfil.
                        </p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading || !name || !password}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
                </Button>
            </form>
        </div>
    )
}
