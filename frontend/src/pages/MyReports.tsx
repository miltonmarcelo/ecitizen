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
import TopBar from "@/components/TopBar";
import { useAuth } from "@/context/AuthContext";

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
  status: string;
  addressLine1: string;
  addressLine2?: string | null;
  town: string;
  city: string;
  county: string;
  eircode: string;
  createdAt: string;
  updatedAt: string;
};

const BASE_STATUSES = ["All", "CREATED", "UNDER_REVIEW", "IN_PROGRESS", "RESOLVED", "CLOSED", "CANCELLED"];
const SORT_OPTIONS = ["Newest first", "Oldest first", "Title A–Z", "Title Z–A"];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.35 },
});

const formatStatusLabel = (status: string) => {
  switch (status) {
    case "CREATED":
      return "Created";
    case "UNDER_REVIEW":
      return "Under Review";
    case "IN_PROGRESS":
      return "In Progress";
    case "RESOLVED":
      return "Resolved";
    case "CLOSED":
      return "Closed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "RESOLVED":
    case "CLOSED":
      return "bg-accent/15 text-accent";
    case "IN_PROGRESS":
    case "UNDER_REVIEW":
      return "bg-warning/15 text-warning";
    case "CANCELLED":
      return "bg-destructive/15 text-destructive";
    case "CREATED":
    default:
      return "bg-primary/15 text-primary";
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const buildLocation = (issue: ApiIssue) => {
  return [issue.addressLine1, issue.town, issue.city].filter(Boolean).join(", ");
};

const getCategoryName = (issue: ApiIssue) => {
  return issue.category?.name || "Uncategorised";
};

const MyReportsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sort, setSort] = useState("Newest first");
  const [showSort, setShowSort] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 5;

  const [issues, setIssues] = useState<ApiIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam && BASE_STATUSES.includes(statusParam)) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

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

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/issues/my`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch issues");
        }

        setIssues(data.issues || []);
      } catch (err: any) {
        setError(err.message || "Unable to load your issues.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchIssues();
    }
  }, [user, authLoading]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, categoryFilter, sort]);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        issues
          .map((issue) => issue.category?.name)
          .filter((name): name is string => Boolean(name))
      )
    ).sort((a, b) => a.localeCompare(b));

    return ["All", ...uniqueCategories];
  }, [issues]);

  const filtered = useMemo(() => {
    let list = issues.filter((issue) => {
      const q = search.toLowerCase();
      const location = buildLocation(issue).toLowerCase();
      const categoryName = getCategoryName(issue).toLowerCase();

      const matchesSearch =
        !q ||
        issue.title.toLowerCase().includes(q) ||
        issue.caseId.toLowerCase().includes(q) ||
        location.includes(q) ||
        categoryName.includes(q);

      const matchesStatus = statusFilter === "All" || issue.status === statusFilter;
      const matchesCategory = categoryFilter === "All" || getCategoryName(issue) === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    switch (sort) {
      case "Oldest first":
        list = [...list].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "Title A–Z":
        list = [...list].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "Title Z–A":
        list = [...list].sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "Newest first":
      default:
        list = [...list].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return list;
  }, [issues, search, statusFilter, categoryFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const paginatedIssues = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const visiblePages = useMemo(() => {
    const pages: number[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, 5);
    } else if (currentPage >= totalPages - 2) {
      pages.push(totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2);
    }

    return pages.filter((page) => page >= 1 && page <= totalPages);
  }, [currentPage, totalPages]);

  const hasActiveFilters = statusFilter !== "All" || categoryFilter !== "All" || search !== "";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar showBack backTo="/dashboard" showProfile />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-5">
        <motion.div {...fadeUp(0)}>
          <h2 className="text-xl font-bold text-foreground">My Reports</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            All your submitted reports, in one place.
          </p>
        </motion.div>

        <motion.div {...fadeUp(0.05)} className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none text-xs font-medium rounded-lg border border-border bg-card pl-3 pr-7 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                {BASE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s === "All" ? "Status" : formatStatusLabel(s)}
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
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "All" ? "Category" : c}
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
                Clear
              </button>
            )}

            <div className="relative ml-auto">
              <button
                  onClick={() => setShowSort(!showSort)}
                  className="text-xs font-medium rounded-lg border border-border bg-card px-3 py-2 text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                >
                  {sort} <ChevronDown size={12} />
              </button>

              {showSort && (
                <div className="absolute right-0 mt-1 w-40 bg-card border border-border rounded-xl shadow-lg z-20 py-1">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setSort(opt);
                        setShowSort(false);
                      }}
                      className={`block w-full text-left text-xs px-4 py-2 hover:bg-muted transition-colors ${
                        sort === opt ? "text-primary font-semibold" : "text-foreground"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} reports
          </p>
        </motion.div>

        <div className="space-y-3">
          {loading || authLoading ? (
            <motion.div {...fadeUp(0.1)} className="card-civic text-center py-10">
              <p className="text-sm text-muted-foreground">Loading your issues...</p>
            </motion.div>
          ) : error ? (
            <motion.div {...fadeUp(0.1)} className="card-civic text-center py-10">
              <p className="text-sm font-medium text-destructive">Unable to load issues</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div {...fadeUp(0.1)} className="card-civic text-center py-10">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No issues found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters.</p>
            </motion.div>
          ) : (
            paginatedIssues.map((issue, idx) => (
              <motion.div
                key={issue.caseId}
                {...fadeUp(0.08 + idx * 0.04)}
                className="card-civic space-y-2.5 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/issue/${issue.caseId}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground leading-snug flex-1">
                    {issue.title}
                  </h3>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${getStatusColor(issue.status)}`}
                  >
                    {formatStatusLabel(issue.status)}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">{issue.description}</p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText size={11} /> {issue.caseId}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={11} /> {formatDate(issue.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={11} /> {issue.town}
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
              </motion.div>
            ))
          )}
        </div>

        {!loading && !authLoading && !error && filtered.length > 0 && totalPages > 1 && (
          <motion.div
            {...fadeUp(0.16)}
            className="flex items-center justify-between gap-2 pt-2"
          >
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
      </main>
    </div>
  );
};

export default MyReportsPage;
