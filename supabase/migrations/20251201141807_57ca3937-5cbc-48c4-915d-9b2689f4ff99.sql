-- Criar tabela de relacionamento empresa_planos (muitos para muitos)
CREATE TABLE IF NOT EXISTS public.empresa_planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, produto_id)
);

-- Habilitar RLS
ALTER TABLE public.empresa_planos ENABLE ROW LEVEL SECURITY;

-- Policies para empresa_planos
CREATE POLICY "Admins podem gerenciar empresa_planos"
  ON public.empresa_planos
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "RH pode ver planos da própria empresa"
  ON public.empresa_planos
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'rh'::app_role) AND
    empresa_id IN (
      SELECT id FROM public.companies
      WHERE cnpj IN (
        SELECT cnpj FROM public.user_roles
        WHERE user_id = auth.uid()
      )
    )
  );

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_empresa_planos_empresa ON public.empresa_planos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_empresa_planos_produto ON public.empresa_planos(produto_id);