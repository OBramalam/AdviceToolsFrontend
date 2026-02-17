// Auth React Query hooks

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { tokenStorage } from '@/lib/utils/token'
import type { AuthResponse } from '@/types/api'
import * as authApi from '@/lib/api/auth'

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data: AuthResponse) => {
      // Set user data in cache - don't invalidate, just use the cached data
      queryClient.setQueryData(['currentUser'], data.user)
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data: AuthResponse) => {
      // Set user data in cache - don't invalidate, just use the cached data
      queryClient.setQueryData(['currentUser'], data.user)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear all queries
      queryClient.clear()
    },
  })
}

export function useRefreshToken() {
  return useMutation({
    mutationFn: authApi.refreshToken,
  })
}

export function useCurrentUser() {
  const [hasToken, setHasToken] = useState(() => !!tokenStorage.getAccessToken())
  
  useEffect(() => {
    // Check for token changes
    const checkToken = () => {
      setHasToken(!!tokenStorage.getAccessToken())
    }
    checkToken()
    // Poll for token changes (in case token is set synchronously)
    const interval = setInterval(checkToken, 50)
    const timeout = setTimeout(() => clearInterval(interval), 3000)
    
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])
  
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    enabled: hasToken,
    retry: false,
    // Use cached data immediately if available
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
