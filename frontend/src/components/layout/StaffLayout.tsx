import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { StaffAppSidebar } from "@/components/staff/StaffAppSidebar";
import { StaffDashboardHeader } from "@/components/staff/StaffDashboardHeader";

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
      <div className="min-h-screen flex w-full bg-background">
        <StaffAppSidebar />
        <SidebarInset>
          <StaffDashboardHeader
            pageTitle={pageTitle}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
          />
          <main className="flex-1 p-5 lg:p-6 overflow-auto">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
