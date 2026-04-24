import { useEffect, useMemo, useState } from "react";
import StaffSummaryCard from "@/components/staff/StaffSummaryCard";
import StaffIssueTable from "@/components/staff/StaffIssueTable";
import StaffSidePanel from "@/components/staff/StaffSidePanel";
import StaffLayout from "@/components/layout/StaffLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  UserCheck,
  UserX,
  CheckCircle2,
  ListFilter,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import { formatIssueStatus } from "@/lib/issueMeta";
import type { ApiStaffIssue } from "@/lib/staffIssues";
import {
  mapApiIssueToTableIssue,
  STAFF_DASHBOARD_STATUS_OPTIONS,
} from "@/lib/staffIssues";

const RESOLVED_STATUSES = new Set(["RESOLVED", "CLOSED"]);

function getAssignedStaffName(staff: any) {
  // Falls back through available name fields when staff profile data is partial.
  return (
    staff?.user?.fullName ||
    [staff?.user?.firstName, staff?.user?.lastName].filter(Boolean).join(" ").trim() ||
    "Unknown staff"
  );
}

const StaffDashboard = () => {
  const { user, appUser, loading: authLoading } = useAuth();

  const [issues, setIssues] = useState<ApiStaffIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const currentStaffId = appUser?.staffProfile?.id ?? null;
  const defaultAssignedFilter = useMemo(() => {
    // Defaults to "my issues" only when current staff actually has assigned records.
    if (appUser?.role !== "STAFF" || currentStaffId === null) {
      return "all";
    }

    const hasAssignedIssues = issues.some(
      (issue) => (issue.staff?.id ?? null) === currentStaffId
    );

    return hasAssignedIssues ? String(currentStaffId) : "all";
  }, [appUser?.role, currentStaffId, issues]);
  const [assignedFilter, setAssignedFilter] = useState("all");

  useEffect(() => {
    // Re-syncs assignment filter when auth/profile data or issue list changes.
    setAssignedFilter(defaultAssignedFilter);
  }, [defaultAssignedFilter]);

  useEffect(() => {
    if (authLoading) return;

    const fetchIssues = async () => {
      try {
        setLoading(true);
        setError("");

        if (!user) {
          setIssues([]);
          return;
        }

        // Uses Firebase token so staff-only issues endpoint can verify role access.
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

    fetchIssues();
  }, [user, authLoading]);

  const categories = useMemo(
    () =>
      [...new Set(issues.map((issue) => issue.category?.name).filter(Boolean as any))].sort(
        (a, b) => a.localeCompare(b)
      ) as string[],
    [issues]
  );

  const assignedStaffOptions = useMemo(() => {
    // Builds one option per staff ID from currently loaded issues.
    const map = new Map<number, string>();

    for (const issue of issues) {
      const staff = issue.staff;
      if (!staff?.id) continue;

      if (!map.has(staff.id)) {
        map.set(staff.id, getAssignedStaffName(staff));
      }
    }

    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [issues]);

  const filteredIssues = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // Applies all dashboard filters in one pass before mapping to table rows.
    return issues.filter((issue) => {
      const categoryName = issue.category?.name || "Uncategorised";
      const assignedStaffId = issue.staff?.id ?? null;

      const matchesAssignment =
        assignedFilter === "all" ||
        (assignedFilter === "unassigned" && assignedStaffId === null) ||
        assignedStaffId === Number(assignedFilter);

      return (
        (statusFilter === "all" || issue.status === statusFilter) &&
        (categoryFilter === "all" || categoryName === categoryFilter) &&
        matchesAssignment &&
        (!query ||
          issue.caseId.toLowerCase().includes(query) ||
          issue.title.toLowerCase().includes(query) ||
          (issue.description || "").toLowerCase().includes(query) ||
          categoryName.toLowerCase().includes(query))
      );
    });
  }, [issues, statusFilter, categoryFilter, assignedFilter, searchQuery]);

  const tableIssues = useMemo(
    () => filteredIssues.map(mapApiIssueToTableIssue),
    [filteredIssues]
  );

  const stats = useMemo(() => {
    // Computes summary cards from the full issue list, not from filtered rows.
    let assignedToMe = 0;
    let unassigned = 0;
    let resolvedByMe = 0;

    for (const issue of issues) {
      const assignedStaffId = issue.staff?.id ?? null;
      const isMine = currentStaffId !== null && assignedStaffId === currentStaffId;
      const isUnassigned = assignedStaffId === null;
      const isResolved = RESOLVED_STATUSES.has(issue.status);

      if (isMine) assignedToMe++;
      if (isUnassigned) unassigned++;
      if (isMine && isResolved) resolvedByMe++;
    }

    return {
      total: issues.length,
      assignedToMe,
      unassigned,
      resolvedByMe,
    };
  }, [issues, currentStaffId]);

  const hasActiveFilters =
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    assignedFilter !== defaultAssignedFilter ||
    searchQuery.trim() !== "";

  const clearFilters = () => {
    setStatusFilter("all");
    setCategoryFilter("all");
    setAssignedFilter(defaultAssignedFilter);
    setSearchQuery("");
  };

  return (
    <StaffLayout
      pageTitle="Operational Dashboard"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
    >
      <div className="staff-summary-grid">
        <StaffSummaryCard
          title="Total Reports"
          value={stats.total}
          icon={FileText}
          tone="default"
        />
        <StaffSummaryCard
          title="Assigned to Me"
          value={stats.assignedToMe}
          icon={UserCheck}
          tone="assigned"
        />
        <StaffSummaryCard
          title="Unassigned"
          value={stats.unassigned}
          icon={UserX}
          tone="unassigned"
        />
        <StaffSummaryCard
          title="Resolved by Me"
          value={stats.resolvedByMe}
          icon={CheckCircle2}
          tone="resolved"
        />
      </div>

      <div className="staff-workspace">
        <div className="staff-workspace__main">
          <div className="staff-toolbar">
            <div className="staff-toolbar__group">
              <ListFilter className="staff-toolbar__icon" />

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="staff-select-trigger">
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
                <SelectTrigger className="staff-select-trigger staff-select-trigger--wide">
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

              <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                <SelectTrigger className="staff-select-trigger staff-select-trigger--wide">
                  <SelectValue placeholder="My issues" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>

                  {assignedStaffOptions.map((staff) => (
                    <SelectItem key={staff.id} value={String(staff.id)}>
                      {staff.label}
                    </SelectItem>
                  ))}

                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="staff-clear-filters"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="staff-count-badge">{tableIssues.length} issues</div>
          </div>

          {error && <div className="staff-error-banner">{error}</div>}

          <StaffIssueTable
            issues={tableIssues}
            loading={loading}
            emptyMessage="No issues found for the selected filters."
          />
        </div>

        <div className="staff-workspace__side">
          <StaffSidePanel
            issues={issues}
            currentStaffId={currentStaffId}
          />
        </div>
      </div>
    </StaffLayout>
  );
};

export default StaffDashboard;
