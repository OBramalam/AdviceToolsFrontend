// Percentile calculation utilities

/**
 * Calculate percentile from a sorted array
 * @param sortedArray - Array of numbers sorted in ascending order
 * @param percentile - Percentile value (0-100)
 * @returns The value at the given percentile
 */
export function calculatePercentile(
  sortedArray: number[],
  percentile: number
): number {
  if (sortedArray.length === 0) return 0
  if (percentile <= 0) return sortedArray[0]
  if (percentile >= 100) return sortedArray[sortedArray.length - 1]

  const index = (percentile / 100) * (sortedArray.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower

  if (lower === upper) {
    return sortedArray[lower]
  }

  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight
}

/**
 * Calculate mean of an array
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0
  const sum = values.reduce((acc, val) => acc + val, 0)
  return sum / values.length
}

/**
 * Calculate median of an array
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return calculatePercentile(sorted, 50)
}

