import { AdminLayout } from "@/components/AdminLayout";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { normalizeCompanyName, formatCNPJ } from "@/lib/utils";
import { useProducts } from "@/hooks/useProducts";
import { useCompany, useCreateCompany, useUpdateCompany } from "@/hooks/useCompanies";
import { useUpdateEmpresaPlanos, useEmpresaPlanos } from "@/hooks/useEmpresaPlanos";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const planEnum = z.enum(["BASICO", "INTERMEDIARIO", "AVANCADO", "SVA", "CUSTOMIZADO"]);

const formSchema = z.object({
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos").refine((val) => val.replace(/\D/g, '').length === 14, "CNPJ inválido"),
  nomeEmpresa: z.string().min(1, "Nome da empresa é obrigatório"),
  endereco: z.string().min(1, "Endereço é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  contato: z.string().min(1, "Contato é obrigatório"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(1, "Telefone é obrigatório"),
  tipoPlano: planEnum,
  desconto: z.string().min(1, "Desconto é obrigatório"),
});

export default function CadastrarEmpresa() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  
  const { data: products = [] } = useProducts();
  const { data: editingCompany, isLoading: isLoadingCompany } = useCompany(editId);
  const { data: empresaPlanos = [] } = useEmpresaPlanos(editId || undefined);
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const updateEmpresaPlanos = useUpdateEmpresaPlanos();
  const [selectedPlanos, setSelectedPlanos] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cnpj: "",
      nomeEmpresa: "",
      endereco: "",
      cidade: "",
      contato: "",
      email: "",
      telefone: "",
      tipoPlano: "BASICO",
      desconto: "0",
    },
  });

  // Carregar planos vinculados quando editando
  useEffect(() => {
    if (editId && empresaPlanos.length > 0) {
      setSelectedPlanos(empresaPlanos.map(ep => ep.produto_id));
    }
  }, [editId, empresaPlanos]);

  // Atualizar form quando editingCompany carregar
  useEffect(() => {
    if (editingCompany) {
      const normalizePlanoKey = (v: string | null | undefined): z.infer<typeof planEnum> => {
        if (!v) return "BASICO";
        const up = v.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const map: Record<string, z.infer<typeof planEnum>> = {
          BASICO: "BASICO",
          INTERMEDIARIO: "INTERMEDIARIO",
          AVANCADO: "AVANCADO",
          SVA: "SVA",
          CUSTOMIZADO: "CUSTOMIZADO",
        };
        return map[up] || "BASICO";
      };
      form.reset({
        cnpj: editingCompany.cnpj,
        nomeEmpresa: editingCompany.nome,
        endereco: editingCompany.endereco || "",
        cidade: editingCompany.cidade || "",
        contato: editingCompany.contato || "",
        email: editingCompany.email || "",
        telefone: editingCompany.telefone || "",
        tipoPlano: normalizePlanoKey(editingCompany.plano) as any,
        desconto: (editingCompany.desconto || 0).toString(),
      });
    }
  }, [editingCompany, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Validar CNPJ único
    const { data: existingCompanies } = await supabase
      .from('companies')
      .select('id')
      .eq('cnpj', values.cnpj);
    
    if (existingCompanies && existingCompanies.length > 0) {
      if (!editId || existingCompanies[0].id !== editId) {
        toast.error('CNPJ já cadastrado no sistema');
        return;
      }
    }

    const desconto = parseFloat(values.desconto) || 0;

    const planoNome = {
      BASICO: "Básico",
      INTERMEDIARIO: "Intermediário",
      AVANCADO: "Avançado",
      SVA: "SVA",
      CUSTOMIZADO: "Customizado",
    }[values.tipoPlano];

    const nomeNormalizado = normalizeCompanyName(values.nomeEmpresa);

    const companyData = {
      cnpj: values.cnpj,
      nome: nomeNormalizado,
      endereco: values.endereco,
      cidade: values.cidade,
      contato: values.contato,
      email: values.email,
      telefone: values.telefone,
      total_vidas: null,
      total_individual: null,
      total_familiar: null,
      plano: planoNome,
      desconto,
      valor: null,
      beneficios: null,
    };

    try {
      if (editId) {
        await updateCompany.mutateAsync({ id: editId, ...companyData });
        await updateEmpresaPlanos.mutateAsync({
          empresaId: editId,
          produtoIds: selectedPlanos,
        });
        toast.success("Empresa atualizada com sucesso!");
        navigate("/admin/empresas");
      } else {
        const newCompany = await createCompany.mutateAsync(companyData);
        if (newCompany && selectedPlanos.length > 0) {
          await updateEmpresaPlanos.mutateAsync({
            empresaId: newCompany.id,
            produtoIds: selectedPlanos,
          });
        }
        toast.success("Empresa cadastrada com sucesso!");
        form.reset();
        setSelectedPlanos([]);
      }
    } catch (error: any) {
      console.error("Erro ao salvar empresa:", error);
      toast.error(error.message || "Erro ao salvar empresa");
    }
  }

  if (isLoadingCompany && editId) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando empresa...</p>
        </div>
      </AdminLayout>
    );
  }

  // Agrupar produtos por família (individual + familiar)
  const groupedProducts = products.reduce((acc, product) => {
    const baseName = product.name.replace(/\s*(Individual|Familiar)\s*/gi, '').trim();
    if (!acc[baseName]) {
      acc[baseName] = { individual: null, familiar: null };
    }
    if (product.name.toLowerCase().includes('familiar')) {
      acc[baseName].familiar = product;
    } else {
      acc[baseName].individual = product;
    }
    return acc;
  }, {} as Record<string, { individual: any; familiar: any }>);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {editId ? "Editar Empresa" : "Cadastrar Empresa"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {editId ? "Atualize os dados da empresa" : "Cadastre uma nova empresa no sistema"}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados da Empresa</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000/0000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nomeEmpresa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Empresa</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nome da empresa" 
                          {...field}
                          onChange={(e) => {
                            const normalized = normalizeCompanyName(e.target.value);
                            field.onChange(normalized);
                          }}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Endereço completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contato"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contato</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do contato" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@empresa.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="desconto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>% Desconto</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tipo de Plano</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="tipoPlano"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de plano" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BASICO">BÁSICO</SelectItem>
                            <SelectItem value="INTERMEDIARIO">INTERMEDIÁRIO</SelectItem>
                            <SelectItem value="AVANCADO">AVANÇADO</SelectItem>
                            <SelectItem value="SVA">SVA</SelectItem>
                            <SelectItem value="CUSTOMIZADO">CUSTOMIZADO</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Planos e Serviços</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Selecione os planos que esta empresa terá acesso (Individual e/ou Familiar)
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(groupedProducts).map(([baseName, variants]) => (
                  <div key={baseName} className="border border-border rounded-lg p-4">
                    <h3 className="font-semibold text-sm mb-3">{baseName}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {variants.individual && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`plano-${variants.individual.id}`}
                            checked={selectedPlanos.includes(variants.individual.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPlanos([...selectedPlanos, variants.individual.id]);
                              } else {
                                setSelectedPlanos(selectedPlanos.filter(id => id !== variants.individual.id));
                              }
                            }}
                          />
                          <label
                            htmlFor={`plano-${variants.individual.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            Individual - R$ {variants.individual.price.toFixed(2)}
                          </label>
                        </div>
                      )}
                      {variants.familiar && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`plano-${variants.familiar.id}`}
                            checked={selectedPlanos.includes(variants.familiar.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPlanos([...selectedPlanos, variants.familiar.id]);
                              } else {
                                setSelectedPlanos(selectedPlanos.filter(id => id !== variants.familiar.id));
                              }
                            }}
                          />
                          <label
                            htmlFor={`plano-${variants.familiar.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            Familiar - R$ {variants.familiar.price.toFixed(2)}
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {selectedPlanos.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    <strong>{selectedPlanos.length}</strong> plano(s) selecionado(s)
                  </p>
                )}
                {products.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum plano cadastrado. Cadastre planos na página "Planos" primeiro.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" size="lg">
                {editId ? "Salvar alterações" : "Cadastrar Empresa"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
