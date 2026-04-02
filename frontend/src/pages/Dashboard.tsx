import {
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Construction,
  MapPin,
  ChevronRight,
  Zap,
  Lightbulb,
  Trash2,
  ThumbsUp,
  ArrowRight,
  History,
  TriangleAlert,
  Footprints,
  Waves,
  BusFront,
  ShieldAlert,
  FileText,
  Tag,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  categoryId: number | null;
  category: ApiCategory | null;
  status: "CREATED" | "UNDER_REVIEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "CANCELLED";
  addressLine1: string;
  addressLine2?: string | null;
  town: string;
  city: string;
  county: string;
  eircode: string;
  createdAt: string;
  updatedAt: string;
};

const NEARBY_ISSUES = [
  {
    id: 4,
    icon: Zap,
    title: "Power outage in Block C",
    area: "Block C, 0.3 km away",
    supporters: 12,
    status: "Open",
    statusColor: "bg-primary/15 text-primary",
  },
  {
    id: 5,
    icon: Trash2,
    title: "Illegal dumping near river",
    area: "River BusFront, 0.8 km away",
    supporters: 8,
    status: "In Progress",
    statusColor: "bg-warning/15 text-warning",
  },
  {
    id: 6,
    icon: Lightbulb,
    title: "Faulty traffic signal",
    area: "Oak Avenue, 1.2 km away",
    supporters: 5,
    status: "Open",
    statusColor: "bg-primary/15 text-primary",
  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
});

const normalizeName = (value: string) =>
  value.toLowerCase().trim().replace(/\s+/g, " ");

