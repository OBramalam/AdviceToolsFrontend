// Tax configuration utility functions

import type { TaxConfig, NewZealandTaxConfig } from '@/types/api'

/**
 * Get default tax config for a jurisdiction
 */
export function getDefaultTaxConfig(jurisdiction: string): TaxConfig | null {
  switch (jurisdiction) {
    case 'nz':
      return {
        jurisdiction: 'nz',
        pir_rate: 0.28, // 28% default PIR
        marginal_tax_rate: 0.33, // 33% default marginal rate
        percent_pie_fund: 0.6, // 60% default PIE
        percent_fif_fund: 0.4, // 40% default FIF
      }
    default:
      return null
  }
}

/**
 * Validate tax config
 */
export function validateTaxConfig(
  config: TaxConfig | null | undefined,
  jurisdiction: string | null | undefined
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!jurisdiction || !config) {
    return { valid: true, errors: [] } // No tax is valid
  }

  if (config.jurisdiction !== jurisdiction) {
    errors.push('Tax config jurisdiction does not match selected jurisdiction')
    return { valid: false, errors }
  }

  switch (jurisdiction) {
    case 'nz': {
      const nzConfig = config as NewZealandTaxConfig

      // Validate PIR rate
      if (nzConfig.pir_rate < 0 || nzConfig.pir_rate > 1) {
        errors.push('PIR rate must be between 0% and 100%')
      }

      // Validate marginal tax rate
      if (nzConfig.marginal_tax_rate < 0 || nzConfig.marginal_tax_rate > 1) {
        errors.push('Marginal tax rate must be between 0% and 100%')
      }

      // Validate PIE fund percentage
      if (nzConfig.percent_pie_fund < 0 || nzConfig.percent_pie_fund > 1) {
        errors.push('PIE fund percentage must be between 0% and 100%')
      }

      // Validate FIF fund percentage
      if (nzConfig.percent_fif_fund < 0 || nzConfig.percent_fif_fund > 1) {
        errors.push('FIF fund percentage must be between 0% and 100%')
      }

      // Validate that PIE + FIF = 1.0 (within tolerance)
      const sum = nzConfig.percent_pie_fund + nzConfig.percent_fif_fund
      if (Math.abs(sum - 1.0) > 0.01) {
        errors.push(
          `PIE fund and FIF fund percentages must sum to 100% (currently ${(sum * 100).toFixed(1)}%)`
        )
      }

      break
    }
    default:
      errors.push(`Unsupported jurisdiction: ${jurisdiction}`)
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Get available jurisdictions
 */
export function getAvailableJurisdictions(): Array<{
  value: string | null
  label: string
}> {
  return [
    { value: null, label: 'None (No Tax)' },
    { value: 'nz', label: 'New Zealand' },
    // Future jurisdictions will be added here
  ]
}

/**
 * Format percentage for display (0.28 -> "28")
 */
export function formatTaxPercentage(value: number): string {
  return (value * 100).toFixed(1)
}

/**
 * Parse percentage from input ("28" -> 0.28)
 */
export function parseTaxPercentage(value: string): number {
  const parsed = parseFloat(value)
  if (isNaN(parsed)) return 0
  return Math.max(0, Math.min(1, parsed / 100))
}



