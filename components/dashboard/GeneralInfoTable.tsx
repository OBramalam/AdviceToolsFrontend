// General Info Table component for displaying and editing financial plan key information

'use client'

import { useState, useEffect } from 'react'
import { FinancialPlan } from '@/types/api'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { useUpdateFinancialPlan } from '@/lib/hooks/useFinancialPlans'
import { clsx } from 'clsx'

export interface GeneralInfoTableProps {
  plan: FinancialPlan
  className?: string
}

export function GeneralInfoTable({ plan, className }: GeneralInfoTableProps) {
  const [formData, setFormData] = useState<Omit<FinancialPlan, 'id' | 'user_id'>>({
    name: plan.name,
    description: plan.description,
    start_age: plan.start_age,
    retirement_age: plan.retirement_age,
    plan_end_age: plan.plan_end_age,
    plan_start_date: plan.plan_start_date,
    current_portfolio_value: plan.current_portfolio_value,
    portfolio_target_value: plan.portfolio_target_value,
  })

  const updateMutation = useUpdateFinancialPlan()

  // Update form data when plan prop changes
  useEffect(() => {
    setFormData({
      name: plan.name,
      description: plan.description,
      start_age: plan.start_age,
      retirement_age: plan.retirement_age,
      plan_end_age: plan.plan_end_age,
      plan_start_date: plan.plan_start_date,
      current_portfolio_value: plan.current_portfolio_value,
      portfolio_target_value: plan.portfolio_target_value,
    })
  }, [plan])

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!plan.id) return

    try {
      await updateMutation.mutateAsync({
        id: plan.id,
        data: formData,
      })
    } catch (error) {
      console.error('Failed to update financial plan:', error)
    }
  }

  const handleCancel = () => {
    // Reset form data to original plan values
    setFormData({
      name: plan.name,
      description: plan.description,
      start_age: plan.start_age,
      retirement_age: plan.retirement_age,
      plan_end_age: plan.plan_end_age,
      plan_start_date: plan.plan_start_date,
      current_portfolio_value: plan.current_portfolio_value,
      portfolio_target_value: plan.portfolio_target_value,
    })
  }

  const handleInitialValueChange = (value: string) => {
    const numericValue = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0
    handleChange('portfolio_target_value', numericValue)
  }

  const handleDateChange = (value: string) => {
    // Convert YYYY-MM-DD to ISO format if needed
    handleChange('plan_start_date', value)
  }

  const rows = [
    {
      label: 'Start Age',
      field: 'start_age' as const,
      type: 'number',
      value: formData.start_age,
      displayValue: formData.start_age.toString(),
    },
    {
      label: 'Retirement Age',
      field: 'retirement_age' as const,
      type: 'number',
      value: formData.retirement_age,
      displayValue: formData.retirement_age.toString(),
    },
    {
      label: 'Plan End Age',
      field: 'plan_end_age' as const,
      type: 'number',
      value: formData.plan_end_age,
      displayValue: formData.plan_end_age.toString(),
    },
    {
      label: 'Plan Start Date',
      field: 'plan_start_date' as const,
      type: 'date',
      value: formData.plan_start_date,
      displayValue: formatDate(formData.plan_start_date),
    },
    {
      label: 'Portfolio Target Value',
      field: 'portfolio_target_value' as const,
      type: 'currency',
      value: formData.portfolio_target_value,
      displayValue: formatCurrency(formData.portfolio_target_value),
    },
  ]

  return (
    <div className={clsx('w-full', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          General Information
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((row, index) => (
            <div key={index} className="flex flex-col">
              <label className="text-sm font-medium text-gray-900 mb-1">
                {row.label}
              </label>
              {row.type === 'number' ? (
                <input
                  type="number"
                  value={row.value}
                  onChange={(e) =>
                    handleChange(row.field, parseInt(e.target.value, 10) || 0)
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              ) : row.type === 'date' ? (
                <input
                  type="date"
                  value={typeof row.value === 'string' ? row.value.split('T')[0] : ''} // Extract date part from ISO string
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              ) : row.type === 'currency' ? (
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="text"
                    value={formatCurrency(typeof row.value === 'number' ? row.value : 0)}
                    onChange={(e) => handleInitialValueChange(e.target.value)}
                    className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              ) : (
                <span className="text-sm text-gray-700">{row.displayValue}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

