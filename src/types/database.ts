export type Owner = 'personal' | 'mother_in_law'
export type TransactionType = 'expense' | 'income'
export type Card = string
export type Role = 'viewer' | 'editor' | 'owner'
export type InstallmentTarget = 'credit_card' | 'transaction'

export interface Category {
  id: string
  name: string
  label: string
}

export interface Transaction {
  id: string
  month: string
  category: string
  description: string
  amount: number
  type: TransactionType
  owner: Owner
  current_installment: number | null
  total_installments: number | null
  paid: boolean
  created_at: string
  categories?: Category
}

export interface CreditCard {
  id: string
  month: string
  card: Card
  description: string
  amount: number
  current_installment: number | null
  total_installments: number | null
  owner: Owner
  created_at: string
}

export interface InstallmentPurchase {
  id: string
  start_month: string
  description: string
  total_amount: number
  installments: number
  owner: Owner
  target: InstallmentTarget
  card: string | null
  category: string | null
  created_at: string
}

export interface RecurringTemplate {
  id: string
  description: string
  amount: number
  type: TransactionType
  target: InstallmentTarget
  category: string | null
  card: string | null
  owner: Owner
  day: number
  active: boolean
  created_at: string
}

export interface Budget {
  id: string
  category: string
  monthly_limit: number
  created_at: string
}

export interface AccessControl {
  id: string
  email: string
  display_name: string | null
  role: Role
  created_at: string
}

export interface CardInfo {
  id: string
  name: string
  label: string
  credit_limit: number
  closing_day: number
  due_day: number
  color: string
  active: boolean
  created_at: string
}

export type CardListItem = Pick<CardInfo, 'name' | 'label' | 'color'>

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: Category
        Insert: Omit<Category, 'id'>
        Update: Partial<Omit<Category, 'id'>>
        Relationships: [{ foreignKeyName: 'fk_transactions_category'; columns: ['category']; referencedRelation: 'categories'; referencedColumns: ['id'] }]
      }
      transactions: {
        Row: Transaction
        Insert: Omit<Transaction, 'id' | 'created_at' | 'categories'>
        Update: Partial<Omit<Transaction, 'id' | 'created_at' | 'categories'>>
        Relationships: [{ foreignKeyName: 'fk_transactions_category'; columns: ['category']; referencedRelation: 'categories'; referencedColumns: ['id'] }]
      }
      credit_cards: {
        Row: CreditCard
        Insert: Omit<CreditCard, 'id' | 'created_at'>
        Update: Partial<Omit<CreditCard, 'id' | 'created_at'>>
        Relationships: []
      }
      installment_purchases: {
        Row: InstallmentPurchase
        Insert: Omit<InstallmentPurchase, 'id' | 'created_at'>
        Update: Partial<Omit<InstallmentPurchase, 'id' | 'created_at'>>
        Relationships: [{ foreignKeyName: 'fk_installment_category'; columns: ['category']; referencedRelation: 'categories'; referencedColumns: ['id'] }]
      }
      recurring_templates: {
        Row: RecurringTemplate
        Insert: Omit<RecurringTemplate, 'id' | 'created_at'>
        Update: Partial<Omit<RecurringTemplate, 'id' | 'created_at'>>
        Relationships: [{ foreignKeyName: 'fk_recurring_category'; columns: ['category']; referencedRelation: 'categories'; referencedColumns: ['id'] }]
      }
      budgets: {
        Row: Budget
        Insert: Omit<Budget, 'id' | 'created_at'>
        Update: Partial<Omit<Budget, 'id' | 'created_at'>>
        Relationships: [{ foreignKeyName: 'fk_budgets_category'; columns: ['category']; referencedRelation: 'categories'; referencedColumns: ['id'] }]
      }
      access_control: {
        Row: AccessControl
        Insert: Omit<AccessControl, 'id' | 'created_at'>
        Update: Partial<Omit<AccessControl, 'id' | 'created_at'>>
        Relationships: []
      }
      cards: {
        Row: CardInfo
        Insert: Omit<CardInfo, 'id' | 'created_at'>
        Update: Partial<Omit<CardInfo, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      generate_recurring: { Args: { target_month: string }; Returns: void }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
