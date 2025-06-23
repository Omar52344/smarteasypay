// hooks/useSession.ts
import { useEffect, useState } from 'react'
//import { supabase } from '@/lib/supabaseClient'

export function useSession() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {

        getSession()
    }, [])

    const getSession = async () => {
        const { data, error } = {data:{user:'omar jaramillo'},error:'' }// Aquí deberías usar tu método para obtener el usuario, por ejemplo desde Supabase
        if (data?.user) setUser(data.user)
        setLoading(false)
    }


    return { user, loading }
}
