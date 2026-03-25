import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginForm from '@/components/auth/LoginForm'

export default async function LoginPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💑</div>
          <h1 className="text-3xl font-bold gradient-text">FinanzasEnPareja</h1>
          <p className="text-slate-400 mt-2">Control financiero compartido</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
