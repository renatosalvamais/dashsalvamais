import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminGerador from "./pages/AdminGerador";
import AdminPropostas from "./pages/AdminPropostas";
import CadastrarEmpresa from "./pages/CadastrarEmpresa";
import AdminPlanos from "./pages/AdminPlanos";
import AdminEmpresas from "./pages/AdminEmpresas";
import AdminUsuarios from "./pages/AdminUsuarios";
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
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/gerador" element={<ProtectedRoute><AdminGerador /></ProtectedRoute>} />
            <Route path="/admin/propostas" element={<ProtectedRoute><AdminPropostas /></ProtectedRoute>} />
            <Route path="/admin/cadastrar-empresa" element={<ProtectedRoute><CadastrarEmpresa /></ProtectedRoute>} />
            <Route path="/admin/empresas" element={<ProtectedRoute><AdminEmpresas /></ProtectedRoute>} />
            <Route path="/admin/planos" element={<ProtectedRoute><AdminPlanos /></ProtectedRoute>} />
            <Route path="/admin/usuarios" element={<ProtectedRoute><AdminUsuarios /></ProtectedRoute>} />
            <Route path="/admin/cadastro-manual" element={<ProtectedRoute><AdminCadastroManual /></ProtectedRoute>} />
            <Route path="/admin/importar-planilha" element={<ProtectedRoute><AdminImportarPlanilha /></ProtectedRoute>} />
            <Route path="/admin/remover-colaborador" element={<ProtectedRoute><AdminRemoverColaborador /></ProtectedRoute>} />
            <Route path="/admin/lista-completa" element={<ProtectedRoute><AdminListaCompleta /></ProtectedRoute>} />
            <Route path="/cadastrar" element={<ProtectedRoute><CadastrarColaborador /></ProtectedRoute>} />
            <Route path="/importar-planilha" element={<ProtectedRoute><ImportarPlanilha /></ProtectedRoute>} />
            <Route path="/remover" element={<ProtectedRoute><RemoverColaborador /></ProtectedRoute>} />
            <Route path="/lista" element={<ProtectedRoute><ListaCompleta /></ProtectedRoute>} />
            <Route path="/programa" element={<ProtectedRoute><ProgramaSupera /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
