// Timestep utility functions for converting timesteps to ages

export type TimestepUnit = 'monthly' | 'annual'

/**
 * Converts a timestep value to age in years
 * @param timestep - The timestep value (0, 1, 2, ...)
 * @param startAge - Starting age in years
 * @param unit - Whether timesteps are 'monthly' or 'annual'
 * @returns Age in years
 */
export function timestepToAge(
  timestep: number,
  startAge: number,
  unit: TimestepUnit
): number {
  if (unit === 'monthly') {
    return startAge + timestep / 12
  }
  // unit === 'annual'
  return startAge + timestep
}

