import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicOnlyRoute from "@/components/PublicOnlyRoute";
import StaffRoute from "@/components/StaffRoute";
import AdminRoute from "@/components/AdminRoute";

import Index from "./pages/public/Index";
import LoginPage from "./pages/auth/Login";
import RegisterPage from "./pages/auth/Register";
import DashboardPage from "./pages/citizen/CitizenDashboard";
import ReportIssuePage from "./pages/citizen/ReportIssue";
import ReportSuccessPage from "./pages/citizen/ReportSuccess";
import MyReportsPage from "./pages/citizen/MyReports";
import IssueDetailsPage from "./pages/citizen/IssueDetails";
import AreaIssuesPage from "./pages/citizen/AreaIssues";
import PublicIssueDetailsPage from "./pages/citizen/PublicIssueDetails";
import ChangePasswordPage from "./pages/auth/ChangePassword";
import ContactPage from "./pages/public/ContactPage";
import ForgotPasswordPage from "./pages/auth/ForgotPassword";
import ForgotPasswordConfirmationPage from "./pages/auth/ForgotPasswordConfirmation";
import NotFound from "./pages/public/NotFound";

import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffAllReports from "./pages/staff/StaffAllReports";
import StaffIssueDetails from "./pages/staff/StaffIssueDetails";

import AdminPanel from "./pages/admin/AdminPanel";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminDatabase from "./pages/admin/AdminDatabase";

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
              path="/forgot-password"
              element={
                <PublicOnlyRoute>
                  <ForgotPasswordPage />
                </PublicOnlyRoute>
              }
            />

            <Route
              path="/forgot-password-confirmation"
              element={
                <PublicOnlyRoute>
                  <ForgotPasswordConfirmationPage />
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

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/staff"
              element={
                <AdminRoute>
                  <AdminStaff />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <AdminRoute>
                  <AdminCategories />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/database"
              element={
                <AdminRoute>
                  <AdminDatabase />
                </AdminRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
