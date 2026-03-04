// Chat React Query hooks

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ChatContext, ChatMessageRequest } from '@/types/api'
import * as chatApi from '@/lib/api/chat'

function chatHistoryQueryKey(context: ChatContext, planId: number | null) {
  return ['chatHistory', context, planId ?? null] as const
}

export function useChatHistory(context: ChatContext, planId: number | null) {
  return useQuery({
    queryKey: chatHistoryQueryKey(context, planId),
    queryFn: () => chatApi.getChatHistory(context, planId),
  })
}

export function useSendMessage(context: ChatContext, planId: number | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      message,
      onChunk,
    }: ChatMessageRequest & { onChunk?: (chunk: string) => void }) => {
      return chatApi.sendMessage(
        { message, context, plan_id: planId },
        onChunk
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatHistoryQueryKey(context, planId),
      })
    },
  })
}

export function useClearChat(context: ChatContext, planId: number | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => chatApi.clearChatHistory(context, planId),
    onSuccess: () => {
      queryClient.setQueryData(chatHistoryQueryKey(context, planId), [])
    },
  })
}

export function useExportChat() {
  return useMutation({
    mutationFn: chatApi.exportChat,
  })
}
