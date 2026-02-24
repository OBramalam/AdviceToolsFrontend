// Risk of Failure Chart component - Line chart showing probability of failure over time

'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { LineChart } from '@/components/charts'
import { ChartDataPoint, LineSeries } from '@/types/charts'
import { FinancialPlan, SimulationResponse } from '@/types/api'
import { timestepToAge, TimestepUnit } from '@/lib/utils/timestep'

export interface RiskOfFailureChartProps {
  plan: FinancialPlan | null | undefined
  simulationResponse: SimulationResponse | null | undefined
  isSimulating: boolean
  simulationError: Error | null
  height?: number
  className?: string
}

// Transform destitution data into chart data
function transformDestitutionData(
  result: any,
  plan: FinancialPlan
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

  // Get destitution array and timesteps
  const destitution = aggregated.destitution
  const timesteps = aggregated.timesteps || []

  if (!destitution || !Array.isArray(destitution)) {
    console.log('[RiskOfFailureChart] No destitution data found')
    return []
  }

  if (timesteps.length === 0) {
    console.log('[RiskOfFailureChart] No timesteps found')
    return []
  }

  if (destitution.length !== timesteps.length) {
    console.warn(
      '[RiskOfFailureChart] Destitution and timesteps arrays have different lengths',
      { destitutionLength: destitution.length, timestepsLength: timesteps.length }
    )
  }

  // Transform to chart data format, filtering by plan_end_age
  const data: ChartDataPoint[] = timesteps
    .map((timestep: number, index: number) => {
      // Convert timestep to age using the timestep_unit from the response
      const age = timestepToAge(timestep, plan.start_age, timestepUnit)
      const risk = destitution[index] !== undefined ? destitution[index] : 0

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
  // Transform destitution data into chart data
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

    return transformDestitutionData(simulationResponse.result, plan)
  }, [plan, simulationResponse])

  // Chart line series configuration
  const chartLines: LineSeries[] = useMemo(
    () => [
      {
        key: 'risk',
        label: 'Risk of Failure',
        color: '#ef4444', // Red for risk
        visible: true,
      },
    ],
    []
  )

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
        xAxisLabel="Age"
        yAxisLabel="Risk (%)"
        height={height}
        showGridlines={true}
        enableGridlineToggle={true}
        showDots={false}
      />
    </Card>
  )
}

