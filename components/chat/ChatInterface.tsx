'use client'

// Chat Interface component – plan_builder when no plan selected, dashboard when a plan is selected

import { useEffect, useRef, useState } from 'react'
import { useDashboardContext } from '@/lib/context/DashboardContext'
import { useChatHistory, useSendMessage, useClearChat, useExportChat } from '@/lib/hooks/useChat'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import type { ChatContext } from '@/types/api'
import type { ChatMessage as ChatMessageType } from '@/types/api'

function getChatContext(selectedPlanId: number | null): ChatContext {
  return selectedPlanId != null ? 'dashboard' : 'plan_builder'
}

export function ChatInterface() {
  const { selectedPlanId } = useDashboardContext()
  const chatContext = getChatContext(selectedPlanId)
  const planId = selectedPlanId ?? null

  const { data: messages = [], isLoading: isLoadingHistory } = useChatHistory(
    chatContext,
    planId
  )
  const sendMessageMutation = useSendMessage(chatContext, planId)
  const clearChatMutation = useClearChat(chatContext, planId)
  const exportChatMutation = useExportChat()

  const [currentMessage, setCurrentMessage] = useState<ChatMessageType | null>(
    null
  )
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentMessage])

  const handleSend = async (messageText: string) => {
    const userMessage: ChatMessageType = {
      role: 'user',
      content: messageText,
    }
    setCurrentMessage(userMessage)

    let assistantContent = ''
    setCurrentMessage({ role: 'assistant', content: '' })

    try {
      await sendMessageMutation.mutateAsync({
        message: messageText,
        onChunk: (chunk: string) => {
          assistantContent += chunk
          setCurrentMessage({
            role: 'assistant',
            content: assistantContent,
          })
        },
      })
    } catch (error) {
      console.error('Error sending message:', error)
      setCurrentMessage({
        role: 'assistant',
        content: 'Sorry, there was an error. Please try again.',
      })
    } finally {
      setCurrentMessage(null)
    }
  }

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
      try {
        await clearChatMutation.mutateAsync()
        setCurrentMessage(null)
      } catch (error) {
        console.error('Error clearing chat:', error)
      }
    }
  }

  const handleExport = async () => {
    const isPlanBuilder = chatContext === 'plan_builder'
    try {
      const result = await exportChatMutation.mutateAsync({
        trigger_parser: isPlanBuilder,
        context: chatContext,
        plan_id: planId,
      })
      if (result.success && !result.error) {
        if (isPlanBuilder) {
          alert('Chat exported and financial plan created successfully!')
        } else {
          alert('Chat exported successfully.')
        }
      } else if (result.error) {
        alert(`Chat exported but parsing failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Error exporting chat:', error)
      alert('Failed to export chat')
    }
  }

  const displayMessages = [...messages]
  if (currentMessage) {
    displayMessages.push(currentMessage)
  }

  const isPlanBuilder = chatContext === 'plan_builder'
  const emptyStateText = isPlanBuilder
    ? 'Start a conversation to build your financial plan'
    : 'Ask about this plan or how to use the dashboard.'

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold">Financial Planning Assistant</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {isPlanBuilder ? 'Plan builder' : 'Dashboard'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClear}
            disabled={clearChatMutation.isPending || messages.length === 0}
          >
            Clear
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            disabled={exportChatMutation.isPending || messages.length === 0}
            isLoading={exportChatMutation.isPending}
          >
            {isPlanBuilder ? 'Export & Parse' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {isLoadingHistory ? (
          <div className="flex justify-center items-center h-full">
            <Spinner />
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            <p>{emptyStateText}</p>
          </div>
        ) : (
          displayMessages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        isLoading={sendMessageMutation.isPending}
      />
    </div>
  )
}
