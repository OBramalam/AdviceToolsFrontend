// Line Chart component with multiple lines, toggleable legend, and customizable colors

'use client'

import { useState, useMemo } from 'react'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Grid3x3 } from 'lucide-react'
import { BaseChart, BaseChartProps } from './BaseChart'
import { ChartDataPoint, LineSeries } from '@/types/charts'
import { clsx } from 'clsx'

export interface LineChartProps extends Omit<BaseChartProps, 'children'> {
  data: ChartDataPoint[]
  xAxisKey: string // Key in data for x-axis
  lines: LineSeries[] // Array of line series to plot
  showGridlines?: boolean // Initial state for gridlines (default: true)
  enableGridlineToggle?: boolean // Whether to show UI control for gridlines (default: true)
  xAxisLabel?: string
  yAxisLabel?: string
  // Nominal/Real toggle
  useReal?: boolean
  onToggleNominalReal?: () => void
  showNominalRealToggle?: boolean
  showDots?: boolean // Whether to show dots on the line (default: true)
  // Optional custom tooltip formatter (Recharts Tooltip formatter signature)
  tooltipFormatter?: (value: any, name: string | undefined, props: any) => any
}

export function LineChart({
  data,
  xAxisKey,
  lines,
  showGridlines: initialShowGridlines = true,
  enableGridlineToggle = true,
  xAxisLabel,
  yAxisLabel,
  title,
  className,
  height = 400,
  margin,
  useReal = false,
  onToggleNominalReal,
  showNominalRealToggle = false,
  showDots = true,
  tooltipFormatter,
}: LineChartProps) {
  // Track gridline visibility
  const [showGridlines, setShowGridlines] = useState(initialShowGridlines)

  // Track which lines are visible
  const [visibleLines, setVisibleLines] = useState<Set<string>>(() => {
    // Initialize with lines that have visible: true or undefined (default visible)
    return new Set(
      lines
        .filter((line) => line.visible !== false)
        .map((line) => line.key)
    )
  })

  // Toggle line visibility
  const toggleLine = (lineKey: string) => {
    setVisibleLines((prev) => {
      const next = new Set(prev)
      if (next.has(lineKey)) {
        next.delete(lineKey)
      } else {
        next.add(lineKey)
      }
      return next
    })
  }

  // Filter lines to only include visible ones
  const visibleLineSeries = useMemo(
    () => lines.filter((line) => visibleLines.has(line.key)),
    [lines, visibleLines]
  )

  // Custom legend click handler
  const handleLegendClick = (e: any) => {
    const lineKey = e.dataKey
    if (lineKey) {
      toggleLine(lineKey)
    }
  }

  // Custom legend formatter to show/hide indicator
  const renderLegend = (props: any) => {
    const { payload } = props
    return (
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        {payload.map((entry: any) => {
          const isVisible = visibleLines.has(entry.dataKey)
          return (
            <button
              key={entry.dataKey}
              onClick={() => toggleLine(entry.dataKey)}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors',
                'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                !isVisible && 'opacity-50'
              )}
              type="button"
            >
              <div
                className="w-4 h-4 rounded-sm"
                style={{
                  backgroundColor: isVisible ? entry.color : 'transparent',
                  border: `2px solid ${entry.color}`,
                }}
              />
              <span className="text-sm font-medium text-gray-700">
                {entry.value}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <BaseChart title={title} className={className} height={height} margin={margin}>
      {/* Chart Controls */}
      {(enableGridlineToggle || showNominalRealToggle) && (
        <div className="flex justify-end gap-2 mb-2">
          {showNominalRealToggle && onToggleNominalReal && (
            <button
              onClick={onToggleNominalReal}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                useReal
                  ? 'text-gray-700 bg-gray-50'
                  : 'text-gray-700 bg-gray-50'
              )}
              type="button"
              aria-label={useReal ? 'Switch to nominal' : 'Switch to real'}
            >
              <span>{useReal ? 'Real' : 'Nominal'}</span>
            </button>
          )}
          {enableGridlineToggle && (
            <button
              onClick={() => setShowGridlines(!showGridlines)}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                showGridlines
                  ? 'text-gray-700 bg-gray-50'
                  : 'text-gray-500 bg-white'
              )}
              type="button"
              aria-label={showGridlines ? 'Hide gridlines' : 'Show gridlines'}
            >
              <Grid3x3 className="w-4 h-4" />
              <span>Gridlines</span>
            </button>
          )}
        </div>
      )}

      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{
            top: margin?.top ?? 20,
            right: margin?.right ?? 30,
            left: margin?.left ?? 20,
            bottom: margin?.bottom ?? 20,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            opacity={showGridlines ? 1 : 0}
          />
          <XAxis
            dataKey={xAxisKey}
            stroke="#6b7280"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            label={
              xAxisLabel
                ? {
                    value: xAxisLabel,
                    position: 'insideBottom',
                    offset: -10,
                    style: { fill: '#6b7280', fontSize: 12 },
                  }
                : undefined
            }
          />
          <YAxis
            stroke="#6b7280"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            label={
              yAxisLabel
                ? {
                    value: yAxisLabel,
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: '#6b7280', fontSize: 12 },
                  }
                : undefined
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '0.5rem',
            }}
            labelStyle={{ color: '#374151', fontWeight: 600 }}
            formatter={tooltipFormatter}
          />
          <Legend
            content={renderLegend}
            wrapperStyle={{ paddingTop: '1rem' }}
          />
          {visibleLineSeries.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color}
              strokeWidth={2}
              dot={showDots ? { r: 4 } : false}
              activeDot={showDots ? { r: 6 } : false}
              name={line.label}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </BaseChart>
  )
}

