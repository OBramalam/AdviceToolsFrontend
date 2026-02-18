'use client'

// Login Form component

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLogin } from '@/lib/hooks/useAuth'
import { useAuth } from '@/lib/context/AuthContext'
import { loginSchema, type LoginFormData } from '@/lib/utils/validation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { getErrorMessage } from '@/lib/utils/errors'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LoginForm() {
  const router = useRouter()
  const { setUser } = useAuth()
  const loginMutation = useLogin()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    try {
      const response = await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
      })
      // Update Context state directly - this triggers immediate re-render
      setUser(response.user)
      router.push('/dashboard')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        {...register('email')}
        error={errors.email?.message}
        autoComplete="email"
      />

      <Input
        label="Password"
        type="password"
        {...register('password')}
        error={errors.password?.message}
        autoComplete="current-password"
      />

      <Button
        type="submit"
        className="w-full"
        isLoading={loginMutation.isPending}
      >
        Login
      </Button>

      <div className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <a href="/signup" className="text-primary hover:underline">
          Sign up
        </a>
      </div>
    </form>
  )
}

