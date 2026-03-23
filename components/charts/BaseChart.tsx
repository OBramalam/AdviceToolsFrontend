// Base Chart component - provides common chart functionality

import { ReactNode } from 'react'
import { clsx } from 'clsx'

export interface BaseChartProps {
  children: ReactNode
  title?: string
  subtitle?: string
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
  subtitle,
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
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
      )}
      <div style={{ width: '100%', height: `${height}px` }}>
        {children}
      </div>
    </div>
  )
}

