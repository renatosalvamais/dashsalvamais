import { AdminLayout } from "@/components/AdminLayout";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";

const formSchema = z.object({
  cnpj: z.string().min(1, "CNPJ é obrigatório"),
  nomeEmpresa: z.string().min(1, "Nome da empresa é obrigatório"),
  endereco: z.string().min(1, "Endereço é obrigatório"),
  contato: z.string().min(1, "Contato é obrigatório"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(1, "Telefone é obrigatório"),
  tipoPlano: z.enum(["BASICO", "INTERMEDIARIO", "AVANCADO", "SVA", "CUSTOMIZADO"]),
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
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cnpj: "",
      nomeEmpresa: "",
      endereco: "",
      contato: "",
      email: "",
      telefone: "",
      tipoPlano: "BASICO",
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast.success("Empresa cadastrada com sucesso!");
    form.reset();
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cadastrar Empresa</h1>
          <p className="text-muted-foreground mt-2">
            Cadastre uma nova empresa no sistema
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
