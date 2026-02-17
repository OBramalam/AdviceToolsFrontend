// Chart type definitions

export interface ChartDataPoint {
  [key: string]: string | number | Date
  // x-axis value (typically a date or label)
  // Additional keys represent different data series
}

export interface LineSeries {
  key: string // The key in the data object for this series
  label: string // Display name for the legend
  color: string // Color for this line (hex, rgb, or Tailwind color)
  visible?: boolean // Whether the line is visible (default: true)
}

export interface ChartConfig {
  xAxisKey: string // Key in data for x-axis
  lines: LineSeries[] // Array of line series to plot
  showGridlines?: boolean // Whether to show gridlines (default: true)
  height?: number // Chart height in pixels (default: 400)
  margin?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
}

