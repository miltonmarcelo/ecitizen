import { CheckCircle, FileText, Calendar, Tag, ArrowRight, LayoutDashboard, PlusCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "@/firebase/firebase";
import TopBar from "@/components/TopBar";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35 },
  }),
};

type IssueDetails = {
  caseId: string;
  title: string;
  status: string;
  createdAt: string;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatStatus = (status: string) => {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getStatusClass = (status: string) => {
  switch (status) {
    case "OPEN":
      return "bg-primary/10 text-primary";
    case "IN_PROGRESS":
      return "bg-warning/10 text-warning";
    case "RESOLVED":
      return "bg-green-100 text-green-700";
    case "CLOSED":
      return "bg-muted text-muted-foreground";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const ReportSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const caseId = location.state?.caseId;

  const [issue, setIssue] = useState<IssueDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchIssue = async () => {
      if (!caseId) {
        setError("No case ID was provided.");
        setLoading(false);
        return;
      }

      try {
        const user = auth.currentUser;

        if (!user) {
          throw new Error("You must be logged in to view this page.");
        }

        const token = await user.getIdToken();

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/issues/${caseId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        console.log("Get issue response:", data);

        if (!response.ok) {
          throw new Error(data.message || "Failed to load issue details.");
        }

        const returnedIssue = data?.issue || data;

        if (!returnedIssue?.caseId) {
          console.error("Unexpected GET issue response:", data);
          throw new Error("Issue details were returned in an unexpected format.");
        }

        setIssue({
          caseId: returnedIssue.caseId,
          title: returnedIssue.title,
          status: returnedIssue.status,
          createdAt: returnedIssue.createdAt,
        });
      } catch (err: any) {
        setError(err.message || "Unable to load report details.");
      } finally {
        setLoading(false);
      }
    };

    fetchIssue();
  }, [caseId]);

  return (
    <div className="min-h-screen bg-background">
      <TopBar showBack backTo="/dashboard" showProfile />

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <motion.div
          className="text-center space-y-3"
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUp}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.15 }}
            className="inline-flex"
          >
            <CheckCircle className="w-16 h-16 text-primary mx-auto" strokeWidth={1.5} />
          </motion.div>
          <h1 className="text-xl font-bold text-foreground">Report Submitted Successfully</h1>
          <p className="text-sm text-muted-foreground">
            Your issue has been submitted and is now under review.
          </p>
        </motion.div>

        <motion.div
          className="card-civic space-y-3"
          initial="hidden"
          animate="visible"
          custom={1}
          variants={fadeUp}
        >
          <h3 className="section-title">Reference Details</h3>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading report details...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : issue ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Report ID</p>
                  <p className="text-sm font-semibold text-foreground tracking-wide">{issue.caseId}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Submission Date</p>
                  <p className="text-sm font-medium text-foreground">{formatDate(issue.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Issue Title</p>
                  <p className="text-sm font-medium text-foreground">{issue.title}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <span
                    className={`inline-block text-[11px] bg-primary/15 text-primary font-medium px-2.5 py-0.5 rounded-full mt-0.5 ${getStatusClass(issue.status)}`}
                  >
                    {formatStatus(issue.status)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No report details found.</p>
          )}
        </motion.div>

        <motion.div
          className="card-civic space-y-3"
          initial="hidden"
          animate="visible"
          custom={2}
          variants={fadeUp}
        >
          <h3 className="section-title">What Happens Next</h3>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-start gap-2.5">
              <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              Your report will be reviewed by the relevant department staff.
            </li>
            <li className="flex items-start gap-2.5">
              <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              You can track progress anytime from<button onClick={() => navigate("/my-issues")} className="text-primary">My Issues.</button>
            </li>
            <li className="flex items-start gap-2.5">
              <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              You may be contacted if more information is needed.
            </li>
          </ul>
        </motion.div>

        <motion.div
          className="flex gap-3"
          initial="hidden"
          animate="visible"
          custom={3}
          variants={fadeUp}
        >
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-primary-civic flex-1 flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            Back to Dashboard
          </button>

          <button
            onClick={() => navigate("/report")}
            className="btn-outline-civic flex-1 flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Report Another Issue
          </button>
        </motion.div>
      </main>
    </div>
  );
};

export default ReportSuccessPage;
