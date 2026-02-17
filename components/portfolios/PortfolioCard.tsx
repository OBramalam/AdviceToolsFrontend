// Portfolio card component (collapsible)

'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Trash2, Copy } from 'lucide-react'
import { PortfolioForm } from './PortfolioForm'
import { formatCurrency } from '@/lib/utils/format'
import type { PortfolioUI } from '@/types/api'
import { clsx } from 'clsx'

export interface PortfolioCardProps {
  portfolio: PortfolioUI
  planId: number
  planStartAge: number
  planEndAge: number
  onUpdate: (portfolio: PortfolioUI) => void
  onDelete: (portfolioId: number) => void
  onDuplicate: (portfolio: PortfolioUI) => void
  isExpanded?: boolean
  onToggleExpand: () => void
}

export function PortfolioCard({
  portfolio,
  planId,
  planStartAge,
  planEndAge,
  onUpdate,
  onDelete,
  onDuplicate,
  isExpanded = false,
  onToggleExpand,
}: PortfolioCardProps) {
  const handleSave = (updatedPortfolio: PortfolioUI) => {
    onUpdate(updatedPortfolio)
    onToggleExpand() // Collapse after save
  }

  const handleCancel = () => {
    onToggleExpand() // Collapse on cancel
  }

  const handleDelete = () => {
    if (
      window.confirm(
        `Are you sure you want to delete "${portfolio.name}"? This action cannot be undone.`
      )
    ) {
      if (portfolio.id !== undefined) {
        onDelete(portfolio.id)
      }
    }
  }

  const handleDuplicate = () => {
    onDuplicate(portfolio)
  }

  // Calculate summary info
  const bondsPercentage =
    portfolio.weights.length > 0
      ? (1 - portfolio.weights[0].stocks - portfolio.cash_allocation) * 100
      : 0

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
      {/* Card Header (Collapsed View) */}
      <div
        className={clsx(
          'p-4 cursor-pointer hover:bg-gray-50 transition-colors',
          isExpanded && 'border-b border-gray-200'
        )}
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {portfolio.name || 'Unnamed Portfolio'}
            </h3>
            <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
              <span>
                Initial Value: {formatCurrency(portfolio.initial_portfolio_value)}
              </span>
              <span>Cash: {(portfolio.cash_allocation * 100).toFixed(1)}%</span>
              <span>
                Cashflow: {(portfolio.cashflow_allocation * 100).toFixed(1)}%
              </span>
              <span>
                {portfolio.weights.length} control point
                {portfolio.weights.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isExpanded && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDuplicate()
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Duplicate portfolio"
                  type="button"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete()
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Delete portfolio"
                  type="button"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Form */}
      {isExpanded && (
        <div className="p-6 border-t border-gray-200">
          <PortfolioForm
            portfolio={portfolio}
            planId={planId}
            planStartAge={planStartAge}
            planEndAge={planEndAge}
            onSave={handleSave}
            onCancel={handleCancel}
            isNew={false}
          />
        </div>
      )}
    </div>
  )
}

