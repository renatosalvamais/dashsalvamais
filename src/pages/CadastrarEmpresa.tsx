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

const formSchema = z.object({
  cnpj: z.string().min(1, "CNPJ é obrigatório"),
  nomeEmpresa: z.string().min(1, "Nome da empresa é obrigatório"),
  endereco: z.string().min(1, "Endereço é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  contato: z.string().min(1, "Contato é obrigatório"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(1, "Telefone é obrigatório"),
  totalIndividual: z.string().min(1, "Total individual é obrigatório"),
  totalFamiliar: z.string().min(1, "Total familiar é obrigatório"),
  tipoPlano: z.enum(["BASICO", "INTERMEDIARIO", "AVANCADO", "SVA", "CUSTOMIZADO"]),
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
  const { data: editingCompany, isLoading: isLoadingCompany } = useCompany(editId);
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const [valorTotal, setValorTotal] = useState(0);

  const getProductPrice = (name: string) => {
    const product = products.find((p) => p.name === name);
    return product ? product.price : 0;
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
      totalIndividual: "5",
      totalFamiliar: "5",
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
      form.reset({
        cnpj: editingCompany.cnpj,
        nomeEmpresa: editingCompany.nome,
        endereco: editingCompany.endereco || "",
        cidade: editingCompany.cidade || "",
        contato: editingCompany.contato || "",
        email: editingCompany.email || "",
        telefone: editingCompany.telefone || "",
        totalIndividual: (editingCompany.total_individual || 0).toString(),
        totalFamiliar: (editingCompany.total_familiar || 0).toString(),
        tipoPlano: editingCompany.plano?.toUpperCase() as any || "BASICO",
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
    const individual = parseInt(values.totalIndividual) || 0;
    const familiar = parseInt(values.totalFamiliar) || 0;
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

    const planoTipo = planoMap[values.tipoPlano as keyof typeof planoMap];
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    const individual = parseInt(values.totalIndividual) || 0;
    const familiar = parseInt(values.totalFamiliar) || 0;
    const totalVidas = individual + familiar;
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
      total_vidas: totalVidas,
      total_individual: individual,
      total_familiar: familiar,
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
                        <Input placeholder="Nome da empresa" {...field} />
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
                  name="totalIndividual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Individual</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalFamiliar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Familiar</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  name="clubeDescontosDependente"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Clube de Descontos Dependente</FormLabel>
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
                  name="telemedicina"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Telemedicina</FormLabel>
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
                  name="telemedicinaFamiliar"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Telemedicina Familiar</FormLabel>
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
                  name="unimais"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Unimais</FormLabel>
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
                Cadastrar Empresa
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
