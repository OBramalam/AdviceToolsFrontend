// Token refresh utility hook
// Note: Token refresh is primarily handled by the API client interceptor
// This hook can be used for manual token refresh if needed

import { useMutation } from '@tanstack/react-query'
import * as authApi from '@/lib/api/auth'
import type { RefreshTokenRequest } from '@/types/api'

export function useTokenRefresh() {
  return useMutation({
    mutationFn: (data: RefreshTokenRequest) => authApi.refreshToken(data),
  })
}
