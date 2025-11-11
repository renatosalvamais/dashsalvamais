import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const AdminUsuarios = () => {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "rh">("rh");
  const [cnpj, setCnpj] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          id,
          role,
          cnpj,
          created_at,
          profiles!inner(email)
        `);
      
      if (error) throw error;
      return data;
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Usuário não criado");

      // Create profile
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({ id: authData.user.id, email });

      if (profileError) throw profileError;

      // Create user role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: role,
          cnpj: role === "rh" ? cnpj : null,
        });

      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário criado com sucesso!");
      setEmail("");
      setPassword("");
      setCnpj("");
      setRole("rh");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar usuário");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (role === "rh" && !cnpj) {
      toast.error("CNPJ é obrigatório para usuários RH");
      return;
    }

    createUserMutation.mutate();
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-8">Carregando usuários...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestão de Usuários</h1>
          <p className="text-muted-foreground">Crie e gerencie contas de Admin e RH</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Criar Novo Usuário</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Tipo de Acesso</Label>
                <Select value={role} onValueChange={(value: "admin" | "rh") => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="rh">RH (Empresa)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === "rh" && (
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ da Empresa</Label>
                  <Input
                    id="cnpj"
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            <Button type="submit" disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Usuários Cadastrados</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>{user.profiles.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.role === "admin" 
                        ? "bg-primary/10 text-primary" 
                        : "bg-secondary/10 text-secondary-foreground"
                    }`}>
                      {user.role === "admin" ? "Admin" : "RH"}
                    </span>
                  </TableCell>
                  <TableCell>{user.cnpj || "-"}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminUsuarios;
