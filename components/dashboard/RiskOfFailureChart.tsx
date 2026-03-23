// Risk of Failure Chart component - Line chart showing probability of failure over time

'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { LineChart } from '@/components/charts'
import { ChartDataPoint, LineSeries } from '@/types/charts'
import { FinancialPlan, SimulationResponse } from '@/types/api'
import { timestepToAge, TimestepUnit } from '@/lib/utils/timestep'
import { buildYearTicks } from '@/lib/utils/chartAxis'
import { clsx } from 'clsx'

export interface RiskOfFailureChartProps {
  plan: FinancialPlan | null | undefined
  simulationResponse: SimulationResponse | null | undefined
  isSimulating: boolean
  simulationError: Error | null
  height?: number
  className?: string
}

type RiskMetric = 'destitution' | 'below_target'

function metricLabel(metric: RiskMetric): string {
  return metric === 'destitution' ? 'Destitution Risk' : 'Plan Failure Risk'
}

function metricSubtitle(metric: RiskMetric, targetValue: number): string {
  if (metric === 'destitution') {
    return 'Likelihood that portfolio value falls below $0.'
  }
  const formattedTarget = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(targetValue)
  return `Likelihood that portfolio value falls below ${formattedTarget}.`
}

// Transform selected risk metric data into chart data
function transformRiskData(
  result: any,
  plan: FinancialPlan,
  metric: RiskMetric
): ChartDataPoint[] {
  if (!result) {
    console.log('[RiskOfFailureChart] No simulation result provided')
    return []
  }

  // Get timestep_unit from result (required field from backend)
  const timestepUnit: TimestepUnit = result.timestep_unit || 'annual'

  // Access aggregated results
  const aggregated = result.aggregated
  if (!aggregated) {
    console.log('[RiskOfFailureChart] No aggregated results found')
    return []
  }

  // Get selected risk array and timesteps
  const riskSeries = metric === 'destitution'
    ? aggregated.destitution
    : aggregated.below_target
  const timesteps = aggregated.timesteps || []

  if (!riskSeries || !Array.isArray(riskSeries)) {
    console.log(`[RiskOfFailureChart] No ${metric} data found`)
    return []
  }

  if (timesteps.length === 0) {
    console.log('[RiskOfFailureChart] No timesteps found')
    return []
  }

  if (riskSeries.length !== timesteps.length) {
    console.warn(
      `[RiskOfFailureChart] ${metric} and timesteps arrays have different lengths`,
      { riskLength: riskSeries.length, timestepsLength: timesteps.length }
    )
  }

  // Transform to chart data format, filtering by plan_end_age
  const data: ChartDataPoint[] = timesteps
    .map((timestep: number, index: number) => {
      // Convert timestep to age using the timestep_unit from the response
      const age = Math.floor(
        timestepToAge(timestep, plan.start_age, timestepUnit)
      )
      const risk = riskSeries[index] !== undefined ? riskSeries[index] : 0

      return {
        age: age,
        risk: risk * 100, // Convert to percentage for display
      }
    })
    .filter((point: ChartDataPoint) => (point.age as number) <= plan.plan_end_age)

  console.log('[RiskOfFailureChart] Transformed chart data:', data.slice(0, 3), '... (showing first 3)')
  return data
}

export function RiskOfFailureChart({
  plan,
  simulationResponse,
  isSimulating,
  simulationError,
  height = 400,
  className,
}: RiskOfFailureChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<RiskMetric>('destitution')

  // Transform selected risk metric data into chart data
  const chartData = useMemo(() => {
    if (!plan) {
      console.log('[RiskOfFailureChart] No plan provided')
      return []
    }
    if (!simulationResponse) {
      console.log('[RiskOfFailureChart] No simulation response')
      return []
    }
    if (!simulationResponse.result) {
      console.log('[RiskOfFailureChart] No result in simulation response')
      return []
    }

    return transformRiskData(simulationResponse.result, plan, selectedMetric)
  }, [plan, simulationResponse, selectedMetric])

  // Chart line series configuration
  const chartLines: LineSeries[] = useMemo(
    () => [
      {
        key: 'risk',
        label: metricLabel(selectedMetric),
        color: '#ef4444', // Red for risk
        visible: true,
      },
    ],
    [selectedMetric]
  )

  const xAxisTicks = useMemo(() => {
    if (!plan) return undefined
    return buildYearTicks(plan.start_age, plan.plan_end_age)
  }, [plan])

  if (isSimulating) {
    return (
      <Card className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Calculating risk of failure...</p>
        </div>
      </Card>
    )
  }

  if (simulationError) {
    return (
      <Card className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading risk of failure</p>
          <p className="text-sm text-gray-600">
            {simulationError instanceof Error
              ? simulationError.message
              : 'Failed to load risk of failure chart'}
          </p>
        </div>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card className="flex items-center justify-center h-[400px]">
        <p className="text-gray-600">No risk of failure data available</p>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <LineChart
        data={chartData}
        xAxisKey="age"
        lines={chartLines}
        title="Risk of Failure"
        subtitle={metricSubtitle(selectedMetric, plan?.portfolio_target_value ?? 0)}
        xAxisLabel="Age"
        yAxisLabel="Risk (%)"
        height={height}
        customControls={
          <button
            data-export-hide="true"
            onClick={() =>
              setSelectedMetric((current) =>
                current === 'destitution' ? 'below_target' : 'destitution'
              )
            }
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              'text-gray-700 bg-gray-50'
            )}
            type="button"
            aria-label="Toggle risk metric"
          >
            <span>
              {selectedMetric === 'destitution'
                ? 'Destitution'
                : 'Below target'}
            </span>
          </button>
        }
        showGridlines={true}
        enableGridlineToggle={true}
        showLegend={false}
        showDots={false}
        xAxisTicks={xAxisTicks}
      />
    </Card>
  )
}

