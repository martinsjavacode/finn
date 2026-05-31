export type { Database } from './supabase-generated'
export type { Tables } from './supabase-generated'

import type { Database } from './supabase-generated'

type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']

export type TransactionType = Enums['entry_type']
export type PaymentMethod = Enums['payment_method']
export type ClosingRule = Enums['closing_rule_type']
export type Card = string
export type Role = 'viewer' | 'editor' | 'owner'
export type InstallmentTarget = 'credit_card' | 'pix'

export interface CardWithRule {
  closing_day: number
  due_day: number
  closing_rule: ClosingRule
  days_before_due: number
}

export type Account = Tables['accounts']['Row']
export type AccountMember = Tables['account_members']['Row']
export type Category = Tables['categories']['Row']
export type Entry = Tables['entries']['Row'] & { categories?: Category }
export type Transaction = Entry
export type CreditCard = Entry
export type CardInfo = Tables['cards']['Row']
export type CardListItem = Pick<CardInfo, 'name' | 'label' | 'color' | 'closing_day' | 'due_day' | 'closing_rule' | 'days_before_due'>
export type Budget = Tables['budgets']['Row']
export type RecurringTemplate = Tables['recurring_templates']['Row']
export type InstallmentPurchase = Tables['installment_purchases']['Row']

export type InvestmentType = 'renda_fixa' | 'renda_variavel' | 'crypto' | 'fundo' | 'fii' | 'fiagro' | 'etf' | 'fundo_multi' | 'fundo_acoes'
export type InvestmentTxType = 'aporte' | 'resgate' | 'rendimento' | 'dividendo'

export interface Investment {
  id: string
  account_id: string
  name: string
  type: InvestmentType
  broker: string | null
  current_balance: number
  invested_total: number
  maturity_date: string | null
  active: boolean
  created_at: string
}

export interface InvestmentTransaction {
  id: string
  investment_id: string
  account_id: string
  type: InvestmentTxType
  amount: number
  date: string
  note: string | null
  created_at: string
}
