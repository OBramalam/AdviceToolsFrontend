// Interactive glide path chart for portfolio asset allocation

'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from 'recharts'
import { Plus, Minus } from 'lucide-react'
import { clsx } from 'clsx'

export interface GlidePathPoint {
  step: number // Time step (year/age)
  stocks: number // Equity percentage (0-1)
}

export interface GlidePathChartProps {
  points: GlidePathPoint[]
  onPointsChange: (points: GlidePathPoint[]) => void
  cashAllocation: number // Constant cash % (0-1)
  planStartAge: number
  planEndAge: number
  height?: number
  allocationStep?: number // Optional step size for equity allocation (e.g., 0.10 for 10% steps)
}

export function GlidePathChart({
  points,
  onPointsChange,
  cashAllocation,
  planStartAge,
  planEndAge,
  height = 400,
  allocationStep,
}: GlidePathChartProps) {
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(
    null
  )
  const [isDragging, setIsDragging] = useState(false)
  const [dragPointIndex, setDragPointIndex] = useState<number | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  // Sort points by step, ensuring first point is always at step 0
  const sortedPoints = useMemo(() => {
    const sorted = [...points].sort((a, b) => a.step - b.step)
    // Ensure the first point is always at step 0
    if (sorted.length === 0) {
      return [{ step: 0, stocks: 0.7 }]
    }
    // If first point is not at step 0, fix it
    if (sorted[0].step !== 0) {
      sorted[0] = { ...sorted[0], step: 0 }
    }
    // Remove any duplicate points at step 0 (keep only the first one)
    const filtered = sorted.filter((p, index) => p.step !== 0 || index === 0)
    return filtered
  }, [points])

  // Convert to chart data format
  const chartData = sortedPoints.map((point) => ({
    step: planStartAge + point.step,
    stocks: point.stocks * 100, // Convert to percentage
    bonds: (1 - point.stocks - cashAllocation) * 100, // Inferred
    cash: cashAllocation * 100,
  }))

  // Handle adding a new point
  const handleAddPoint = useCallback(() => {
    if (sortedPoints.length === 0) {
      // Add first point at start age with default equity
      onPointsChange([
        { step: 0, stocks: 0.7 }, // 70% default equity
      ])
      setSelectedPointIndex(0)
      return
    }

    if (selectedPointIndex !== null) {
      // Add point after the selected point
      const selectedPoint = sortedPoints[selectedPointIndex]
      // If selected point is at step 0 (first point), add new point at step 1
      // Otherwise, add it 1 step after the selected point
      const newStep = selectedPoint.step === 0 
        ? 1 
        : Math.min(selectedPoint.step + 1, planEndAge - planStartAge)
      const newPoint: GlidePathPoint = {
        step: newStep,
        stocks: selectedPoint.stocks,
      }
      const newPoints = [...sortedPoints, newPoint]
      onPointsChange(newPoints)
      // Find the index of the newly added point after sorting (by step value, should be unique)
      const sortedNewPoints = [...newPoints].sort((a, b) => a.step - b.step)
      const newIndex = sortedNewPoints.findIndex(p => p.step === newStep)
      setSelectedPointIndex(newIndex >= 0 ? newIndex : sortedNewPoints.length - 1)
    } else {
      // Add point at the end
      const lastPoint = sortedPoints[sortedPoints.length - 1]
      const newStep = Math.min(lastPoint.step + 10, planEndAge - planStartAge) // Add 10 years after last point, or at end
      const newPoint: GlidePathPoint = {
        step: newStep,
        stocks: lastPoint.stocks,
      }
      const newPoints = [...sortedPoints, newPoint]
      onPointsChange(newPoints)
      // Find the index of the newly added point after sorting
      const sortedNewPoints = [...newPoints].sort((a, b) => a.step - b.step)
      const newIndex = sortedNewPoints.findIndex(p => p.step === newStep)
      setSelectedPointIndex(newIndex >= 0 ? newIndex : newPoints.length - 1)
    }
  }, [sortedPoints, selectedPointIndex, onPointsChange, planStartAge, planEndAge])

  // Handle deleting selected point
  const handleDeletePoint = useCallback(() => {
    // Prevent deleting the first point (it's fixed to starting age)
    if (
      selectedPointIndex !== null &&
      sortedPoints.length > 1 &&
      selectedPointIndex !== 0
    ) {
      const newPoints = sortedPoints.filter(
        (_, index) => index !== selectedPointIndex
      )
      onPointsChange(newPoints)
      setSelectedPointIndex(null)
    }
  }, [selectedPointIndex, sortedPoints, onPointsChange])

  // Handle point click (select point)
  const handlePointClick = useCallback(
    (index: number) => {
      setSelectedPointIndex(index === selectedPointIndex ? null : index)
    },
    [selectedPointIndex]
  )

  // Handle dragging
  const handleMouseDown = useCallback(
    (index: number, event: React.MouseEvent) => {
      event.stopPropagation()
      setIsDragging(true)
      setDragPointIndex(index)
      setSelectedPointIndex(index)
    },
    []
  )

  useEffect(() => {
    if (!isDragging || dragPointIndex === null || !chartRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!chartRef.current) return

      const rect = chartRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Approximate chart area (accounting for margins and labels)
      const marginLeft = 50
      const marginRight = 30
      const marginTop = 20
      const marginBottom = 40
      const chartWidth = rect.width - marginLeft - marginRight
      const chartHeight = rect.height - marginTop - marginBottom

      // Convert mouse position to chart coordinates
      const stepRange = planEndAge - planStartAge
      const relativeY = (y - marginTop) / chartHeight

      // Calculate new step (snap to integer)
      // First point (step 0) is fixed to step 0 (starting age) - check by step value, not index
      const draggedPoint = sortedPoints[dragPointIndex]
      const isFirstPoint = draggedPoint.step === 0
      const newStep = isFirstPoint
        ? 0
        : Math.round(Math.max(1, Math.min(stepRange, ((x - marginLeft) / chartWidth) * stepRange))) // Min 1 to prevent moving to step 0

      // Calculate new stocks percentage (invert Y, constrain to valid range)
      const maxStocks = 1 - cashAllocation
      const rawStocks = Math.max(0, Math.min(maxStocks, (1 - relativeY) * maxStocks))
      // Snap to nearest allocation step for equity (default 1% if not provided)
      const step = allocationStep && allocationStep > 0 ? allocationStep : 0.01
      const snappedStocks = Math.round(rawStocks / step) * step
      const newStocks = Math.max(0, Math.min(maxStocks, snappedStocks))

      // Update the point
      const newPoints = [...sortedPoints]
      newPoints[dragPointIndex] = {
        step: newStep,
        stocks: newStocks,
      }
      onPointsChange(newPoints)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setDragPointIndex(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [
    isDragging,
    dragPointIndex,
    sortedPoints,
    onPointsChange,
    planStartAge,
    planEndAge,
    cashAllocation,
    allocationStep,
  ])

  // Custom dot component for interactive points
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props
    const pointIndex = sortedPoints.findIndex(
      (p) => p.step === payload.step - planStartAge
    )
    const isSelected = pointIndex === selectedPointIndex
    const isDragging = dragPointIndex === pointIndex
    // Check if this is the first point by step value, not array index
    const point = sortedPoints[pointIndex]
    const isFirstPoint = point && point.step === 0

    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={isSelected ? 8 : 6}
          fill={isSelected ? '#3b82f6' : '#6b7280'}
          stroke={isSelected ? '#1e40af' : '#374151'}
          strokeWidth={isSelected ? 2 : 1}
          style={{
            cursor: isDragging
              ? isFirstPoint
                ? 'ns-resize'
                : 'grabbing'
              : isFirstPoint
              ? 'ns-resize'
              : 'grab',
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
            if (pointIndex !== -1) {
              handleMouseDown(pointIndex, e)
            }
          }}
          onClick={(e) => {
            e.stopPropagation()
            if (pointIndex !== -1 && !isDragging) {
              handlePointClick(pointIndex)
            }
          }}
        />
        {/* Visual indicator for fixed first point */}
        {isFirstPoint && (
          <circle
            cx={cx}
            cy={cy}
            r={isSelected ? 10 : 8}
            fill="none"
            stroke="#ef4444"
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.5}
          />
        )}
      </g>
    )
  }

  // Can only delete if there's more than one point AND it's not the first point (step 0)
  const canDelete =
    selectedPointIndex !== null &&
    sortedPoints.length > 1 &&
    sortedPoints[selectedPointIndex]?.step !== 0

  return (
    <div ref={chartRef} className="w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">Glide Path</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddPoint}
            className="flex items-center justify-center w-7 h-7 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            type="button"
            aria-label="Add control point"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeletePoint}
            disabled={!canDelete}
            className={clsx(
              'flex items-center justify-center w-7 h-7 rounded-md transition-colors',
              canDelete
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
            )}
            type="button"
            aria-label="Delete control point"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div style={{ width: '100%', height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="step"
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
                value: 'Equity Allocation (%)',
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
              formatter={(value: number | undefined, name: string | undefined) => {
                if (value === undefined || name === undefined) return ['', '']
                if (name === 'stocks') return [`${value.toFixed(1)}%`, 'Equity']
                if (name === 'bonds')
                  return [`${value.toFixed(1)}%`, 'Bonds (inferred)']
                if (name === 'cash')
                  return [`${value.toFixed(1)}%`, 'Cash (constant)']
                return [value, name]
              }}
            />
            <Line
              type="stepAfter"
              dataKey="stocks"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={false}
              name="Equity"
            />
            {/* Reference line for cash */}
            <Line
              type="monotone"
              dataKey="cash"
              stroke="#94a3b8"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name="Cash (constant)"
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>

      {/* Info display */}
      {selectedPointIndex !== null && (
        <div className="mt-2 text-sm text-gray-600">
          <p>
            Age: {planStartAge + sortedPoints[selectedPointIndex].step} | Equity:{' '}
            {(sortedPoints[selectedPointIndex].stocks * 100).toFixed(1)}% | Bonds:{' '}
            {((1 - sortedPoints[selectedPointIndex].stocks - cashAllocation) *
              100).toFixed(1)}
            % | Cash: {(cashAllocation * 100).toFixed(1)}%
          </p>
        </div>
      )}
      {selectedPointIndex === null && (
        <div className="mt-2 text-sm text-gray-500">
          <p>
            Bonds: {(1 - cashAllocation) * 100}% (inferred) | Cash:{' '}
            {cashAllocation * 100}% (constant)
          </p>
        </div>
      )}
    </div>
  )
}

