// Base Table component for consistent table styling with resizable columns

'use client'

import { ReactNode, useState, useRef, useCallback, useEffect } from 'react'
import { clsx } from 'clsx'

export interface BaseTableProps {
  title?: string
  headers: string[]
  children: ReactNode
  className?: string
  initialColumnWidths?: (number | undefined)[] // Optional default widths per column (in px)
}

export function BaseTable({
  title,
  headers,
  children,
  className,
  initialColumnWidths,
}: BaseTableProps) {
  const [columnWidths, setColumnWidths] = useState<number[]>([])
  const [isResizing, setIsResizing] = useState<number | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)
  const tableRef = useRef<HTMLTableElement>(null)

  // Initialize column widths on mount (equal distribution or provided defaults)
  useEffect(() => {
    if (columnWidths.length !== headers.length && headers.length > 0) {
      if (initialColumnWidths && initialColumnWidths.length === headers.length) {
        // Use provided initial widths where specified, fallback to a sensible default
        const fallback =
          typeof window !== 'undefined'
            ? Math.max(100, (window.innerWidth * 0.8) / headers.length)
            : 150
        setColumnWidths(
          initialColumnWidths.map((w) => (w && w > 0 ? w : fallback))
        )
      } else {
        // Calculate default width based on viewport or use fixed default
        const defaultWidth =
          typeof window !== 'undefined'
            ? Math.max(100, (window.innerWidth * 0.8) / headers.length)
            : 150
        setColumnWidths(new Array(headers.length).fill(defaultWidth))
      }
    }
  }, [headers.length, columnWidths.length, initialColumnWidths])

  const handleMouseDown = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.preventDefault()
      setIsResizing(index)
      setStartX(e.clientX)
      if (columnWidths[index] > 0) {
        setStartWidth(columnWidths[index])
      } else if (tableRef.current) {
        const th = tableRef.current.querySelectorAll('th')[index]
        setStartWidth(th?.offsetWidth || 100)
      }
    },
    [columnWidths]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isResizing === null) return

      const diff = e.clientX - startX
      const newWidth = Math.max(50, startWidth + diff) // Minimum width of 50px

      setColumnWidths((prev) => {
        const updated = [...prev]
        updated[isResizing] = newWidth
        return updated
      })
    },
    [isResizing, startX, startWidth]
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(null)
  }, [])

  useEffect(() => {
    if (isResizing !== null) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  return (
    <div className={clsx('w-full', className)}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div className="overflow-x-auto">
        <table ref={tableRef} className="w-full border-collapse table-fixed">
          <thead>
            <tr className="border-b border-gray-200">
              {headers.map((header, index) => (
                <th
                  key={index}
                  style={{
                    width: columnWidths[index] > 0 ? `${columnWidths[index]}px` : 'auto',
                    position: 'relative',
                  }}
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-50"
                >
                  {header}
                  {index < headers.length - 1 && (
                    <div
                      onMouseDown={(e) => handleMouseDown(index, e)}
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 bg-transparent z-10"
                      style={{ touchAction: 'none' }}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  )
}
