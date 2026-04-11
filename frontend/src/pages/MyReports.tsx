import {
  Search,
  ChevronDown,
  X,
  MapPin,
  Calendar,
  Tag,
  FileText,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import CitizenLayout from "@/components/layout/CitizenLayout";
import PageHeader from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import StatusBadge from "@/components/common/StatusBadge";
import type { IssueStatus } from "@/types/domain";
import { ALL_ISSUE_STATUSES, formatIssueStatus } from "@/lib/issueMeta";

type ApiCategory = {
  id: number;
  name: string;
  description?: string | null;
  isActive?: boolean;
};

type ApiIssue = {
  id: number;
  caseId: string;
  title: string;
  description: string;
  categoryId: number;
  category: ApiCategory | null;
  status: IssueStatus;
  addressLine1: string;
  addressLine2?: string | null;
  suburb: string;
  area: string;
  city: string;
  county: string;
  createdAt: string;
  updatedAt: string;
};

const ITEMS_PER_PAGE = 5;
const SORT_OPTIONS = ["Newest first", "Oldest first", "Title A-Z", "Title Z-A"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.35 },
});

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const buildLocation = ({ addressLine1, suburb, area }: ApiIssue) =>
  [addressLine1, suburb, area].filter(Boolean).join(", ");

const getCategoryName = (issue: ApiIssue) => issue.category?.name || "Uncategorised";

const SORTERS: Record<SortOption, (a: ApiIssue, b: ApiIssue) => number> = {
  "Newest first": (a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  "Oldest first": (a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  "Title A-Z": (a, b) => a.title.localeCompare(b.title),
  "Title Z-A": (a, b) => b.title.localeCompare(a.title),
};

const getVisiblePages = (currentPage: number, totalPages: number) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) return [1, 2, 3, 4, 5];
  if (currentPage >= totalPages - 2) {
    return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
};

const MyReportsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | IssueStatus>("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sort, setSort] = useState<SortOption>("Newest first");
  const [showSort, setShowSort] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [issues, setIssues] = useState<ApiIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam && ALL_ISSUE_STATUSES.includes(statusParam as IssueStatus)) {
      setStatusFilter(statusParam as IssueStatus);
    }
  }, [searchParams]);

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

        const token = await user.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/issues/my`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch issues");
        }

        setIssues(Array.isArray(data.issues) ? data.issues : []);
      } catch (err: any) {
        setIssues([]);
        setError(err.message || "Unable to load your issues.");
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, [user, authLoading]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, categoryFilter, sort]);

  const categories = useMemo(() => {
    const unique = [
      ...new Set(
        issues
          .map((issue) => issue.category?.name)
          .filter((name): name is string => Boolean(name))
      ),
    ].sort((a, b) => a.localeCompare(b));

    return ["All", ...unique];
  }, [issues]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return issues
      .filter((issue) => {
        const categoryName = getCategoryName(issue);
        const location = buildLocation(issue);
        const matchesSearch =
          !query ||
          issue.title.toLowerCase().includes(query) ||
          issue.caseId.toLowerCase().includes(query) ||
          location.toLowerCase().includes(query) ||
          categoryName.toLowerCase().includes(query);

        const matchesStatus = statusFilter === "All" || issue.status === statusFilter;
        const matchesCategory = categoryFilter === "All" || categoryName === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
      })
      .sort(SORTERS[sort]);
  }, [issues, search, statusFilter, categoryFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const paginatedIssues = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const visiblePages = useMemo(
    () => getVisiblePages(currentPage, totalPages),
    [currentPage, totalPages]
  );

  const hasActiveFilters =
    Boolean(search.trim()) || statusFilter !== "All" || categoryFilter !== "All";

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const rangeEnd = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);

  return (
    <CitizenLayout width="default" showBack backTo="/dashboard" showProfile>
      <div className="space-y-5">
        <motion.div {...fadeUp()}>
          <PageHeader
            title="My Reports"
            subtitle="Track and manage everything you've reported"
            className="mb-0"
          />
        </motion.div>

        <motion.div {...fadeUp(0.05)} className="space-y-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search by title, case ID, location, or category"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-civic pl-10 pr-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "All" | IssueStatus)}
                className="appearance-none text-xs font-medium rounded-lg border border-border bg-card pl-3 pr-7 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                <option value="All">Status</option>
                {ALL_ISSUE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {formatIssueStatus(status)}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>

            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none text-xs font-medium rounded-lg border border-border bg-card pl-3 pr-7 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "All" ? "Category" : category}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                  setCategoryFilter("All");
                }}
                className="text-xs text-destructive font-medium hover:underline"
              >
                Clear filter
              </button>
            )}

            <div className="relative ml-auto">
              <button
                onClick={() => setShowSort((prev) => !prev)}
                className="text-xs font-medium rounded-lg border border-border bg-card px-3 py-2 text-foreground hover:bg-muted transition-colors flex items-center gap-1"
              >
                {sort} <ChevronDown size={12} />
              </button>

              {showSort && (
                <div className="absolute right-0 mt-1 w-40 bg-card border border-border rounded-xl shadow-lg z-20 py-1">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSort(option);
                        setShowSort(false);
                      }}
                      className={`block w-full text-left text-xs px-4 py-2 hover:bg-muted transition-colors ${
                        sort === option ? "text-primary font-semibold" : "text-foreground"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Showing {rangeStart} to {rangeEnd} of {filtered.length} reports
          </p>
        </motion.div>

        <div className="space-y-3">
          {loading || authLoading ? (
            <motion.div {...fadeUp(0.1)}>
              <SectionCard className="text-center" bodyClassName="py-10">
                <p className="text-sm text-muted-foreground">Loading your reports...</p>
              </SectionCard>
            </motion.div>
          ) : error ? (
            <motion.div {...fadeUp(0.1)}>
              <SectionCard className="text-center" bodyClassName="py-10">
                <p className="text-sm font-medium text-destructive">Unable to load reports</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
              </SectionCard>
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div {...fadeUp(0.1)}>
              <SectionCard className="text-center" bodyClassName="py-10">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">No reports found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try adjusting your search or filters.
                </p>
              </SectionCard>
            </motion.div>
          ) : (
            paginatedIssues.map((issue, idx) => (
              <motion.div
                key={issue.caseId}
                {...fadeUp(0.08 + idx * 0.04)}
                className="cursor-pointer"
                onClick={() => navigate(`/issue/${issue.caseId}`)}
              >
                <SectionCard
                  className="hover:shadow-md transition-shadow"
                  bodyClassName="space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground leading-snug flex-1">
                      {issue.title}
                    </h3>
                    <StatusBadge status={issue.status} />
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {issue.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText size={11} /> {issue.caseId}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={11} /> {formatDate(issue.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={11} /> {issue.suburb}
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag size={11} /> {getCategoryName(issue)}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/issue/${issue.caseId}`);
                    }}
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5 pt-0.5"
                  >
                    View Details <ChevronRight size={12} />
                  </button>
                </SectionCard>
              </motion.div>
            ))
          )}
        </div>

        {!loading && !authLoading && !error && filtered.length > 0 && totalPages > 1 && (
          <motion.div {...fadeUp(0.16)} className="flex items-center justify-between gap-2 pt-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex items-center gap-1.5">
              {visiblePages.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 text-xs font-medium rounded-lg border transition-colors ${
                    currentPage === page
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </motion.div>
        )}
      </div>
    </CitizenLayout>
  );
};

export default MyReportsPage;