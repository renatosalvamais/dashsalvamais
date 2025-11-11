import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminGerador from "./pages/AdminGerador";
import AdminPropostas from "./pages/AdminPropostas";
import CadastrarEmpresa from "./pages/CadastrarEmpresa";
import AdminPlanos from "./pages/AdminPlanos";
import AdminEmpresas from "./pages/AdminEmpresas";
import AdminCadastroManual from "./pages/AdminCadastroManual";
import AdminImportarPlanilha from "./pages/AdminImportarPlanilha";
import AdminRemoverColaborador from "./pages/AdminRemoverColaborador";
import AdminListaCompleta from "./pages/AdminListaCompleta";
import CadastrarColaborador from "./pages/CadastrarColaborador";
import ImportarPlanilha from "./pages/ImportarPlanilha";
import RemoverColaborador from "./pages/RemoverColaborador";
import ListaCompleta from "./pages/ListaCompleta";
import ProgramaSupera from "./pages/ProgramaSupera";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/gerador" element={<AdminGerador />} />
        <Route path="/admin/propostas" element={<AdminPropostas />} />
        <Route path="/admin/cadastrar-empresa" element={<CadastrarEmpresa />} />
        <Route path="/admin/empresas" element={<AdminEmpresas />} />
        <Route path="/admin/planos" element={<AdminPlanos />} />
        <Route path="/admin/cadastro-manual" element={<AdminCadastroManual />} />
        <Route path="/admin/importar-planilha" element={<AdminImportarPlanilha />} />
        <Route path="/admin/remover-colaborador" element={<AdminRemoverColaborador />} />
        <Route path="/admin/lista-completa" element={<AdminListaCompleta />} />
          <Route path="/cadastrar" element={<CadastrarColaborador />} />
          <Route path="/importar-planilha" element={<ImportarPlanilha />} />
          <Route path="/remover" element={<RemoverColaborador />} />
          <Route path="/lista" element={<ListaCompleta />} />
          <Route path="/programa" element={<ProgramaSupera />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
