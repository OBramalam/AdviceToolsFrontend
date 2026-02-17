'use client'

// Chat Sidebar component

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { clsx } from 'clsx'

const MIN_WIDTH = 320 // Minimum width when expanded
const MAX_WIDTH = 800 // Maximum width
const DEFAULT_WIDTH = 384 // Default width (w-96 = 384px)
const COLLAPSED_WIDTH = 64 // Collapsed width (w-16 = 64px)

export function ChatSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const toggleSidebar = () => {
    if (isCollapsed) {
      setIsCollapsed(false)
    } else {
      setIsCollapsed(true)
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return

      // Calculate new width based on mouse position
      const newWidth = window.innerWidth - e.clientX
      const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth))
      
      // Update DOM directly for immediate response
      sidebarRef.current.style.width = `${clampedWidth}px`
      sidebarRef.current.style.transition = 'none'
      
      // Also update state for consistency
      setWidth(clampedWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      // Re-enable transition after resize
      if (sidebarRef.current) {
        sidebarRef.current.style.transition = ''
      }
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  const currentWidth = isCollapsed ? COLLAPSED_WIDTH : width

  return (
    <>
      {/* Resize Handle */}
      {!isCollapsed && (
        <div
          onMouseDown={handleResizeStart}
          className="w-1 bg-gray-200 hover:bg-primary cursor-col-resize transition-colors group relative"
          style={{ flexShrink: 0 }}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-primary/20" />
        </div>
      )}

      <aside
        ref={sidebarRef}
        className={clsx(
          'bg-white shadow-sm border-l border-gray-200 flex flex-col h-full',
          !isResizing && 'transition-all duration-300'
        )}
        style={{ width: `${currentWidth}px`, flexShrink: 0 }}
      >
        {/* Toggle Button */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={isCollapsed ? 'Expand chat sidebar' : 'Collapse chat sidebar'}
          >
            {isCollapsed ? (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Chat Interface */}
        {!isCollapsed && (
          <div className="flex-1 min-h-0">
            <ChatInterface />
          </div>
        )}

        {/* Collapsed Icon */}
        {isCollapsed && (
          <div className="flex-1 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </aside>
    </>
  )
}

