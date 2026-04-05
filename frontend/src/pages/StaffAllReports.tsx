import { useState, useMemo } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import IssueTable, { Issue } from "@/components/dashboard/IssueTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ListFilter, X } from "lucide-react";

const statusOptions = ["Open", "In Progress", "Resolved", "Closed"];

const categoryOptions = [
  "Roads",
  "Drainage",
  "Lighting",
  "Waste",
  "Parks",
  "Vandalism",
  "Noise",
  "Vehicles",
];

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
  { id: "ISS-1035", title: "Broken Fence - Riverside Walk", category: "Parks", status: "Open", dateReported: "16 Mar 2026", lastUpdated: "18 Mar 2026" },
  { id: "ISS-1034", title: "Leaking Hydrant - Bridge St", category: "Drainage", status: "In Progress", dateReported: "15 Mar 2026", lastUpdated: "20 Mar 2026" },
  { id: "ISS-1033", title: "Illegal Dumping - Canal Path", category: "Waste", status: "Open", dateReported: "14 Mar 2026", lastUpdated: "16 Mar 2026" },
  { id: "ISS-1032", title: "Faded Road Markings - A12 Junction", category: "Roads", status: "Resolved", dateReported: "13 Mar 2026", lastUpdated: "19 Mar 2026" },
  { id: "ISS-1031", title: "Broken Swing - Jubilee Playground", category: "Parks", status: "Closed", dateReported: "12 Mar 2026", lastUpdated: "17 Mar 2026" },
  { id: "ISS-1030", title: "Blocked Footpath - Manor Lane", category: "Roads", status: "Open", dateReported: "11 Mar 2026", lastUpdated: "14 Mar 2026" },
  { id: "ISS-1029", title: "Vandalised Bus Stop - King St", category: "Vandalism", status: "In Progress", dateReported: "10 Mar 2026", lastUpdated: "15 Mar 2026" },
  { id: "ISS-1028", title: "Damaged Street Sign - Church Rd", category: "Roads", status: "Resolved", dateReported: "09 Mar 2026", lastUpdated: "14 Mar 2026" },
  { id: "ISS-1027", title: "Overgrown Hedge - School Lane", category: "Parks", status: "Closed", dateReported: "08 Mar 2026", lastUpdated: "12 Mar 2026" },
  { id: "ISS-1026", title: "Flickering Streetlight - West Ave", category: "Lighting", status: "Open", dateReported: "07 Mar 2026", lastUpdated: "10 Mar 2026" },
];

const StaffAllReports = () => {
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [assignmentFilter, setAssignmentFilter] = useState("all");

  const hasFilters =
    statusFilters.length > 0 ||
    categoryFilters.length > 0 ||
    assignmentFilter !== "all";

  const clearFilters = () => {
    setStatusFilters([]);
    setCategoryFilters([]);
    setAssignmentFilter("all");
  };

  const toggleFilter = (
    current: string[],
    value: string,
    setter: (v: string[]) => void
  ) => {
    setter(
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
    );
  };

  const filtered = useMemo(() => {
    return mockIssues.filter((issue) => {
      if (statusFilters.length > 0 && !statusFilters.includes(issue.status)) {
        return false;
      }

      if (categoryFilters.length > 0 && !categoryFilters.includes(issue.category)) {
        return false;
      }

      return true;
    });
  }, [statusFilters, categoryFilters]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader pageTitle="All Issues" />

          <main className="flex-1 p-5 lg:p-6 overflow-auto">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <ListFilter className="w-4 h-4 text-muted-foreground" />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs bg-card font-normal"
                    >
                      {statusFilters.length === 0
                        ? "All Status"
                        : `Status (${statusFilters.length})`}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-44">
                    {statusOptions.map((status) => (
                      <DropdownMenuCheckboxItem
                        key={status}
                        checked={statusFilters.includes(status)}
                        onCheckedChange={() =>
                          toggleFilter(statusFilters, status, setStatusFilters)
                        }
                        onSelect={(e) => e.preventDefault()}
                      >
                        {status}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs bg-card font-normal"
                    >
                      {categoryFilters.length === 0
                        ? "All Categories"
                        : `Categories (${categoryFilters.length})`}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-44">
                    {categoryOptions.map((category) => (
                      <DropdownMenuCheckboxItem
                        key={category}
                        checked={categoryFilters.includes(category)}
                        onCheckedChange={() =>
                          toggleFilter(categoryFilters, category, setCategoryFilters)
                        }
                        onSelect={(e) => e.preventDefault()}
                      >
                        {category}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                  <SelectTrigger className="h-8 w-36 text-xs bg-card">
                    <SelectValue placeholder="All Assignment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="mine">Assigned to Me</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                  </SelectContent>
                </Select>

                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                    onClick={clearFilters}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear filters
                  </Button>
                )}
              </div>

              <Badge variant="secondary" className="text-xs">
                Showing {filtered.length} issues
              </Badge>
            </div>

            <IssueTable issues={filtered} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default StaffAllReports;