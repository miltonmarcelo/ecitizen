import { ReactNode } from "react";

import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import StaffDashboardHeader from "@/components/staff/StaffDashboardHeader";

interface AdminLayoutProps {
  children: ReactNode;
  pageTitle: string;
  breadcrumb?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export default function AdminLayout({
  children,
  pageTitle,
  searchValue = "",
  onSearchChange,
  searchPlaceholder,
}: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-x-hidden bg-background">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Reuses the staff header component for shared search/profile behavior in admin pages. */}
          <StaffDashboardHeader
            pageTitle={pageTitle}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            searchPlaceholder={searchPlaceholder}
            showBackButton
            backTo="/staff/dashboard"
            backLabel="Back to Staff Dashboard"
          />

          <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto p-5 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
