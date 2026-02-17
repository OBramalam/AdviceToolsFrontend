// Tax configuration section component for portfolio forms

'use client'

import { useState, useEffect } from 'react'
import type { TaxConfig, NewZealandTaxConfig } from '@/types/api'
import {
  getDefaultTaxConfig,
  validateTaxConfig,
  getAvailableJurisdictions,
  formatTaxPercentage,
  parseTaxPercentage,
} from '@/lib/utils/taxConfig'

export interface TaxConfigSectionProps {
  taxJurisdiction: string | null | undefined
  taxConfig: TaxConfig | null | undefined
  defaultJurisdiction?: string | null // From adviser config
  onJurisdictionChange: (jurisdiction: string | null) => void
  onTaxConfigChange: (config: TaxConfig | null) => void
}

export function TaxConfigSection({
  taxJurisdiction,
  taxConfig,
  defaultJurisdiction,
  onJurisdictionChange,
  onTaxConfigChange,
}: TaxConfigSectionProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [localJurisdiction, setLocalJurisdiction] = useState<string | null>(
    taxJurisdiction ?? defaultJurisdiction ?? null
  )
  const [localConfig, setLocalConfig] = useState<TaxConfig | null>(
    taxConfig ?? null
  )

  // Sync props to local state (only sync, don't call parent callbacks)
  // This effect only runs when props change, not when local state changes
  useEffect(() => {
    const effectiveJurisdiction = taxJurisdiction ?? defaultJurisdiction ?? null
    
    // Only update if different to prevent unnecessary re-renders
    setLocalJurisdiction((prev) => {
      if (prev !== effectiveJurisdiction) {
        return effectiveJurisdiction
      }
      return prev
    })
    
    // Sync tax config from props
    setLocalConfig((prev) => {
      if (prev !== taxConfig) {
        return taxConfig ?? null
      }
      return prev
    })
  }, [taxJurisdiction, defaultJurisdiction, taxConfig])

  // Validate config when it changes
  useEffect(() => {
    if (localJurisdiction && localConfig) {
      const validation = validateTaxConfig(localConfig, localJurisdiction)
      setValidationErrors(validation.errors)
    } else {
      setValidationErrors([])
    }
  }, [localJurisdiction, localConfig])

  const handleJurisdictionChange = (value: string) => {
    const newJurisdiction = value === '' ? null : value
    
    // Update local state first
    setLocalJurisdiction(newJurisdiction)
    
    // Notify parent of jurisdiction change
    onJurisdictionChange(newJurisdiction)

    // If jurisdiction cleared, clear config
    if (newJurisdiction === null) {
      setLocalConfig(null)
      onTaxConfigChange(null)
    } else {
      // If jurisdiction set and no config exists or config is for different jurisdiction, initialize default
      if (!localConfig || localConfig.jurisdiction !== newJurisdiction) {
        const defaultConfig = getDefaultTaxConfig(newJurisdiction)
        if (defaultConfig) {
          setLocalConfig(defaultConfig)
          onTaxConfigChange(defaultConfig)
        }
      }
    }
  }

  const handleNZConfigChange = (
    field: keyof NewZealandTaxConfig,
    value: string
  ) => {
    if (localConfig && localConfig.jurisdiction === 'nz') {
      const nzConfig = localConfig as NewZealandTaxConfig
      const parsedValue = parseTaxPercentage(value)

      let updatedConfig: NewZealandTaxConfig = {
        ...nzConfig,
        [field]: parsedValue,
      }

      // Auto-calculate FIF if PIE changes (or vice versa)
      if (field === 'percent_pie_fund') {
        updatedConfig.percent_fif_fund = Math.max(
          0,
          Math.min(1, 1 - parsedValue)
        )
      } else if (field === 'percent_fif_fund') {
        updatedConfig.percent_pie_fund = Math.max(
          0,
          Math.min(1, 1 - parsedValue)
        )
      }

      setLocalConfig(updatedConfig)
      onTaxConfigChange(updatedConfig)
    }
  }

  const jurisdictions = getAvailableJurisdictions()

  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Tax Configuration
      </h3>

      {/* Jurisdiction Dropdown */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tax Jurisdiction
        </label>
        <select
          value={localJurisdiction ?? ''}
          onChange={(e) => handleJurisdictionChange(e.target.value)}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          {jurisdictions.map((jur) => (
            <option key={jur.value ?? 'null'} value={jur.value ?? ''}>
              {jur.label}
            </option>
          ))}
        </select>
        {defaultJurisdiction && !taxJurisdiction && (
          <p className="mt-1 text-sm text-gray-500">
            Defaulting to {defaultJurisdiction.toUpperCase()} from adviser
            settings
          </p>
        )}
      </div>

      {/* Conditional Rendering Based on Jurisdiction */}
      {localJurisdiction === 'nz' && localConfig && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900">
            New Zealand Tax Settings
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PIR Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prescribed Investor Rate (PIR) (%)
              </label>
              <input
                type="text"
                value={formatTaxPercentage(
                  (localConfig as NewZealandTaxConfig).pir_rate
                )}
                onChange={(e) => handleNZConfigChange('pir_rate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="28.0"
              />
              <p className="mt-1 text-xs text-gray-500">
                Your Prescribed Investor Rate (typically 10.5%, 17.5%, 28%, or
                33%)
              </p>
            </div>

            {/* Marginal Tax Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marginal Tax Rate (%)
              </label>
              <input
                type="text"
                value={formatTaxPercentage(
                  (localConfig as NewZealandTaxConfig).marginal_tax_rate
                )}
                onChange={(e) =>
                  handleNZConfigChange('marginal_tax_rate', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="33.0"
              />
              <p className="mt-1 text-xs text-gray-500">
                Your marginal tax rate (typically 10.5%, 17.5%, 30%, or 33%)
              </p>
            </div>

            {/* PIE Fund Percentage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PIE Fund Allocation (%)
              </label>
              <input
                type="text"
                value={formatTaxPercentage(
                  (localConfig as NewZealandTaxConfig).percent_pie_fund
                )}
                onChange={(e) =>
                  handleNZConfigChange('percent_pie_fund', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="60.0"
              />
              <p className="mt-1 text-xs text-gray-500">
                Percentage of portfolio in PIE (Portfolio Investment Entity)
                funds
              </p>
            </div>

            {/* FIF Fund Percentage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                FIF Fund Allocation (%)
              </label>
              <input
                type="text"
                value={formatTaxPercentage(
                  (localConfig as NewZealandTaxConfig).percent_fif_fund
                )}
                onChange={(e) =>
                  handleNZConfigChange('percent_fif_fund', e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="40.0"
              />
              <p className="mt-1 text-xs text-gray-500">
                Percentage of portfolio in FIF (Foreign Investment Fund) funds
                (auto-calculated from PIE)
              </p>
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800 mb-1">
                Please fix the following errors:
              </p>
              <ul className="list-disc list-inside text-sm text-red-700">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {localJurisdiction === null && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">
            No tax will be applied to this portfolio. The simulation will run
            without tax calculations.
          </p>
        </div>
      )}
    </div>
  )
}

