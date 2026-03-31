import {
  MapPin,
  Calendar,
  Tag,
  FileText,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/context/AuthContext";

type IssueNote = {
  id: number;
  content: string;
  createdAt: string;
  staff?: {
    id: number;
    jobTitle?: string | null;
    user?: {
      fullName?: string | null;
      email?: string | null;
    };
  } | null;
};

type IssueHistory = {
  id: number;
  eventType: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  comment?: string | null;
  changedAt: string;
  changedByUser?: {
    id: number;
    fullName?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
};

type IssueDetails = {
  id: number;
  caseId: string;
  title: string;
  description: string;
  category: string;
  status: string;
  addressLine1: string;
  addressLine2?: string | null;
  town: string;
  city: string;
  county: string;
  eircode: string;
  createdAt: string;
  updatedAt: string;
  notes: IssueNote[];
  history: IssueHistory[];
};

type TimelineStep = {
  key: string;
  label: string;
  done: boolean;
  date: string;
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.35 },
});

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatStatusLabel = (status: string) => {
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

const buildTimeline = (issue: IssueDetails): TimelineStep[] => {
  const statusDates: Record<string, string> = {
    CREATED: formatDate(issue.createdAt),
  };

  for (const item of issue.history || []) {
    if (item.eventType === "STATUS_CHANGED" && item.toStatus) {
      if (!statusDates[item.toStatus]) {
        statusDates[item.toStatus] = formatDate(item.changedAt);
      }
    }

    if (item.eventType === "CREATED" && !statusDates.CREATED) {
      statusDates.CREATED = formatDate(item.changedAt);
    }
  }

  if (issue.status === "CANCELLED") {
    return [
      {
        key: "CREATED",
        label: "Report submitted",
        done: true,
        date: statusDates.CREATED || formatDate(issue.createdAt),
      },
      {
        key: "CANCELLED",
        label: "Cancelled",
        done: true,
        date: statusDates.CANCELLED || "",
      },
    ];
  }

  const orderedSteps = [
    { key: "CREATED", label: "Report submitted" },
    { key: "UNDER_REVIEW", label: "Under review" },
    { key: "IN_PROGRESS", label: "In progress" },
    { key: "RESOLVED", label: "Resolved" },
    { key: "CLOSED", label: "Closed" },
  ];

  const currentIndex = orderedSteps.findIndex((step) => step.key === issue.status);

  return orderedSteps.map((step, index) => ({
    key: step.key,
    label: step.label,
    done: currentIndex >= index,
    date: statusDates[step.key] || "",
  }));
};

const IssueDetailsPage = () => {
  const navigate = useNavigate();
  const { issueId } = useParams<{ issueId: string }>();
  const { user, loading: authLoading } = useAuth();

  const [issue, setIssue] = useState<IssueDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        setLoading(true);
        setError("");

        if (!user || !issueId) {
          setIssue(null);
          return;
        }

        const token = await user.getIdToken();

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/issues/${issueId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch issue");
        }

        setIssue(data.issue);
      } catch (err: any) {
        setError(err.message || "Unable to load issue details.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchIssue();
    }
  }, [user, authLoading, issueId]);

  const timeline = useMemo(() => {
    if (!issue) return [];
    return buildTimeline(issue);
  }, [issue]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar showBack backTo="/my-issues" showProfile />
        <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
          <div className="card-civic text-center py-10">
            <p className="text-sm text-muted-foreground">Loading issue details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <FileText className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-1">Issue Not Found</h2>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          {error || "The report you're looking for doesn't exist."}
        </p>
        <button
          onClick={() => navigate("/my-issues")}
          className="btn-primary text-sm px-6 py-2.5"
        >
          Back to My Issues
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar showBack backTo="/my-issues" showProfile />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-4">
        <motion.div {...fadeUp(0)} className="card-civic space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-base font-bold text-foreground leading-snug flex-1">
              {issue.title}
            </h2>
            <span
              className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap ${getStatusColor(
                issue.status
              )}`}
            >
              {formatStatusLabel(issue.status)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <FileText size={12} className="shrink-0" /> {issue.caseId}
            </span>
            <span className="flex items-center gap-1.5">
              <Tag size={12} className="shrink-0" /> {issue.category}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="shrink-0" /> {issue.town}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={12} className="shrink-0" /> {formatDate(issue.createdAt)}
            </span>
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.05)} className="card-civic space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Description</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {issue.description}
          </p>
        </motion.div>

        <motion.div {...fadeUp(0.1)} className="card-civic space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Status Timeline</h3>
          <div className="relative pl-5">
            {timeline.map((step, idx) => {
              const isLast = idx === timeline.length - 1;

              return (
                <div key={step.key} className="relative pb-5 last:pb-0">
                  {!isLast && (
                    <div
                      className={`absolute left-0 top-3 w-px h-full ${
                        step.done ? "bg-accent" : "bg-border"
                      }`}
                    />
                  )}

                  <div
                    className={`absolute -left-1.5 top-0.5 w-3 h-3 rounded-full border-2 ${
                      step.done
                        ? "bg-accent border-accent"
                        : "bg-card border-border"
                    }`}
                  />

                  <div className="ml-3">
                    <p
                      className={`text-xs font-medium ${
                        step.done ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.date ? (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {step.date}
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Pending
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {issue.notes.length > 0 && (
          <motion.div {...fadeUp(0.15)} className="card-civic space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <MessageSquare size={14} /> Official Updates
            </h3>

            <div className="space-y-2.5">
              {issue.notes.map((note) => (
                <div key={note.id} className="flex gap-2.5">
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap mt-0.5 w-20 shrink-0">
                    {formatDate(note.createdAt)}
                  </span>
                  <div className="space-y-1">
                    <p className="text-xs text-foreground leading-relaxed">
                      {note.content}
                    </p>
                    {note.staff?.user?.fullName && (
                      <p className="text-[11px] text-muted-foreground">
                        {note.staff.user.fullName}
                        {note.staff.jobTitle ? ` • ${note.staff.jobTitle}` : ""}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {issue.notes.length === 0 && issue.status === "UNDER_REVIEW" && (
          <motion.div
            {...fadeUp(0.2)}
            className="card-civic border-warning/30 bg-warning/5 space-y-2.5"
          >
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <AlertCircle size={14} className="text-warning" /> Under Review
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your report has been received and is currently under review by the team.
            </p>
          </motion.div>
        )}

        {(issue.status === "RESOLVED" || issue.status === "CLOSED") && (
          <motion.div {...fadeUp(0.2)} className="card-civic bg-accent/5 border-accent/20">
            <div className="flex items-center gap-2 text-accent">
              <CheckCircle2 size={16} />
              <p className="text-sm font-medium">
                This issue has been {formatStatusLabel(issue.status).toLowerCase()}.
              </p>
            </div>
          </motion.div>
        )}

       <motion.div {...fadeUp(0.25)} className="grid grid-cols-2 gap-2.5 pt-2">
        <button
          onClick={() => navigate("/my-issues")}
          className="btn-primary-civic w-full text-sm py-3"
        >
          Back to My Issues
        </button>

        <button
          onClick={() => navigate("/report")}
          className="flex-1 flex items-center justify-center gap-2 text-sm rounded-xl border border-border bg-card px-4 py-2.5 font-medium text-foreground hover:bg-muted transition-colors"
        >
          Report Another Issue
        </button>
      </motion.div>
      </main>
    </div>
  );
};

export default IssueDetailsPage;