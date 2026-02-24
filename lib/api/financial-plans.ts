// Financial Plans API functions

import { apiClient } from './client'
import type { FinancialPlan } from '@/types/api'

export async function getFinancialPlans(): Promise<FinancialPlan[]> {
  const response = await apiClient.get<FinancialPlan[]>('/financial-plans')
  return response.data
}

export async function getFinancialPlan(id: number): Promise<FinancialPlan> {
  const response = await apiClient.get<FinancialPlan>(`/financial-plans/${id}`)
  return response.data
}

export async function createFinancialPlan(
  data: Omit<FinancialPlan, 'id' | 'user_id'>
): Promise<FinancialPlan> {
  const response = await apiClient.post<FinancialPlan>('/financial-plans', data)
  return response.data
}

export async function updateFinancialPlan(
  id: number,
  data: Omit<FinancialPlan, 'id' | 'user_id'>
): Promise<FinancialPlan> {
  const response = await apiClient.put<FinancialPlan>(
    `/financial-plans/${id}`,
    data
  )
  return response.data
}

export async function deleteFinancialPlan(id: number): Promise<void> {
  await apiClient.delete(`/financial-plans/${id}`)
}

export async function duplicateFinancialPlan(
  id: number
): Promise<FinancialPlan> {
  const response = await apiClient.post<FinancialPlan>(
    `/financial-plans/${id}/duplicate`
  )
  return response.data
}


