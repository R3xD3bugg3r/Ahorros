'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, List, User, CreditCard, Landmark } from 'lucide-react'

const links = [
    { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
    { href: '/dashboard/historial', label: 'Historial', icon: List },
    { href: '/dashboard/tarjetas', label: 'Tarjetas', icon: CreditCard },
    { href: '/dashboard/cuentas', label: 'Cuentas', icon: Landmark },
    { href: '/dashboard/perfil', label: 'Perfil', icon: User },
]

export default function BottomNav() {
    const pathname = usePathname()
    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md glass border-t border-white/10 pb-safe z-40">
            <div className="flex items-center justify-around pt-3 pb-1 px-2">
                {links.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href
                    return (
                        <Link key={href} href={href} className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${active ? 'text-primary' : 'text-slate-500 hover:text-slate-300'}`}>
                            <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
                            <span className="text-[10px] font-medium">{label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
