// Portfolio manager component

'use client'

import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { PortfolioCard } from './PortfolioCard'
import { PortfolioForm } from './PortfolioForm'
import { usePortfolios, useCreatePortfolio, useUpdatePortfolio, useDeletePortfolio } from '@/lib/hooks/usePortfolios'
import { createDefaultPortfolioUI, transformPortfolioFromAPI, transformPortfolioToAPI } from '@/lib/utils/portfolioTransform'
import { Spinner } from '@/components/ui/Spinner'
import type { PortfolioUI } from '@/types/api'

export interface PortfolioManagerProps {
  planId: number
  planStartAge: number
  planEndAge: number
}

export function PortfolioManager({
  planId,
  planStartAge,
  planEndAge,
}: PortfolioManagerProps) {
  const { data: portfolios, isLoading } = usePortfolios(planId)
  const createMutation = useCreatePortfolio()
  const updateMutation = useUpdatePortfolio()
  const deleteMutation = useDeletePortfolio()

  // Track which portfolios are expanded
  const [expandedPortfolios, setExpandedPortfolios] = useState<Set<string>>(
    new Set()
  )
  const [isAddingNew, setIsAddingNew] = useState(false)

  // Transform portfolios from API to UI format
  const uiPortfolios = useMemo(() => {
    if (!portfolios) return []
    return portfolios.map(transformPortfolioFromAPI)
  }, [portfolios])

  // Calculate total cashflow allocation
  const totalCashflowAllocation = useMemo(() => {
    return uiPortfolios.reduce(
      (sum, p) => sum + p.cashflow_allocation,
      0
    )
  }, [uiPortfolios])

  const toggleExpand = (portfolioId: number | undefined, index: number) => {
    // Use id if available, otherwise use index as fallback
    const identifier = portfolioId !== undefined ? `id-${portfolioId}` : `index-${index}`
    setExpandedPortfolios((prev) => {
      const next = new Set(prev)
      if (next.has(identifier)) {
        next.delete(identifier)
      } else {
        next.add(identifier)
      }
      return next
    })
  }

  const handleCreate = async (portfolio: PortfolioUI) => {
    try {
      await createMutation.mutateAsync({ planId, portfolio })
      setIsAddingNew(false)
    } catch (error) {
      console.error('Failed to create portfolio:', error)
      // Error handling could be improved with toast notifications
    }
  }

  const handleUpdate = async (portfolio: PortfolioUI) => {
    if (!portfolio.id) return
    try {
      await updateMutation.mutateAsync({
        portfolioId: portfolio.id,
        portfolio,
        planId, // Pass planId so we can invalidate the correct query
      })
    } catch (error) {
      console.error('Failed to update portfolio:', error)
    }
  }

  const handleDelete = async (portfolioId: number) => {
    try {
      await deleteMutation.mutateAsync(portfolioId)
    } catch (error) {
      console.error('Failed to delete portfolio:', error)
    }
  }

  const handleDuplicate = async (portfolio: PortfolioUI) => {
    const duplicated: PortfolioUI = {
      ...portfolio,
      id: undefined, // New portfolio - backend will generate id
      name: `${portfolio.name} (Copy)`,
    }
    try {
      await createMutation.mutateAsync({ planId, portfolio: duplicated })
    } catch (error) {
      console.error('Failed to duplicate portfolio:', error)
    }
  }

  const handleCancelNew = () => {
    setIsAddingNew(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Portfolios</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage portfolio allocations and glide paths
          </p>
        </div>
        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          type="button"
        >
          <Plus className="w-4 h-4" />
          Add New Portfolio
        </button>
      </div>

      {/* Validation Warning */}
      {uiPortfolios.length > 0 && (
        <div
          className={`p-3 rounded-lg ${
            Math.abs(totalCashflowAllocation - 1.0) < 0.01
              ? 'bg-green-50 text-green-800'
              : 'bg-yellow-50 text-yellow-800'
          }`}
        >
          <p className="text-sm font-medium">
            Total Cashflow Allocation:{' '}
            {(totalCashflowAllocation * 100).toFixed(1)}%
            {Math.abs(totalCashflowAllocation - 1.0) < 0.01 ? (
              <span className="ml-2">✓ Valid</span>
            ) : (
              <span className="ml-2">
                ⚠ Must sum to 100% across all portfolios
              </span>
            )}
          </p>
        </div>
      )}

      {/* New Portfolio Form */}
      {isAddingNew && (
        <div className="border border-gray-200 rounded-lg bg-white shadow-sm p-6">
          <PortfolioForm
            planId={planId}
            planStartAge={planStartAge}
            planEndAge={planEndAge}
            onSave={handleCreate}
            onCancel={handleCancelNew}
            isNew={true}
          />
        </div>
      )}

      {/* Portfolio Cards */}
      <div className="space-y-4">
        {uiPortfolios.map((portfolio, index) => {
          // Use id if available, otherwise use index as fallback
          const identifier =
            portfolio.id !== undefined ? `id-${portfolio.id}` : `index-${index}`
          return (
            <PortfolioCard
              key={identifier}
              portfolio={portfolio}
              planId={planId}
              planStartAge={planStartAge}
              planEndAge={planEndAge}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              isExpanded={expandedPortfolios.has(identifier)}
              onToggleExpand={() => toggleExpand(portfolio.id, index)}
            />
          )
        })}
      </div>

      {/* Empty State */}
      {!isAddingNew && uiPortfolios.length === 0 && (
        <div className="text-center py-12 border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-gray-600 mb-4">No portfolios configured</p>
          <button
            onClick={() => setIsAddingNew(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            type="button"
          >
            Create Your First Portfolio
          </button>
        </div>
      )}
    </div>
  )
}

