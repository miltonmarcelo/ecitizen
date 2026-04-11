import { useEffect, useMemo, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { StaffAppSidebar } from "@/components/dashboard/StaffAppSidebar";
import StaffDashboardHeader from "@/components/dashboard/StaffDashboardHeader";
import StaffSummaryCard from "@/components/dashboard/StaffSummaryCard";
import StaffIssueTable from "@/components/dashboard/StaffIssueTable";
import StaffSidePanel from "@/components/dashboard/StaffSidePanel";
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
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import type { IssueStatus } from "@/types/domain";
import { formatIssueStatus } from "@/lib/issueMeta";
import type { ApiStaffIssue } from "@/lib/staffIssues";
import {
  mapApiIssueToTableIssue,
  STAFF_DASHBOARD_STATUS_OPTIONS,
} from "@/lib/staffIssues";

const StaffDashboard = () => {
  const { user, loading: authLoading } = useAuth();

  const [issues, setIssues] = useState<ApiStaffIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setLoading(true);
        setError("");

        if (!user) {
          setIssues([]);
          return;
        }

        const token = await user.getIdToken();

        const response = await fetch(`${API_BASE_URL}/api/issues`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch issues");
        }

        setIssues(Array.isArray(data.issues) ? data.issues : []);
      } catch (err: any) {
        setError(err.message || "Unable to load issues.");
        setIssues([]);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchIssues();
    }
  }, [user, authLoading]);

  const categories = useMemo(() => {
    const values = Array.from(
      new Set(
        issues
          .map((issue) => issue.category?.name)
          .filter((name): name is string => Boolean(name))
      )
    ).sort((a, b) => a.localeCompare(b));

    return values;
  }, [issues]);

  const filteredIssues = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return issues.filter((issue) => {
      const matchesStatus =
        statusFilter === "all" || issue.status === statusFilter;

      const matchesCategory =
        categoryFilter === "all" ||
        (issue.category?.name || "Uncategorised") === categoryFilter;

      const matchesSearch =
        !normalizedQuery ||
        issue.caseId.toLowerCase().includes(normalizedQuery) ||
        issue.title.toLowerCase().includes(normalizedQuery) ||
        (issue.description || "").toLowerCase().includes(normalizedQuery) ||
        (issue.category?.name || "").toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [issues, statusFilter, categoryFilter, searchQuery]);

  const tableIssues = useMemo(() => {
    return filteredIssues.map(mapApiIssueToTableIssue);
  }, [filteredIssues]);

  const stats = useMemo(() => {
    const total = issues.length;
    const open = issues.filter(
      (issue) => issue.status === "CREATED" || issue.status === "UNDER_REVIEW"
    ).length;
    const inProgress = issues.filter(
      (issue) => issue.status === "IN_PROGRESS"
    ).length;
    const resolved = issues.filter(
      (issue) => issue.status === "RESOLVED" || issue.status === "CLOSED"
    ).length;

    return { total, open, inProgress, resolved };
  }, [issues]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <StaffAppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <StaffDashboardHeader
            pageTitle="Operational Dashboard"
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <main className="flex-1 p-5 lg:p-6 overflow-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StaffSummaryCard
                title="Total Issues"
                value={stats.total}
                icon={FileText}
                accentClass="text-primary bg-primary/10"
                cardClassName="bg-card"
              />
              <StaffSummaryCard
                title="Open"
                value={stats.open}
                icon={AlertCircle}
                accentClass="text-primary-foreground bg-primary"
                cardClassName="bg-primary/10"
              />
              <StaffSummaryCard
                title="In Progress"
                value={stats.inProgress}
                icon={Loader2}
                accentClass="text-amber-700 bg-amber-100"
                cardClassName="bg-warning/20"
              />
              <StaffSummaryCard
                title="Resolved"
                value={stats.resolved}
                icon={CheckCircle2}
                accentClass="text-accent/200 bg-accent/30"
                cardClassName="bg-accent/20"
              />
            </div>

            <div className="flex gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <ListFilter className="w-4 h-4 text-muted-foreground" />

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-8 w-40 text-xs bg-card">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {STAFF_DASHBOARD_STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {formatIssueStatus(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="h-8 w-44 text-xs bg-card">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Badge variant="secondary" className="text-xs">
                    {tableIssues.length} issues
                  </Badge>
                </div>

                {error ? (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive mb-4">
                    {error}
                  </div>
                ) : null}

                <StaffIssueTable
                  issues={tableIssues}
                  loading={loading}
                  emptyMessage="No issues found for the selected filters."
                />
              </div>

              <div className="hidden xl:block w-80 shrink-0">
                <StaffSidePanel issues={issues} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default StaffDashboard;
