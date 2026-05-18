-- Create Enquiries Table
CREATE TABLE IF NOT EXISTS public.enquiries (
    id text PRIMARY KEY,
    date text,
    name text,
    phone text,
    source text,
    converted text,
    "followUp" text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id text PRIMARY KEY,
    date text,
    "customerPhone" text,
    "customerName" text,
    service text,
    "pricePerKg" numeric,
    weight numeric,
    "deliveryChrg" numeric,
    amount numeric,
    payment text,
    pickup text,
    delivery text,
    status text,
    priority text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id text PRIMARY KEY,
    name text,
    phone text,
    area text,
    address text,
    "customerType" text,
    plan text,
    status text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id text PRIMARY KEY,
    "customerName" text,
    phone text,
    plan text,
    "startDate" text,
    "endDate" text,
    "remainingKg" numeric,
    "renewalStatus" text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id text PRIMARY KEY,
    date text,
    type text,
    amount numeric,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create Policies for Anonymous Access (Since no Auth is setup yet)
-- Note: In a production environment with users, you should restrict this to authenticated users.

-- Policies for Enquiries
CREATE POLICY "Allow anonymous select on enquiries" ON public.enquiries FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on enquiries" ON public.enquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on enquiries" ON public.enquiries FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete on enquiries" ON public.enquiries FOR DELETE USING (true);

-- Policies for Orders
CREATE POLICY "Allow anonymous select on orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete on orders" ON public.orders FOR DELETE USING (true);

-- Policies for Customers
CREATE POLICY "Allow anonymous select on customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on customers" ON public.customers FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete on customers" ON public.customers FOR DELETE USING (true);

-- Policies for Subscriptions
CREATE POLICY "Allow anonymous select on subscriptions" ON public.subscriptions FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on subscriptions" ON public.subscriptions FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete on subscriptions" ON public.subscriptions FOR DELETE USING (true);

-- Policies for Expenses
CREATE POLICY "Allow anonymous select on expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on expenses" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on expenses" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete on expenses" ON public.expenses FOR DELETE USING (true);
