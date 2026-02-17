// Adviser Config API functions

import { apiClient } from './client'
import type { AdviserConfig } from '@/types/api'

export async function getAdviserConfig(): Promise<AdviserConfig> {
  const response = await apiClient.get<AdviserConfig>('/adviser-configs')
  return response.data
}

export async function createAdviserConfig(
  data: Omit<AdviserConfig, 'risk_allocation_map'>
): Promise<AdviserConfig> {
  // Include empty risk_allocation_map for backend compatibility (deprecated field)
  const payload: AdviserConfig = {
    ...data,
    risk_allocation_map: {},
  }
  const response = await apiClient.post<AdviserConfig>('/adviser-configs', payload)
  return response.data
}

export async function updateAdviserConfig(
  data: Omit<AdviserConfig, 'risk_allocation_map'>,
  existingRiskMap?: Record<number, number>
): Promise<AdviserConfig> {
  // Preserve existing risk_allocation_map if provided, otherwise use empty object (deprecated field)
  const payload: AdviserConfig = {
    ...data,
    risk_allocation_map: existingRiskMap || {},
  }
  const response = await apiClient.put<AdviserConfig>('/adviser-configs', payload)
  return response.data
}

export async function deleteAdviserConfig(): Promise<void> {
  await apiClient.delete('/adviser-configs')
}
