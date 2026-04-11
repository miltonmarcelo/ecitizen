import {
  MapPin,
  Calendar,
  Tag,
  FileText,
  CheckCircle2,
  MessageSquare,
  ClipboardCheck,
  Eye,
  Wrench,
  CircleX,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState, type ElementType } from "react";
import { useAuth } from "@/context/AuthContext";
import CitizenLayout from "@/components/layout/CitizenLayout";
import PageHeader from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import StatusBadge from "@/components/common/StatusBadge";
import { CITIZEN_STATUS_FLOW, formatIssueStatus } from "@/lib/issueMeta";

type ApiCategory = {
  id: number;
  name: string;
  description?: string | null;
  isActive?: boolean;
};

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
  categoryId: number;
  category: ApiCategory | null;
  status: string;
  addressLine1: string;
  addressLine2?: string | null;
  suburb: string;
  area: string;
  city: string;
  county: string;
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

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const getCategoryName = (issue: IssueDetails) =>
  issue.category?.name || "Uncategorised";

const CITIZEN_NOTICE_CONTENT: Record<
  string,
  { icon: ElementType; message: string; size?: number }
> = {
  CREATED: {
    icon: ClipboardCheck,
    size: 30,
    message: "We've received your report. Our team will review it shortly and keep you updated.",
  },
  UNDER_REVIEW: {
    icon: Eye,
    size: 30,
    message: "Your report is being reviewed. We'll let you know as soon as there's an update.",
  },
  IN_PROGRESS: {
    icon: Wrench,
    size: 30,
    message: "Our team is actively working on this issue. We'll keep you updated as things move forward.",
  },
  RESOLVED: {
    icon: CheckCircle2,
    size: 30,
    message: "Great news! Our team has resolved this issue. This report will be automatically closed soon.",
  },
  CLOSED: {
    icon: CheckCircle2,
    size: 16,
    message: "This issue has been resolved and closed. Thanks for helping make the city better.",
  },
  CANCELLED: {
    icon: CircleX,
    size: 30,
    message: "This report has been cancelled. If the issue is still there, you're welcome to submit a new report.",
  },
};

const buildTimeline = (issue: IssueDetails): TimelineStep[] => {
  const statusDates: Record<string, string> = {
    CREATED: formatDate(issue.createdAt),
  };

  for (const item of issue.history || []) {
    if (item.eventType === "STATUS_CHANGED" && item.toStatus && !statusDates[item.toStatus]) {
      statusDates[item.toStatus] = formatDate(item.changedAt);
    }

    if (item.eventType === "CREATED" && !statusDates.CREATED) {
      statusDates.CREATED = formatDate(item.changedAt);
    }
  }

  if (issue.status === "CANCELLED") {
    return [
      {
        key: "CREATED",
        label: formatIssueStatus("CREATED"),
        done: true,
        date: statusDates.CREATED || formatDate(issue.createdAt),
      },
      {
        key: "CANCELLED",
        label: formatIssueStatus("CANCELLED"),
        done: true,
        date: statusDates.CANCELLED || formatDate(issue.updatedAt),
      },
    ];
  }

  const currentIndex = CITIZEN_STATUS_FLOW.findIndex((status) => status === issue.status);

  return CITIZEN_STATUS_FLOW.map((status, index) => ({
    key: status,
    label: formatIssueStatus(status),
    done: currentIndex >= index,
    date: statusDates[status] || "",
  }));
};

const getNoticeConfig = (issue: IssueDetails) => {
  if (issue.status === "UNDER_REVIEW" && issue.notes?.length > 0) return null;
  return CITIZEN_NOTICE_CONTENT[issue.status] || null;
};

