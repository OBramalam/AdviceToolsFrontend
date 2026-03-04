// File upload API functions
import axios from 'axios'
import { API_URL } from '@/lib/utils/constants'
import type { UploadResponse } from '@/types/api'
import { tokenStorage } from '@/lib/utils/token'

export async function uploadConversationFile(
  file: File
): Promise<UploadResponse> {
  const accessToken = tokenStorage.getAccessToken()
  if (!accessToken) {
    throw new Error('No access token available')
  }

  const formData = new FormData()
  formData.append('file', file)

  const response = await axios.post<UploadResponse>(`${API_URL}/upload`, formData, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}


