'use client'

// Auth Context Provider

import { createContext, useContext, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCurrentUser, useLogout } from '@/lib/hooks/useAuth'
import { tokenStorage } from '@/lib/utils/token'
import type { User } from '@/types/api'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  logout: () => Promise<void>
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [userState, setUserState] = useState<User | null>(null)
  const queryClient = useQueryClient()
  const { data: queryUser, isLoading, refetch } = useCurrentUser()
  
  // Use local state if available, otherwise fall back to query/cache
  const cachedUser = queryClient.getQueryData<User>(['currentUser'])
  const user = userState || cachedUser || queryUser || null
  
  const logoutMutation = useLogout()
  
  // Sync local state with query data when it loads
  useEffect(() => {
    if (queryUser && !userState) {
      setUserState(queryUser)
    }
  }, [queryUser, userState])
  
  // Sync local state with cache when it's set
  useEffect(() => {
    if (cachedUser && !userState) {
      setUserState(cachedUser)
    }
  }, [cachedUser, userState])
  
  const setUser = (user: User | null) => {
    setUserState(user)
    // Also update cache for React Query
    if (user) {
      queryClient.setQueryData(['currentUser'], user)
    } else {
      queryClient.removeQueries({ queryKey: ['currentUser'] })
    }
  }

  // Check if we have a token on mount and when tokens change
  useEffect(() => {
    const hasToken = !!tokenStorage.getAccessToken()
    if (hasToken) {
      // Try to fetch user data
      refetch().finally(() => {
        setIsInitialized(true)
      })
    } else {
      setIsInitialized(true)
    }
  }, [refetch])

  // Also refetch when we detect a token was just added (after login/register)
  useEffect(() => {
    const checkToken = () => {
      const hasToken = !!tokenStorage.getAccessToken()
      if (hasToken && !user && !isLoading) {
        refetch()
      }
    }
    
    // Check immediately
    checkToken()
    
    // Also check periodically for a short time after mount (in case token was just set)
    const interval = setInterval(checkToken, 100)
    const timeout = setTimeout(() => clearInterval(interval), 1000)
    
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [user, isLoading, refetch])

  const logout = async () => {
    const refreshToken = tokenStorage.getRefreshToken()
    if (refreshToken) {
      await logoutMutation.mutateAsync({ refresh_token: refreshToken })
    } else {
      // Clear tokens even if logout API call fails
      tokenStorage.clearTokens()
    }
    // Clear user state
    setUser(null)
  }

  const value: AuthContextType = {
    user: user || null,
    isAuthenticated: !!user && !!tokenStorage.getAccessToken(),
    isLoading: !isInitialized || isLoading,
    logout,
    setUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
