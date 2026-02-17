// Portfolio form component for creating/editing portfolios

'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { GlidePathChart, GlidePathPoint } from './GlidePathChart'
import { PortfolioCashFlowsTable } from './PortfolioCashFlowsTable'
import { TaxConfigSection } from './TaxConfigSection'
import { formatCurrency } from '@/lib/utils/format'
import type { PortfolioUI, TaxConfig } from '@/types/api'
import { useAdviserConfig } from '@/lib/hooks/useAdviserConfig'
import { getDefaultTaxConfig } from '@/lib/utils/taxConfig'

export interface PortfolioFormProps {
  portfolio?: PortfolioUI
  planId: number
  planStartAge: number
  planEndAge: number
  onSave: (portfolio: PortfolioUI) => void
  onCancel: () => void
  isNew?: boolean
}

export function PortfolioForm({
  portfolio,
  planId,
  planStartAge,
  planEndAge,
  onSave,
  onCancel,
  isNew = false,
}: PortfolioFormProps) {
  const { data: adviserConfig } = useAdviserConfig()
  const [formData, setFormData] = useState<PortfolioUI>(() => {
    if (portfolio) {
      return { ...portfolio }
    }
    // For new portfolios, don't set tax fields (let backend use defaults)
    return {
      name: '',
      cash_allocation: 0.05, // 5% default
      weights: [{ step: 0, stocks: 0.7 }], // 70% default equity
      expected_returns: {
        stocks: 0.08,
        bonds: 0.04,
        cash: 0.02,
      },
      asset_costs: {
        stocks: 0.001,
        bonds: 0.001,
        cash: 0.001,
      },
      initial_portfolio_value: 0,
      cashflow_allocation: 1.0,
      // tax_jurisdiction and tax_config left undefined for new portfolios
    }
  })

  // Update form data when portfolio prop changes
  useEffect(() => {
    if (portfolio) {
      setFormData({ ...portfolio })
    }
  }, [portfolio])

  const handleChange = (field: keyof PortfolioUI, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNestedChange = (
    parentField: 'expected_returns' | 'asset_costs',
    childField: string,
    value: number | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value,
      },
    }))
  }

  const handleWeightsChange = (points: GlidePathPoint[]) => {
    setFormData((prev) => ({
      ...prev,
      weights: points,
    }))
  }

  const handleInitialValueChange = (value: string) => {
    // Remove currency symbols and parse
    const numericValue = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0
    handleChange('initial_portfolio_value', numericValue)
  }

  const handleCashAllocationChange = (value: string) => {
    // Convert percentage to decimal
    const decimalValue = parseFloat(value) / 100 || 0
    handleChange('cash_allocation', Math.max(0, Math.min(1, decimalValue)))
  }

  const handleCashflowAllocationChange = (value: string) => {
    // Convert percentage to decimal
    const decimalValue = parseFloat(value) / 100 || 0
    handleChange('cashflow_allocation', Math.max(0, Math.min(1, decimalValue)))
  }

  const handleTaxJurisdictionChange = (jurisdiction: string | null) => {
    setFormData((prev) => ({
      ...prev,
      tax_jurisdiction: jurisdiction,
      // Clear tax_config if jurisdiction is cleared
      tax_config: jurisdiction ? prev.tax_config : null,
    }))
  }

  const handleTaxConfigChange = (config: TaxConfig | null) => {
    setFormData((prev) => ({
      ...prev,
      tax_config: config,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  // Calculate inferred bonds percentage
  const bondsPercentage =
    formData.weights.length > 0
      ? (1 - formData.weights[0].stocks - formData.cash_allocation) * 100
      : 0

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Section: Left (Name, Value, Cash) and Right (Returns, Costs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Name, Portfolio Value, Cash Allocation */}
        <div className="space-y-4">
          <Input
            label="Portfolio Name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            placeholder="e.g., Conservative Portfolio"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initial Portfolio Value
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="text"
                value={formatCurrency(formData.initial_portfolio_value)}
                onChange={(e) => handleInitialValueChange(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cash Allocation (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={(formData.cash_allocation * 100).toFixed(1)}
              onChange={(e) => handleCashAllocationChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              Constant cash allocation over time
            </p>
          </div>
        </div>

        {/* Right Column: Expected Returns and Asset Costs */}
        <div className="space-y-4">
          {/* Expected Returns */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Expected Returns (%)
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Stocks</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={
                    formData.expected_returns.stocks
                      ? (formData.expected_returns.stocks * 100).toFixed(2)
                      : ''
                  }
                  onChange={(e) =>
                    handleNestedChange(
                      'expected_returns',
                      'stocks',
                      e.target.value ? parseFloat(e.target.value) / 100 : null
                    )
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="8.0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Bonds</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={
                    formData.expected_returns.bonds
                      ? (formData.expected_returns.bonds * 100).toFixed(2)
                      : ''
                  }
                  onChange={(e) =>
                    handleNestedChange(
                      'expected_returns',
                      'bonds',
                      e.target.value ? parseFloat(e.target.value) / 100 : null
                    )
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="4.0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Cash</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={
                    formData.expected_returns.cash !== null &&
                    formData.expected_returns.cash !== undefined
                      ? (formData.expected_returns.cash * 100).toFixed(2)
                      : ''
                  }
                  onChange={(e) =>
                    handleNestedChange(
                      'expected_returns',
                      'cash',
                      e.target.value ? parseFloat(e.target.value) / 100 : null
                    )
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="2.0"
                />
              </div>
            </div>
          </div>

          {/* Asset Costs */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Asset Costs (%)
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Stocks</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.001"
                  value={(formData.asset_costs.stocks * 100).toFixed(3)}
                  onChange={(e) =>
                    handleNestedChange(
                      'asset_costs',
                      'stocks',
                      parseFloat(e.target.value) / 100 || 0
                    )
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Bonds</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.001"
                  value={(formData.asset_costs.bonds * 100).toFixed(3)}
                  onChange={(e) =>
                    handleNestedChange(
                      'asset_costs',
                      'bonds',
                      parseFloat(e.target.value) / 100 || 0
                    )
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Cash</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.001"
                  value={(formData.asset_costs.cash * 100).toFixed(3)}
                  onChange={(e) =>
                    handleNestedChange(
                      'asset_costs',
                      'cash',
                      parseFloat(e.target.value) / 100 || 0
                    )
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Portfolio Cash Flows, Cashflow Allocation Slider and Glide Path Chart */}
      <div className="space-y-6">
        {/* Portfolio-specific Cash Flows */}
        <div className="border-t pt-6">
          <PortfolioCashFlowsTable
            planId={planId}
            portfolioId={formData.id}
          />
        </div>

        {/* Cashflow Allocation Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cashflow Allocation: {(formData.cashflow_allocation * 100).toFixed(1)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={formData.cashflow_allocation * 100}
            onChange={(e) => handleCashflowAllocationChange(e.target.value)}
            className="w-full"
          />
          <p className="mt-1 text-sm text-gray-500">
            Percentage of cash flows allocated to this portfolio (must sum to 100%
            across all portfolios)
          </p>
        </div>

      {/* Glide Path Chart */}
      <div className="border-t pt-6">
        <GlidePathChart
          points={formData.weights}
          onPointsChange={handleWeightsChange}
          cashAllocation={formData.cash_allocation}
          planStartAge={planStartAge}
          planEndAge={planEndAge}
          height={400}
          allocationStep={adviserConfig?.allocation_step ?? 0.01}
        />
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Bonds:</strong> {bondsPercentage.toFixed(1)}% (inferred from
            equity and cash)
          </p>
          <p className="text-sm text-gray-600">
            <strong>Cash:</strong> {(formData.cash_allocation * 100).toFixed(1)}%
            (constant)
          </p>
        </div>
      </div>

      {/* Tax Configuration Section */}
      <TaxConfigSection
        taxJurisdiction={formData.tax_jurisdiction}
        taxConfig={formData.tax_config}
        defaultJurisdiction={adviserConfig?.tax_jurisdiction ?? null}
        onJurisdictionChange={handleTaxJurisdictionChange}
        onTaxConfigChange={handleTaxConfigChange}
      />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {isNew ? 'Create Portfolio' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

