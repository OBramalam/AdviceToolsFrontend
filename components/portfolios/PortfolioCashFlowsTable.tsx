// Portfolio-specific Cash Flows table for a single portfolio

'use client'

import { useState, useMemo } from 'react'
import { CashFlow } from '@/types/api'
import { useCashFlows, useCreateCashFlow, useUpdateCashFlow, useDeleteCashFlow } from '@/lib/hooks/useCashFlows'
import { BaseTable } from '@/components/dashboard/BaseTable'
import { formatCurrency } from '@/lib/utils/format'
import { Spinner } from '@/components/ui/Spinner'
import { Trash2 } from 'lucide-react'

export interface PortfolioCashFlowsTableProps {
  planId: number
  portfolioId?: number
  className?: string
}

type EditableCashFlowFields = Omit<CashFlow, 'id' | 'plan_id'>

export function PortfolioCashFlowsTable({
  planId,
  portfolioId,
  className,
}: PortfolioCashFlowsTableProps) {
  const { data: cashFlows, isLoading } = useCashFlows(planId)
  const createMutation = useCreateCashFlow()
  const updateMutation = useUpdateCashFlow()
  const deleteMutation = useDeleteCashFlow()

  // Track edits for existing cashflows (by id)
  const [edits, setEdits] = useState<
    Record<number, Partial<EditableCashFlowFields>>
  >({})

  // Track new unsaved portfolio-specific cashflows (by temp id)
  const [newEntries, setNewEntries] = useState<
    Record<string, EditableCashFlowFields>
  >({})
  const [newEntryCounter, setNewEntryCounter] = useState(0)

  const isPending =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Derive portfolio-specific cashflows and plan-level income cashflows
  const { portfolioCashFlows, planIncomeCashFlows } = useMemo(() => {
    const all = cashFlows || []
    
    console.log('[PortfolioCashFlowsTable] Filtering cashflows:', {
      portfolioId,
      totalCashflows: all.length,
      allCashflows: all.map((cf) => ({
        id: cf.id,
        name: cf.name,
        portfolio_id: cf.portfolio_id,
        portfolio_id_type: typeof cf.portfolio_id,
        amount: cf.amount,
        basis: cf.basis,
        include_in_main_savings: cf.include_in_main_savings,
      })),
    })

    const portfolioSpecific = portfolioId
      ? all.filter((cf) => {
          // Explicit check: portfolio_id must match and not be null/undefined
          const cfPortfolioId = cf.portfolio_id
          if (cfPortfolioId == null || cfPortfolioId === undefined) {
            console.log('[PortfolioCashFlowsTable] Skipping cashflow (no portfolio_id):', {
              id: cf.id,
              name: cf.name,
            })
            return false
          }
          // Handle both number and string types
          const matches = String(cfPortfolioId) === String(portfolioId)
          console.log('[PortfolioCashFlowsTable] Checking cashflow:', {
            id: cf.id,
            name: cf.name,
            cf_portfolio_id: cfPortfolioId,
            cf_portfolio_id_type: typeof cfPortfolioId,
            expected_portfolio_id: portfolioId,
            expected_portfolio_id_type: typeof portfolioId,
            matches,
          })
          return matches
        })
      : []
    
    console.log('[PortfolioCashFlowsTable] Filtered portfolio cashflows:', {
      portfolioId,
      count: portfolioSpecific.length,
      cashflows: portfolioSpecific.map((cf) => ({
        id: cf.id,
        name: cf.name,
        portfolio_id: cf.portfolio_id,
      })),
    })

    const planIncome = all.filter(
      (cf) =>
        // Explicitly exclude portfolio-specific cashflows
        (cf.portfolio_id == null || cf.portfolio_id === undefined) &&
        (cf.include_in_main_savings ?? true) &&
        cf.amount > 0
    )
    
    return {
      portfolioCashFlows: portfolioSpecific,
      planIncomeCashFlows: planIncome,
    }
  }, [cashFlows, portfolioId])

  // Helper to get current value (edit override > original > new)
  const getValue = (
    entry:
      | { type: 'existing'; cf: CashFlow }
      | { type: 'new'; tempId: string; cf: EditableCashFlowFields },
    field: keyof EditableCashFlowFields
  ): any => {
    if (entry.type === 'existing') {
      const edit = edits[entry.cf.id!]
      if (edit && field in edit) {
        return (edit as any)[field]
      }
      return (entry.cf as any)[field]
    }
    // new
    const base = entry.cf
    return (base as any)[field]
  }

  const handleEditChange = (
    id: number,
    field: keyof EditableCashFlowFields,
    value: any
  ) => {
    setEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }))
  }

  const handleNewChange = (
    tempId: string,
    field: keyof EditableCashFlowFields,
    value: any
  ) => {
    setNewEntries((prev) => ({
      ...prev,
      [tempId]: {
        ...prev[tempId],
        [field]: value,
      },
    }))
  }

  const handleAdd = () => {
    if (!portfolioId) return
    const tempId = `new-${newEntryCounter}`
    setNewEntryCounter((prev) => prev + 1)
    setNewEntries((prev) => ({
      ...prev,
      [tempId]: {
        portfolio_id: portfolioId,
        name: '',
        description: '',
        amount: 0,
        basis: 'fixed',
        periodicity: 'monthly',
        frequency: 1,
        start_date: getTodayDate(),
        end_date: undefined,
        reference_cashflow_id: null,
        include_in_main_savings: false,
      },
    }))
  }

  const handleDelete = async (entry:
    | { type: 'existing'; cf: CashFlow }
    | { type: 'new'; tempId: string; cf: EditableCashFlowFields }
  ) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this portfolio cash flow?'
    )
    if (!confirmed) return

    if (entry.type === 'new') {
      setNewEntries((prev) => {
        const next = { ...prev }
        delete next[entry.tempId]
        return next
      })
      return
    }

    const id = entry.cf.id
    if (!id) return

    try {
      await deleteMutation.mutateAsync({ id, planId })
      setEdits((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } catch (error) {
      console.error('Failed to delete portfolio cash flow:', error)
      alert('Failed to delete portfolio cash flow. Please try again.')
    }
  }

  const validateEntry = (
    data: Partial<EditableCashFlowFields>,
    base?: EditableCashFlowFields
  ): boolean => {
    const name = data.name ?? base?.name ?? ''
    const amount = data.amount ?? base?.amount ?? 0
    if (!name.trim()) return false
    if (!amount || isNaN(Number(amount))) return false
    // For pct_* bases, amount should be > 0
    const basis = (data.basis ?? base?.basis ?? 'fixed') as string
    if (basis !== 'fixed' && amount <= 0) return false
    return true
  }

  const handleSave = async () => {
    if (!portfolioId) return

    // Validate edits
    const invalidEdits: number[] = []
    portfolioCashFlows.forEach((cf) => {
      const edit = edits[cf.id!]
      if (edit && !validateEntry(edit, cf)) {
        invalidEdits.push(cf.id!)
      }
    })

    // Validate new entries
    const invalidNew: string[] = []
    Object.entries(newEntries).forEach(([tempId, data]) => {
      if (!validateEntry(data)) {
        invalidNew.push(tempId)
      }
    })

    if (invalidEdits.length > 0 || invalidNew.length > 0) {
      alert(
        'Please fill in all required fields (Name and Amount) for all portfolio cashflows before saving.'
      )
      return
    }

    const updates: Promise<any>[] = []
    const creates: Promise<any>[] = []

    // Process edits
    portfolioCashFlows.forEach((cf) => {
      if (!cf.id) return
      const edit = edits[cf.id]
      if (!edit) return

      const merged: EditableCashFlowFields = {
        portfolio_id: portfolioId,
        name: edit.name ?? cf.name,
        description: edit.description ?? cf.description ?? '',
        amount: edit.amount ?? cf.amount,
        periodicity: edit.periodicity ?? cf.periodicity ?? 'monthly',
        frequency: edit.frequency ?? cf.frequency ?? 1,
        start_date: edit.start_date ?? cf.start_date,
        end_date: edit.end_date ?? cf.end_date ?? undefined,
        basis: edit.basis ?? cf.basis ?? 'fixed',
        reference_cashflow_id:
          edit.reference_cashflow_id ?? cf.reference_cashflow_id ?? null,
        include_in_main_savings:
          edit.include_in_main_savings ??
          cf.include_in_main_savings ??
          false,
      }

      updates.push(
        updateMutation.mutateAsync({
          id: cf.id,
          data: merged,
        })
      )
    })

    // Process new entries
    Object.entries(newEntries).forEach(([tempId, data]) => {
      const payload: EditableCashFlowFields = {
        portfolio_id: portfolioId,
        name: data.name,
        description: data.description ?? '',
        amount: data.amount,
        periodicity: data.periodicity ?? 'monthly',
        frequency: data.frequency ?? 1,
        start_date: data.start_date ?? getTodayDate(),
        end_date: data.end_date ?? undefined,
        basis: data.basis ?? 'fixed',
        reference_cashflow_id: data.reference_cashflow_id ?? null,
        include_in_main_savings:
          data.include_in_main_savings ?? false,
      }

      creates.push(
        createMutation.mutateAsync({
          planId,
          data: payload,
        })
      )
    })

    try {
      await Promise.all([...updates, ...creates])
      setEdits({})
      setNewEntries({})
      setNewEntryCounter(0)
    } catch (error) {
      console.error('Failed to save portfolio cash flows:', error)
      alert('Failed to save portfolio cash flows. Please try again.')
    }
  }

  const handleCancel = () => {
    setEdits({})
    setNewEntries({})
    setNewEntryCounter(0)
  }

  const allEntries: (
    | {
        type: 'existing'
        cf: CashFlow
      }
    | {
        type: 'new'
        tempId: string
        cf: EditableCashFlowFields
      }
  )[] = [
    ...portfolioCashFlows.map((cf) => ({
      type: 'existing' as const,
      cf,
    })),
    ...Object.entries(newEntries).map(([tempId, cf]) => ({
      type: 'new' as const,
      tempId,
      cf,
    })),
  ]

  const hasChanges =
    Object.keys(edits).length > 0 || Object.keys(newEntries).length > 0

  if (!portfolioId) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Portfolio-specific Cash Flows
          </h3>
        </div>
        <p className="text-sm text-gray-500">
          Save the portfolio first to configure portfolio-specific cash flows.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Portfolio-specific Cash Flows
          </h3>
        </div>
        <div className="flex items-center justify-center py-4">
          <Spinner />
        </div>
      </div>
    )
  }

  const showTable = allEntries.length > 0

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">
          Portfolio-specific Cash Flows
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAdd}
            disabled={isPending}
            className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Add Cash Flow
          </button>
          {showTable && hasChanges && (
            <>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {!showTable && (
        <p className="text-sm text-gray-500">
          No portfolio-specific cash flows configured. Click &quot;Add Cash
          Flow&quot; to create one.
        </p>
      )}

      {showTable && (
        <BaseTable
          headers={[
            'Name',
            'Type',
            'Amount',
            'Reference Income',
            'Periodicity',
            'Frequency',
            'Start Date',
            'End Date',
            'Include in Main Savings',
            '',
          ]}
          initialColumnWidths={[
            220, // Name - wider
            220, // Type - wider
            120, // Amount
            220, // Reference Income - wider
            150, // Periodicity - a bit wider
            90, // Frequency - a bit bigger
            160, // Start Date - wider
            160, // End Date - wider
            160, // Include in Main Savings
            60, // Actions (delete)
          ]}
        >
          {allEntries.map((entry) => {
            const isNew = entry.type === 'new'
            const key = entry.type === 'existing' ? entry.cf.id! : entry.tempId
            const basis =
              getValue(
                entry.type === 'existing'
                  ? { type: 'existing', cf: entry.cf }
                  : { type: 'new', tempId: entry.tempId, cf: entry.cf },
                'basis'
              ) || 'fixed'
            const isOneOff =
              getValue(
                entry.type === 'existing'
                  ? { type: 'existing', cf: entry.cf }
                  : { type: 'new', tempId: entry.tempId, cf: entry.cf },
                'periodicity'
              ) === 'one_off'
            const referenceId = getValue(
              entry.type === 'existing'
                ? { type: 'existing', cf: entry.cf }
                : { type: 'new', tempId: entry.tempId, cf: entry.cf },
              'reference_cashflow_id'
            ) as number | null | undefined

            const handleFieldChange = (
              field: keyof EditableCashFlowFields,
              value: any
            ) => {
              if (entry.type === 'existing') {
                handleEditChange(entry.cf.id!, field, value)
              } else {
                handleNewChange(entry.tempId, field, value)
              }
            }

            return (
              <tr
                key={key}
                className={`hover:bg-gray-50 ${isNew ? 'bg-blue-50' : ''}`}
              >
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={getValue(
                      entry.type === 'existing'
                        ? { type: 'existing', cf: entry.cf }
                        : { type: 'new', tempId: entry.tempId, cf: entry.cf },
                      'name'
                    ) || ''}
                    onChange={(e) =>
                      handleFieldChange('name', e.target.value)
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Cashflow name"
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={basis}
                    onChange={(e) =>
                      handleFieldChange(
                        'basis',
                        e.target.value as EditableCashFlowFields['basis']
                      )
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="fixed">Fixed amount</option>
                    <option value="pct_total_income">% of total income</option>
                    <option value="pct_specific_income">
                      % of specific income
                    </option>
                    <option value="pct_savings">% of savings</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="relative">
                    {basis === 'fixed' && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                        $
                      </span>
                    )}
                    <input
                      type="text"
                      value={
                        basis === 'fixed'
                          ? formatCurrency(
                              getValue(
                                entry.type === 'existing'
                                  ? { type: 'existing', cf: entry.cf }
                                  : {
                                      type: 'new',
                                      tempId: entry.tempId,
                                      cf: entry.cf,
                                    },
                                'amount'
                              ) || 0
                            )
                          : (getValue(
                              entry.type === 'existing'
                                ? { type: 'existing', cf: entry.cf }
                                : {
                                    type: 'new',
                                    tempId: entry.tempId,
                                    cf: entry.cf,
                                  },
                              'amount'
                            ) ?? ''
                            ).toString()
                      }
                      onChange={(e) => {
                        const raw = e.target.value
                        if (basis === 'fixed') {
                          const numeric =
                            parseFloat(raw.replace(/[^0-9.-]/g, '')) || 0
                          handleFieldChange('amount', numeric)
                        } else {
                          const numeric = parseFloat(raw) || 0
                          handleFieldChange('amount', numeric)
                        }
                      }}
                      className={`w-full ${
                        basis === 'fixed' ? 'pl-6' : 'pl-2'
                      } pr-2 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                      placeholder={basis === 'fixed' ? '0' : '10 = 10%'}
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  {basis === 'pct_specific_income' ? (
                    <select
                      value={referenceId ?? ''}
                      onChange={(e) =>
                        handleFieldChange(
                          'reference_cashflow_id',
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select income</option>
                      {planIncomeCashFlows.map((inc) => (
                        <option key={inc.id} value={inc.id}>
                          {inc.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {basis === 'fixed'
                        ? 'N/A'
                        : basis === 'pct_total_income'
                        ? 'All income'
                        : 'Net savings'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={
                      getValue(
                        entry.type === 'existing'
                          ? { type: 'existing', cf: entry.cf }
                          : {
                              type: 'new',
                              tempId: entry.tempId,
                              cf: entry.cf,
                            },
                        'periodicity'
                      ) || 'monthly'
                    }
                    onChange={(e) => {
                      const value = e.target.value as EditableCashFlowFields['periodicity']
                      handleFieldChange('periodicity', value)
                      if (value === 'one_off') {
                        handleFieldChange('frequency', undefined)
                        handleFieldChange(
                          'end_date',
                          getValue(
                            entry.type === 'existing'
                              ? { type: 'existing', cf: entry.cf }
                              : {
                                  type: 'new',
                                  tempId: entry.tempId,
                                  cf: entry.cf,
                                },
                            'start_date'
                          )
                        )
                      }
                    }}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                    <option value="one_off">One-off</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  {!isOneOff ? (
                    <input
                      type="number"
                      min={1}
                      value={
                        getValue(
                          entry.type === 'existing'
                            ? { type: 'existing', cf: entry.cf }
                            : {
                                type: 'new',
                                tempId: entry.tempId,
                                cf: entry.cf,
                              },
                          'frequency'
                        ) ?? 1
                      }
                      onChange={(e) =>
                        handleFieldChange(
                          'frequency',
                          parseInt(e.target.value, 10) || 1
                        )
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">n/a</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="date"
                    value={
                      getValue(
                        entry.type === 'existing'
                          ? { type: 'existing', cf: entry.cf }
                          : {
                              type: 'new',
                              tempId: entry.tempId,
                              cf: entry.cf,
                            },
                        'start_date'
                      )
                        ? (
                            getValue(
                              entry.type === 'existing'
                                ? { type: 'existing', cf: entry.cf }
                                : {
                                    type: 'new',
                                    tempId: entry.tempId,
                                    cf: entry.cf,
                                  },
                              'start_date'
                            ) as string
                          ).split('T')[0]
                        : ''
                    }
                    onChange={(e) =>
                      handleFieldChange('start_date', e.target.value || undefined)
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="date"
                    value={
                      getValue(
                        entry.type === 'existing'
                          ? { type: 'existing', cf: entry.cf }
                          : {
                              type: 'new',
                              tempId: entry.tempId,
                              cf: entry.cf,
                            },
                        'end_date'
                      )
                        ? (
                            getValue(
                              entry.type === 'existing'
                                ? { type: 'existing', cf: entry.cf }
                                : {
                                    type: 'new',
                                    tempId: entry.tempId,
                                    cf: entry.cf,
                                  },
                              'end_date'
                            ) as string
                          ).split('T')[0]
                        : ''
                    }
                    onChange={(e) =>
                      handleFieldChange('end_date', e.target.value || undefined)
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </td>
                <td className="px-4 py-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={
                        getValue(
                          entry.type === 'existing'
                            ? { type: 'existing', cf: entry.cf }
                            : {
                                type: 'new',
                                tempId: entry.tempId,
                                cf: entry.cf,
                              },
                          'include_in_main_savings'
                        ) ?? false
                      }
                      onChange={(e) =>
                        handleFieldChange(
                          'include_in_main_savings',
                          e.target.checked
                        )
                      }
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-600 sr-only">
                      Include in main savings
                    </span>
                  </label>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleDelete(entry)}
                    disabled={isPending}
                    className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete cash flow"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            )
          })}
        </BaseTable>
      )}
    </div>
  )
}


