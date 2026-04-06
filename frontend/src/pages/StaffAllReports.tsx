import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { StaffAppSidebar } from "@/components/dashboard/StaffAppSidebar";
import StaffDashboardHeader from "@/components/dashboard/StaffDashboardHeader";
import StaffIssueTable from "@/components/dashboard/StaffIssueTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListFilter, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import type { IssueStatus } from "@/types/domain";
import { formatIssueStatus } from "@/lib/issueMeta";
import type { ApiCategory, ApiStaffIssue } from "@/lib/staffIssues";
import {
  mapApiIssueToTableIssue,
  STAFF_DASHBOARD_STATUS_OPTIONS,
} from "@/lib/staffIssues";

const StaffAllReports = () => {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [issues, setIssues] = useState<ApiStaffIssue[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilters, setStatusFilters] = useState<IssueStatus[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (location.pathname === "/staff/my-issues") {
      setAssignmentFilter("mine");
      return;
    }

    if (location.pathname === "/staff/unassigned") {
      setAssignmentFilter("unassigned");
      return;
    }

    setAssignmentFilter("all");
  }, [location.pathname]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        if (!user) {
          setIssues([]);
          setCategories([]);
          return;
        }

        const token = await user.getIdToken();

        const params = new URLSearchParams();

        if (statusFilters.length === 1) {
          params.set("status", statusFilters[0]);
        }

        if (categoryFilters.length === 1) {
          params.set("category", categoryFilters[0]);
        }

        if (assignmentFilter !== "all") {
          params.set("assignment", assignmentFilter);
        }

        const issuesUrl = `${API_BASE_URL}/api/issues${
          params.toString() ? `?${params.toString()}` : ""
        }`;

        const [issuesResponse, categoriesResponse] = await Promise.all([
          fetch(issuesUrl, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/api/categories`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const issuesData = await issuesResponse.json();
        const categoriesData = await categoriesResponse.json();

        if (!issuesResponse.ok) {
          throw new Error(issuesData.message || "Failed to fetch issues");
        }

        if (!categoriesResponse.ok) {
          throw new Error(categoriesData.message || "Failed to fetch categories");
        }

        let nextIssues: ApiStaffIssue[] = Array.isArray(issuesData.issues)
          ? issuesData.issues
          : [];

        if (statusFilters.length > 1) {
          nextIssues = nextIssues.filter((issue) =>
            statusFilters.includes(issue.status)
          );
        }

        if (categoryFilters.length > 1) {
          nextIssues = nextIssues.filter((issue) =>
            categoryFilters.includes(issue.category?.name || "Uncategorised")
          );
        }

        setIssues(nextIssues);
        setCategories(Array.isArray(categoriesData.categories) ? categoriesData.categories : []);
      } catch (err: any) {
        setError(err.message || "Unable to load issues.");
        setIssues([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading, statusFilters, categoryFilters, assignmentFilter]);

  const hasFilters =
    statusFilters.length > 0 ||
    categoryFilters.length > 0 ||
    assignmentFilter !== "all" ||
    searchQuery.trim() !== "";

  const clearFilters = () => {
    setStatusFilters([]);
    setCategoryFilters([]);
    setSearchQuery("");
    if (location.pathname === "/staff/my-issues") {
      setAssignmentFilter("mine");
      return;
    }

    if (location.pathname === "/staff/unassigned") {
      setAssignmentFilter("unassigned");
      return;
    }

    setAssignmentFilter("all");
  };

  const toggleStatusFilter = (value: IssueStatus) => {
    setStatusFilters((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const toggleCategoryFilter = (value: string) => {
    setCategoryFilters((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const tableIssues = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filteredBySearch = issues.filter((issue) => {
      if (!normalizedQuery) return true;

      return (
        issue.caseId.toLowerCase().includes(normalizedQuery) ||
        issue.title.toLowerCase().includes(normalizedQuery) ||
        (issue.description || "").toLowerCase().includes(normalizedQuery) ||
        (issue.category?.name || "").toLowerCase().includes(normalizedQuery)
      );
    });

    return filteredBySearch.map(mapApiIssueToTableIssue);
  }, [issues, searchQuery]);

  const pageTitle = useMemo(() => {
    if (location.pathname === "/staff/my-issues") {
      return "Issues Assigned to Me";
    }

    if (location.pathname === "/staff/unassigned") {
      return "Unassigned Issues";
    }

    return "All Issues";
  }, [location.pathname]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <StaffAppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <StaffDashboardHeader
            pageTitle={pageTitle}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
          />

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
                  <DropdownMenuContent align="start" className="w-52">
                    {STAFF_DASHBOARD_STATUS_OPTIONS.map((status) => (
                      <DropdownMenuCheckboxItem
                        key={status}
                        checked={statusFilters.includes(status)}
                        onCheckedChange={() => toggleStatusFilter(status)}
                        onSelect={(event) => event.preventDefault()}
                      >
                        {formatIssueStatus(status)}
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
                  <DropdownMenuContent align="start" className="w-52">
                    {categories.map((category) => (
                      <DropdownMenuCheckboxItem
                        key={category.id}
                        checked={categoryFilters.includes(category.name)}
                        onCheckedChange={() => toggleCategoryFilter(category.name)}
                        onSelect={(event) => event.preventDefault()}
                      >
                        {category.name}
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
                Showing {tableIssues.length} issues
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
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default StaffAllReports;
