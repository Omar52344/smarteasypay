// hooks/useSession.ts
import { useEffect, useState } from 'react'

export function useSession() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getSession()
    }, [])

    const getSession = async () => {
        const userStr = sessionStorage.getItem('user')
        let name = null
        if (userStr) {
            try {
                const userObj = JSON.parse(userStr)
                name = userObj.name
            } catch (e) {
                name = null
            }
        }
        if (name) setUser(name)
            console.log('User session:', name)
        setLoading(false)
    }

    return { user, loading }
}
