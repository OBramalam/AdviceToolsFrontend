// React Query hooks for portfolios

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as portfolioApi from '@/lib/api/portfolios'
import type { Portfolio, PortfolioUI } from '@/types/api'
import {
  transformPortfolioFromAPI,
  transformPortfolioToAPI,
} from '@/lib/utils/portfolioTransform'

export function usePortfolios(planId: number | undefined) {
  return useQuery({
    queryKey: ['portfolios', planId],
    queryFn: () => portfolioApi.getPortfolios(planId!),
    enabled: !!planId,
  })
}

export function usePortfolio(portfolioId: number | undefined) {
  return useQuery({
    queryKey: ['portfolio', portfolioId],
    queryFn: () => portfolioApi.getPortfolio(portfolioId!),
    enabled: !!portfolioId,
  })
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      planId,
      portfolio,
    }: {
      planId: number
      portfolio: PortfolioUI
    }) => {
      const apiPortfolio = transformPortfolioToAPI(portfolio)
      return portfolioApi.createPortfolio(planId, apiPortfolio)
    },
    onSuccess: (_, variables) => {
      // Invalidate portfolios list for the plan
      queryClient.invalidateQueries({
        queryKey: ['portfolios', variables.planId],
      })
    },
  })
}

export function useUpdatePortfolio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      portfolioId,
      portfolio,
      planId,
    }: {
      portfolioId: number
      portfolio: PortfolioUI
      planId?: number
    }) => {
      const apiPortfolio = transformPortfolioToAPI(portfolio)
      return portfolioApi.updatePortfolio(portfolioId, apiPortfolio)
    },
    onSuccess: (data, variables) => {
      // Invalidate both the specific portfolio and the list
      if (data.id) {
        queryClient.invalidateQueries({
          queryKey: ['portfolio', data.id],
        })
      }
      // Invalidate portfolios list - use planId if available, otherwise invalidate all
      if (variables.planId) {
        queryClient.invalidateQueries({
          queryKey: ['portfolios', variables.planId],
        })
      } else {
        // Fallback: invalidate all portfolio queries
        queryClient.invalidateQueries({ queryKey: ['portfolios'] })
      }
    },
  })
}

export function useDeletePortfolio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (portfolioId: number) => portfolioApi.deletePortfolio(portfolioId),
    onSuccess: () => {
      // Invalidate all portfolio queries
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
    },
  })
}

