import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ReportIssuePage from "./pages/ReportIssue.tsx";
import RegisterPage from "./pages/Register.tsx";
import LoginPage from "./pages/Login.tsx";
import ForgotPasswordPage from "./pages/ForgotPassword.tsx";
import DashboardPage from "./pages/Dashboard.tsx";
import ReportSuccessPage from "./pages/ReportSuccess.tsx";
import ProfilePage from "./pages/Profile.tsx";
import MyIssuesPage from "./pages/MyIssues.tsx";
import IssueDetailsPage from "./pages/IssueDetails.tsx";
import AreaIssuesPage from "./pages/AreaIssues.tsx";
import PublicIssueDetailsPage from "./pages/PublicIssueDetails.tsx";
import { AuthProvider } from "@/context/AuthContext";
import ForgotPasswordConfirmationPage from "./pages/ForgotPasswordConfirmation.tsx";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
     <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/report" element={<ReportIssuePage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/report-success" element={<ReportSuccessPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/my-issues" element={<MyIssuesPage />} />
              <Route path="/issue/:issueId" element={<IssueDetailsPage />} />
              <Route path="/area-issues" element={<AreaIssuesPage />} />
              <Route path="/area-issue/:issueId" element={<PublicIssueDetailsPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/forgot-password-confirmation" element={<ForgotPasswordConfirmationPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider> 
  </QueryClientProvider>
);

export default App;
