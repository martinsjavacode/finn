export type Owner = 'personal' | 'mother_in_law'
export type TransactionType = 'expense' | 'income'
export type Category = 'house' | 'business' | 'education' | 'misc'
export type Card = 'nubank' | 'bradesco' | 'inter' | 'pague_menos' | 'mercado_pago' | 'neon'

export interface Transaction {
  id: string
  month: string
  category: Category
  description: string
  amount: number
  type: TransactionType
  owner: Owner
  created_at: string
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
      transactions: {
        Row: Transaction
        Insert: Omit<Transaction, 'id' | 'created_at'>
        Update: Partial<Omit<Transaction, 'id' | 'created_at'>>
        Relationships: []
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
