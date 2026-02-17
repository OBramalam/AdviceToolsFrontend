// Base Chart component - provides common chart functionality

import { ReactNode } from 'react'
import { clsx } from 'clsx'

export interface BaseChartProps {
  children: ReactNode
  title?: string
  className?: string
  height?: number
  margin?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
}

const DEFAULT_MARGIN = {
  top: 20,
  right: 30,
  left: 20,
  bottom: 20,
}

export function BaseChart({
  children,
  title,
  className,
  height = 400,
  margin = DEFAULT_MARGIN,
}: BaseChartProps) {
  const chartMargin = {
    top: margin.top ?? DEFAULT_MARGIN.top,
    right: margin.right ?? DEFAULT_MARGIN.right,
    left: margin.left ?? DEFAULT_MARGIN.left,
    bottom: margin.bottom ?? DEFAULT_MARGIN.bottom,
  }

  return (
    <div className={clsx('w-full', className)}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div style={{ width: '100%', height: `${height}px` }}>
        {children}
      </div>
    </div>
  )
}

