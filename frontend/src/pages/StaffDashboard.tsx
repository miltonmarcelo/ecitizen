import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SummaryCard from "@/components/dashboard/SummaryCard";
import IssueTable, { Issue } from "@/components/dashboard/IssueTable";
import SidePanel from "@/components/dashboard/SidePanel";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ListFilter,
} from "lucide-react";

const mockIssues: Issue[] = [
  { id: "ISS-1045", title: "Blocked Drain - Oak Avenue", category: "Drainage", status: "Open", dateReported: "24 Mar 2026", lastUpdated: "24 Mar 2026" },
  { id: "ISS-1044", title: "Streetlight Out - Elm Road", category: "Lighting", status: "In Progress", dateReported: "23 Mar 2026", lastUpdated: "24 Mar 2026" },
  { id: "ISS-1043", title: "Abandoned Vehicle - Park Lane", category: "Vehicles", status: "Open", dateReported: "23 Mar 2026", lastUpdated: "23 Mar 2026" },
  { id: "ISS-1042", title: "Pothole - Main Street", category: "Roads", status: "Open", dateReported: "22 Mar 2026", lastUpdated: "22 Mar 2026" },
  { id: "ISS-1041", title: "Fly Tipping - Industrial Estate", category: "Waste", status: "In Progress", dateReported: "21 Mar 2026", lastUpdated: "24 Mar 2026" },
  { id: "ISS-1040", title: "Damaged Bench - Central Park", category: "Parks", status: "In Progress", dateReported: "20 Mar 2026", lastUpdated: "23 Mar 2026" },
  { id: "ISS-1039", title: "Graffiti - Library Wall", category: "Vandalism", status: "Open", dateReported: "20 Mar 2026", lastUpdated: "22 Mar 2026" },
  { id: "ISS-1038", title: "Noise Complaint - High Street", category: "Noise", status: "Resolved", dateReported: "19 Mar 2026", lastUpdated: "23 Mar 2026" },
  { id: "ISS-1037", title: "Overflowing Bin - Station Rd", category: "Waste", status: "Resolved", dateReported: "18 Mar 2026", lastUpdated: "21 Mar 2026" },
  { id: "ISS-1036", title: "Cracked Pavement - School Lane", category: "Roads", status: "Closed", dateReported: "17 Mar 2026", lastUpdated: "20 Mar 2026" },
];

const StaffDashboard = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader pageTitle="Operational Dashboard" />

          <main className="flex-1 p-5 lg:p-6 overflow-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <SummaryCard
                title="Total Issues"
                value={142}
                icon={FileText}
                trend="+12 this week"
                trendUp
                accentClass="text-primary bg-primary/10"
              />
              <SummaryCard
                title="Open"
                value={38}
                icon={AlertCircle}
                trend="5 new today"
                trendUp
                accentClass="text-blue-600 bg-blue-50"
              />
              <SummaryCard
                title="In Progress"
                value={24}
                icon={Loader2}
                accentClass="text-amber-600 bg-amber-50"
              />
              <SummaryCard
                title="Resolved"
                value={80}
                icon={CheckCircle2}
                trend="+8 this week"
                trendUp
                accentClass="text-emerald-600 bg-emerald-50"
              />
            </div>

            <div className="flex gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <ListFilter className="w-4 h-4 text-muted-foreground" />

                    <Select>
                      <SelectTrigger className="h-8 w-32 text-xs bg-card">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select>
                      <SelectTrigger className="h-8 w-36 text-xs bg-card">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="Roads">Roads</SelectItem>
                        <SelectItem value="Drainage">Drainage</SelectItem>
                        <SelectItem value="Lighting">Lighting</SelectItem>
                        <SelectItem value="Waste">Waste</SelectItem>
                        <SelectItem value="Parks">Parks</SelectItem>
                        <SelectItem value="Vandalism">Vandalism</SelectItem>
                        <SelectItem value="Noise">Noise</SelectItem>
                        <SelectItem value="Vehicles">Vehicles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {mockIssues.length} issues
                    </Badge>
                  </div>
                </div>

                <IssueTable issues={mockIssues} />
              </div>

              <div className="hidden xl:block w-80 shrink-0">
                <SidePanel />
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default StaffDashboard;