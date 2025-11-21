import { AdminLayout } from "@/components/AdminLayout";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { normalizeCompanyName, formatCNPJ } from "@/lib/utils";
import { useProducts } from "@/hooks/useProducts";
import { usePlanStore } from "@/lib/planStore";
import { useCompany, useCreateCompany, useUpdateCompany } from "@/hooks/useCompanies";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  clubeDescontos: z.enum(["sim", "nao"]),
  clubeDescontosDependente: z.enum(["sim", "nao"]),
  telemedicina: z.enum(["sim", "nao"]),
  telemedicinaFamiliar: z.enum(["sim", "nao"]),
  unimais: z.enum(["sim", "nao"]),
  ubook: z.enum(["sim", "nao"]),
  totalpass: z.enum(["totalpass1", "totalpass2", "totalpass3", "nao"]),
  epharma: z.enum(["50", "100", "150", "nao"]),
  epharmaDependente: z.enum(["50", "100", "150", "nao"]),
});

export default function CadastrarEmpresa() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  
  const { data: products = [] } = useProducts();
  const planStore = usePlanStore();
  const { data: editingCompany, isLoading: isLoadingCompany } = useCompany(editId);
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const [valorTotal, setValorTotal] = useState(0);

  const getProductPrice = (name: string) => {
    // normaliza rótulos para comparação tolerante a acentos/maiúsculas/espacos
    const normalizeLabel = (s: string) =>
      s
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "")
        .replace(/[()\-_.]/g, "");

    // 1) tentativa por igualdade exata (preferir preço do banco se > 0)
    const exact = products.find((p) => p.name === name);
    if (exact && exact.price > 0) return exact.price;

    // 2) tentativa por igualdade normalizada
    const targetNorm = normalizeLabel(name);
    const byNorm = products.find((p) => normalizeLabel(p.name) === targetNorm);
    if (byNorm && byNorm.price > 0) return byNorm.price;

    // 3) fallback ao planStore local (preços padrão)
    const fallback = planStore.getProductPrice(name);
    if (fallback > 0) return fallback;

    // 4) se encontrou algo no banco mas com preço 0, retorna 0; caso contrário, 0
    return exact?.price ?? byNorm?.price ?? 0;
  };

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
      clubeDescontos: "nao",
      clubeDescontosDependente: "nao",
      telemedicina: "nao",
      telemedicinaFamiliar: "nao",
      unimais: "nao",
      ubook: "nao",
      totalpass: "nao",
      epharma: "nao",
      epharmaDependente: "nao",
    },
  });

  // Atualizar form quando editingCompany carregar
  useEffect(() => {
    if (editingCompany) {
      const beneficios = editingCompany.beneficios as any;
      // normaliza o valor do plano salvo (remove acentos e coloca em maiúsculas)
      const normalizePlanoKey = (v: string | null | undefined): z.infer<typeof planEnum> => {
        if (!v) return "BASICO";
        const up = v.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        // mapeia nomes para chaves aceitas pelo enum
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
        clubeDescontos: beneficios?.clubeDescontos ? "sim" : "nao",
        clubeDescontosDependente: beneficios?.clubeDescontosDependente ? "sim" : "nao",
        telemedicina: beneficios?.telemedicina ? "sim" : "nao",
        telemedicinaFamiliar: beneficios?.telemedicinaFamiliar ? "sim" : "nao",
        unimais: beneficios?.unimais ? "sim" : "nao",
        ubook: beneficios?.ubook ? "sim" : "nao",
        totalpass: beneficios?.totalpass || "nao",
        epharma: beneficios?.epharma || "nao",
        epharmaDependente: beneficios?.epharmaDependente || "nao",
      });
    }
  }, [editingCompany, form]);

  const calculateTotal = () => {
    const values = form.getValues();
    const individual = 0;
    const familiar = 0;
    const desconto = parseFloat(values.desconto) || 0;

    let total = 0;

    // Plano base
    const planoMap = {
      BASICO: { individual: "Plano Básico", familiar: "Plano Básico Familiar" },
      INTERMEDIARIO: { individual: "Plano Intermediário", familiar: "Plano Intermediário Familiar" },
      AVANCADO: { individual: "Plano Avançado", familiar: "Plano Avançado Familiar" },
      SVA: { individual: "Plano Básico", familiar: "Plano Básico Familiar" },
      CUSTOMIZADO: { individual: "Plano Básico", familiar: "Plano Básico Familiar" },
    };

    const planoTipo =
      planoMap[(values.tipoPlano as keyof typeof planoMap) || "BASICO"] ||
      planoMap["BASICO"];
    total += individual * getProductPrice(planoTipo.individual);
    total += familiar * getProductPrice(planoTipo.familiar);

    // Epharma titular
    if (values.epharma !== "nao") {
      const epharmaPrice = getProductPrice(`ePharma (${values.epharma})`);
      total += individual * epharmaPrice;
    }

    // Epharma dependente
    if (values.epharmaDependente !== "nao") {
      const epharmaDependPrice = getProductPrice(`ePharma (${values.epharmaDependente})`);
      total += familiar * epharmaDependPrice;
    }

    // TotalPass
    if (values.totalpass !== "nao") {
      const totalpassMap = {
        totalpass1: "TotalPass1",
        totalpass2: "TotalPass2",
        totalpass3: "TotalPass3",
      };
      const totalpassPrice = getProductPrice(totalpassMap[values.totalpass as keyof typeof totalpassMap]);
      total += (individual + familiar) * totalpassPrice;
    }

    // Aplicar desconto
    const totalComDesconto = total * (1 - desconto / 100);
    setValorTotal(totalComDesconto);
    return totalComDesconto;
  };

  useEffect(() => {
    const subscription = form.watch(() => {
      calculateTotal();
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Recalcula quando os produtos do Supabase são carregados/atualizados
  useEffect(() => {
    calculateTotal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Validar CNPJ único (se não estiver editando ou se mudou o CNPJ)
    const cnpjDigits = values.cnpj.replace(/\D/g, '');
    const { data: existingCompanies } = await supabase
      .from('companies')
      .select('id')
      .eq('cnpj', values.cnpj);
    
    if (existingCompanies && existingCompanies.length > 0) {
      // Se estamos editando e o CNPJ é da própria empresa, está ok
      if (!editId || existingCompanies[0].id !== editId) {
        toast.error('CNPJ já cadastrado no sistema');
        return;
      }
    }

    const desconto = parseFloat(values.desconto) || 0;
    const valor = calculateTotal();

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
      valor,
      beneficios: {
        clubeDescontos: values.clubeDescontos === "sim",
        clubeDescontosDependente: values.clubeDescontosDependente === "sim",
        telemedicina: values.telemedicina === "sim",
        telemedicinaFamiliar: values.telemedicinaFamiliar === "sim",
        unimais: values.unimais === "sim",
        ubook: values.ubook === "sim",
        totalpass: values.totalpass,
        epharma: values.epharma,
        epharmaDependente: values.epharmaDependente,
      },
    };

    if (editId) {
      updateCompany.mutate({ id: editId, ...companyData }, {
        onSuccess: () => {
          form.reset();
          navigate("/admin/empresas");
        },
      });
    } else {
      createCompany.mutate(companyData, {
        onSuccess: () => {
          form.reset();
          navigate("/admin/empresas");
        },
      });
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

                <FormItem>
                  <FormLabel>Valor Total Calculado</FormLabel>
                  <div className="text-2xl font-bold text-primary">
                    {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </FormItem>
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
                <CardTitle>Benefícios</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="clubeDescontos"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Clube de Descontos</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex gap-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="sim" />
                            </FormControl>
                            <FormLabel className="font-normal">Sim</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="nao" />
                            </FormControl>
                            <FormLabel className="font-normal">Não</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clubeDescontosDependente"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Clube de Descontos Dependente</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex gap-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="sim" />
                            </FormControl>
                            <FormLabel className="font-normal">Sim</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="nao" />
                            </FormControl>
                            <FormLabel className="font-normal">Não</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telemedicina"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Telemedicina</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex gap-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="sim" />
                            </FormControl>
                            <FormLabel className="font-normal">Sim</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="nao" />
                            </FormControl>
                            <FormLabel className="font-normal">Não</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telemedicinaFamiliar"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Telemedicina Familiar</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex gap-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="sim" />
                            </FormControl>
                            <FormLabel className="font-normal">Sim</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="nao" />
                            </FormControl>
                            <FormLabel className="font-normal">Não</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unimais"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Unimais</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex gap-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="sim" />
                            </FormControl>
                            <FormLabel className="font-normal">Sim</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="nao" />
                            </FormControl>
                            <FormLabel className="font-normal">Não</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ubook"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>uBook</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex gap-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="sim" />
                            </FormControl>
                            <FormLabel className="font-normal">Sim</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="nao" />
                            </FormControl>
                            <FormLabel className="font-normal">Não</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalpass"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TotalPass</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="totalpass1">TotalPass1</SelectItem>
                            <SelectItem value="totalpass2">TotalPass2</SelectItem>
                            <SelectItem value="totalpass3">TotalPass3</SelectItem>
                            <SelectItem value="nao">Não</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="epharma"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Epharma</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="50">Epharma (50)</SelectItem>
                            <SelectItem value="100">Epharma (100)</SelectItem>
                            <SelectItem value="150">Epharma (150)</SelectItem>
                            <SelectItem value="nao">Não</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="epharmaDependente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Epharma Dependente</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="50">Epharma (50)</SelectItem>
                            <SelectItem value="100">Epharma (100)</SelectItem>
                            <SelectItem value="150">Epharma (150)</SelectItem>
                            <SelectItem value="nao">Não</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
