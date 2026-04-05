import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicOnlyRoute from "@/components/PublicOnlyRoute";
import StaffRoute from "@/components/StaffRoute";

import Index from "./pages/Index";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import DashboardPage from "./pages/Dashboard";
import ReportIssuePage from "./pages/ReportIssue";
import ReportSuccessPage from "./pages/ReportSuccess";
import MyReportsPage from "./pages/MyReports";
import IssueDetailsPage from "./pages/IssueDetails";
import ProfilePage from "./pages/Profile";
import AreaIssuesPage from "./pages/AreaIssues";
import PublicIssueDetailsPage from "./pages/PublicIssueDetails";
import ChangePasswordPage from "./pages/ChangePassword";
import ContactPage from "./pages/ContactPage";
import NotFound from "./pages/NotFound";

import StaffDashboard from "./pages/StaffDashboard";
import StaffAllReports from "./pages/StaffAllReports";
import StaffIssueDetails from "./pages/StaffIssueDetails";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />

            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />

            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <RegisterPage />
                </PublicOnlyRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/report"
              element={
                <ProtectedRoute>
                  <ReportIssuePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/report-success"
              element={
                <ProtectedRoute>
                  <ReportSuccessPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-reports"
              element={
                <ProtectedRoute>
                  <MyReportsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/issue/:issueId"
              element={
                <ProtectedRoute>
                  <IssueDetailsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/area-issues"
              element={
                <ProtectedRoute>
                  <AreaIssuesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/area-issue/:issueId"
              element={
                <ProtectedRoute>
                  <PublicIssueDetailsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePasswordPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/staff/dashboard"
              element={
                <StaffRoute>
                  <StaffDashboard />
                </StaffRoute>
              }
            />

            <Route
              path="/staff/issues"
              element={
                <StaffRoute>
                  <StaffAllReports />
                </StaffRoute>
              }
            />

            <Route
              path="/staff/issues/:issueId"
              element={
                <StaffRoute>
                  <StaffIssueDetails />
                </StaffRoute>
              }
            />

            <Route
              path="/staff/my-issues"
              element={
                <StaffRoute>
                  <StaffAllReports />
                </StaffRoute>
              }
            />

            <Route
              path="/staff/unassigned"
              element={
                <StaffRoute>
                  <StaffAllReports />
                </StaffRoute>
              }
            />

            <Route
              path="/staff/change-password"
              element={
                <StaffRoute>
                  <ChangePasswordPage />
                </StaffRoute>
              }
            />

            <Route path="/contact" element={<ContactPage />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;