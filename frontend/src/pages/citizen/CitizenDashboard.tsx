import {
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Construction,
  MapPin,
  ChevronRight,
  Lightbulb,
  Trash2,
  History,
  TriangleAlert,
  Waves,
  ShieldAlert,
  FileText,
  Tag,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import CitizenLayout from "@/components/layout/CitizenLayout";
import PageHeader from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import StatusBadge from "@/components/common/StatusBadge";
import type { IssueStatus } from "@/types/domain";

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

const DEFAULT_CATEGORY_NAMES = ["Potholes", "Illegal Dumping", "Hazards"];
const CLOSED_STATUSES: IssueStatus[] = ["RESOLVED", "CLOSED", "CANCELLED"];
const RESOLVED_STATUSES: IssueStatus[] = ["RESOLVED", "CLOSED"];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
});

const normalizeName = (value: string) =>
  value.toLowerCase().trim().replace(/\s+/g, " ");

const buildLocation = ({ addressLine1, suburb, area }: ApiIssue) =>
  [addressLine1, suburb, area].filter(Boolean).join(", ");

const getCategoryName = (issue: ApiIssue) =>
  issue.category?.name || "Uncategorised";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const QUICK_ACTION_META = {
  potholes: {
    label: "Report Pothole",
    icon: Construction,
    color: "var(--app-brand-primary)",
  },
  "illegal dumping": {
    label: "Report Illegal Dumping",
    icon: Trash2,
    color: "var(--app-brand-accent)",
  },
  hazards: {
    label: "Report Hazard",
    icon: ShieldAlert,
    color: "var(--status-review-text)",
  },
  "street lighting": {
    label: "Report Street Lighting",
    icon: Lightbulb,
    color: "var(--status-review-text)",
  },
  "waste collection": {
    label: "Report Waste Issue",
    icon: Trash2,
    color: "var(--app-brand-accent)",
  },
  flooding: {
    label: "Report Flooding",
    icon: Waves,
    color: "var(--status-progress-text)",
  },
} satisfies Record<
  string,
  {
    label: string;
    icon: typeof TriangleAlert;
    color: string;
  }
>;

