// Final Wealth Distribution Chart component - Histogram showing distribution of final wealth outcomes

'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { BaseChart, BaseChartProps } from '@/components/charts/BaseChart'
import { FinancialPlan, SimulationResponse } from '@/types/api'
import { clsx } from 'clsx'

export interface FinalWealthDistributionChartProps {
  plan: FinancialPlan | null | undefined
  simulationResponse: SimulationResponse | null | undefined
  isSimulating: boolean
  simulationError: Error | null
  height?: number
  className?: string
}

// Create histogram bins from final wealth values
function createHistogramBins(
  values: number[],
  numBins: number = 50
): Array<{ range: string; count: number; min: number; max: number }> {
  if (values.length === 0) {
    return []
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const binWidth = (max - min) / numBins

  // Initialize bins
  const bins: Array<{ min: number; max: number; count: number }> = []
  for (let i = 0; i < numBins; i++) {
    bins.push({
      min: min + i * binWidth,
      max: min + (i + 1) * binWidth,
      count: 0,
    })
  }

  // Count values in each bin
  values.forEach((value) => {
    // Find which bin this value belongs to
    let binIndex = Math.floor((value - min) / binWidth)
    // Handle edge case where value equals max
    if (binIndex >= numBins) {
      binIndex = numBins - 1
    }
    bins[binIndex].count++
  })

  // Format bins for display - use midpoint for label
  return bins.map((bin) => {
    const midpoint = (bin.min + bin.max) / 2
    return {
      range: formatCurrency(midpoint, 'USD', 'en-US'),
      count: bin.count,
      min: bin.min,
      max: bin.max,
    }
  })
}

// Format currency helper
function formatCurrency(value: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function FinalWealthDistributionChart({
  plan,
  simulationResponse,
  isSimulating,
  simulationError,
  height = 400,
  className,
}: FinalWealthDistributionChartProps) {
  // Default to real (inflation-adjusted) values
  const [useReal, setUseReal] = useState<boolean>(true)

  // Extract final wealth values and create histogram
  const histogramData = useMemo(() => {
    if (!simulationResponse?.result?.aggregated) {
      return []
    }

    const aggregated = simulationResponse.result.aggregated
    const simulationData = useReal
      ? aggregated.real?.simulation_data
      : aggregated.nominal?.simulation_data

    if (!simulationData || !Array.isArray(simulationData) || simulationData.length === 0) {
      return []
    }

    // Get the final timestep index (last column)
    const firstSimulation = simulationData[0]
    if (!firstSimulation || !Array.isArray(firstSimulation) || firstSimulation.length === 0) {
      return []
    }

    const finalTimestepIndex = firstSimulation.length - 1

    // Extract final wealth values from all simulations
    const finalWealthValues = simulationData
      .map((simulation: number[]) => {
        if (Array.isArray(simulation) && simulation[finalTimestepIndex] !== undefined) {
          return simulation[finalTimestepIndex]
        }
        return null
      })
      .filter((value: number | null): value is number => value !== null)

    if (finalWealthValues.length === 0) {
      return []
    }

    // Clip extreme outliers by excluding the top 1% of final wealth outcomes
    // This improves interpretability of the histogram without affecting other charts
    const sortedValues = [...finalWealthValues].sort((a, b) => a - b)
    const n = sortedValues.length
    const cutoffIndex = Math.floor(n * 0.99) - 1
    const cutoffValue =
      cutoffIndex >= 0 ? sortedValues[cutoffIndex] : sortedValues[n - 1]

    const clippedValues = finalWealthValues.filter(
      (v) => v <= cutoffValue
    )

    if (clippedValues.length === 0) {
      return []
    }

    // Create histogram bins (use 50 bins by default, but adjust if needed)
    const numBins = Math.min(
      50,
      Math.max(10, Math.floor(Math.sqrt(clippedValues.length)))
    )
    return createHistogramBins(clippedValues, numBins)
  }, [simulationResponse, useReal])

  if (isSimulating) {
    return (
      <Card className={className}>
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <Spinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-600">Loading chart data...</p>
          </div>
        </div>
      </Card>
    )
  }

  if (simulationError) {
    return (
      <Card className={className}>
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading chart data</p>
            <p className="text-sm text-gray-600">
              {simulationError instanceof Error
                ? simulationError.message
                : 'Failed to load simulation results'}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  if (histogramData.length === 0) {
    return (
      <Card className={className}>
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-gray-600">No distribution data available</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <BaseChart
        title="Final Wealth Distribution"
        className={className}
        height={height}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        {/* Nominal/Real Toggle */}
        <div className="flex justify-end gap-2 mb-2">
          <button
            onClick={() => setUseReal(!useReal)}
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              useReal
                ? 'text-gray-700 bg-gray-50'
                : 'text-gray-500 bg-white'
            )}
            type="button"
            aria-label={useReal ? 'Switch to nominal' : 'Switch to real'}
          >
            <span>{useReal ? 'Real' : 'Nominal'}</span>
          </button>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={histogramData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="range"
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={80}
              interval="preserveStartEnd"
              label={{
                value: 'Final Wealth',
                position: 'insideBottom',
                offset: -5,
                style: { fill: '#6b7280', fontSize: 12 },
              }}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              label={{
                value: 'Number of Simulations',
                angle: -90,
                position: 'insideLeft',
                style: { fill: '#6b7280', fontSize: 12 },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '0.5rem',
              }}
              labelStyle={{ color: '#374151', fontWeight: 600 }}
              formatter={(value: number | undefined) => {
                if (value === undefined) return ['', '']
                return [value, 'Count']
              }}
            />
            <Bar
              dataKey="count"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </BaseChart>
    </Card>
  )
}

