// Chat React Query hooks

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ChatMessageRequest } from '@/types/api'
import * as chatApi from '@/lib/api/chat'

export function useChatHistory() {
  return useQuery({
    queryKey: ['chatHistory'],
    queryFn: chatApi.getChatHistory,
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      message,
      onChunk,
    }: ChatMessageRequest & { onChunk?: (chunk: string) => void }) => {
      return chatApi.sendMessage({ message }, onChunk)
    },
    onSuccess: () => {
      // Invalidate chat history to refetch
      queryClient.invalidateQueries({ queryKey: ['chatHistory'] })
    },
  })
}

export function useClearChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: chatApi.clearChatHistory,
    onSuccess: () => {
      // Clear chat history from cache
      queryClient.setQueryData(['chatHistory'], [])
    },
  })
}

export function useExportChat() {
  return useMutation({
    mutationFn: chatApi.exportChat,
  })
}
