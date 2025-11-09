import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
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
