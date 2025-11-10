import { ReactNode } from "react";
import { Home, FileText, ScrollText, Building2, DollarSign, Building } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import logo from "@/assets/logo.png";

const menuItems = [
  { title: "Home", url: "/admin/dashboard", icon: Home },
  { title: "Gerador de Planilhas", url: "/admin/gerador", icon: FileText },
  { title: "Gerador de Propostas", url: "/admin/propostas", icon: ScrollText },
  { title: "Cadastrar Empresa", url: "/admin/cadastrar-empresa", icon: Building2 },
  { title: "Empresas", url: "/admin/empresas", icon: Building },
  { title: "Planos", url: "/admin/planos", icon: DollarSign },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r-0">
          <div className="p-6 border-b border-sidebar-border flex items-center justify-center">
            <img src={logo} alt="Salva+ Benefícios" className="h-12" />
          </div>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className="flex items-center gap-3 px-4 py-3 text-sidebar-foreground/80 hover:bg-sidebar-accent transition-colors"
                          activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="h-14 bg-header border-b border-header-foreground/10 flex items-center justify-between px-6">
            <div className="flex items-center gap-4 text-header-foreground">
              <span className="text-sm">Empresa: <span className="font-semibold">Salva+ Benefícios</span> - CNPJ: 34.225.216/0001-77</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-sm text-header-foreground hover:underline">
                Trocar Senha
              </button>
              <button onClick={handleLogout} className="text-sm text-header-foreground hover:underline flex items-center gap-2">
                <span>Sair</span>
                <span>→</span>
              </button>
            </div>
          </header>

          <main className="flex-1 p-8 bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
