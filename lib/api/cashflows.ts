// Cash Flows API functions

import { apiClient } from './client'
import type { CashFlow } from '@/types/api'

export async function getCashFlows(planId: number): Promise<CashFlow[]> {
  const response = await apiClient.get<CashFlow[]>(
    `/cashflows/plan/${planId}`
  )
  console.log('[getCashFlows] Backend response:', {
    planId,
    count: response.data.length,
    cashflows: response.data.map((cf) => ({
      id: cf.id,
      name: cf.name,
      portfolio_id: cf.portfolio_id,
      amount: cf.amount,
      basis: cf.basis,
      include_in_main_savings: cf.include_in_main_savings,
    })),
  })
  return response.data
}

export async function getCashFlow(id: number): Promise<CashFlow> {
  const response = await apiClient.get<CashFlow>(`/cashflows/${id}`)
  return response.data
}

export async function createCashFlow(
  planId: number,
  data: Omit<CashFlow, 'id' | 'plan_id'>
): Promise<CashFlow> {
  console.log('[createCashFlow] Sending request:', {
    planId,
    data: {
      ...data,
      portfolio_id: data.portfolio_id,
    },
  })
  const response = await apiClient.post<CashFlow>(
    `/cashflows/plan/${planId}`,
    data
  )
  console.log('[createCashFlow] Backend response:', {
    id: response.data.id,
    name: response.data.name,
    portfolio_id: response.data.portfolio_id,
    amount: response.data.amount,
    basis: response.data.basis,
    include_in_main_savings: response.data.include_in_main_savings,
    fullResponse: response.data,
  })
  return response.data
}

export async function updateCashFlow(
  id: number,
  data: Omit<CashFlow, 'id' | 'plan_id'>
): Promise<CashFlow> {
  console.log('[updateCashFlow] Sending request:', {
    id,
    data: {
      ...data,
      portfolio_id: data.portfolio_id,
    },
  })
  const response = await apiClient.put<CashFlow>(`/cashflows/${id}`, data)
  console.log('[updateCashFlow] Backend response:', {
    id: response.data.id,
    name: response.data.name,
    portfolio_id: response.data.portfolio_id,
    amount: response.data.amount,
    basis: response.data.basis,
    include_in_main_savings: response.data.include_in_main_savings,
    fullResponse: response.data,
  })
  return response.data
}

export async function deleteCashFlow(id: number): Promise<void> {
  await apiClient.delete(`/cashflows/${id}`)
}

