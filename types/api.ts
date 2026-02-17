// API Types based on API_DOCUMENTATION.md

export interface User {
  id: number
  email: string
  name: string
  is_active: boolean
  is_verified: boolean
  created_at: string // ISO 8601 datetime
}

export interface FinancialPlan {
  id?: number // Optional, auto-generated on create
  user_id?: number // Auto-set from authenticated user
  name: string
  description: string
  start_age: number
  retirement_age: number
  plan_end_age: number
  plan_start_date: string // ISO 8601 datetime
  current_portfolio_value: number
  portfolio_target_value: number
}

export interface CashFlow {
  id?: number // Optional, auto-generated on create
  plan_id: number // Set from URL path on create
  portfolio_id?: number | null // Optional: when set, this is a portfolio-specific cashflow; when null/omitted, it's a plan-level cashflow
  name: string
  description: string
  amount: number // Interpretation depends on 'basis' (see below)
  periodicity?: 'monthly' | 'quarterly' | 'annually' | 'one_off' // Time unit for cashflow occurrence (default: "monthly")
  frequency?: number // Number of periods to skip between occurrences (default: 1, ignored for "one_off")
  start_date?: string // ISO 8601 datetime, required for recurring cashflows, optional for one_off
  end_date?: string | null // ISO 8601 datetime, required for recurring cashflows, optional for one_off
  basis?: 'fixed' | 'pct_total_income' | 'pct_specific_income' | 'pct_savings'
  // How to interpret 'amount':
  // - "fixed"              => amount is a nominal currency value (e.g., 500 = $500)
  // - "pct_total_income"   => amount is a percentage of total income at each timestep (e.g., 10 = 10% of total income)
  // - "pct_specific_income"=> amount is a percentage of a specific income cashflow (identified by reference_cashflow_id)
  // - "pct_savings"        => amount is a percentage of net savings (income - expenses) at each timestep
  reference_cashflow_id?: number | null // Optional id of another CashFlow this one is based on (used with "pct_specific_income" basis)
  include_in_main_savings?: boolean
  // Whether this cashflow should be included when computing plan-level net savings (income - expenses):
  // - true  => contributes to the shared income/expense pool (default for normal income/expenses)
  // - false => treated as a portfolio-specific adjustment (e.g., employer/government contributions) and
  //            does not change the shared net savings that get allocated across portfolios
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AdviserConfig {
  risk_allocation_map: Record<number, number> // Risk level -> allocation percentage (deprecated, kept for backend compatibility)
  inflation: number
  asset_costs: Record<string, number> // Asset type -> cost percentage
  expected_returns: Record<string, number> // Asset type -> expected return
  number_of_simulations: number
  allocation_step?: number // Frontend-only: Step size for allocation inputs (e.g., 0.10 = 10% increments)
  tax_jurisdiction?: string | null // Default tax jurisdiction (e.g., "nz", "au") for new portfolios. Optional.
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface LogoutRequest {
  refresh_token: string
}

export interface ChatMessageRequest {
  message: string
}

export interface ChatHistoryResponse {
  messages: ChatMessage[]
}

export interface ExportChatRequest {
  trigger_parser: boolean
}

export interface ExportChatResponse {
  success: boolean
  chat_text?: string
  filepath?: string
  error?: string
}

export interface SimulationRequest {
  financial_plan_id: number // Required: ID of the financial plan to simulate
  cash_flows?: CashFlow[] // Optional: Override cash flows from database
  adviser_config?: AdviserConfig // Optional: Override default adviser configuration
}

export interface SimulationResponse {
  success: boolean
  result?: any // Simulation results (structure depends on simulation engine)
  error?: string // Error message if simulation failed
  traceback?: string // Full traceback if available (for debugging)
}

// Portfolio Types
export interface SimulationPortfolioWeights {
  step: number // Time step (year) for this weight configuration
  stocks: number // Stock allocation (0.0 to 1.0)
  bonds: number // Bond allocation (0.0 to 1.0)
  cash: number // Cash allocation (calculated as 1 - stocks - bonds)
}

export interface ExpectedReturns {
  stocks?: number // Expected return for stocks (0.0 to 1.0, optional)
  bonds?: number // Expected return for bonds (0.0 to 1.0, optional)
  cash?: number | null // Expected return for cash (0.0 to 1.0, optional)
}

export interface AssetCosts {
  stocks: number // Asset cost for stocks (0.0 to 1.0)
  bonds: number // Asset cost for bonds (0.0 to 1.0)
  cash: number // Asset cost for cash (0.0 to 1.0)
}

// Tax Configuration Types
export interface NewZealandTaxConfig {
  jurisdiction: "nz"
  pir_rate: number // 0.0 to 1.0
  marginal_tax_rate: number // 0.0 to 1.0
  percent_pie_fund: number // 0.0 to 1.0
  percent_fif_fund: number // 0.0 to 1.0
}

// Union type for future jurisdictions
export type TaxConfig = NewZealandTaxConfig
// Future: | AustralianTaxConfig | USTaxConfig | ...

// Supported tax jurisdictions
export type TaxJurisdiction = "nz" | null
// Future: | "au" | "us" | ...

export interface Portfolio {
  id?: number // Optional, auto-generated database primary key
  plan_id?: number // Financial plan this portfolio belongs to (set from URL on create)
  name?: string // Optional name for the portfolio
  weights: SimulationPortfolioWeights[] // Array of weight configurations over time
  expected_returns: ExpectedReturns // Expected returns for each asset class
  asset_costs: AssetCosts // Asset costs for each asset class
  initial_portfolio_value: number // Nominal dollar value of initial wealth allocated to this portfolio
  cashflow_allocation: number // Fraction of cashflows (must sum to 1.0 across all portfolios)
  tax_jurisdiction?: string | null
  tax_config?: TaxConfig | null
}

// UI-specific portfolio type (for form handling)
export interface PortfolioUI {
  id?: number // Optional for new portfolios (auto-generated by backend)
  plan_id?: number // Financial plan this portfolio belongs to
  name: string
  cash_allocation: number // Constant cash % (0-1)
  weights: Array<{ step: number; stocks: number }> // Only stocks, bonds inferred
  expected_returns: ExpectedReturns
  asset_costs: AssetCosts
  initial_portfolio_value: number
  cashflow_allocation: number
  tax_jurisdiction?: string | null
  tax_config?: TaxConfig | null
}

