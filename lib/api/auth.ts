// Auth API functions

import { apiClient } from './client'
import { tokenStorage } from '@/lib/utils/token'
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  LogoutRequest,
  User,
} from '@/types/api'

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', data)
  const { tokens } = response.data

  // Store tokens
  tokenStorage.setAccessToken(tokens.access_token)
  tokenStorage.setRefreshToken(tokens.refresh_token)

  return response.data
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/register', data)
  const { tokens } = response.data

  // Store tokens
  tokenStorage.setAccessToken(tokens.access_token)
  tokenStorage.setRefreshToken(tokens.refresh_token)

  return response.data
}

export async function logout(
  data: LogoutRequest
): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>(
    '/auth/logout',
    data
  )

  // Clear tokens
  tokenStorage.clearTokens()

  return response.data
}

export async function refreshToken(
  data: RefreshTokenRequest
): Promise<{ access_token: string; refresh_token: string; token_type: string }> {
  const response = await apiClient.post<{
    access_token: string
    refresh_token: string
    token_type: string
  }>('/auth/refresh', data)

  // Store new tokens
  tokenStorage.setAccessToken(response.data.access_token)
  tokenStorage.setRefreshToken(response.data.refresh_token)

  return response.data
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>('/auth/me')
  return response.data
}

