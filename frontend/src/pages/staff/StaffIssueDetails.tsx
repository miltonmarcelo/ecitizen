import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { StaffAppSidebar } from "@/components/staff/StaffAppSidebar";
import StaffDashboardHeader from "@/components/staff/StaffDashboardHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  User,
  Mail,
  FileText,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserRoundCheck,
  Tag,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import type { IssueStatus } from "@/types/domain";
import { ALL_ISSUE_STATUSES, formatIssueStatus, getIssueStatusClass } from "@/lib/issueMeta";
import {
  buildIssueLocation,
  calculateDaysOpen,
  formatShortDate,
  formatShortDateTime,
  getStaffDisplayName,
  type ApiAssignableStaffMember,
  type ApiCategory,
  type ApiStaffSummary,
  type ApiCitizenSummary,
} from "@/lib/staffIssues";

type IssueNote = {
  id: number;
  content: string;
  createdAt: string;
  staff?: ApiStaffSummary;
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

type StaffIssueDetailsData = {
  id: number;
  caseId: string;
  title: string;
  description: string;
  categoryId: number | null;
  category: ApiCategory | null;
  status: IssueStatus;
  addressLine1: string;
  addressLine2?: string | null;
  suburb?: string | null;
  area?: string | null;
  city: string;
  county: string;
  createdAt: string;
  updatedAt: string;
  citizen?: ApiCitizenSummary;
  staff?: ApiStaffSummary;
  notes: IssueNote[];
  history: IssueHistory[];
};

const timelineIconMap: Record<string, any> = {
  CREATED: AlertCircle,
  STATUS_CHANGED: CheckCircle2,
  NOTE_ADDED: MessageSquare,
  INFO_REQUESTED: MessageSquare,
  INFO_RECEIVED: MessageSquare,
  ASSIGNED: UserRoundCheck,
  UNASSIGNED: UserRoundCheck,
  REOPENED: AlertCircle,
};

const timelineColorMap: Record<string, string> = {
  CREATED: "text-blue-600 bg-blue-50",
  STATUS_CHANGED: "text-amber-600 bg-amber-50",
  NOTE_ADDED: "text-primary bg-primary/10",
  INFO_REQUESTED: "text-primary bg-primary/10",
  INFO_RECEIVED: "text-primary bg-primary/10",
  ASSIGNED: "text-emerald-600 bg-emerald-50",
  UNASSIGNED: "text-slate-600 bg-slate-50",
  REOPENED: "text-blue-600 bg-blue-50",
};

function getTimelineTitle(item: IssueHistory): string {
  if (item.comment?.trim()) {
    return item.comment;
  }

  if (item.eventType === "STATUS_CHANGED" && item.toStatus) {
    return `Status changed to ${formatIssueStatus(item.toStatus)}`;
  }

  if (item.eventType === "CREATED") {
    return "Issue created";
  }

  return item.eventType.replace(/_/g, " ");
}

const StaffIssueDetails = () => {
  const { issueId } = useParams<{ issueId: string }>();
  const navigate = useNavigate();
  const { user, appUser, loading: authLoading } = useAuth();

  const [issue, setIssue] = useState<StaffIssueDetailsData | null>(null);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [staffMembers, setStaffMembers] = useState<ApiAssignableStaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusSaving, setStatusSaving] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [error, setError] = useState("");
  const [currentStatus, setCurrentStatus] = useState<IssueStatus | "">("");
  const [currentCategoryId, setCurrentCategoryId] = useState<string>("");
  const [currentAssigneeId, setCurrentAssigneeId] = useState<string>("unassigned");
  const [staffNote, setStaffNote] = useState("");

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError("");

      if (!user || !issueId) {
        setIssue(null);
        setCategories([]);
        setStaffMembers([]);
        return;
      }

      const token = await user.getIdToken();

      const [issueResponse, categoriesResponse, staffResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/issues/${issueId}`, {
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
        fetch(`${API_BASE_URL}/api/users/staff-members`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const issueData = await issueResponse.json();
      const categoriesData = await categoriesResponse.json();
      const staffData = await staffResponse.json();

      if (!issueResponse.ok) {
        throw new Error(issueData.message || "Failed to fetch issue");
      }

      if (!categoriesResponse.ok) {
        throw new Error(categoriesData.message || "Failed to fetch categories");
      }

      if (!staffResponse.ok) {
        throw new Error(staffData.message || "Failed to fetch staff members");
      }

      const nextIssue = issueData.issue || null;
      const nextCategories = Array.isArray(categoriesData.categories) ? categoriesData.categories : [];
      const nextStaffMembers = Array.isArray(staffData.staffMembers) ? staffData.staffMembers : [];

      setIssue(nextIssue);
      setCategories(nextCategories);
      setStaffMembers(nextStaffMembers);
      setCurrentStatus(nextIssue?.status || "");
      setCurrentCategoryId(nextIssue?.categoryId ? String(nextIssue.categoryId) : "");
      setCurrentAssigneeId(nextIssue?.staff?.id ? String(nextIssue.staff.id) : "unassigned");
    } catch (err: any) {
      setError(err.message || "Unable to load issue details.");
      setIssue(null);
      setCategories([]);
      setStaffMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadPageData();
    }
  }, [user, authLoading, issueId]);

  const handleSaveStatus = async () => {
    if (!issue || !currentStatus || currentStatus === issue.status || !user) {
      return;
    }

    try {
      setStatusSaving(true);
      setError("");

      const token = await user.getIdToken();

      const response = await fetch(`${API_BASE_URL}/api/issues/${issue.caseId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: currentStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update issue status");
      }

      await loadPageData();
    } catch (err: any) {
      setError(err.message || "Unable to update issue status.");
    } finally {
      setStatusSaving(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!issue || !currentCategoryId || String(issue.categoryId || "") === currentCategoryId || !user) {
      return;
    }

    try {
      setCategorySaving(true);
      setError("");

      const token = await user.getIdToken();

      const response = await fetch(`${API_BASE_URL}/api/issues/${issue.caseId}/category`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          categoryId: Number(currentCategoryId),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update issue category");
      }

      await loadPageData();
    } catch (err: any) {
      setError(err.message || "Unable to update issue category.");
    } finally {
      setCategorySaving(false);
    }
  };

  const handleSaveAssignment = async () => {
    if (!issue || !user) {
      return;
    }

    const existingAssignment = issue.staff?.id ? String(issue.staff.id) : "unassigned";

    if (currentAssigneeId === existingAssignment) {
      return;
    }

    try {
      setAssignmentSaving(true);
      setError("");

      const token = await user.getIdToken();
      const nextStaffId = currentAssigneeId === "unassigned" ? null : Number(currentAssigneeId);

      const response = await fetch(`${API_BASE_URL}/api/issues/${issue.caseId}/assignment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          staffId: nextStaffId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update assignment");
      }

      await loadPageData();
    } catch (err: any) {
      setError(err.message || "Unable to update assignment.");
    } finally {
      setAssignmentSaving(false);
    }
  };

  const handleAssignToMe = () => {
    if (appUser?.staffProfile?.id) {
      setCurrentAssigneeId(String(appUser.staffProfile.id));
    }
  };

  const handleSaveNote = async () => {
    if (!issue || !user || !staffNote.trim()) {
      return;
    }

    try {
      setNoteSaving(true);
      setError("");

      const token = await user.getIdToken();

      const response = await fetch(`${API_BASE_URL}/api/issues/${issue.caseId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: staffNote.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save staff note");
      }

      setStaffNote("");
      await loadPageData();
    } catch (err: any) {
      setError(err.message || "Unable to save staff note.");
    } finally {
      setNoteSaving(false);
    }
  };

  const daysOpen = useMemo(() => {
    if (!issue) return 0;
    return calculateDaysOpen(issue.createdAt, issue.status, issue.updatedAt);
  }, [issue]);

  const assignmentUnchanged = useMemo(() => {
    if (!issue) return true;
    const existingAssignment = issue.staff?.id ? String(issue.staff.id) : "unassigned";
    return currentAssigneeId === existingAssignment;
  }, [issue, currentAssigneeId]);

  const categoryUnchanged = useMemo(() => {
    if (!issue) return true;
    return String(issue.categoryId || "") === currentCategoryId;
  }, [issue, currentCategoryId]);

  if (loading || authLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <StaffAppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <StaffDashboardHeader pageTitle="Issue Details" />
            <main className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Loading issue details...</p>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (error && !issue) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <StaffAppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <StaffDashboardHeader pageTitle="Issue Details" />
            <main className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-foreground mb-1">Issue not found</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {error || "The selected issue could not be loaded."}
                </p>
                <Button variant="outline" onClick={() => navigate("/staff/dashboard")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!issue) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <StaffAppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <StaffDashboardHeader pageTitle="Issue Details" />

          <main className="flex-1 p-5 lg:p-6 overflow-auto">
            <div className="mb-4">
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>

            {error ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive mb-4">
                {error}
              </div>
            ) : null}

            <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.85fr] gap-6">
              <div className="space-y-6">
                <section className="rounded-lg border bg-card p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-primary mb-2">{issue.caseId}</p>
                      <h2 className="text-xl font-heading font-semibold text-foreground">
                        {issue.title}
                      </h2>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-xs font-medium ${getIssueStatusClass(issue.status)}`}
                    >
                      {formatIssueStatus(issue.status)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5 text-sm">
                    <MetaRow icon={Calendar} label="Date Reported" value={formatShortDate(issue.createdAt)} />
                    <MetaRow icon={Clock} label="Days Open" value={daysOpen === 0 ? "Today" : `${daysOpen} days`} />
                    <MetaRow icon={Calendar} label="Last Updated" value={formatShortDateTime(issue.updatedAt)} />
                    <MetaRow icon={FileText} label="Category" value={issue.category?.name || "Uncategorised"} />
                    <MetaRow icon={User} label="Assigned To" value={issue.staff?.user?.fullName || "Unassigned"} />
                    <MetaRow icon={MapPin} label="Location" value={buildIssueLocation(issue)} />
                  </div>

                  <Separator className="my-5" />

                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground leading-6">{issue.description}</p>
                  </div>
                </section>

                <section className="rounded-lg border bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Case Timeline</h3>

                  <div className="space-y-4">
                    {issue.history.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No history entries yet.</p>
                    ) : (
                      issue.history.map((item) => {
                        const Icon = timelineIconMap[item.eventType] || MessageSquare;
                        const colorClass = timelineColorMap[item.eventType] || "text-primary bg-primary/10";

                        return (
                          <div key={item.id} className="flex gap-3">
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                              <Icon className="w-4 h-4" />
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground">{getTimelineTitle(item)}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatShortDateTime(item.changedAt)}
                                {item.changedByUser?.fullName ? ` • ${item.changedByUser.fullName}` : ""}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>

                <section className="rounded-lg border bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Staff Notes</h3>

                  <div className="space-y-4 mb-5">
                    <Textarea
                      value={staffNote}
                      onChange={(event) => setStaffNote(event.target.value)}
                      placeholder="Add a progress update for the citizen"
                      className="min-h-28 resize-y"
                    />
                    <Button onClick={handleSaveNote} disabled={noteSaving || !staffNote.trim()}>
                      {noteSaving ? "Saving..." : "Save Note"}
                    </Button>
                  </div>

                  <Separator className="mb-4" />

                  <div className="space-y-4">
                    {issue.notes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No staff notes recorded yet.</p>
                    ) : (
                      issue.notes.map((note) => (
                        <div key={note.id} className="rounded-lg border bg-muted/20 p-4">
                          <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {note.staff?.user?.fullName || "Staff user"} • {formatShortDateTime(note.createdAt)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <section className="rounded-lg border bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Reporter</h3>

                  <div className="space-y-3 text-sm">
                    <MetaRow icon={User} label="Name" value={issue.citizen?.fullName || "Unknown"} />
                    <MetaRow icon={Mail} label="Email" value={issue.citizen?.email || "Not available"} />
                  </div>
                </section>

                <section className="rounded-lg border bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <UserRoundCheck className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">Assignment</h3>
                  </div>

                  <div className="space-y-3">
                    <Select value={currentAssigneeId} onValueChange={setCurrentAssigneeId}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {staffMembers.map((member) => (
                          <SelectItem key={member.id} value={String(member.id)}>
                            {getStaffDisplayName(member)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAssignToMe}
                        disabled={!appUser?.staffProfile?.id}
                      >
                        Assign to Me
                      </Button>
                      <Button onClick={handleSaveAssignment} disabled={assignmentSaving || assignmentUnchanged}>
                        {assignmentSaving ? "Saving..." : "Save Assignment"}
                      </Button>
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">Update Status</h3>
                  </div>

                  <div className="space-y-3">
                    <Select value={currentStatus} onValueChange={(value) => setCurrentStatus(value as IssueStatus)}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_ISSUE_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {formatIssueStatus(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button onClick={handleSaveStatus} disabled={statusSaving || !currentStatus || currentStatus === issue.status} className="w-full">
                      {statusSaving ? "Saving..." : "Save Status"}
                    </Button>
                  </div>
                </section>

                <section className="rounded-lg border bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">Update Category</h3>
                  </div>

                  <div className="space-y-3">
                    <Select value={currentCategoryId} onValueChange={setCurrentCategoryId}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={String(category.id)}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button onClick={handleSaveCategory} disabled={categorySaving || !currentCategoryId || categoryUnchanged} className="w-full">
                      {categorySaving ? "Saving..." : "Save Category"}
                    </Button>
                  </div>
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const MetaRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-2.5">
    <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground break-words">{value}</p>
    </div>
  </div>
);

export default StaffIssueDetails;
