// Expenses Table component for displaying and editing negative cash flows (expenses)

'use client'

import { useState } from 'react'
import { BaseTable } from './BaseTable'
import { CashFlow } from '@/types/api'
import { formatCurrency } from '@/lib/utils/format'
import {
  useUpdateCashFlow,
  useCreateCashFlow,
  useDeleteCashFlow,
} from '@/lib/hooks/useCashFlows'
import { Trash2 } from 'lucide-react'

export interface ExpensesTableProps {
  expenses: CashFlow[]
  planId: number
  className?: string
}

type ExistingExpenseEntry = {
  type: 'existing'
  id: number
  data: CashFlow
}

type NewExpenseEntry = {
  type: 'new'
  id: string
  data: Omit<CashFlow, 'id' | 'plan_id'>
}

type ExpenseEntry = ExistingExpenseEntry | NewExpenseEntry

export function ExpensesTable({
  expenses,
  planId,
  className,
}: ExpensesTableProps) {
  // Track edits: only store changed fields per entry ID
  const [edits, setEdits] = useState<
    Record<number | string, Partial<Omit<CashFlow, 'id' | 'plan_id'>>>
  >({})
  // Track new unsaved entries
  const [newEntries, setNewEntries] = useState<
    Record<string, Omit<CashFlow, 'id' | 'plan_id'>>
  >({})
  const [newEntryCounter, setNewEntryCounter] = useState(0)

  const updateMutation = useUpdateCashFlow()
  const createMutation = useCreateCashFlow()
  const deleteMutation = useDeleteCashFlow()

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Get the effective value for a field (edit if exists, otherwise from expense/newEntry)
  const getValue = (
    entry: ExpenseEntry,
    field: keyof Omit<CashFlow, 'id' | 'plan_id'>
  ): any => {
    const entryId = entry.id
    const edit = edits[entryId]
    if (edit && field in edit) {
      return edit[field]
    }
    if (entry.type === 'new') {
      return entry.data[field]
    }
    return entry.data[field as keyof CashFlow]
  }

  const handleChange = (
    id: number | string,
    field: keyof Omit<CashFlow, 'id' | 'plan_id'>,
    value: string | number | undefined
  ) => {
    setEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }))
  }

  const handleNewEntryChange = (
    tempId: string,
    field: keyof Omit<CashFlow, 'id' | 'plan_id'>,
    value: string | number | undefined
  ) => {
    setNewEntries((prev) => ({
      ...prev,
      [tempId]: {
        ...prev[tempId],
        [field]: value,
      },
    }))
  }

  const handleAmountChange = (id: number | string, value: string) => {
    const numericValue = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0
    // Ensure amount stays negative for expenses
    const negativeValue = -Math.abs(numericValue)
    handleChange(id, 'amount', negativeValue)
  }

  const handleNewEntryAmountChange = (tempId: string, value: string) => {
    const numericValue = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0
    // Ensure amount stays negative for expenses
    const negativeValue = -Math.abs(numericValue)
    handleNewEntryChange(tempId, 'amount', negativeValue)
  }

  const handleDateChange = (
    id: number | string,
    field: 'start_date' | 'end_date',
    value: string
  ) => {
    handleChange(id, field, value || undefined)
  }

  const handleNewEntryDateChange = (
    tempId: string,
    field: 'start_date' | 'end_date',
    value: string
  ) => {
    handleNewEntryChange(tempId, field, value || undefined)
  }

  const handlePeriodicityChange = (id: number | string, value: string) => {
    const periodicity = value as
      | 'monthly'
      | 'quarterly'
      | 'annually'
      | 'one_off'

    if (periodicity === 'one_off') {
      handleChange(id, 'periodicity', periodicity)
      handleChange(id, 'end_date', undefined)
    } else {
      handleChange(id, 'periodicity', periodicity)
    }
  }

  const handleNewEntryPeriodicityChange = (tempId: string, value: string) => {
    const periodicity = value as
      | 'monthly'
      | 'quarterly'
      | 'annually'
      | 'one_off'

    if (periodicity === 'one_off') {
      handleNewEntryChange(tempId, 'periodicity', periodicity)
      handleNewEntryChange(tempId, 'end_date', undefined)
    } else {
      handleNewEntryChange(tempId, 'periodicity', periodicity)
    }
  }

  const handleAdd = () => {
    const tempId = `new-${newEntryCounter}`
    setNewEntryCounter((prev) => prev + 1)
    setNewEntries((prev) => ({
      ...prev,
      [tempId]: {
        name: '',
        description: '',
        amount: 0, // Will be negative when user enters amount
        periodicity: 'monthly',
        frequency: 1,
        start_date: getTodayDate(),
        end_date: undefined,
      },
    }))
  }

  const handleDelete = async (id: number | string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this expense entry?'
    )
    if (!confirmed) return

    if (typeof id === 'string' && id.startsWith('new-')) {
      // New entry, just remove from newEntries
      setNewEntries((prev) => {
        const newData = { ...prev }
        delete newData[id]
        return newData
      })
    } else {
      // Existing entry, call API
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id
      if (!isNaN(numericId) && numericId > 0) {
        try {
          await deleteMutation.mutateAsync({ id: numericId, planId })
          // Remove any edits for this entry
          setEdits((prev) => {
            const newData = { ...prev }
            delete newData[numericId]
            return newData
          })
        } catch (error) {
          console.error('Failed to delete expense entry:', error)
          alert('Failed to delete expense entry. Please try again.')
        }
      }
    }
  }

  const validateEntry = (
    data: Partial<Omit<CashFlow, 'id' | 'plan_id'>>,
    baseData?: Omit<CashFlow, 'id' | 'plan_id'>
  ): boolean => {
    const name = data.name ?? baseData?.name ?? ''
    const amount = data.amount ?? baseData?.amount ?? 0
    if (!name.trim()) return false
    if (amount >= 0) return false // Must be negative for expenses
    return true
  }

  const handleSave = async () => {
    // Validate all edits
    const invalidEdits: (number | string)[] = []
    Object.entries(edits).forEach(([id, edit]) => {
      const expense = expenses.find((exp) => exp.id === parseInt(id, 10))
      if (expense && !validateEntry(edit, expense)) {
        invalidEdits.push(id)
      }
    })

    // Validate all new entries
    const invalidNewEntries: string[] = []
    Object.entries(newEntries).forEach(([id, data]) => {
      if (!validateEntry(data)) {
        invalidNewEntries.push(id)
      }
    })

    if (invalidEdits.length > 0 || invalidNewEntries.length > 0) {
      alert(
        'Please fill in all required fields (Name and Amount) for all entries before saving.'
      )
      return
    }

    const updates: Promise<any>[] = []
    const creates: Promise<any>[] = []

    // Process edits (updates)
    Object.entries(edits).forEach(([id, edit]) => {
      const numericId = parseInt(id, 10)
      if (!isNaN(numericId)) {
        const expense = expenses.find((exp) => exp.id === numericId)
        if (expense) {
          // Merge edit with original expense data
          const updateData: Omit<CashFlow, 'id' | 'plan_id'> = {
            name: edit.name ?? expense.name,
            description: edit.description ?? expense.description ?? '',
            amount: edit.amount ?? expense.amount,
            periodicity: edit.periodicity ?? expense.periodicity ?? 'monthly',
            frequency: edit.frequency ?? expense.frequency ?? 1,
            start_date: edit.start_date ?? expense.start_date,
            end_date: edit.end_date ?? expense.end_date ?? undefined,
          }
          updates.push(
            updateMutation.mutateAsync({
              id: numericId,
              data: updateData,
            })
          )
        }
      }
    })

    // Process new entries (creates)
    Object.entries(newEntries).forEach(([tempId, data]) => {
      creates.push(
        createMutation.mutateAsync({
          planId,
          data,
        })
      )
    })

    try {
      await Promise.all([...updates, ...creates])
      // Clear edits and new entries after successful save
      setEdits({})
      setNewEntries({})
      setNewEntryCounter(0)
    } catch (error) {
      console.error('Failed to save expense entries:', error)
      alert('Failed to save expense entries. Please try again.')
    }
  }

  const handleCancel = () => {
    // Clear all edits and new entries
    setEdits({})
    setNewEntries({})
    setNewEntryCounter(0)
  }

  // Combine existing expenses and new entries for display
  const allEntries: ExpenseEntry[] = [
    ...expenses
      .filter((exp): exp is CashFlow & { id: number } => exp.id !== undefined)
      .map((exp) => ({ type: 'existing' as const, id: exp.id, data: exp })),
    ...Object.entries(newEntries).map(([tempId, data]) => ({
      type: 'new' as const,
      id: tempId,
      data,
    })),
  ]

  const isPending =
    updateMutation.isPending ||
    createMutation.isPending ||
    deleteMutation.isPending

  if (allEntries.length === 0) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Expenses</h3>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={isPending}
              className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              + Add Expense
            </button>
          </div>
        </div>
        <BaseTable
          headers={[
            'Name',
            'Amount',
            'Periodicity',
            'Frequency',
            'Start Date',
            'End Date',
            '',
          ]}
        >
          <tr>
            <td
              colSpan={7}
              className="px-4 py-8 text-center text-sm text-gray-500"
            >
              No expense entries found
            </td>
          </tr>
        </BaseTable>
      </div>
    )
  }

  const hasChanges = Object.keys(edits).length > 0 || Object.keys(newEntries).length > 0

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Expenses</h3>
        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            disabled={isPending}
            className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            + Add Expense
          </button>
          {hasChanges && (
            <>
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                {isPending ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>
      <BaseTable
        headers={[
          'Name',
          'Amount',
          'Periodicity',
          'Frequency',
          'Start Date',
          'End Date',
          '',
        ]}
      >
        {allEntries.map((entry) => {
          const isNew = entry.type === 'new'
          const entryId = entry.id
          const isOneOff = getValue(entry, 'periodicity') === 'one_off'

          return (
            <tr
              key={entryId}
              className={`hover:bg-gray-50 ${isNew ? 'bg-blue-50' : ''}`}
            >
              <td className="px-4 py-3">
                <input
                  type="text"
                  value={getValue(entry, 'name') || ''}
                  onChange={(e) =>
                    isNew
                      ? handleNewEntryChange(entryId as string, 'name', e.target.value)
                      : handleChange(entryId as number, 'name', e.target.value)
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Expense name"
                />
              </td>
              <td className="px-4 py-3">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    $
                  </span>
                  <input
                    type="text"
                    value={formatCurrency(Math.abs(getValue(entry, 'amount') || 0))}
                    onChange={(e) =>
                      isNew
                        ? handleNewEntryAmountChange(entryId as string, e.target.value)
                        : handleAmountChange(entryId as number, e.target.value)
                    }
                    className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded text-sm font-semibold text-red-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </td>
              <td className="px-4 py-3">
                <select
                  value={getValue(entry, 'periodicity') || 'monthly'}
                  onChange={(e) =>
                    isNew
                      ? handleNewEntryPeriodicityChange(entryId as string, e.target.value)
                      : handlePeriodicityChange(entryId as number, e.target.value)
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                  <option value="one_off">One-off</option>
                </select>
              </td>
              {!isOneOff && (
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="1"
                    value={getValue(entry, 'frequency') ?? 1}
                    onChange={(e) =>
                      isNew
                        ? handleNewEntryChange(
                            entryId as string,
                            'frequency',
                            parseInt(e.target.value, 10) || 1
                          )
                        : handleChange(
                            entryId as number,
                            'frequency',
                            parseInt(e.target.value, 10) || 1
                          )
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </td>
              )}
              {isOneOff && <td className="px-4 py-3 w-1/4"></td>}
              <td className="px-4 py-3">
                <input
                  type="date"
                  value={
                    getValue(entry, 'start_date')
                      ? (getValue(entry, 'start_date') as string).split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    isNew
                      ? handleNewEntryDateChange(entryId as string, 'start_date', e.target.value)
                      : handleDateChange(entryId as number, 'start_date', e.target.value)
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </td>
              {!isOneOff && (
                <td className="px-4 py-3">
                  <input
                    type="date"
                    value={
                      getValue(entry, 'end_date')
                        ? (getValue(entry, 'end_date') as string).split('T')[0]
                        : ''
                    }
                    onChange={(e) =>
                      isNew
                        ? handleNewEntryDateChange(entryId as string, 'end_date', e.target.value)
                        : handleDateChange(entryId as number, 'end_date', e.target.value)
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </td>
              )}
              {isOneOff && <td className="px-4 py-3 w-1/4"></td>}
              <td className="px-4 py-3">
                <button
                  onClick={() => handleDelete(entryId as number | string)}
                  disabled={isPending}
                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          )
        })}
      </BaseTable>
    </div>
  )
}
