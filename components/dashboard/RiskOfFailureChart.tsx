// Risk chart: failure probability or success likelihood (1 − P(failure)) over time

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
type RiskViewMode = 'failure' | 'success'

function chartTitle(viewMode: RiskViewMode): string {
  return viewMode === 'failure'
    ? 'Risk of Failure'
    : 'Likelihood of Success'
}

function yAxisLabelForView(viewMode: RiskViewMode): string {
  return viewMode === 'failure' ? 'Risk (%)' : 'Success (%)'
}

function lineSeriesLabel(metric: RiskMetric, viewMode: RiskViewMode): string {
  if (viewMode === 'failure') {
    return metric === 'destitution' ? 'Destitution risk' : 'Below target risk'
  }
  return metric === 'destitution'
    ? 'At or above $0'
    : 'At or above target'
}

function metricSubtitle(
  metric: RiskMetric,
  targetValue: number,
  viewMode: RiskViewMode
): string {
  if (metric === 'destitution') {
    if (viewMode === 'failure') {
      return 'Likelihood that total wealthh falls below $0.'
    }
    return 'Likelihood that total wealth stays at or above $0.'
  }
  const formattedTarget = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(targetValue)
  if (viewMode === 'failure') {
    return `Likelihood that total wealth falls below ${formattedTarget}.`
  }
  return `Likelihood that total wealth stays at or above ${formattedTarget}.`
}

function formatRiskTooltipPercentValue(value: unknown): string {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return String(value ?? '')
  const rounded = Math.round(n * 100) / 100
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rounded)
}

function riskTooltipFormatter(
  value: any,
  name: string | undefined,
  _props: any
) {
  return [`${formatRiskTooltipPercentValue(value)}%`, name ?? '']
}

function riskTooltipLabelFormatter(label: any) {
  const n = typeof label === 'number' ? label : Number(label)
  if (Number.isFinite(n)) {
    // Integer age in tooltip; x-axis uses fractional ages so hover updates each timestep
    return String(Math.floor(n))
  }
  return String(label ?? '')
}

// Transform selected risk metric data into chart data
function transformRiskData(
  result: any,
  plan: FinancialPlan,
  metric: RiskMetric,
  viewMode: RiskViewMode
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

  // Use fractional age on the x-axis so monthly (or sub-year) points are distinct.
  // Floored age would collapse ~12 months onto one x and break tooltips / hover.
  const data: ChartDataPoint[] = timesteps
    .map((timestep: number, index: number) => {
      const ageYears = timestepToAge(timestep, plan.start_age, timestepUnit)
      const pRaw = riskSeries[index] !== undefined ? riskSeries[index] : 0
      const p = Math.min(1, Math.max(0, Number(pRaw)))
      const displayPct =
        viewMode === 'failure' ? p * 100 : (1 - p) * 100

      return {
        age: ageYears,
        risk: displayPct,
      }
    })
    .filter(
      (point: ChartDataPoint) =>
        Math.floor(point.age as number) <= plan.plan_end_age
    )

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
  const [selectedMetric, setSelectedMetric] = useState<RiskMetric>('below_target')
  const [viewMode, setViewMode] = useState<RiskViewMode>('success')

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

    return transformRiskData(
      simulationResponse.result,
      plan,
      selectedMetric,
      viewMode
    )
  }, [plan, simulationResponse, selectedMetric, viewMode])

  // Chart line series configuration
  const chartLines: LineSeries[] = useMemo(
    () => [
      {
        key: 'risk',
        label: lineSeriesLabel(selectedMetric, viewMode),
        color: viewMode === 'failure' ? '#ef4444' : '#22c55e',
        visible: true,
      },
    ],
    [selectedMetric, viewMode]
  )

  const xAxisTicks = useMemo(() => {
    if (!plan) return undefined
    return buildYearTicks(plan.start_age, plan.plan_end_age)
  }, [plan])

  const xAxisTickFormatter = useMemo(
    () => (value: unknown) => {
      const n = typeof value === 'number' ? value : Number(value)
      if (!Number.isFinite(n)) return String(value ?? '')
      return String(Math.round(n))
    },
    []
  )

  if (isSimulating) {
    return (
      <Card className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Calculating risk and success likelihood...</p>
        </div>
      </Card>
    )
  }

  if (simulationError) {
    return (
      <Card className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading risk chart</p>
          <p className="text-sm text-gray-600">
            {simulationError instanceof Error
              ? simulationError.message
              : 'Failed to load risk chart'}
          </p>
        </div>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card className="flex items-center justify-center h-[400px]">
        <p className="text-gray-600">No risk data available</p>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <LineChart
        data={chartData}
        xAxisKey="age"
        lines={chartLines}
        title={chartTitle(viewMode)}
        subtitle={metricSubtitle(
          selectedMetric,
          plan?.portfolio_target_value ?? 0,
          viewMode
        )}
        xAxisLabel="Age"
        yAxisLabel={yAxisLabelForView(viewMode)}
        height={height}
        customControls={
          <div className="flex flex-wrap items-center gap-2">
            <button
              data-export-hide="true"
              onClick={() =>
                setViewMode((current) =>
                  current === 'failure' ? 'success' : 'failure'
                )
              }
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                'text-gray-700 bg-gray-50'
              )}
              type="button"
              aria-label="Toggle failure or success view"
            >
              <span>{viewMode === 'failure' ? 'Failure' : 'Success'}</span>
            </button>
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
              aria-label="Toggle destitution or below target metric"
            >
              <span>
                {selectedMetric === 'destitution'
                  ? 'Destitution'
                  : 'Below target'}
              </span>
            </button>
          </div>
        }
        showGridlines={true}
        enableGridlineToggle={true}
        showLegend={false}
        showDots={false}
        xAxisTicks={xAxisTicks}
        xAxisType="number"
        xAxisTickFormatter={xAxisTickFormatter}
        tooltipFormatter={riskTooltipFormatter}
        tooltipLabelFormatter={riskTooltipLabelFormatter}
      />
    </Card>
  )
}

