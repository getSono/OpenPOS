'use client'

import { useAuth } from '@/contexts/AuthContext'
import LoginPage from '@/components/LoginPage'
import POSInterface from '@/components/POSInterface'

export default function Home() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return user ? <POSInterface /> : <LoginPage />
}
