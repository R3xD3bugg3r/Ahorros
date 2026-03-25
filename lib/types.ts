// Tipos base para FinanzasEnPareja

export type TransactionType = 'income' | 'expense'

export interface Household {
    id: string
    name: string
    created_at: string
}

export interface UserProfile {
    id: string
    household_id: string | null
    display_name: string | null
    email: string | null
    created_at: string
}

export interface Category {
    id: string
    household_id: string | null
    name: string
    type: TransactionType
    icon: string | null
    is_custom: boolean
    created_at: string
}

export interface Transaction {
    id: string
    household_id: string
    user_id: string
    category_id: string | null
    amount: number
    type: TransactionType
    description: string | null
    date: string
    created_at: string
    // Joined fields
    categories?: Category
    users?: UserProfile
}

export interface MonthlyBalance {
    totalIncome: number
    totalExpense: number
    balance: number
    month: string
}

export interface GastoHormiga {
    category_id: string | null
    category_name: string
    description: string | null
    count: number
    total_amount: number
    average_amount: number
    transactions: Transaction[]
}

export interface CategorySummary {
    category_name: string
    total: number
    count: number
    percentage: number
}
