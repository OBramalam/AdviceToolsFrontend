// Default Settings Form component for managing adviser config

'use client'

import { useState, useEffect } from 'react'
import { AdviserConfig } from '@/types/api'
import {
  useAdviserConfig,
  useCreateAdviserConfig,
  useUpdateAdviserConfig,
} from '@/lib/hooks/useAdviserConfig'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { clsx } from 'clsx'

// Helper to convert decimal to percentage string (e.g., 0.02 -> "2")
function decimalToPercent(decimal: number | null | undefined): string {
  if (decimal === null || decimal === undefined) return ''
  return (decimal * 100).toString()
}

// Helper to convert percentage string to decimal (e.g., "2" -> 0.02)
function percentToDecimal(percentStr: string): number | null {
  if (!percentStr.trim()) return null
  const num = parseFloat(percentStr)
  if (isNaN(num)) return null
  return num / 100
}

// Default values when no config exists
const defaultValues = {
  inflation: '2.0',
  asset_costs_stocks: '0.1',
  asset_costs_bonds: '0.1',
  asset_costs_cash: '0.1',
  expected_returns_stocks: '8.0',
  expected_returns_bonds: '4.0',
  expected_returns_cash: '2.0',
  number_of_simulations: 5000,
  allocation_step: '10.0',
}

export function DefaultSettingsForm() {
  const { data: config, isLoading, error } = useAdviserConfig()
  const createMutation = useCreateAdviserConfig()
  const updateMutation = useUpdateAdviserConfig()

  const [formData, setFormData] = useState<{
    inflation: string
    asset_costs_stocks: string
    asset_costs_bonds: string
    asset_costs_cash: string
    expected_returns_stocks: string
    expected_returns_bonds: string
    expected_returns_cash: string
    number_of_simulations: number
    allocation_step: string
  }>(defaultValues)

  const [isEditing, setIsEditing] = useState(false)
  const configExists = config && !error

  // Initialize form data when config loads
  useEffect(() => {
    if (config) {
      setFormData({
        inflation: decimalToPercent(config.inflation) || defaultValues.inflation,
        asset_costs_stocks: decimalToPercent(config.asset_costs?.stocks) || defaultValues.asset_costs_stocks,
        asset_costs_bonds: decimalToPercent(config.asset_costs?.bonds) || defaultValues.asset_costs_bonds,
        asset_costs_cash: decimalToPercent(config.asset_costs?.cash) || defaultValues.asset_costs_cash,
        expected_returns_stocks: decimalToPercent(config.expected_returns?.stocks) || defaultValues.expected_returns_stocks,
        expected_returns_bonds: decimalToPercent(config.expected_returns?.bonds) || defaultValues.expected_returns_bonds,
        expected_returns_cash: decimalToPercent(config.expected_returns?.cash) || defaultValues.expected_returns_cash,
        number_of_simulations: config.number_of_simulations || defaultValues.number_of_simulations,
        allocation_step: decimalToPercent(config.allocation_step) || defaultValues.allocation_step,
      })
      setIsEditing(false)
    } else {
      // Reset to defaults when config doesn't exist
      setFormData(defaultValues)
      setIsEditing(false)
    }
  }, [config])

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setIsEditing(true)
  }

  const handleSave = async () => {
    try {
      const payload: Omit<AdviserConfig, 'risk_allocation_map'> = {
        inflation: percentToDecimal(formData.inflation) || 0.02,
        asset_costs: {
          stocks: percentToDecimal(formData.asset_costs_stocks) || 0.001,
          bonds: percentToDecimal(formData.asset_costs_bonds) || 0.001,
          cash: percentToDecimal(formData.asset_costs_cash) || 0.001,
        },
        expected_returns: {
          stocks: percentToDecimal(formData.expected_returns_stocks) || 0.08,
          bonds: percentToDecimal(formData.expected_returns_bonds) || 0.04,
          cash: percentToDecimal(formData.expected_returns_cash) || 0.02,
        },
        number_of_simulations: formData.number_of_simulations,
        allocation_step: percentToDecimal(formData.allocation_step) || 0.10,
      }

      if (configExists && config) {
        await updateMutation.mutateAsync({
          data: payload,
          existingRiskMap: config.risk_allocation_map,
        })
      } else {
        await createMutation.mutateAsync(payload)
      }
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save default settings:', error)
    }
  }

  const handleCancel = () => {
    if (config) {
      setFormData({
        inflation: decimalToPercent(config.inflation),
        asset_costs_stocks: decimalToPercent(config.asset_costs?.stocks),
        asset_costs_bonds: decimalToPercent(config.asset_costs?.bonds),
        asset_costs_cash: decimalToPercent(config.asset_costs?.cash),
        expected_returns_stocks: decimalToPercent(config.expected_returns?.stocks),
        expected_returns_bonds: decimalToPercent(config.expected_returns?.bonds),
        expected_returns_cash: decimalToPercent(config.expected_returns?.cash),
        number_of_simulations: config.number_of_simulations || 5000,
        allocation_step: decimalToPercent(config.allocation_step),
      })
    }
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner />
      </div>
    )
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Default Settings</h3>
        {configExists && (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={!isEditing || isPending}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isEditing || isPending}
              className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              {isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {!configExists && error && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            No default settings configured. Create default settings to apply them
            across all financial plans.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inflation */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Inflation Rate (%)
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={formData.inflation}
              onChange={(e) => handleChange('inflation', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="2.0"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              %
            </span>
          </div>
        </div>

        {/* Number of Simulations */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Number of Simulations
          </label>
          <input
            type="number"
            min="1"
            value={formData.number_of_simulations}
            onChange={(e) =>
              handleChange('number_of_simulations', parseInt(e.target.value, 10) || 0)
            }
            className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Allocation Step */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Allocation Step (%)
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={formData.allocation_step}
              onChange={(e) => handleChange('allocation_step', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="10.0"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              %
            </span>
          </div>
        </div>
      </div>

      {/* Expected Returns */}
      <div className="mt-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Expected Returns (%)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { key: 'expected_returns_stocks', label: 'Stocks' },
            { key: 'expected_returns_bonds', label: 'Bonds' },
            { key: 'expected_returns_cash', label: 'Cash' },
          ].map(({ key, label }) => (
            <div key={key} className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData[key as keyof typeof formData] as string}
                  onChange={(e) => handleChange(key as keyof typeof formData, e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="8.0"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  %
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Asset Costs */}
      <div className="mt-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Asset Costs (%)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { key: 'asset_costs_stocks', label: 'Stocks' },
            { key: 'asset_costs_bonds', label: 'Bonds' },
            { key: 'asset_costs_cash', label: 'Cash' },
          ].map(({ key, label }) => (
            <div key={key} className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData[key as keyof typeof formData] as string}
                  onChange={(e) => handleChange(key as keyof typeof formData, e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="0.1"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  %
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create button if config doesn't exist */}
      {!configExists && (
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="px-4 py-2"
          >
            {isPending ? 'Creating...' : 'Create Default Settings'}
          </Button>
        </div>
      )}
    </div>
  )
}

