// App constants

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
export const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || '/api'
export const API_URL = `${API_BASE_URL}${API_PREFIX}`

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Financial Planning App'

// Token storage keys
export const ACCESS_TOKEN_KEY = 'access_token'
export const REFRESH_TOKEN_KEY = 'refresh_token'