const getStatusLabel = (status: ApiIssue["status"]) => {
  switch (status) {
    case "CREATED":
      return "Open";
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

const getStatusColor = (status: ApiIssue["status"]) => {
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

const buildLocation = (issue: ApiIssue) => {
  return [issue.addressLine1, issue.town, issue.city].filter(Boolean).join(", ");
};

const getCategoryName = (issue: ApiIssue) => {
  return issue.category?.name || "Uncategorised";
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getQuickActionMeta = (categoryName: string) => {
  const normalized = normalizeName(categoryName);

  if (normalized === "potholes") {
    return {
      label: "Report Pothole",
      icon: Construction,
      color: "text-primary",
    };
  }

  if (normalized === "illegal dumping") {
    return {
      label: "Report Illegal Dumping",
      icon: Trash2,
      color: "text-accent",
    };
  }

  if (normalized === "hazards") {
    return {
      label: "Report Hazard",
      icon: ShieldAlert,
      color: "text-warning",
    };
  }

  if (normalized === "street lighting") {
    return {
      label: "Report Street Lighting",
      icon: Lightbulb,
      color: "text-warning",
    };
  }

  if (normalized === "waste collection") {
    return {
      label: "Report Waste Issue",
      icon: Trash2,
      color: "text-accent",
    };
  }

  if (normalized === "flooding") {
    return {
      label: "Report Flooding",
      icon: Waves,
      color: "text-primary",
    };
  }

  return {
    label: `Report ${categoryName}`,
    icon: TriangleAlert,
    color: "text-primary",
  };
};

const DEFAULT_CATEGORY_NAMES = ["Potholes", "Illegal Dumping", "Hazards"];

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [issues, setIssues] = useState<ApiIssue[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        if (!user) {
          setIssues([]);
          setCategories([]);
          return;
        }

        const token = await user.getIdToken();

        const [issuesResponse, categoriesResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_BASE_URL}/api/issues/my`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${import.meta.env.VITE_API_BASE_URL}/api/categories`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const issuesData = await issuesResponse.json();
        const categoriesData = await categoriesResponse.json();

        if (!issuesResponse.ok) {
          throw new Error(issuesData.message || "Failed to fetch dashboard issues");
        }

        if (!categoriesResponse.ok) {
          throw new Error(categoriesData.message || "Failed to fetch categories");
        }

        setIssues(Array.isArray(issuesData.issues) ? issuesData.issues : []);
        setCategories(Array.isArray(categoriesData.categories) ? categoriesData.categories : []);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        setIssues([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchDashboardData();
    }
  }, [user, authLoading]);

  const stats = useMemo(() => {
    const createdCount = issues.length;

    const inProgressCount = issues.filter(
      (issue) =>
        issue.status !== "RESOLVED" &&
        issue.status !== "CLOSED" &&
        issue.status !== "CANCELLED"
    ).length;

    const resolvedCount = issues.filter(
      (issue) => issue.status === "RESOLVED" || issue.status === "CLOSED"
    ).length;

    return [
      {
        label: "Created",
        value: createdCount,
        icon: AlertCircle,
        color: "text-primary",
        bg: "bg-primary/10",
      },
      {
        label: "In Progress",
        value: inProgressCount,
        icon: Clock,
        color: "text-warning",
        bg: "bg-warning/10",
      },
      {
        label: "Resolved",
        value: resolvedCount,
        icon: CheckCircle2,
        color: "text-accent",
        bg: "bg-accent/10",
      },
    ];
  }, [issues]);

  const recentIssues = useMemo(() => {
    return [...issues]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }, [issues]);

  const latestIssue = useMemo(() => {
    if (issues.length === 0) return null;

    return [...issues].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }, [issues]);

  const topQuickActionCategories = useMemo(() => {
    const usedCounts = new Map<number, { category: ApiCategory; count: number }>();

    issues.forEach((issue) => {
      if (!issue.category || !issue.categoryId) return;

      const current = usedCounts.get(issue.categoryId);
      if (current) {
        usedCounts.set(issue.categoryId, {
          category: current.category,
          count: current.count + 1,
        });
      } else {
        usedCounts.set(issue.categoryId, {
          category: issue.category,
          count: 1,
        });
      }
    });

    const mostUsed = [...usedCounts.values()]
      .sort((a, b) => b.count - a.count)
      .map((item) => item.category);

    const combined: ApiCategory[] = [...mostUsed];

    DEFAULT_CATEGORY_NAMES.forEach((defaultName) => {
      const fallbackCategory = categories.find(
        (category) => normalizeName(category.name) === normalizeName(defaultName)
      );

      if (!fallbackCategory) return;

      const alreadyIncluded = combined.some(
        (category) => category.id === fallbackCategory.id
      );

      if (!alreadyIncluded) {
        combined.push(fallbackCategory);
      }
    });

    return combined.slice(0, 3);
  }, [issues, categories]);

  const quickActions = useMemo(() => {
    const categoryButtons = topQuickActionCategories.map((category) => {
      const meta = getQuickActionMeta(category.name);

      return {
        key: `category-${category.id}`,
        icon: meta.icon,
        label: meta.label,
        color: meta.color,
        onClick: () => navigate(`/report?categoryId=${category.id}`),
        disabled: false,
      };
    });

    return [
      {
        key: "latest-report",
        icon: History,
        label: latestIssue ? "See My Latest Report" : "No Reports Yet",
        color: "text-primary",
        onClick: () => {
          if (latestIssue) {
            navigate(`/issue/${latestIssue.caseId}`);
          }
        },
        disabled: !latestIssue,
      },
      ...categoryButtons,
    ];
  }, [topQuickActionCategories, latestIssue, navigate]);

  const userName =
    user?.displayName?.trim() ||
    (user?.email ? user.email.split("@")[0] : "there");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar showProfile />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-6">
        <motion.div {...fadeUp(0)}>
          <h1 className="text-xl font-bold text-foreground">Hello, {userName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Report and track local issues easily
          </p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => navigate("/report")}
              className="btn-primary-civic flex-1 flex items-center justify-center gap-2 text-sm"
            >
              <Plus size={16} /> Report New Issue
            </button>
            <button
              onClick={() => navigate("/my-issues")}
              className="flex-1 flex items-center justify-center gap-2 text-sm rounded-xl border border-border bg-card px-4 py-2.5 font-medium text-foreground hover:bg-muted transition-colors"
            >
              View My Issues
            </button>
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.1)}>
          <div className="grid grid-cols-3 gap-2.5">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="card-civic flex flex-col items-center py-3 px-1 text-center"
              >
                <div className={`w-8 h-8 rounded-full ${stat.bg} flex items-center justify-center mb-1.5`}>
                  <stat.icon size={15} className={stat.color} />
                </div>
                <span className="text-lg font-bold text-foreground leading-none">
                  {loading ? "..." : stat.value}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.2)}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">My Recent Issues</h2>
            <button
              onClick={() => navigate("/my-issues")}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5"
            >
              View all <ChevronRight size={12} />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentIssues.length === 0 ? (
              <div className="card-civic">
                <p className="text-sm text-muted-foreground">
                  {loading ? "Loading your issues..." : "No issues reported yet."}
                </p>
              </div>
            ) : (
              recentIssues.map((issue) => (
                <div key={issue.id} className="card-civic flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{issue.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin size={11} className="text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">
                        {buildLocation(issue)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText size={11} /> {issue.caseId}
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag size={11} /> {getCategoryName(issue)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getStatusColor(issue.status)}`}
                      >
                        {getStatusLabel(issue.status)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(issue.createdAt)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/issue/${issue.caseId}`)}
                    className="shrink-0 text-xs text-primary font-medium hover:underline mt-1"
                  >
                    View
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.3)}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Issues Near Me</h2>
            <button
              onClick={() => navigate("/area-issues")}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5"
            >
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2.5">
            {NEARBY_ISSUES.map((issue) => (
              <div key={issue.id} className="card-civic flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <issue.icon size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{issue.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{issue.area}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${issue.statusColor}`}>
                      {issue.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <ThumbsUp size={10} /> {issue.supporters} supporters
                    </span>
                  </div>
                </div>
                <button onClick={() => navigate("/area-issues")} className="shrink-0 mt-1">
                  <ArrowRight
                    size={14}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.4)}>
          <h2 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {quickActions.map((action) => (
              (() => {
                const isLatestPrimary = action.key === "latest-report" && !action.disabled;

                return (
                  <button
                    key={action.key}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={`flex items-center gap-3 text-left transition-colors ${
                      isLatestPrimary
                        ? "btn-primary-civic justify-start"
                        : "card-civic"
                    } ${action.disabled ? "opacity-50 cursor-not-allowed" : !isLatestPrimary ? "hover:bg-muted/40" : ""}`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isLatestPrimary ? "bg-primary-foreground/20" : "bg-muted"
                      }`}
                    >
                      <action.icon
                        size={16}
                        className={isLatestPrimary ? "text-primary-foreground" : action.color}
                      />
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        isLatestPrimary ? "text-primary-foreground" : "text-foreground"
                      }`}
                    >
                      {action.label}
                    </span>
                  </button>
                );
              })()
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardPage;