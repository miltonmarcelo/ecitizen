import { type ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { StaffAppSidebar } from "@/components/dashboard/StaffAppSidebar";
import StaffDashboardHeader from "@/components/dashboard/StaffDashboardHeader";

type StaffLayoutProps = {
  children: ReactNode;
  pageTitle: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
};

export default function StaffLayout({
  children,
  pageTitle,
  searchValue = "",
  onSearchChange,
}: StaffLayoutProps) {
  return (
    <SidebarProvider>
      <div className="staff-shell">
        <StaffAppSidebar />
        <div className="staff-main">
          <StaffDashboardHeader
            pageTitle={pageTitle}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
          />
          <main className="staff-content">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
