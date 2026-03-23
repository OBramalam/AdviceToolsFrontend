const THOUSANDS_THRESHOLD = 100_000_000

function buildYAxisLabel(baseLabel: string, useThousands: boolean): string {
  if (!useThousands) return baseLabel
  if (baseLabel.includes('($)')) {
    return baseLabel.replace('($)', "($000's)")
  }
  return `${baseLabel} (000's)`
}

export function getYAxisFormatConfig(maxAbsValue: number, baseLabel: string) {
  const useThousands = maxAbsValue > THOUSANDS_THRESHOLD
  const divisor = useThousands ? 1000 : 1

  return {
    label: buildYAxisLabel(baseLabel, useThousands),
    width: useThousands ? 96 : 88,
    tickFormatter: (value: any): string => {
      const num = typeof value === 'number' ? value : Number(value)
      if (!isFinite(num)) return ''
      return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0,
      }).format(num / divisor)
    },
  }
}
