// Portfolio Projection Chart component

'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { LineChart } from '@/components/charts'
import { ChartDataPoint, LineSeries } from '@/types/charts'
import { FinancialPlan } from '@/types/api'
import { SimulationResponse } from '@/types/api'
import { timestepToAge, TimestepUnit } from '@/lib/utils/timestep'

// Available percentiles from backend (1, 99, and every 5th percentile)
const AVAILABLE_PERCENTILES = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 99]

// Transform simulation results into chart data
// Uses precomputed statistics from backend (no calculations needed)
function transformSimulationResults(
  result: any,
  plan: FinancialPlan,
  percentile1: number,
  percentile2: number,
  useReal: boolean
): ChartDataPoint[] {
  if (!result) {
    console.log('[PortfolioProjectionChart] No simulation result provided')
    return []
  }

  // Get timestep_unit from result (required field from backend)
  const timestepUnit: TimestepUnit = result.timestep_unit || 'annual'

  // Access aggregated results
  const aggregated = result.aggregated
  if (!aggregated) {
    console.log('[PortfolioProjectionChart] No aggregated results found')
    return []
  }

  // Get the appropriate data (real or nominal) with precomputed statistics
  const data = useReal ? aggregated.real : aggregated.nominal
  if (!data) {
    console.log('[PortfolioProjectionChart] No data found for selected type')
    return []
  }

  // Get timesteps from aggregated
  const timesteps = aggregated.timesteps || []
  if (timesteps.length === 0) {
    console.log('[PortfolioProjectionChart] No timesteps found')
    return []
  }

  // Get precomputed statistics arrays
  const mean = data.mean || []
  const percentiles = data.percentiles || {}
  
  // Convert percentile numbers to string keys with ".0" suffix (e.g., 50 -> "50.0")
  const percentile1Key = `${percentile1}.0`
  const percentile2Key = `${percentile2}.0`
  const medianKey = '50.0'
  
  // Get percentile arrays (fallback to empty array if not available)
  const percentile1Array = percentiles[percentile1Key] || []
  const percentile2Array = percentiles[percentile2Key] || []
  const medianArray = percentiles[medianKey] || []

  console.log('[PortfolioProjectionChart] Using precomputed statistics:', {
    numTimesteps: timesteps.length,
    percentile1,
    percentile2,
    hasPercentile1: percentile1Array.length > 0,
    hasPercentile2: percentile2Array.length > 0,
    hasMedian: medianArray.length > 0,
  })

  // Map timesteps to chart data using precomputed statistics
  const chartData: ChartDataPoint[] = timesteps
    .map((timestep: number) => {
      // Convert timestep to age using the timestep_unit from the response
      const age = timestepToAge(timestep, plan.start_age, timestepUnit)

      // Direct access to precomputed values - no calculations!
      return {
        age: age,
        mean: mean[timestep] ?? 0,
        median: medianArray[timestep] ?? 0,
        percentile1: percentile1Array[timestep] ?? 0,
        percentile2: percentile2Array[timestep] ?? 0,
      }
    })
    .filter((point: ChartDataPoint) => {
      const pointAge = typeof point.age === 'number' ? point.age : Number(point.age)
      return pointAge <= plan.plan_end_age
    })

  console.log(
    '[PortfolioProjectionChart] Transformed chart data:',
    chartData.slice(0, 3),
    '... (showing first 3)'
  )
  return chartData
}

export interface PortfolioProjectionChartProps {
  plan: FinancialPlan | null | undefined
  simulationResponse: SimulationResponse | null | undefined
  isSimulating: boolean
  simulationError: Error | null
}

export function PortfolioProjectionChart({
  plan,
  simulationResponse,
  isSimulating,
  simulationError,
}: PortfolioProjectionChartProps) {
  // State for percentile inputs
  const [percentile1, setPercentile1] = useState<number>(25)
  const [percentile2, setPercentile2] = useState<number>(75)

  // State for nominal vs real (default to real)
  const [useReal, setUseReal] = useState<boolean>(true)

  // Tooltip formatter to show currency with 0 decimal places
  const tooltipFormatter = (value: any) => {
    const num =
      typeof value === 'number'
        ? value
        : value != null
        ? Number(value)
        : NaN
    if (!isFinite(num)) return ['', '']
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
    return [formatted, '']
  }

  // Transform simulation results into chart data
  const chartData = useMemo(() => {
    if (!plan) {
      console.log('[PortfolioProjectionChart] No plan provided')
      return []
    }
    if (!simulationResponse) {
      console.log('[PortfolioProjectionChart] No simulation response')
      return []
    }
    console.log('[PortfolioProjectionChart] Simulation response:', simulationResponse)
    if (!simulationResponse.result) {
      console.log('[PortfolioProjectionChart] No result in simulation response')
      return []
    }

    return transformSimulationResults(
      simulationResponse.result,
      plan,
      percentile1,
      percentile2,
      useReal
    )
  }, [plan, simulationResponse, percentile1, percentile2, useReal])

  // Chart line series configuration
  const chartLines: LineSeries[] = useMemo(
    () => [
      {
        key: 'mean',
        label: 'Mean',
        color: '#3b82f6', // Blue
        visible: true,
      },
      {
        key: 'median',
        label: 'Median',
        color: '#8b5cf6', // Purple
        visible: true,
      },
      {
        key: 'percentile1',
        label: `${percentile1}th Percentile`,
        color: '#10b981', // Green
        visible: true,
      },
      {
        key: 'percentile2',
        label: `${percentile2}th Percentile`,
        color: '#f59e0b', // Amber
        visible: true,
      },
    ],
    [percentile1, percentile2]
  )

  return (
    <Card>
      {isSimulating ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <Spinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-600">Running simulation...</p>
          </div>
        </div>
      ) : simulationError ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error running simulation</p>
            <p className="text-sm text-gray-600">
              {simulationError instanceof Error
                ? simulationError.message
                : 'Failed to load simulation results'}
            </p>
          </div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-gray-600">No simulation data available</p>
        </div>
      ) : (
        <div>
          <LineChart
            data={chartData}
            xAxisKey="age"
            lines={chartLines}
            title="Portfolio Projection"
            xAxisLabel="Age"
            yAxisLabel="Value ($)"
            height={400}
            useReal={useReal}
            onToggleNominalReal={() => setUseReal(!useReal)}
            showNominalRealToggle={true}
            showDots={false}
            tooltipFormatter={tooltipFormatter}
          />
          {/* Percentile Controls - Below Legend */}
          <div className="mt-8 flex flex-wrap gap-3 items-center justify-center">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600">Percentile 1:</label>
              <select
                value={percentile1.toString()}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10)
                  if (!isNaN(value) && AVAILABLE_PERCENTILES.includes(value)) {
                    setPercentile1(value)
                  }
                }}
                className="px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {AVAILABLE_PERCENTILES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600">Percentile 2:</label>
              <select
                value={percentile2.toString()}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10)
                  if (!isNaN(value) && AVAILABLE_PERCENTILES.includes(value)) {
                    setPercentile2(value)
                  }
                }}
                className="px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {AVAILABLE_PERCENTILES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

