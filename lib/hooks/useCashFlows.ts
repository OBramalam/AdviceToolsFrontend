// Cash Flows React Query hooks

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CashFlow } from '@/types/api'
import * as cashFlowsApi from '@/lib/api/cashflows'

export function useCashFlows(planId: number) {
  return useQuery({
    queryKey: ['cashFlows', planId],
    queryFn: () => cashFlowsApi.getCashFlows(planId),
    enabled: !!planId,
  })
}

export function useCashFlow(id: number) {
  return useQuery({
    queryKey: ['cashFlow', id],
    queryFn: () => cashFlowsApi.getCashFlow(id),
    enabled: !!id,
  })
}

export function useCreateCashFlow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      planId,
      data,
    }: {
      planId: number
      data: Omit<CashFlow, 'id' | 'plan_id'>
    }) => cashFlowsApi.createCashFlow(planId, data),
    onSuccess: (_: CashFlow, variables) => {
      // Invalidate cash flows for the plan
      queryClient.invalidateQueries({
        queryKey: ['cashFlows', variables.planId],
      })
    },
  })
}

export function useUpdateCashFlow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Omit<CashFlow, 'id' | 'plan_id'>
    }) => cashFlowsApi.updateCashFlow(id, data),
    onSuccess: (data: CashFlow, variables) => {
      // Invalidate cash flow and all cash flows lists
      queryClient.invalidateQueries({ queryKey: ['cashFlow', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['cashFlows'] })
    },
  })
}

export function useDeleteCashFlow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      planId,
    }: {
      id: number
      planId: number
    }) => cashFlowsApi.deleteCashFlow(id),
    onSuccess: (_: void, variables: { id: number; planId: number }) => {
      // Remove specific cash flow from cache
      queryClient.removeQueries({ queryKey: ['cashFlow', variables.id] })
      // Invalidate cash flows list for the plan
      queryClient.invalidateQueries({
        queryKey: ['cashFlows', variables.planId],
      })
    },
  })
}
