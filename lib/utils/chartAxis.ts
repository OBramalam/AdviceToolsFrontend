// Helpers for chart axis tick generation

export function getYearTickStep(startAge: number, endAge: number): 1 | 5 {
  const span = Math.max(0, Math.floor(endAge) - Math.floor(startAge))
  // Use yearly ticks for shorter ranges; switch to 5-year ticks when crowded.
  return span <= 20 ? 1 : 5
}

export function buildYearTicks(startAge: number, endAge: number): number[] {
  const start = Math.floor(startAge)
  const end = Math.floor(endAge)
  const step = getYearTickStep(start, end)
  const ticks: number[] = []

  for (let age = start; age <= end; age += step) {
    ticks.push(age)
  }

  if (ticks.length === 0 || ticks[ticks.length - 1] !== end) {
    ticks.push(end)
  }

  return ticks
}
