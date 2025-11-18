-- Policies to allow RH/Admin users to read companies and beneficiaries by CNPJ linkage
-- Safe creation using IF NOT EXISTS checks

-- Enable RLS (idempotent; enabling twice is harmless)
alter table if exists public.companies enable row level security;
alter table if exists public.beneficiaries enable row level security;

-- Helpful indexes
create index if not exists companies_cnpj_idx on public.companies (cnpj);
create index if not exists beneficiaries_company_id_idx on public.beneficiaries (company_id);

-- Companies: RH can select when their user_roles.cnpj matches companies.cnpj
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'companies'
      and policyname = 'rh_can_select_companies_by_cnpj'
  ) then
    create policy rh_can_select_companies_by_cnpj
    on public.companies
    for select
    using (
      exists (
        select 1 from public.user_roles ur
        where ur.user_id = auth.uid()
          and ur.role = 'rh'
          and ur.cnpj is not null
          and ur.cnpj = companies.cnpj
      )
    );
  end if;
end $$;

-- Companies: Admins can select all
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'companies'
      and policyname = 'admin_can_select_companies'
  ) then
    create policy admin_can_select_companies
    on public.companies
    for select
    using (
      exists (
        select 1 from public.user_roles ur
        where ur.user_id = auth.uid()
          and ur.role = 'admin'
      )
    );
  end if;
end $$;

-- Beneficiaries: RH can select when their CNPJ matches the company's CNPJ of the beneficiary
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'beneficiaries'
      and policyname = 'rh_can_select_beneficiaries'
  ) then
    create policy rh_can_select_beneficiaries
    on public.beneficiaries
    for select
    using (
      exists (
        select 1
        from public.companies c
        join public.user_roles ur on ur.cnpj = c.cnpj
        where c.id = beneficiaries.company_id
          and ur.user_id = auth.uid()
          and ur.role = 'rh'
      )
    );
  end if;
end $$;

-- Beneficiaries: Admins can select all
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'beneficiaries'
      and policyname = 'admin_can_select_beneficiaries'
  ) then
    create policy admin_can_select_beneficiaries
    on public.beneficiaries
    for select
    using (
      exists (
        select 1 from public.user_roles ur
        where ur.user_id = auth.uid()
          and ur.role = 'admin'
      )
    );
  end if;
end $$;