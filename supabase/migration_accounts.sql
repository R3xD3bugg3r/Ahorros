-- Migración: Agregar Cuentas (Bancos/Efectivo)

-- 1. Crear tabla de cuentas
CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('bank', 'cash', 'virtual_wallet')),
  currency text DEFAULT 'ARS' CHECK (currency IN ('ARS', 'USD')),
  initial_balance numeric(12,2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Vincular transacciones con cuentas
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;

-- 3. Habilitar RLS para cuentas
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view accounts from their household" ON public.accounts;
CREATE POLICY "Users can view accounts from their household" ON public.accounts
  FOR SELECT USING (household_id = public.get_user_household_id());

DROP POLICY IF EXISTS "Users can insert accounts for their household" ON public.accounts;
CREATE POLICY "Users can insert accounts for their household" ON public.accounts
  FOR INSERT WITH CHECK (household_id = public.get_user_household_id());

DROP POLICY IF EXISTS "Users can update their household accounts" ON public.accounts;
CREATE POLICY "Users can update their household accounts" ON public.accounts
  FOR UPDATE USING (household_id = public.get_user_household_id());

DROP POLICY IF EXISTS "Users can delete their household accounts" ON public.accounts;
CREATE POLICY "Users can delete their household accounts" ON public.accounts
  FOR DELETE USING (household_id = public.get_user_household_id());
