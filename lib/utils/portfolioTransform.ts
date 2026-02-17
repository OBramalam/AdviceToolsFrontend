// Transform portfolio data between UI format and API format

import type { Portfolio, PortfolioUI } from '@/types/api'

/**
 * Transform portfolio from API format to UI format
 * Extracts constant cash allocation and simplifies weights structure
 */
export function transformPortfolioFromAPI(portfolio: Portfolio): PortfolioUI {
  // Extract cash from first weight (assuming constant)
  // Cash is calculated by backend as 1 - stocks - bonds, so we infer it from the weights
  // Calculate cash from stocks and bonds: cash = 1 - stocks - bonds
  const firstWeight = portfolio.weights[0]
  let cash_allocation = 0
  if (firstWeight) {
    const stocks = firstWeight.stocks || 0
    const bonds = firstWeight.bonds || 0
    // Calculate cash as the remainder: cash = 1 - stocks - bonds
    cash_allocation = Math.max(0, 1 - stocks - bonds)
  }

  return {
    id: portfolio.id,
    plan_id: portfolio.plan_id,
    name: portfolio.name || '',
    cash_allocation: cash_allocation,
    weights: portfolio.weights.map((w) => ({
      step: w.step,
      stocks: w.stocks,
      // bonds and cash stored separately
    })),
    expected_returns: portfolio.expected_returns,
    asset_costs: portfolio.asset_costs,
    initial_portfolio_value: portfolio.initial_portfolio_value,
    cashflow_allocation: portfolio.cashflow_allocation,
    tax_jurisdiction: portfolio.tax_jurisdiction,
    tax_config: portfolio.tax_config,
  }
}

/**
 * Transform portfolio from UI format to API format
 * Calculates bonds and adds cash to each weight entry
 */
export function transformPortfolioToAPI(
  portfolio: PortfolioUI
): Portfolio {
  // Note: id and plan_id are NOT sent in request body
  // - id is auto-generated on create, cannot be changed on update
  // - plan_id is set from URL path on create, cannot be changed on update
  
  const result: Portfolio = {
    name: portfolio.name,
    weights: portfolio.weights.map((w) => ({
      step: w.step,
      stocks: w.stocks,
      bonds: 1 - w.stocks - portfolio.cash_allocation, // Calculate bonds
      // cash is calculated automatically by backend as 1 - stocks - bonds
    })),
    expected_returns: portfolio.expected_returns,
    asset_costs: portfolio.asset_costs,
    initial_portfolio_value: portfolio.initial_portfolio_value,
    cashflow_allocation: portfolio.cashflow_allocation,
  }

  // Include tax fields if they are explicitly set in the UI state
  // - If both are set (non-null): send them (apply tax)
  // - If both are null: send them as null (explicitly clear tax)
  // - If either is undefined: omit them (use backend defaults for new portfolios)
  // This ensures:
  //   - Updates with tax config are sent correctly
  //   - Updates clearing tax config are sent correctly (both null)
  //   - New portfolios without tax config use backend defaults (omitted)
  const hasTaxJurisdiction = portfolio.tax_jurisdiction !== undefined
  const hasTaxConfig = portfolio.tax_config !== undefined
  
  if (hasTaxJurisdiction || hasTaxConfig) {
    // If either is defined, include both (use null if undefined)
    // This ensures we always send a complete tax configuration state
    result.tax_jurisdiction = portfolio.tax_jurisdiction ?? null
    result.tax_config = portfolio.tax_config ?? null
  }

  return result
}

/**
 * Generate a default portfolio UI structure
 */
export function createDefaultPortfolioUI(
  planStartAge: number,
  planEndAge: number
): PortfolioUI {
  return {
    name: 'New Portfolio',
    cash_allocation: 0.05, // 5% default
    weights: [
      {
        step: 0, // Start at plan start age
        stocks: 0.7, // 70% default equity
      },
    ],
    expected_returns: {
      stocks: 0.08,
      bonds: 0.04,
      cash: 0.02,
    },
    asset_costs: {
      stocks: 0.001,
      bonds: 0.001,
      cash: 0.001,
    },
    initial_portfolio_value: 0,
    cashflow_allocation: 1.0, // Will be adjusted when multiple portfolios exist
  }
}

