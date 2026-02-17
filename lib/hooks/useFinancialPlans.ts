// Financial Plans React Query hooks

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { FinancialPlan } from '@/types/api'
import * as financialPlansApi from '@/lib/api/financial-plans'

export function useFinancialPlans() {
  return useQuery({
    queryKey: ['financialPlans'],
    queryFn: financialPlansApi.getFinancialPlans,
  })
}

export function useFinancialPlan(id: number) {
  return useQuery({
    queryKey: ['financialPlan', id],
    queryFn: () => financialPlansApi.getFinancialPlan(id),
    enabled: !!id,
  })
}

export function useCreateFinancialPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: financialPlansApi.createFinancialPlan,
    onSuccess: () => {
      // Invalidate plans list to refetch
      queryClient.invalidateQueries({ queryKey: ['financialPlans'] })
    },
  })
}

export function useUpdateFinancialPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Omit<FinancialPlan, 'id' | 'user_id'>
    }) => financialPlansApi.updateFinancialPlan(id, data),
    onSuccess: (data: FinancialPlan) => {
      // Invalidate plans list and specific plan
      queryClient.invalidateQueries({ queryKey: ['financialPlans'] })
      queryClient.invalidateQueries({ queryKey: ['financialPlan', data.id] })
    },
  })
}

export function useDeleteFinancialPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: financialPlansApi.deleteFinancialPlan,
    onSuccess: (_: void, id: number) => {
      // Invalidate plans list and remove specific plan from cache
      queryClient.invalidateQueries({ queryKey: ['financialPlans'] })
      queryClient.removeQueries({ queryKey: ['financialPlan', id] })
    },
  })
}
