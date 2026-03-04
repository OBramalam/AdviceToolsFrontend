// Chat API functions

import { apiClient } from './client'
import { API_URL } from '@/lib/utils/constants'
import { tokenStorage } from '@/lib/utils/token'
import type {
  ChatMessage,
  ChatMessageRequest,
  ChatHistoryResponse,
  ExportChatRequest,
  ExportChatResponse,
  ChatContext,
} from '@/types/api'

function chatHistoryParams(context: ChatContext, planId: number | null): string {
  const params = new URLSearchParams()
  params.set('context', context)
  if (context === 'dashboard' && planId != null) {
    params.set('plan_id', String(planId))
  }
  return params.toString()
}

export async function getChatHistory(
  context: ChatContext,
  planId: number | null
): Promise<ChatMessage[]> {
  const query = chatHistoryParams(context, planId)
  const url = query ? `/chat/history?${query}` : '/chat/history'
  const response = await apiClient.get<ChatHistoryResponse>(url)
  return response.data.messages
}

export async function sendMessage(
  data: ChatMessageRequest,
  onChunk?: (chunk: string) => void
): Promise<void> {
  const accessToken = tokenStorage.getAccessToken()
  if (!accessToken) {
    throw new Error('No access token available')
  }

  const response = await fetch(`${API_URL}/chat/message`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  if (!response.body) {
    throw new Error('Response body is null')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()

        if (data === '[DONE]') {
          return
        } else if (data.startsWith('[ERROR]')) {
          throw new Error(data.slice(7).trim())
        } else if (data && onChunk) {
          onChunk(data)
        }
      }
    }
  }
}

export async function clearChatHistory(
  context: ChatContext,
  planId: number | null
): Promise<{ success: boolean; message: string }> {
  const query = chatHistoryParams(context, planId)
  const url = query ? `/chat/history?${query}` : '/chat/history'
  const response = await apiClient.delete<{ success: boolean; message: string }>(
    url
  )
  return response.data
}

export async function exportChat(
  data: ExportChatRequest
): Promise<ExportChatResponse> {
  const response = await apiClient.post<ExportChatResponse>(
    '/chat/export',
    data
  )
  return response.data
}

