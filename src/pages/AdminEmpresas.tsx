import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Input } from "@/components/ui/input";
import { Search, Pencil } from "lucide-react";
import { formatCNPJ } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useCompanies } from "@/hooks/useCompanies";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminEmpresas() {
  const navigate = useNavigate();
  const { data: companies = [], isLoading } = useCompanies();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  const handleSelectCompany = (companyId: string, checked: boolean) => {
    if (checked) {
      setSelectedCompanies([...selectedCompanies, companyId]);
    } else {
      setSelectedCompanies(selectedCompanies.filter(id => id !== companyId));
    }
  };

  const handleEditCompany = (companyId: string) => {
    navigate(`/admin/cadastrar-empresa?edit=${companyId}`);
  };

  const filteredCompanies = companies.filter((company) =>
    company.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.cnpj.includes(searchTerm) ||
    (company.cidade || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando empresas...</p>
        </div>
      </AdminLayout>
    );
  }

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
                <TableHead className="text-xs whitespace-nowrap w-12"></TableHead>
                <TableHead className="text-xs whitespace-nowrap">CNPJ</TableHead>
                <TableHead className="text-xs whitespace-nowrap">Nome</TableHead>
                <TableHead className="text-xs whitespace-nowrap">Cidade</TableHead>
                <TableHead className="text-xs text-right whitespace-nowrap">Total de Vidas</TableHead>
                <TableHead className="text-xs text-right whitespace-nowrap">Total Individual</TableHead>
                <TableHead className="text-xs text-right whitespace-nowrap">Total Familiar</TableHead>
                <TableHead className="text-xs whitespace-nowrap">Plano</TableHead>
                <TableHead className="text-xs text-right whitespace-nowrap">% Desconto</TableHead>
                <TableHead className="text-xs text-right whitespace-nowrap">Valor</TableHead>
                <TableHead className="text-xs text-center whitespace-nowrap">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      <Checkbox
                        checked={selectedCompanies.includes(company.id)}
                        onCheckedChange={(checked) => handleSelectCompany(company.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="text-xs font-mono whitespace-nowrap">{formatCNPJ(company.cnpj)}</TableCell>
                    <TableCell className="text-xs font-medium whitespace-nowrap">{company.nome}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{company.cidade || "-"}</TableCell>
                    <TableCell className="text-xs text-right whitespace-nowrap">{company.total_vidas || 0}</TableCell>
                    <TableCell className="text-xs text-right whitespace-nowrap">{company.total_individual || 0}</TableCell>
                    <TableCell className="text-xs text-right whitespace-nowrap">{company.total_familiar || 0}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{company.plano || "-"}</TableCell>
                    <TableCell className="text-xs text-right whitespace-nowrap">{company.desconto || 0}%</TableCell>
                    <TableCell className="text-xs text-right whitespace-nowrap">
                      {(company.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    <TableCell className="text-xs text-center whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCompany(company.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-xs text-muted-foreground py-8">
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
