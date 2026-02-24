'use client'

// Dashboard Page

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Copy, Trash2 } from 'lucide-react'
import {
  GeneralInfoTable,
  IncomeTable,
  ExpensesTable,
  ChartCarousel,
} from '@/components/dashboard'
import { PortfolioManager } from '@/components/portfolios/PortfolioManager'
import {
  useFinancialPlans,
  useFinancialPlan,
  useDuplicateFinancialPlan,
  useDeleteFinancialPlan,
  useUpdateFinancialPlan,
} from '@/lib/hooks/useFinancialPlans'
import { useCashFlows } from '@/lib/hooks/useCashFlows'
import { useRunSimulation } from '@/lib/hooks/useSimulation'
import { CashFlow, FinancialPlan } from '@/types/api'

export default function DashboardPage() {
  // Fetch all financial plans
  const { data: plans, isLoading: plansLoading } = useFinancialPlans()

  // State for selected plan ID
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)

  const duplicatePlanMutation = useDuplicateFinancialPlan()
  const deletePlanMutation = useDeleteFinancialPlan()
  const updatePlanMutation = useUpdateFinancialPlan()

  const [isEditingName, setIsEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState<string>('')

  // Set default selected plan when plans load
  useEffect(() => {
    if (plans && plans.length > 0 && !selectedPlanId) {
      const firstPlanId = plans[0].id
      if (firstPlanId) {
        setSelectedPlanId(firstPlanId)
      }
    }
  }, [plans, selectedPlanId])

  // Fetch selected plan details
  const {
    data: selectedPlan,
    isLoading: planLoading,
  } = useFinancialPlan(selectedPlanId ?? 0)

  // Keep local name draft in sync when selected plan changes (unless actively editing)
  useEffect(() => {
    if (selectedPlan && !isEditingName) {
      setNameDraft(selectedPlan.name ?? '')
    }
  }, [selectedPlan, isEditingName])

  // Fetch cash flows for selected plan
  const {
    data: cashFlows,
    isLoading: cashFlowsLoading,
  } = useCashFlows(selectedPlanId ?? 0)

  // Run simulation when plan is selected
  const {
    mutate: runSimulation,
    data: simulationResponse,
    isPending: isSimulating,
    error: simulationError,
  } = useRunSimulation()

  // Trigger simulation when plan changes
  useEffect(() => {
    if (selectedPlanId && selectedPlan?.id) {
      runSimulation({ financial_plan_id: selectedPlanId })
    }
  }, [selectedPlanId, selectedPlan?.id, runSimulation])

  // Separate cash flows into income and expenses (only plan-level, exclude portfolio-specific)
  const { incomes, expenses } = useMemo(() => {
    if (!cashFlows) return { incomes: [], expenses: [] }

    console.log('[Dashboard] Filtering cashflows:', {
      total: cashFlows.length,
      cashflows: cashFlows.map((cf) => ({
        id: cf.id,
        name: cf.name,
        portfolio_id: cf.portfolio_id,
        amount: cf.amount,
      })),
    })

    const incomeList: CashFlow[] = []
    const expenseList: CashFlow[] = []

    cashFlows.forEach((flow) => {
      // Only include plan-level cashflows (portfolio_id is null/undefined)
      // Explicitly exclude any cashflow with a portfolio_id set
      if (flow.portfolio_id == null || flow.portfolio_id === undefined) {
        if (flow.amount > 0) {
          incomeList.push(flow)
        } else {
          expenseList.push(flow)
        }
      } else {
        console.log('[Dashboard] Excluding portfolio-specific cashflow from income/expenses:', {
          id: flow.id,
          name: flow.name,
          portfolio_id: flow.portfolio_id,
          amount: flow.amount,
        })
      }
    })

    console.log('[Dashboard] Filtered results:', {
      incomes: incomeList.length,
      expenses: expenseList.length,
      incomeNames: incomeList.map((cf) => cf.name),
      expenseNames: expenseList.map((cf) => cf.name),
    })

    return { incomes: incomeList, expenses: expenseList }
  }, [cashFlows])

  // Prepare plan options for dropdown
  const planOptions = useMemo(() => {
    if (!plans) return []
    return plans
      .filter((plan) => plan.id !== undefined)
      .map((plan) => ({
        value: plan.id!,
        label: plan.name,
      }))
  }, [plans])

  const isLoading = plansLoading || planLoading || cashFlowsLoading

  // Show empty state if no plans
  if (!isLoading && (!plans || plans.length === 0)) {
    return (
      <div className="h-full">
        <Card className="h-full">
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-2xl font-semibold mb-4">
              Welcome to Your Dashboard
            </h2>
            <p className="text-gray-600 mb-8">
              Use the chat interface on the right to start building your financial plan.
              Once you&apos;ve completed the conversation, you can export it to
              create your financial plan.
            </p>
            <div className="space-y-2 text-left text-sm text-gray-500">
              <p>• Chat with the AI assistant to provide your financial information</p>
              <p>• The assistant will help you build a comprehensive plan</p>
              <p>• Export the conversation to create your financial plan</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Show loading state
  if (isLoading || !selectedPlan) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6 p-6">
        {/* Page Header with Plan Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              {isEditingName ? (
                <input
                  className="text-2xl font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:outline-none focus:border-primary min-w-[8rem]"
                  value={nameDraft}
                  autoFocus
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={() => {
                    if (!selectedPlan?.id) {
                      setIsEditingName(false)
                      return
                    }
                    const { id, user_id, ...rest } = selectedPlan as any
                    updatePlanMutation.mutate(
                      {
                        id,
                        data: {
                          ...rest,
                          name: nameDraft,
                        },
                      },
                      {
                        onSettled: () => {
                          setIsEditingName(false)
                        },
                      }
                    )
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      ;(e.target as HTMLInputElement).blur()
                    }
                    if (e.key === 'Escape') {
                      setNameDraft(selectedPlan?.name ?? '')
                      setIsEditingName(false)
                    }
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="text-left"
                  onClick={() => {
                    setNameDraft(selectedPlan.name ?? '')
                    setIsEditingName(true)
                  }}
                >
                  <h1 className="text-2xl font-bold text-gray-900">
                    {selectedPlan.name}
                  </h1>
                </button>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!selectedPlanId || duplicatePlanMutation.isPending}
                  onClick={() => {
                    if (!selectedPlanId) return
                    duplicatePlanMutation.mutate(selectedPlanId, {
                      onSuccess: (newPlan) => {
                        if (newPlan.id) {
                          setSelectedPlanId(newPlan.id)
                        }
                      },
                    })
                  }}
                >
                  <Copy className="w-4 h-4" aria-hidden="true" />
                  <span className="sr-only">
                    {duplicatePlanMutation.isPending ? 'Duplicating plan…' : 'Duplicate plan'}
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={!selectedPlanId || deletePlanMutation.isPending || !plans || plans.length === 0}
                  onClick={() => {
                    if (!selectedPlanId || !plans || plans.length === 0) return
                    const confirmed = window.confirm(
                      'Are you sure you want to delete this plan? This action cannot be undone.'
                    )
                    if (!confirmed) return

                    // Determine which plan to select after deletion
                    const currentIndex = plans.findIndex(
                      (p) => p.id === selectedPlanId
                    )
                    const remainingPlans = plans.filter(
                      (p) => p.id !== selectedPlanId
                    )
                    let nextPlanId: number | null = null
                    if (remainingPlans.length > 0) {
                      const fallbackIndex =
                        currentIndex >= remainingPlans.length
                          ? remainingPlans.length - 1
                          : currentIndex
                      nextPlanId = remainingPlans[fallbackIndex].id ?? null
                    }

                    deletePlanMutation.mutate(selectedPlanId, {
                      onSuccess: () => {
                        setSelectedPlanId(nextPlanId)
                      },
                    })
                  }}
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  <span className="sr-only">
                    {deletePlanMutation.isPending ? 'Deleting plan…' : 'Delete plan'}
                  </span>
                </Button>
              </div>
            </div>
            {selectedPlan.description && (
              <p className="text-gray-600 mt-1">{selectedPlan.description}</p>
            )}
          </div>
          {plans && plans.length > 0 && (
            <div className="w-full sm:w-64">
              <Select
                label="Select Financial Plan"
                value={selectedPlanId ?? ''}
                onChange={(e) => {
                  const newPlanId = parseInt(e.target.value, 10)
                  if (!isNaN(newPlanId)) {
                    setSelectedPlanId(newPlanId)
                  }
                }}
                options={planOptions}
              />
            </div>
          )}
        </div>

        {/* General Information */}
        <Card>
          <GeneralInfoTable plan={selectedPlan} />
        </Card>

        {/* Charts Carousel */}
        <ChartCarousel
          plan={selectedPlan}
          simulationResponse={simulationResponse || null}
          isSimulating={isSimulating}
          simulationError={simulationError || null}
          onRunSimulation={() => {
            if (selectedPlanId) {
              runSimulation({ financial_plan_id: selectedPlanId })
            }
          }}
        />

        {/* Portfolios Section */}
        {selectedPlan && (
          <Card>
            <PortfolioManager
              planId={selectedPlan.id!}
              planStartAge={selectedPlan.start_age}
              planEndAge={selectedPlan.plan_end_age}
            />
          </Card>
        )}

        {/* Tables Stacked */}
        <div className="space-y-6">
          {/* Income Table */}
          <Card>
            <IncomeTable
              incomes={incomes}
              planId={selectedPlanId!}
            />
          </Card>

          {/* Expenses Table */}
          <Card>
            <ExpensesTable
              expenses={expenses}
              planId={selectedPlanId!}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