const IssueDetailsPage = () => {
  const navigate = useNavigate();
  const { issueId } = useParams<{ issueId: string }>();
  const { user, loading: authLoading } = useAuth();

  const [issue, setIssue] = useState<IssueDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    const fetchIssue = async () => {
      try {
        setLoading(true);
        setError("");

        if (!user || !issueId) {
          setIssue(null);
          return;
        }

        const token = await user.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/issues/${issueId}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load this report. Please try again.");
        }

        setIssue(data.issue || null);
      } catch (err: any) {
        setIssue(null);
        setError(err.message || "Unable to load report details.");
      } finally {
        setLoading(false);
      }
    };

    fetchIssue();
  }, [user, authLoading, issueId]);

  const timeline = useMemo(() => (issue ? buildTimeline(issue) : []), [issue]);
  const noticeConfig = useMemo(() => (issue ? getNoticeConfig(issue) : null), [issue]);

  if (loading || authLoading) {
    return (
      <CitizenLayout width="default" showBack backTo="/my-reports" showProfile>
        <SectionCard className="text-center" bodyClassName="py-10">
          <p className="text-sm text-muted-foreground">Loading issue details...</p>
        </SectionCard>
      </CitizenLayout>
    );
  }

  if (error || !issue) {
    return (
      <CitizenLayout width="default" showBack backTo="/my-reports" showProfile>
        <SectionCard className="text-center" bodyClassName="py-10">
          <FileText className="w-12 h-12 text-muted-foreground mb-4 mx-auto" />
          <p className="text-sm font-semibold text-foreground mb-1">Report Not Found</p>
          <p className="text-sm text-muted-foreground mb-6">
            {error || "We couldn't find this report. It may have been removed or the link may be incorrect."}
          </p>
          <button
            onClick={() => navigate("/my-reports")}
            className="btn-primary-civic text-sm px-6 py-2.5"
          >
            Back to My Reports
          </button>
        </SectionCard>
      </CitizenLayout>
    );
  }

  return (
    <CitizenLayout width="default" showBack backTo="/my-reports" showProfile>
      <div className="space-y-4">
        <motion.div {...fadeUp()}>
          <PageHeader
            title="Issue Details"
            subtitle="View the full details and progress of your report"
            className="mb-0"
          />
        </motion.div>

        <motion.div {...fadeUp(0.02)}>
          <SectionCard bodyClassName="space-y-3">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{issue.title}</h2>
              </div>
              <StatusBadge status={issue.status} />
            </div>

            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <FileText size={12} className="shrink-0" /> {issue.caseId}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={12} className="shrink-0" /> {formatDate(issue.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={12} className="shrink-0" /> {issue.suburb}
              </span>
              <span className="flex items-center gap-1.5">
                <Tag size={12} className="shrink-0" /> {getCategoryName(issue)}
              </span>
            </div>
          </SectionCard>
        </motion.div>

        <motion.div {...fadeUp(0.05)}>
          <SectionCard bodyClassName="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">What was reported</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{issue.description}</p>
          </SectionCard>
        </motion.div>

        <motion.div {...fadeUp(0.1)}>
          <SectionCard bodyClassName="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Where it happened</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>{issue.addressLine1}</p>
              {issue.addressLine2 && <p>{issue.addressLine2}</p>}
              <p>{issue.suburb}</p>
              <p>{issue.area}</p>
              <p>{issue.city}</p>
              <p>{issue.county}</p>
            </div>
          </SectionCard>
        </motion.div>

        <motion.div {...fadeUp(0.15)}>
          <SectionCard bodyClassName="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Progress so far</h3>
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
                        step.done ? "bg-accent border-accent" : "bg-card border-border"
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
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {step.date || "Pending"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </motion.div>

        {issue.notes?.length > 0 && (
          <motion.div {...fadeUp(0.2)}>
            <SectionCard bodyClassName="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <MessageSquare size={14} /> Updates from the team
              </h3>

              <div className="space-y-2.5">
                {issue.notes.map((note) => (
                  <div key={note.id} className="flex gap-2.5">
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap mt-0.5 w-20 shrink-0">
                      {formatDate(note.createdAt)}
                    </span>
                    <div className="space-y-1">
                      <p className="text-xs text-foreground leading-relaxed">{note.content}</p>
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
            </SectionCard>
          </motion.div>
        )}

        {noticeConfig && (
          <motion.div {...fadeUp(0.25)}>
            <SectionCard className="issue-notice issue-notice--primary" bodyClassName="space-y-2.5">
              <div className="issue-notice__content">
                <noticeConfig.icon size={noticeConfig.size ?? 30} />
                <p className="issue-notice__text">{noticeConfig.message}</p>
              </div>
            </SectionCard>
          </motion.div>
        )}

        <motion.div {...fadeUp(0.3)} className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            onClick={() => navigate("/my-reports")}
            className="btn-primary-civic w-full text-sm py-3"
          >
            Back to My Reports
          </button>

          <button
            onClick={() => navigate("/report")}
            className="flex-1 flex items-center justify-center gap-2 text-sm rounded-xl border border-border bg-card px-4 py-2.5 font-medium text-foreground hover:bg-muted transition-colors"
          >
            Submit a New Report
          </button>
        </motion.div>
      </div>
    </CitizenLayout>
  );
};

export default IssueDetailsPage;