import { createClient } from '@/lib/supabase/client'
import { Transaction, Category, TransactionType } from '@/lib/types'

const supabase = createClient()

export const transactionService = {
    async getTransactions(month?: string, type?: TransactionType) {
        let query = supabase
            .from('transactions')
            .select('*, categories(name, icon, type, default_description), users(display_name, email)')
            .order('date', { ascending: false })

        if (month) {
            const start = `${month}-01T00:00:00.000Z`
            const d = new Date(start)
            const end = new Date(d.setMonth(d.getMonth() + 1)).toISOString()
            query = query.gte('date', start).lt('date', end)
        }
        if (type) {
            query = query.eq('type', type)
        }

        const { data, error } = await query
        if (error) throw error
        return data as Transaction[]
    },

    async getCategories() {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name', { ascending: true })
        if (error) throw error
        return data as Category[]
    },

    async updateCategory(id: string, payload: { name?: string, default_description?: string | null }) {
        const { data, error } = await supabase
            .from('categories')
            .update(payload)
            .eq('id', id)
            .select()
            .single()
        if (error) throw error
        return data as Category
    },

    async createTransaction(payload: {
        amount: number,
        type: TransactionType,
        description: string,
        category_name: string,
        date: string,
        currency?: 'ARS' | 'USD'
    }) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data: profile } = await supabase.from('users').select('household_id').eq('id', user.id).single()
        if (!profile?.household_id) throw new Error('No household')

        // 1. Get or create category
        let categoryId: string | null = null
        const { data: cat } = await supabase
            .from('categories')
            .select('id')
            .eq('household_id', profile.household_id)
            .eq('name', payload.category_name)
            .eq('type', payload.type)
            .single()

        if (cat) {
            categoryId = cat.id
        } else {
            const { data: newCat } = await supabase
                .from('categories')
                .insert({
                    household_id: profile.household_id,
                    name: payload.category_name,
                    type: payload.type,
                    is_custom: true
                })
                .select('id')
                .single()
            categoryId = newCat?.id || null
        }

        // 2. Insert transaction
        const { data, error } = await supabase.from('transactions').insert({
            household_id: profile.household_id,
            user_id: user.id,
            category_id: categoryId,
            amount: payload.amount,
            type: payload.type,
            description: payload.description,
            date: payload.date,
            currency: payload.currency || 'ARS'
        }).select('*, categories(*)').single()

        if (error) throw error
        return data as Transaction
    },

    async updateTransaction(id: string, payload: {
        amount?: number,
        type?: TransactionType,
        description?: string,
        category_name?: string,
        date?: string,
        currency?: 'ARS' | 'USD'
    }) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('users').select('household_id').eq('id', user.id).single()
        const household_id = profile?.household_id

        let categoryId = undefined
        if (payload.category_name) {
            let { data: cat } = await supabase
                .from('categories')
                .select('id')
                .eq('name', payload.category_name)
                .eq('type', payload.type || 'expense')
                .limit(1)
                .single()

            if (!cat && household_id) {
                const { data: newCat } = await supabase
                    .from('categories')
                    .insert({ 
                        name: payload.category_name, 
                        type: payload.type || 'expense', 
                        is_custom: true, 
                        household_id: household_id 
                    })
                    .select('id')
                    .single()
                cat = newCat
            }
            if (cat) categoryId = cat.id
        }

        const { data, error } = await supabase
            .from('transactions')
            .update({
                amount: payload.amount,
                type: payload.type,
                category_id: categoryId,
                description: payload.description,
                date: payload.date,
                currency: payload.currency
            })
            .eq('id', id)
            .select('*, categories(*)')
            .single()

        if (error) throw error
        return data as Transaction
    },

    async deleteTransaction(id: string) {
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    }
}
