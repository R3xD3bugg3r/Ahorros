-- Supabase Schema para FinanzasEnPareja

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
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  icon text,
  is_custom boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabla: transactions (Transacciones: Ingresos y Gastos)
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  description text,
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
CREATE POLICY "Users can view their own household" ON public.households
  FOR SELECT USING (id = public.get_user_household_id());
CREATE POLICY "Users can update their own household" ON public.households
  FOR UPDATE USING (id = public.get_user_household_id());

-- Policies for users
CREATE POLICY "Users can view profiles in same household" ON public.users
  FOR SELECT USING (household_id = public.get_user_household_id() OR id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- Policies for categories
CREATE POLICY "Users can read categories of their household or global/system categories" ON public.categories
  FOR SELECT USING (household_id = public.get_user_household_id() OR household_id IS NULL);
CREATE POLICY "Users can insert categories to their household" ON public.categories
  FOR INSERT WITH CHECK (household_id = public.get_user_household_id());
CREATE POLICY "Users can update their household categories" ON public.categories
  FOR UPDATE USING (household_id = public.get_user_household_id());
CREATE POLICY "Users can delete their household categories" ON public.categories
  FOR DELETE USING (household_id = public.get_user_household_id());

-- Policies for transactions
CREATE POLICY "Users can view transactions from their household" ON public.transactions
  FOR SELECT USING (household_id = public.get_user_household_id());
CREATE POLICY "Users can insert transactions for their household" ON public.transactions
  FOR INSERT WITH CHECK (household_id = public.get_user_household_id());
CREATE POLICY "Users can update their household transactions" ON public.transactions
  FOR UPDATE USING (household_id = public.get_user_household_id());
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
