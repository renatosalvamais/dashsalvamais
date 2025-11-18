-- Replace RLS policies to compare CNPJ ignoring punctuation (digits-only match)

alter table if exists public.companies enable row level security;
alter table if exists public.beneficiaries enable row level security;

-- Drop existing policies if present
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'companies' and policyname = 'rh_can_select_companies_by_cnpj'
  ) then
    drop policy rh_can_select_companies_by_cnpj on public.companies;
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'companies' and policyname = 'admin_can_select_companies'
  ) then
    drop policy admin_can_select_companies on public.companies;
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'beneficiaries' and policyname = 'rh_can_select_beneficiaries'
  ) then
    drop policy rh_can_select_beneficiaries on public.beneficiaries;
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'beneficiaries' and policyname = 'admin_can_select_beneficiaries'
  ) then
    drop policy admin_can_select_beneficiaries on public.beneficiaries;
  end if;
end $$;

-- Create normalized policies
create policy rh_can_select_companies_by_cnpj
on public.companies
for select
using (
  exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'rh'
      and ur.cnpj is not null
      and regexp_replace(ur.cnpj, '[^0-9]', '', 'g') = regexp_replace(public.companies.cnpj, '[^0-9]', '', 'g')
  )
);

create policy admin_can_select_companies
on public.companies
for select
using (
  exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);

create policy rh_can_select_beneficiaries
on public.beneficiaries
for select
using (
  exists (
    select 1
    from public.companies c
    join public.user_roles ur on regexp_replace(ur.cnpj, '[^0-9]', '', 'g') = regexp_replace(c.cnpj, '[^0-9]', '', 'g')
    where c.id = public.beneficiaries.company_id
      and ur.user_id = auth.uid()
      and ur.role = 'rh'
  )
);

create policy admin_can_select_beneficiaries
on public.beneficiaries
for select
using (
  exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);