'use client'

// Chat Interface component

import { useEffect, useRef, useState } from 'react'
import { useChatHistory, useSendMessage, useClearChat, useExportChat } from '@/lib/hooks/useChat'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import type { ChatMessage as ChatMessageType } from '@/types/api'

export function ChatInterface() {
  const { data: messages = [], isLoading: isLoadingHistory } = useChatHistory()
  const sendMessageMutation = useSendMessage()
  const clearChatMutation = useClearChat()
  const exportChatMutation = useExportChat()
  const [currentMessage, setCurrentMessage] = useState<ChatMessageType | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentMessage])

  const handleSend = async (messageText: string) => {
    // Add user message immediately
    const userMessage: ChatMessageType = {
      role: 'user',
      content: messageText,
    }
    setCurrentMessage(userMessage)

    // Start assistant message
    let assistantContent = ''
    const assistantMessage: ChatMessageType = {
      role: 'assistant',
      content: '',
    }
    setCurrentMessage(assistantMessage)

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
    try {
      const result = await exportChatMutation.mutateAsync({
        trigger_parser: true,
      })
      if (result.success && !result.error) {
        alert('Chat exported and financial plan created successfully!')
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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Financial Planning Assistant</h2>
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
            Export & Parse
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
            <p>Start a conversation to build your financial plan</p>
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

