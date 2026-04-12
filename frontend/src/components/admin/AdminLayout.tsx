import { ReactNode } from "react";

import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import StaffDashboardHeader from "@/components/dashboard/StaffDashboardHeader";

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
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <StaffDashboardHeader
            pageTitle={pageTitle}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            searchPlaceholder={searchPlaceholder}
            showBackButton
            backTo="/staff/dashboard"
            backLabel="Back to Staff Dashboard"
          />

          <main className="flex-1 p-5 lg:p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}