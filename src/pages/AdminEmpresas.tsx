import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Company {
  id: string;
  cnpj: string;
  nome: string;
  cidade: string;
  totalVidas: number;
  totalIndividual: number;
  totalFamiliar: number;
  plano: string;
  desconto: number;
  valor: number;
}

// Mock data - será substituído por dados reais do banco
const mockCompanies: Company[] = [
  {
    id: "1",
    cnpj: "12.345.678/0001-90",
    nome: "Empresa Exemplo Ltda",
    cidade: "São Paulo",
    totalVidas: 150,
    totalIndividual: 100,
    totalFamiliar: 50,
    plano: "Plano A",
    desconto: 10,
    valor: 5985.00,
  },
  {
    id: "2",
    cnpj: "98.765.432/0001-10",
    nome: "Tech Solutions S.A.",
    cidade: "Rio de Janeiro",
    totalVidas: 80,
    totalIndividual: 60,
    totalFamiliar: 20,
    plano: "Plano B",
    desconto: 15,
    valor: 3192.00,
  },
  {
    id: "3",
    cnpj: "11.222.333/0001-44",
    nome: "Comércio Brasil LTDA",
    cidade: "Belo Horizonte",
    totalVidas: 200,
    totalIndividual: 120,
    totalFamiliar: 80,
    plano: "Plano C",
    desconto: 8,
    valor: 7344.00,
  },
];

export default function AdminEmpresas() {
  const [companies] = useState<Company[]>(mockCompanies);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCompanies = companies.filter((company) =>
    company.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.cnpj.includes(searchTerm) ||
    company.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Empresas Cadastradas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie todas as empresas cadastradas no sistema
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CNPJ ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="border rounded-lg bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs whitespace-nowrap">CNPJ</TableHead>
                <TableHead className="text-xs whitespace-nowrap">Nome</TableHead>
                <TableHead className="text-xs whitespace-nowrap">Cidade</TableHead>
                <TableHead className="text-xs text-right whitespace-nowrap">Total de Vidas</TableHead>
                <TableHead className="text-xs text-right whitespace-nowrap">Total Individual</TableHead>
                <TableHead className="text-xs text-right whitespace-nowrap">Total Familiar</TableHead>
                <TableHead className="text-xs whitespace-nowrap">Plano</TableHead>
                <TableHead className="text-xs text-right whitespace-nowrap">% Desconto</TableHead>
                <TableHead className="text-xs text-right whitespace-nowrap">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="text-xs font-mono whitespace-nowrap">{company.cnpj}</TableCell>
                    <TableCell className="text-xs font-medium whitespace-nowrap">{company.nome}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{company.cidade}</TableCell>
                    <TableCell className="text-xs text-right whitespace-nowrap">{company.totalVidas}</TableCell>
                    <TableCell className="text-xs text-right whitespace-nowrap">{company.totalIndividual}</TableCell>
                    <TableCell className="text-xs text-right whitespace-nowrap">{company.totalFamiliar}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{company.plano}</TableCell>
                    <TableCell className="text-xs text-right whitespace-nowrap">{company.desconto}%</TableCell>
                    <TableCell className="text-xs text-right whitespace-nowrap">
                      {company.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-xs text-muted-foreground py-8">
                    Nenhuma empresa encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="text-xs text-muted-foreground">
          Total: {filteredCompanies.length} empresa(s)
        </div>
      </div>
    </AdminLayout>
  );
}
