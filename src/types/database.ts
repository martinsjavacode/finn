export type Owner = 'personal' | 'mother_in_law'
export type TransactionType = 'expense' | 'income'
export type Card = 'nubank' | 'bradesco' | 'inter' | 'pague_menos' | 'mercado_pago' | 'neon'

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

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: Category
        Insert: Omit<Category, 'id'>
        Update: Partial<Omit<Category, 'id'>>
        Relationships: []
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
