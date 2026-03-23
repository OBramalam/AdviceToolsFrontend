// Chart Carousel component - Displays multiple charts with navigation

'use client'

import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Play } from 'lucide-react'
import { SimulationPercentilesChart } from './SimulationPercentilesChart'
import { GrowthOfWealthChart } from './GrowthOfWealthChart'
import { RiskOfFailureChart } from './RiskOfFailureChart'
// import { FinalWealthDistributionChart } from './FinalWealthDistributionChart'
import { SimulationPercentilesChartProps } from './SimulationPercentilesChart'
import { clsx } from 'clsx'
import { exportElementAsPng } from '@/lib/utils/chartExport'

export interface ChartCarouselProps {
  plan: SimulationPercentilesChartProps['plan']
  simulationResponse: SimulationPercentilesChartProps['simulationResponse']
  isSimulating: SimulationPercentilesChartProps['isSimulating']
  simulationError: SimulationPercentilesChartProps['simulationError']
  onRunSimulation?: () => void
}

type ChartType = 'projection' | 'growth' | 'destitution'

const CHARTS: Array<{ id: ChartType; name: string }> = [
  { id: 'projection', name: 'Simulation Percentiles' },
  { id: 'growth', name: 'Growth of Wealth' },
  { id: 'destitution', name: 'Risk of Failure' },
]

export function ChartCarousel({
  plan,
  simulationResponse,
  isSimulating,
  simulationError,
  onRunSimulation,
}: ChartCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [isExporting, setIsExporting] = useState(false)
  const chartContainerRef = useRef<HTMLDivElement>(null)

  const currentChart = CHARTS[currentIndex]

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? CHARTS.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === CHARTS.length - 1 ? 0 : prev + 1))
  }

  const goToChart = (index: number) => {
    setCurrentIndex(index)
  }

  const handleExport = async () => {
    if (!chartContainerRef.current) return
    setIsExporting(true)
    try {
      const baseName = plan?.name
        ? `${plan.name}-${currentChart.name}`
        : currentChart.name
      await exportElementAsPng(chartContainerRef.current, baseName)
    } catch (error) {
      console.error('Failed to export chart image:', error)
      alert('Failed to export chart image. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="relative">
      {/* Navigation Arrows */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 -translate-x-4">
        <button
          onClick={goToPrevious}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Previous chart"
          type="button"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 translate-x-4">
        <button
          onClick={goToNext}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Next chart"
          type="button"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Run Simulation Button */}
      <div className="flex justify-end gap-2 mb-4">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            isExporting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gray-700 text-white hover:bg-gray-800'
          )}
          type="button"
          aria-label="Export chart as image"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Exporting...' : 'Export image'}</span>
        </button>
        {onRunSimulation && plan?.id && (
          <button
            onClick={onRunSimulation}
            disabled={isSimulating}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              isSimulating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            )}
            type="button"
            aria-label="Run simulation"
          >
            <Play className="w-4 h-4" />
            <span>{isSimulating ? 'Running...' : 'Run Simulation'}</span>
          </button>
        )}
      </div>

      {/* Chart Indicators */}
      <div className="flex justify-center gap-2 mb-2">
        {CHARTS.map((chart, index) => (
          <button
            key={chart.id}
            onClick={() => goToChart(index)}
            className={clsx(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              index === currentIndex
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
            type="button"
            aria-label={`Switch to ${chart.name}`}
          >
            {chart.name}
          </button>
        ))}
      </div>

      {/* Chart Container */}
      <div ref={chartContainerRef} className="relative">
        {currentChart.id === 'projection' && (
          <SimulationPercentilesChart
            plan={plan}
            simulationResponse={simulationResponse}
            isSimulating={isSimulating}
            simulationError={simulationError}
          />
        )}
        {currentChart.id === 'growth' && (
          <GrowthOfWealthChart
            plan={plan}
            simulationResponse={simulationResponse}
            isSimulating={isSimulating}
            simulationError={simulationError}
          />
        )}
        {currentChart.id === 'destitution' && (
          <RiskOfFailureChart
            plan={plan}
            simulationResponse={simulationResponse}
            isSimulating={isSimulating}
            simulationError={simulationError}
          />
        )}
        {/* {currentChart.id === 'distribution' && (
          <FinalWealthDistributionChart
            plan={plan}
            simulationResponse={simulationResponse}
            isSimulating={isSimulating}
            simulationError={simulationError}
          />
        )} */}
      </div>
    </div>
  )
}

