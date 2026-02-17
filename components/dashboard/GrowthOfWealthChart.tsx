// Growth of Wealth Chart component - Stacked area chart showing mean values of individual portfolios

'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { BaseChart, BaseChartProps } from '@/components/charts/BaseChart'
import { FinancialPlan, SimulationResponse, Portfolio } from '@/types/api'
import { usePortfolios } from '@/lib/hooks/usePortfolios'
import { timestepToAge, TimestepUnit } from '@/lib/utils/timestep'
import { clsx } from 'clsx'

// Color palette for portfolios
const PORTFOLIO_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#ec4899', // Pink
]

interface GrowthOfWealthChartProps {
  plan: FinancialPlan | null | undefined
  simulationResponse: SimulationResponse | null | undefined
  isSimulating: boolean
  simulationError: Error | null
  height?: number
  className?: string
}

export function GrowthOfWealthChart({
  plan,
  simulationResponse,
  isSimulating,
  simulationError,
  height = 400,
  className,
}: GrowthOfWealthChartProps) {
  // Default to real (inflation-adjusted) values
  const [useReal, setUseReal] = useState<boolean>(true)
  
  // Fetch portfolios to map IDs to names
  const { data: portfolios } = usePortfolios(plan?.id)
  
  // Create mapping from portfolio ID (as string) to portfolio name
  const portfolioIdToName = useMemo(() => {
    const map: Record<string, string> = {}
    if (portfolios) {
      portfolios.forEach((portfolio: Portfolio) => {
        if (portfolio.id !== undefined) {
          map[portfolio.id.toString()] = portfolio.name || `Portfolio ${portfolio.id}`
        }
      })
    }
    return map
  }, [portfolios])

  // Transform individual portfolio results into chart data
  const chartData = useMemo(() => {
    if (!plan) {
      return []
    }
    if (!simulationResponse?.result?.individual_portfolios) {
      return []
    }

    const individualPortfolios = simulationResponse.result.individual_portfolios
    const portfolioIds = Object.keys(individualPortfolios)

    if (portfolioIds.length === 0) {
      return []
    }

    // Get timestep_unit from result (required field from backend)
    const timestepUnit: TimestepUnit = simulationResponse.result.timestep_unit || 'annual'

    // Get timesteps from first portfolio (all should have same timesteps)
    const firstPortfolio = individualPortfolios[portfolioIds[0]]
    const timesteps = firstPortfolio.timesteps || []

    if (timesteps.length === 0) {
      return []
    }

    // Extract mean values for each portfolio, filtering by plan_end_age
    const data = timesteps
      .map((timestep: number) => {
        // Convert timestep to age using the timestep_unit from the response
        const age = timestepToAge(timestep, plan.start_age, timestepUnit)
        const dataPoint: Record<string, any> = {
          age: age,
        }

        // Add mean value for each portfolio
        portfolioIds.forEach((portfolioId) => {
          const portfolio = individualPortfolios[portfolioId]
          const portfolioData = useReal ? portfolio.real : portfolio.nominal
          
          // Get mean values
          const values = portfolioData?.mean || []

          if (values[timestep] !== undefined) {
            // Use portfolio name from mapping if available, otherwise use ID or default
            // Note: individual_portfolios keys are portfolio IDs from the simulation response
            const portfolioName = portfolioIdToName[portfolioId] || 
              (portfolioId === 'default' ? 'Portfolio' : `Portfolio ${portfolioId}`)
            dataPoint[portfolioName] = values[timestep]
          }
        })

        // Add aggregated mean value
        const aggregated = simulationResponse.result.aggregated
        if (aggregated) {
          const aggregatedData = useReal ? aggregated.real : aggregated.nominal
          const aggregatedValues = aggregatedData?.mean || []
          if (aggregatedValues[timestep] !== undefined) {
            dataPoint['Aggregated'] = aggregatedValues[timestep]
          }
        }

        return dataPoint
      })
      .filter((point: Record<string, any>) => point.age <= plan.plan_end_age)

    return data
  }, [plan, simulationResponse, useReal, portfolioIdToName])

  // Get portfolio names for legend (using the mapping)
  const portfolioNames = useMemo(() => {
    if (!simulationResponse?.result?.individual_portfolios) return []
    return Object.keys(simulationResponse.result.individual_portfolios).map(
      (id) => {
        // Use portfolio name from mapping if available, otherwise use ID or default
        return portfolioIdToName[id] || (id === 'default' ? 'Portfolio' : `Portfolio ${id}`)
      }
    )
  }, [simulationResponse, portfolioIdToName])

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

  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-gray-600">No portfolio data available</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <BaseChart
        title="Growth of Wealth"
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
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
              {portfolioNames.map((name, index) => {
                // Create a safe ID for the gradient (remove spaces and special chars)
                const gradientId = `colorPortfolio${index}`
                return (
                  <linearGradient
                    key={name}
                    id={gradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={PORTFOLIO_COLORS[index % PORTFOLIO_COLORS.length]}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={PORTFOLIO_COLORS[index % PORTFOLIO_COLORS.length]}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                )
              })}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="age"
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              label={{
                value: 'Age',
                position: 'insideBottom',
                offset: -10,
                style: { fill: '#6b7280', fontSize: 12 },
              }}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              label={{
                value: 'Value ($)',
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
                return [
                  new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(value),
                  '',
                ]
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '1rem' }}
              formatter={(value: string) => value}
            />
            {portfolioNames.map((name, index) => (
              <Area
                key={name}
                type="monotone"
                dataKey={name}
                stackId="1"
                stroke={PORTFOLIO_COLORS[index % PORTFOLIO_COLORS.length]}
                fill={`url(#colorPortfolio${index})`}
                strokeWidth={2}
              />
            ))}
            {/* Aggregated mean line - black line with no fill */}
            <Line
              type="monotone"
              dataKey="Aggregated"
              stroke="#000000"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              name="Aggregated"
            />
          </AreaChart>
        </ResponsiveContainer>
      </BaseChart>
    </Card>
  )
}

