// Formatting utility functions

import { format, parseISO } from 'date-fns'

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format a date string to a readable format
 */
export function formatDate(
  dateString: string,
  formatString: string = 'MMM dd, yyyy'
): string {
  try {
    const date = parseISO(dateString)
    return format(date, formatString)
  } catch (error) {
    return dateString
  }
}

/**
 * Format a number with commas
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format a decimal annual growth rate (e.g. 0.05) for UI as a percentage, max 2 decimal places.
 * Avoids long floating-point strings from binary arithmetic.
 */
export function formatGrowthRatePercentDisplay(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return ''
  const pct = Math.round(value * 100 * 100) / 100
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(pct)
}

/**
 * Parse a percentage string from the UI (e.g. "5" or "3.25") to API decimal (e.g. 0.05).
 */
export function parseGrowthRatePercentInput(raw: string): number | null {
  if (raw.trim() === '') return null
  const parsed = Number(raw)
  if (Number.isNaN(parsed)) return null
  return parsed / 100
}

