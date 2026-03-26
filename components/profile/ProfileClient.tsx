'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LogOut, Copy, CheckCircle, Home, Users, Loader2, List } from 'lucide-react'
import { useState } from 'react'

export default function ProfileClient({ profile, user }: { profile: any; user: any }) {
    const router = useRouter()
    const supabase = createClient()
    const [copied, setCopied] = useState(false)
    const [joinCode, setJoinCode] = useState('')
    const [loading, setLoading] = useState(false)

    const getRealName = (name: string) => {
        if (!name) return 'Alguien'
        if (name.toLowerCase() === 'john.towr') return 'Juan Torres'
        if (name.toLowerCase() === 'ka20_03') return 'Romina Fernandez'
        return name
    }

    // Derived display data
    const email = profile?.email || user?.email || ''
    const baseName = profile?.display_name || (email ? email.split('@')[0] : 'Usuario')
    const displayName = getRealName(baseName)
    // Get first two characters for the avatar (e.g. Juan -> JU, Maria -> MA)
    const initials = displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()

    const rawHhName = profile?.households?.name || `Hogar de ${displayName}`
    const householdName = getRealName(rawHhName.replace(/ y /g, '||')) // Helper, wait it's easier to just basic replace
        .replace('Hogar de john.towr', 'Hogar de Juan Torres')
        .replace('Hogar de ka20_03', 'Hogar de Romina Fernandez')
        .replace(' y john.towr', ' y Juan Torres')
        .replace(' y ka20_03', ' y Romina Fernandez')

    async function handleSignOut() {
        await supabase.auth.signOut()
        router.push('/')
    }

    function copyHouseholdId() {
        if (profile?.households?.id) {
            navigator.clipboard.writeText(profile.households.id)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    async function handleCreateHousehold() {
        setLoading(true)
        const { data: newHh, error } = await supabase.from('households').insert({ name: `Hogar de ${displayName}` }).select('id').single()
        if (newHh) {
            await supabase.from('users').upsert({
                id: user.id,
                email: email,
                display_name: displayName,
                household_id: newHh.id
            })
            router.refresh()
        } else if (error) {
            alert('Error creando el hogar: ' + error.message)
        }
        setLoading(false)
    }

    async function handleJoinHousehold() {
        if (!joinCode) return
        setLoading(true)
        const { data: hh } = await supabase.from('households').select('id, name').eq('id', joinCode.trim()).single()
        if (hh) {
            await supabase.from('users').upsert({
                id: user.id,
                email: email,
                display_name: displayName,
                household_id: hh.id
            })

            // Auto-rename household to 'Hogar de Juan y Romina'
            if (hh.name && !hh.name.includes(displayName)) {
                await supabase.from('households').update({ name: `${hh.name} y ${displayName}` }).eq('id', hh.id)
            }

            router.refresh()
        } else {
            alert('Código de hogar inválido o no encontrado')
        }
        setLoading(false)
    }

    return (
        <div className="p-4 space-y-5">
            <h1 className="text-2xl font-bold pt-2">Perfil</h1>

            {/* Avatar */}
            <div className="glass rounded-2xl p-5 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-2xl font-bold">
                    {initials}
                </div>
                <div>
                    <p className="text-lg font-bold capitalize">{displayName}</p>
                    <p className="text-slate-400 text-sm">{email}</p>
                </div>
            </div>

            {/* Household Manager */}
            <div className="glass rounded-2xl p-5 space-y-4">
                <h2 className="text-lg font-bold">Tu Hogar</h2>

                {profile?.households?.id ? (
                    <div className="space-y-3">
                        <div>
                            <p className="text-base font-medium text-emerald-400 flex items-center gap-2">
                                <Home size={18} /> {householdName}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Usa este ID para que tu pareja se una a tu hogar:</p>
                        </div>
                        <button
                            onClick={copyHouseholdId}
                            className="w-full flex items-center justify-between gap-2 bg-slate-800/50 rounded-xl px-4 py-3 text-sm font-mono text-slate-300 border border-white/10 hover:border-white/30 transition-all"
                        >
                            <span className="truncate">{profile.households.id}</span>
                            {copied ? <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" /> : <Copy size={16} className="text-slate-500 flex-shrink-0" />}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 pt-1">
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                            <p className="text-sm text-amber-200">No estás unido a ningún hogar. Creá el tuyo o unite al de tu pareja para empezar.</p>
                        </div>

                        <Button onClick={handleCreateHousehold} disabled={loading} className="w-full relative overflow-hidden group">
                            <span className="relative z-10 flex items-center gap-2">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Home size={16} />}
                                Crear mi propio hogar
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                        </Button>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0f172a] px-2 text-slate-500">O unirse</span></div>
                        </div>

                        <div className="flex gap-2">
                            <Input
                                placeholder="Pegar ID del hogar..."
                                value={joinCode}
                                onChange={e => setJoinCode(e.target.value)}
                                className="bg-slate-800/50"
                            />
                            <Button variant="outline" onClick={handleJoinHousehold} disabled={loading || !joinCode} className="flex-shrink-0 bg-slate-800">
                                <Users size={16} className="mr-2" /> Unirse
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Settings */}
            <div className="glass rounded-2xl p-5 space-y-3">
                <h2 className="text-lg font-bold">Configuración</h2>
                <Button variant="outline" className="w-full justify-start gap-3 bg-white/5 border-white/10 h-12" onClick={() => router.push('/dashboard/categorias')}>
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                        <List size={18} />
                    </div>
                    <span>Gestionar Categorías</span>
                </Button>
            </div>

            {/* Sign out */}
            <Button variant="destructive" className="w-full" onClick={handleSignOut}>
                <LogOut size={16} className="mr-2" /> Cerrar sesión
            </Button>
        </div>
    )
}
