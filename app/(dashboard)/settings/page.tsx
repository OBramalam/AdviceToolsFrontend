'use client'

// Settings Page

import { useAuth } from '@/lib/context/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/Spinner'
import { DefaultSettingsForm } from '@/components/settings'
import { User, Mail, Shield, Calendar } from 'lucide-react'

export default function SettingsPage() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-y-auto pb-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-900">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Name
              </label>
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || 'N/A'}
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Email
              </label>
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email || 'N/A'}
              </p>
            </div>
          </div>

          {/* Account Status */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Account Status
              </label>
              <div>
                {user?.is_active ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Member Since */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Member Since
              </label>
              <p className="text-sm font-medium text-gray-900">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <DefaultSettingsForm />
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Actions</h2>
        <div className="space-y-4">
          <Button variant="danger" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </Card>
      </div>
    </div>
  )
}

