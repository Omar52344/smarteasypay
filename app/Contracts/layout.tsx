'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useSession } from '@/hooks/user-hook' // tu hook para obtener el usuario, o desde Supabase/Auth

export default function ContractsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, loading } = useSession() // asumimos que tienes un hook que da user y loading

  useEffect(() => {
    if (!loading && !user) {
      router.push('/Login') // redirige al login si no está autenticado
    }
  }, [user, loading, router])

  if (loading || !user) return null // o un spinner

  return <>{children}</>
}