import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  FolderOpen,
  FileText,
  UserCheck,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { adminFetch } from "@/lib/adminApi";
import type { AdminCounts, AdminUser } from "@/lib/admin";

const emptyCounts: AdminCounts = {
  users: 0,
  staff: 0,
  categories: 0,
  issues: 0,
  notes: 0,
  history: 0,
};

const quickAccess = [
  {
    title: "Manage Users",
    description: "View, edit, and manage all user accounts",
    icon: Users,
    url: "/admin/users",
  },
  {
    title: "Manage Staff",
    description: "View and manage staff records",
    icon: UserCheck,
    url: "/admin/staff",
  },
  {
    title: "Manage Categories",
    description: "Add, edit, and manage issue categories",
    icon: FolderOpen,
    url: "/admin/categories",
  },
  {
    title: "Browse Database",
    description: "Explore all database tables",
    icon: FileText,
    url: "/admin/database",
  },
] as const;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [counts, setCounts] = useState<AdminCounts>(emptyCounts);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboardData = useCallback(
    async (isRefresh = false) => {
      if (!user) {
        setCounts(emptyCounts);
        setUsers([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const [overviewData, usersData] = await Promise.all([
          adminFetch<{ counts: AdminCounts }>(user, "/api/admin/overview"),
          adminFetch<{ users: AdminUser[] }>(user, "/api/admin/users"),
        ]);

        setCounts(overviewData.counts || emptyCounts);
        setUsers(usersData.users || []);
      } catch (err: any) {
        setError(
          err.message ||
            (isRefresh
              ? "Unable to refresh the admin dashboard."
              : "Unable to load the admin dashboard.")
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (!authLoading) {
      loadDashboardData();
    }
  }, [authLoading, loadDashboardData]);

  const activeUsers = useMemo(
    () => users.filter((item) => item.isActive).length,
    [users]
  );

  const stats = useMemo(
    () => [
      {
        title: "Total Users",
        value: counts.users,
        icon: Users,
        iconColor: "text-primary",
        iconBg: "bg-primary/10",
      },
      {
        title: "Active Users",
        value: activeUsers,
        icon: UserCheck,
        iconColor: "text-accent",
        iconBg: "bg-accent/10",
      },
      {
        title: "Total Categories",
        value: counts.categories,
        icon: FolderOpen,
        iconColor: "text-primary",
        iconBg: "bg-primary/10",
      },
      {
        title: "Total Issues",
        value: counts.issues,
        icon: FileText,
        iconColor: "text-primary",
        iconBg: "bg-primary/10",
      },
    ],
    [counts.users, counts.categories, counts.issues, activeUsers]
  );

  if (loading) {
    return (
      <AdminLayout pageTitle="Admin Dashboard">
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading admin dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="Admin Dashboard">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-1">
            Overview
          </h2>
          <p className="text-sm text-muted-foreground">System summary at a glance</p>
        </div>

        <Button
          variant="outline"
          onClick={() => loadDashboardData(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5 mb-6">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${stat.iconBg}`}
              >
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {stat.title}
                </p>
                <p className="text-2xl font-heading font-bold text-card-foreground leading-none mt-0.5">
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-heading font-semibold text-foreground mb-1">
          Quick Access
        </h2>
        <p className="text-sm text-muted-foreground mb-4">Jump to management areas</p>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {quickAccess.map((item) => (
            <Card
              key={item.title}
              className="shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => navigate(item.url)}
            >
              <CardContent className="p-5 flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-card-foreground">
                      {item.title}
                    </p>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </div>

                  <p className="text-xs text-muted-foreground mt-1">
                    {item.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}