import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import AuthGuard from "@/components/auth/AuthGuard";
import { ChatWidget } from "@/components/chat/ChatWidget";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Docs from "./pages/Docs";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Team from "./pages/Team";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import ProjectEditor from "./pages/ProjectEditor";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/docs/:section/:article" element={<Docs />} />
              <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
              <Route path="/dashboard/projects" element={<AuthGuard><Projects /></AuthGuard>} />
              <Route path="/dashboard/projects/:id" element={<AuthGuard><ProjectEditor /></AuthGuard>} />
              <Route path="/dashboard/team" element={<AuthGuard><Team /></AuthGuard>} />
              <Route path="/dashboard/analytics" element={<AuthGuard><Analytics /></AuthGuard>} />
              <Route path="/dashboard/settings" element={<AuthGuard><Settings /></AuthGuard>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <ChatWidget />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
