import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import PartnerDashboard from "./pages/PartnerDashboard";
import Directory from "./pages/Directory";
import Projects from "./pages/Projects";
import ProjectNew from "./pages/ProjectNew";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectEdit from "./pages/ProjectEdit";
import ProjectApply from "./pages/ProjectApply";
import ClientChallenges from "./pages/ClientChallenges";
import ClientChallengeNew from "./pages/ClientChallengeNew";
import ClientChallengeEdit from "./pages/ClientChallengeEdit";
import Inbox from "./pages/Inbox";
import Proposals from "./pages/Proposals";
import Training from "./pages/Training";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ResetPassword from "./pages/ResetPassword";
import ClientRequirements from "./pages/ClientRequirements";
import ConsultantRequirements from "./pages/ConsultantRequirements";
import BusinessDiagnostic from "./pages/BusinessDiagnostic";
import ConsultantAssessment from "./pages/ConsultantAssessment";
import ConsultantActivate from "./pages/ConsultantActivate";
import FirmDiagnostic from "./pages/FirmDiagnostic";
import FirmActivate from "./pages/FirmActivate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/diagnostico-empresarial" element={<BusinessDiagnostic />} />
            <Route path="/evaluacion-consultor" element={<ConsultantAssessment />} />
            <Route path="/consultor/activar" element={<ConsultantActivate />} />
            <Route path="/diagnostico-firma" element={<FirmDiagnostic />} />
            <Route path="/firma/activar" element={<FirmActivate />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/partner" element={<PartnerDashboard />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/new" element={<ProjectNew />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/projects/:id/edit" element={<ProjectEdit />} />
            <Route path="/projects/:id/apply" element={<ProjectApply />} />
            <Route path="/challenges" element={<ClientChallenges />} />
            <Route path="/challenges/new" element={<ClientChallengeNew />} />
            <Route path="/challenges/:id/edit" element={<ClientChallengeEdit />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/proposals" element={<Proposals />} />
            <Route path="/training" element={<Training />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/requirements" element={<ClientRequirements />} />
            <Route path="/consultant-requirements" element={<ConsultantRequirements />} />
            <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
