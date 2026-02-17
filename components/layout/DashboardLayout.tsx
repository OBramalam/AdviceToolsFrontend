'use client'

// Dashboard Layout component

import { ProtectedRoute } from './ProtectedRoute'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { ChatSidebar } from './ChatSidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <main className="flex-1 p-6 overflow-hidden flex flex-col min-h-0">{children}</main>
          <ChatSidebar />
        </div>
      </div>
    </ProtectedRoute>
  )
}

