-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'rh');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  cnpj TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  endereco TEXT,
  contato TEXT,
  email TEXT,
  telefone TEXT,
  cidade TEXT,
  total_vidas INTEGER DEFAULT 0,
  total_individual INTEGER DEFAULT 0,
  total_familiar INTEGER DEFAULT 0,
  plano TEXT,
  desconto DECIMAL(5,2) DEFAULT 0,
  valor DECIMAL(10,2) DEFAULT 0,
  beneficios JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RH can view own company"
  ON public.companies FOR SELECT
  USING (
    public.has_role(auth.uid(), 'rh') AND 
    cnpj IN (SELECT cnpj FROM public.user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all companies"
  ON public.companies FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage companies"
  ON public.companies FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create employees/beneficiaries table
CREATE TABLE public.beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  telefone TEXT,
  dependentes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ativo',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RH can view own company beneficiaries"
  ON public.beneficiaries FOR SELECT
  USING (
    public.has_role(auth.uid(), 'rh') AND 
    company_id IN (
      SELECT id FROM public.companies 
      WHERE cnpj IN (SELECT cnpj FROM public.user_roles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all beneficiaries"
  ON public.beneficiaries FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "RH can manage own company beneficiaries"
  ON public.beneficiaries FOR ALL
  USING (
    public.has_role(auth.uid(), 'rh') AND 
    company_id IN (
      SELECT id FROM public.companies 
      WHERE cnpj IN (SELECT cnpj FROM public.user_roles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage all beneficiaries"
  ON public.beneficiaries FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create import logs table
CREATE TABLE public.import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  filename TEXT,
  total_rows INTEGER,
  success_count INTEGER,
  error_count INTEGER,
  errors JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own import logs"
  ON public.import_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all import logs"
  ON public.import_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial products data
INSERT INTO public.products (name, price, display_order) VALUES
  ('Plano Básico', 39.90, 1),
  ('Plano Básico Familiar', 69.90, 2),
  ('Plano Intermediário', 49.90, 3),
  ('Plano Intermediário Familiar', 79.90, 4),
  ('Plano Avançado', 59.90, 5),
  ('Plano Avançado Familiar', 89.90, 6),
  ('ePharma (50)', 0.00, 7),
  ('ePharma (100)', 9.90, 8),
  ('ePharma (150)', 14.90, 9),
  ('TotalPass1', 19.90, 10),
  ('TotalPass2', 14.90, 11),
  ('TotalPass3', 12.90, 12),
  ('Ubook', 1.00, 13),
  ('Braslivros', 1.00, 14);