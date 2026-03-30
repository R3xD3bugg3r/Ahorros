-- MIGRACION PARA TARJETAS DE CREDITO Y CUOTAS

-- 1. Crear tabla de tarjetas si no existe
CREATE TABLE IF NOT EXISTS public.credit_cards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  bank text,
  closing_day int check (closing_day >= 1 and closing_day <= 31),
  due_day int check (due_day >= 1 and due_day <= 31),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Asegurar que las categorías tengan los nuevos tipos
DO $$ 
BEGIN
  ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_type_check;
  ALTER TABLE public.categories ADD CONSTRAINT categories_type_check CHECK (type IN ('income', 'expense', 'investment', 'savings'));
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- 3. Agregar columnas a transactions si no existen
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='payment_method') THEN
    ALTER TABLE public.transactions ADD COLUMN payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'debit', 'credit_card'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='credit_card_id') THEN
    ALTER TABLE public.transactions ADD COLUMN credit_card_id uuid REFERENCES public.credit_cards(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='installments_count') THEN
    ALTER TABLE public.transactions ADD COLUMN installments_count int DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='installment_number') THEN
    ALTER TABLE public.transactions ADD COLUMN installment_number int DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='statement_month') THEN
    ALTER TABLE public.transactions ADD COLUMN statement_month text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='is_consolidated') THEN
    ALTER TABLE public.transactions ADD COLUMN is_consolidated boolean DEFAULT false;
  END IF;
END $$;

-- 4. Habilitar RLS en la nueva tabla
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas para credit_cards (borrando si existen)
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
