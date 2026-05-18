-- ============================================================
-- A-1 Laundry CRM - Supabase Production Schema
-- Drop & recreate tables with consistent camelCase columns
-- Run this in Supabase SQL Editor to reset the schema
-- ============================================================

-- Drop old tables (clean slate)
DROP TABLE IF EXISTS public.expenses;
DROP TABLE IF EXISTS public.subscriptions;
DROP TABLE IF EXISTS public.orders;
DROP TABLE IF EXISTS public.customers;
DROP TABLE IF EXISTS public.enquiries;

-- ─── Enquiries ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.enquiries (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text NOT NULL,
    phone           text NOT NULL,
    source          text DEFAULT 'Direct',
    converted       text DEFAULT 'Follow-up Pending',
    "followUp"      text DEFAULT 'Tomorrow',
    date            text,
    created_at      timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- ─── Orders ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "customerPhone" text NOT NULL,
    "customerName"  text NOT NULL,
    service         text DEFAULT 'Wash+Iron',
    weight          numeric DEFAULT 0,
    "pricePerKg"    numeric DEFAULT 0,
    "deliveryChrg"  numeric DEFAULT 0,
    amount          numeric DEFAULT 0,
    payment         text DEFAULT 'Unpaid',
    pickup          text DEFAULT 'No',
    delivery        text DEFAULT 'Pending',
    status          text DEFAULT 'Pending',
    priority        text DEFAULT 'Normal',
    date            text,
    created_at      timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- ─── Customers ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customers (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text NOT NULL,
    phone           text NOT NULL,
    area            text DEFAULT '',
    address         text DEFAULT 'N/A',
    "customerType"  text DEFAULT 'Residential',
    plan            text DEFAULT 'None',
    status          text DEFAULT 'Active',
    created_at      timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- ─── Subscriptions ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "customerName"  text NOT NULL,
    phone           text NOT NULL,
    plan            text DEFAULT 'Silver',
    "startDate"     text,
    "endDate"       text,
    "remainingKg"   numeric DEFAULT 15,
    "renewalStatus" text DEFAULT 'Active',
    created_at      timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- ─── Expenses ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expenses (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type            text DEFAULT 'Petrol',
    amount          numeric DEFAULT 0,
    notes           text DEFAULT '',
    date            text,
    created_at      timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- ─── Row Level Security ─────────────────────────────────────
ALTER TABLE public.enquiries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses      ENABLE ROW LEVEL SECURITY;

-- ─── Open Policies (anon access - no auth yet) ───────────────
-- Enquiries
CREATE POLICY "anon_select_enquiries"  ON public.enquiries  FOR SELECT USING (true);
CREATE POLICY "anon_insert_enquiries"  ON public.enquiries  FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_enquiries"  ON public.enquiries  FOR UPDATE USING (true);
CREATE POLICY "anon_delete_enquiries"  ON public.enquiries  FOR DELETE USING (true);

-- Orders
CREATE POLICY "anon_select_orders"     ON public.orders     FOR SELECT USING (true);
CREATE POLICY "anon_insert_orders"     ON public.orders     FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_orders"     ON public.orders     FOR UPDATE USING (true);
CREATE POLICY "anon_delete_orders"     ON public.orders     FOR DELETE USING (true);

-- Customers
CREATE POLICY "anon_select_customers"  ON public.customers  FOR SELECT USING (true);
CREATE POLICY "anon_insert_customers"  ON public.customers  FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_customers"  ON public.customers  FOR UPDATE USING (true);
CREATE POLICY "anon_delete_customers"  ON public.customers  FOR DELETE USING (true);

-- Subscriptions
CREATE POLICY "anon_select_subs"       ON public.subscriptions FOR SELECT USING (true);
CREATE POLICY "anon_insert_subs"       ON public.subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_subs"       ON public.subscriptions FOR UPDATE USING (true);
CREATE POLICY "anon_delete_subs"       ON public.subscriptions FOR DELETE USING (true);

-- Expenses
CREATE POLICY "anon_select_expenses"   ON public.expenses   FOR SELECT USING (true);
CREATE POLICY "anon_insert_expenses"   ON public.expenses   FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_expenses"   ON public.expenses   FOR UPDATE USING (true);
CREATE POLICY "anon_delete_expenses"   ON public.expenses   FOR DELETE USING (true);