const getQuickActionMeta = (categoryName: string) =>
  QUICK_ACTION_META[normalizeName(categoryName)] || {
    label: `Report ${categoryName}`,
    icon: TriangleAlert,
    color: "var(--app-brand-primary)",
  };

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [issues, setIssues] = useState<ApiIssue[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        if (!user) {
          setIssues([]);
          setCategories([]);
          return;
        }

        const token = await user.getIdToken();
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const headers = { Authorization: `Bearer ${token}` };

        const [issuesResponse, categoriesResponse] = await Promise.all([
          fetch(`${baseUrl}/api/issues/my`, { method: "GET", headers }),
          fetch(`${baseUrl}/api/categories`, { method: "GET", headers }),
        ]);

        const [issuesData, categoriesData] = await Promise.all([
          issuesResponse.json(),
          categoriesResponse.json(),
        ]);

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

    fetchDashboardData();
  }, [user, authLoading]);

  const sortedIssues = useMemo(
    () =>
      [...issues].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [issues]
  );

  const latestIssue = sortedIssues[0] || null;
  const recentIssues = sortedIssues.slice(0, 3);

  const stats = useMemo(
    () => [
      {
        label: "Submitted",
        value: issues.length,
        icon: AlertCircle,
        cardBg: "var(--status-created-bg)",
        borderColor: "var(--status-created-border)",
        iconBg: "color-mix(in oklab, var(--status-created-border) 30%, white)",
        iconColor: "var(--status-created-text)",
      },
      {
        label: "In Progress",
        value: issues.filter((issue) => !CLOSED_STATUSES.includes(issue.status)).length,
        icon: Clock,
        cardBg: "var(--status-progress-bg)",
        borderColor: "var(--status-progress-border)",
        iconBg: "color-mix(in oklab, var(--status-progress-border) 30%, white)",
        iconColor: "var(--status-progress-text)",
      },
      {
        label: "Resolved",
        value: issues.filter((issue) => RESOLVED_STATUSES.includes(issue.status)).length,
        icon: CheckCircle2,
        cardBg: "var(--status-resolved-bg)",
        borderColor: "var(--status-resolved-border)",
        iconBg: "color-mix(in oklab, var(--status-resolved-border) 30%, white)",
        iconColor: "var(--status-resolved-text)",
      },
    ],
    [issues]
  );

  const topQuickActionCategories = useMemo(() => {
    const usedCounts = new Map<number, { category: ApiCategory; count: number }>();

    for (const issue of issues) {
      if (!issue.category || !issue.categoryId) continue;

      const current = usedCounts.get(issue.categoryId);

      usedCounts.set(issue.categoryId, {
        category: issue.category,
        count: (current?.count || 0) + 1,
      });
    }

    const mostUsed = [...usedCounts.values()]
      .sort((a, b) => b.count - a.count)
      .map(({ category }) => category);

    const fallbackCategories = DEFAULT_CATEGORY_NAMES.map((defaultName) =>
      categories.find(
        (category) => normalizeName(category.name) === normalizeName(defaultName)
      )
    ).filter(Boolean) as ApiCategory[];

    return [...mostUsed, ...fallbackCategories]
      .filter(
        (category, index, arr) =>
          arr.findIndex((item) => item.id === category.id) === index
      )
      .slice(0, 3);
  }, [issues, categories]);

  const quickActions = useMemo(
    () => [
      {
        key: "latest-report",
        icon: latestIssue ? History : Plus,
        label: latestIssue ? "See My Latest Report" : "Report a New Issue",
        color: "var(--app-brand-primary)",
        onClick: () =>
          latestIssue ? navigate(`/issue/${latestIssue.caseId}`) : navigate("/report"),
        disabled: false,
      },
      ...topQuickActionCategories.map((category) => {
        const meta = getQuickActionMeta(category.name);

        return {
          key: `category-${category.id}`,
          icon: meta.icon,
          label: meta.label,
          color: meta.color,
          onClick: () => navigate(`/report?categoryId=${category.id}`),
          disabled: false,
        };
      }),
    ],
    [topQuickActionCategories, latestIssue, navigate]
  );

  return (
    <CitizenLayout width="default" showBack backTo="/" showProfile>
      <div className="space-y-6">
        <motion.div {...fadeUp()}>
          <PageHeader
            title="Small action. Real change."
            subtitle="Report and track local issues easily"
            className="mb-4"
          />

          <div className="actions-row mt-4">
            <button
              onClick={() => navigate("/report")}
              className="app-btn app-btn--primary flex-1"
            >
              <Plus size={16} /> Report New Issue
            </button>

            <button
              onClick={() => navigate("/my-reports")}
              className="app-btn app-btn--secondary flex-1"
            >
              My Reports
            </button>
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.1)}>
          <div className="stats-grid">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="stat-card"
                style={{
                  backgroundColor: stat.cardBg,
                  borderColor: stat.borderColor,
                }}
              >
                <div
                  className="stat-card__icon"
                  style={{
                    backgroundColor: stat.iconBg,
                    color: stat.iconColor,
                  }}
                >
                  <stat.icon size={18} />
                </div>

                <span className="stat-card__value">
                  {loading ? "..." : stat.value}
                </span>
                <span className="stat-card__label">{stat.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.2)}>
          <div className="section-row">
            <h2 className="section-row__title">Latest Reports</h2>

            <button
              onClick={() => navigate("/my-reports")}
              className="section-row__link"
            >
              View all <ChevronRight size={12} />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentIssues.length === 0 ? (
              <SectionCard bodyClassName="text-center py-8 px-4">
                <div className="space-y-2">
                  <p className="text-base font-medium text-foreground">
                    Nothing here yet. You have not reported any issues so far.
                  </p>

                  <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    When you spot something that needs attention, reporting it here is a quick way to help.
                  </p>
                </div>
              </SectionCard>
            ) : (
              recentIssues.map((issue) => (
                <SectionCard key={issue.id} bodyClassName="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {issue.title}
                    </p>

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

                    <div className="flex items-center gap-3 mt-2">
                      <StatusBadge status={issue.status} />
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
                </SectionCard>
              ))
            )}
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.3)}>
          <h2 className="section-row__title mb-3">Quick Actions</h2>

          <div className="action-grid">
            {quickActions.map((action) => {
              const isLatestPrimary =
                action.key === "latest-report" && !action.disabled;

              return (
                <button
                  key={action.key}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`action-tile ${isLatestPrimary ? "action-tile--primary" : ""} ${
                    action.disabled ? "action-tile--disabled" : ""
                  }`}
                >
                  <div className="action-tile__icon">
                    <action.icon
                      size={16}
                      style={isLatestPrimary ? undefined : { color: action.color }}
                    />
                  </div>

                  <span className="action-tile__label">{action.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </CitizenLayout>
  );
};

export default DashboardPage;