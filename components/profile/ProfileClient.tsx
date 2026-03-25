'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, Copy, CheckCircle } from 'lucide-react'
import { useState } from 'react'

export default function ProfileClient({ profile }: { profile: any }) {
    const router = useRouter()
    const supabase = createClient()
    const [copied, setCopied] = useState(false)

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

    return (
        <div className="p-4 space-y-5">
            <h1 className="text-2xl font-bold pt-2">Perfil</h1>

            {/* Avatar */}
            <div className="glass rounded-2xl p-5 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-2xl font-bold">
                    {(profile?.display_name || 'U')[0].toUpperCase()}
                </div>
                <div>
                    <p className="text-lg font-bold">{profile?.display_name || 'Usuario'}</p>
                    <p className="text-slate-400 text-sm">{profile?.email}</p>
                </div>
            </div>

            {/* Household */}
            <div className="glass rounded-2xl p-4 space-y-3">
                <h2 className="text-sm font-semibold text-slate-300">Tu Hogar</h2>
                <div>
                    <p className="text-base font-medium">{profile?.households?.name || 'Sin hogar asignado'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Compartí este ID con tu pareja para que se una:</p>
                </div>
                {profile?.households?.id && (
                    <button
                        onClick={copyHouseholdId}
                        className="w-full flex items-center justify-between gap-2 bg-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-slate-300 border border-white/10 hover:border-white/20 transition-all"
                    >
                        <span className="truncate">{profile.households.id}</span>
                        {copied ? <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" /> : <Copy size={16} className="text-slate-500 flex-shrink-0" />}
                    </button>
                )}
                <p className="text-xs text-slate-600">Tu pareja debe pegar este código durante el registro.</p>
            </div>

            {/* Sign out */}
            <Button variant="destructive" className="w-full" onClick={handleSignOut}>
                <LogOut size={16} className="mr-2" /> Cerrar sesión
            </Button>
        </div>
    )
}
