// Adviser Config React Query hooks

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { AdviserConfig } from '@/types/api'
import * as adviserConfigApi from '@/lib/api/adviser-configs'

export function useAdviserConfig() {
  return useQuery({
    queryKey: ['adviserConfig'],
    queryFn: adviserConfigApi.getAdviserConfig,
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (config doesn't exist yet)
      if (error?.response?.status === 404) {
        return false
      }
      return failureCount < 3
    },
  })
}

export function useCreateAdviserConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Omit<AdviserConfig, 'risk_allocation_map'>) =>
      adviserConfigApi.createAdviserConfig(data),
    onSuccess: () => {
      // Invalidate config query to refetch
      queryClient.invalidateQueries({ queryKey: ['adviserConfig'] })
    },
  })
}

export function useUpdateAdviserConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      data,
      existingRiskMap,
    }: {
      data: Omit<AdviserConfig, 'risk_allocation_map'>
      existingRiskMap?: Record<number, number>
    }) => adviserConfigApi.updateAdviserConfig(data, existingRiskMap),
    onSuccess: () => {
      // Invalidate config query to refetch
      queryClient.invalidateQueries({ queryKey: ['adviserConfig'] })
    },
  })
}

export function useDeleteAdviserConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adviserConfigApi.deleteAdviserConfig,
    onSuccess: () => {
      // Remove config from cache
      queryClient.removeQueries({ queryKey: ['adviserConfig'] })
    },
  })
}
