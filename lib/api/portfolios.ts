// Portfolio API functions

import { apiClient } from './client'
import type { Portfolio } from '@/types/api'

export async function getPortfolios(planId: number): Promise<Portfolio[]> {
  const response = await apiClient.get<Portfolio[]>(`/portfolios/plan/${planId}`)
  return response.data
}

export async function getPortfolio(portfolioId: number): Promise<Portfolio> {
  const response = await apiClient.get<Portfolio>(`/portfolios/${portfolioId}`)
  return response.data
}

export async function createPortfolio(
  planId: number,
  portfolio: Portfolio
): Promise<Portfolio> {
  const response = await apiClient.post<Portfolio>(
    `/portfolios/plan/${planId}`,
    portfolio
  )
  return response.data
}

export async function updatePortfolio(
  portfolioId: number,
  portfolio: Portfolio
): Promise<Portfolio> {
  const response = await apiClient.put<Portfolio>(
    `/portfolios/${portfolioId}`,
    portfolio
  )
  return response.data
}

export async function deletePortfolio(portfolioId: number): Promise<void> {
  await apiClient.delete(`/portfolios/${portfolioId}`)
}

