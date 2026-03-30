-- Supabase Schema para Santa Clara 2026

-- 1. Tabla: households (Hogares / Parejas)
CREATE TABLE IF NOT EXISTS public.households (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla: users (Perfiles de usuario extendidos)
-- Se enlaza con auth.users automáticamente vía triggers (opcional) o manualmente.
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  display_name text,
  email text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla: categories (Categorías de ingresos y gastos)
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES public.households(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense', 'investment', 'savings')),
  icon text,
  is_custom boolean DEFAULT false,
  default_description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabla: credit_cards (Tarjetas de Crédito)
CREATE TABLE IF NOT EXISTS public.credit_cards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  bank text,
  closing_day int check (closing_day >= 1 and closing_day <= 31),
  due_day int check (due_day >= 1 and due_day <= 31),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabla: transactions (Transacciones: Ingresos y Gastos)
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  credit_card_id uuid REFERENCES public.credit_cards(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('income', 'expense', 'investment', 'savings')),
  description text,
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'debit', 'credit_card')),
  installments_count int DEFAULT 1,
  installment_number int DEFAULT 1,
  statement_month text, -- Formato 'YYYY-MM'
  is_consolidated boolean DEFAULT false,
  date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

--------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
--------------------------------------------------------

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Helper function para obtener el household_id del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_household_id()
RETURNS uuid
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT household_id FROM public.users WHERE id = auth.uid();
$$;

-- Policies for households
DROP POLICY IF EXISTS "Users can view their own household" ON public.households;
CREATE POLICY "Users can view their own household" ON public.households
  FOR SELECT USING (id = public.get_user_household_id());

DROP POLICY IF EXISTS "Users can update their own household" ON public.households;
CREATE POLICY "Users can update their own household" ON public.households
  FOR UPDATE USING (id = public.get_user_household_id());

DROP POLICY IF EXISTS "Users can insert households" ON public.households;
CREATE POLICY "Users can insert households" ON public.households
  FOR INSERT WITH CHECK (true);

-- Policies for users
DROP POLICY IF EXISTS "Users can view profiles in same household" ON public.users;
CREATE POLICY "Users can view profiles in same household" ON public.users
  FOR SELECT USING (household_id = public.get_user_household_id() OR id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

-- Policies for categories
DROP POLICY IF EXISTS "Users can read categories of their household or global/system categories" ON public.categories;
CREATE POLICY "Users can read categories of their household or global/system categories" ON public.categories
  FOR SELECT USING (household_id = public.get_user_household_id() OR household_id IS NULL);

DROP POLICY IF EXISTS "Users can insert categories to their household" ON public.categories;
CREATE POLICY "Users can insert categories to their household" ON public.categories
  FOR INSERT WITH CHECK (household_id = public.get_user_household_id());

DROP POLICY IF EXISTS "Users can update their household categories" ON public.categories;
CREATE POLICY "Users can update their household categories" ON public.categories
  FOR UPDATE USING (household_id = public.get_user_household_id());

DROP POLICY IF EXISTS "Users can delete their household categories" ON public.categories;
CREATE POLICY "Users can delete their household categories" ON public.categories
  FOR DELETE USING (household_id = public.get_user_household_id());

-- Policies for credit_cards
DROP POLICY IF EXISTS "Users can view credit cards from their household" ON public.credit_cards;
CREATE POLICY "Users can view credit cards from their household" ON public.credit_cards
  FOR SELECT USING (household_id = public.get_user_household_id());

DROP POLICY IF EXISTS "Users can insert credit cards for their household" ON public.credit_cards;
CREATE POLICY "Users can insert credit cards for their household" ON public.credit_cards
  FOR INSERT WITH CHECK (household_id = public.get_user_household_id());

DROP POLICY IF EXISTS "Users can update their household credit cards" ON public.credit_cards;
CREATE POLICY "Users can update their household credit cards" ON public.credit_cards
  FOR UPDATE USING (household_id = public.get_user_household_id());

DROP POLICY IF EXISTS "Users can delete their household credit cards" ON public.credit_cards;
CREATE POLICY "Users can delete their household credit cards" ON public.credit_cards
  FOR DELETE USING (household_id = public.get_user_household_id());

-- Policies for transactions
DROP POLICY IF EXISTS "Users can view transactions from their household" ON public.transactions;
CREATE POLICY "Users can view transactions from their household" ON public.transactions
  FOR SELECT USING (household_id = public.get_user_household_id());

DROP POLICY IF EXISTS "Users can insert transactions for their household" ON public.transactions;
CREATE POLICY "Users can insert transactions for their household" ON public.transactions
  FOR INSERT WITH CHECK (household_id = public.get_user_household_id());

DROP POLICY IF EXISTS "Users can update their household transactions" ON public.transactions;
CREATE POLICY "Users can update their household transactions" ON public.transactions
  FOR UPDATE USING (household_id = public.get_user_household_id());

DROP POLICY IF EXISTS "Users can delete their household transactions" ON public.transactions;
CREATE POLICY "Users can delete their household transactions" ON public.transactions
  FOR DELETE USING (household_id = public.get_user_household_id());

--------------------------------------------------------
-- SEED DATA (Global Categories)
--------------------------------------------------------

INSERT INTO public.categories (name, type, icon, is_custom) VALUES
('Sueldo', 'income', 'briefcase', false),
('Inversiones', 'income', 'trending-up', false),
('Supermercado', 'expense', 'shopping-cart', false),
('Alquiler', 'expense', 'home', false),
('Servicios', 'expense', 'zap', false),
('Salidas', 'expense', 'coffee', false)
ON CONFLICT DO NOTHING;
