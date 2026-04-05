import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
  Phone,
  FileText,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
  UserPlus,
} from "lucide-react";

const issuesData: Record<string, any> = {
  "ISS-1045": {
    id: "ISS-1045",
    title: "Blocked Drain - Oak Avenue",
    category: "Drainage",
    status: "Open",
    dateReported: "24 Mar 2026",
    lastUpdated: "24 Mar 2026",
    description:
      "There is a large blockage in the storm drain on the corner of Oak Avenue and Birch Street. Water is pooling across the footpath and part of the road during rain. This is causing a hazard for pedestrians and vehicles. The drain cover appears to be partially displaced.",
    location: "Corner of Oak Avenue and Birch Street, near the primary school",
    reporter: {
      name: "Margaret Thompson",
      email: "m.thompson@email.com",
      phone: "07700 900123",
    },
    timeline: [
      { event: "Issue submitted by citizen", date: "24 Mar 2026, 09:14", type: "created" },
    ],
    notes: [],
  },
  "ISS-1044": {
    id: "ISS-1044",
    title: "Streetlight Out - Elm Road",
    category: "Lighting",
    status: "In Progress",
    dateReported: "23 Mar 2026",
    lastUpdated: "24 Mar 2026",
    description:
      "The streetlight outside number 42 Elm Road has not been working for over a week. The area is very dark at night and residents feel unsafe walking to the bus stop.",
    location: "42 Elm Road, near the bus stop",
    reporter: {
      name: "David Chen",
      email: "d.chen@email.com",
      phone: "07700 900456",
    },
    timeline: [
      { event: "Issue submitted by citizen", date: "23 Mar 2026, 14:32", type: "created" },
      { event: "Status changed to In Progress", date: "24 Mar 2026, 10:05", type: "status" },
      { event: "Staff note added by J. Martinez", date: "24 Mar 2026, 10:06", type: "note" },
    ],
    notes: [
      {
        author: "J. Martinez",
        date: "24 Mar 2026, 10:06",
        text: "Assigned to field team for inspection. Electrical contractor notified.",
      },
    ],
  },
};

const statusVariant: Record<string, string> = {
  Open: "bg-blue-50 text-blue-700 border-blue-200",
  "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
  Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Closed: "bg-muted text-muted-foreground border-border",
};

const timelineIcon: Record<string, any> = {
  created: AlertCircle,
  status: CheckCircle2,
  note: MessageSquare,
};

const timelineColor: Record<string, string> = {
  created: "text-blue-600 bg-blue-50",
  status: "text-amber-600 bg-amber-50",
  note: "text-primary bg-primary/10",
};

const StaffIssueDetails = () => {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const issue = issuesData[issueId || ""];

  const [currentStatus, setCurrentStatus] = useState(issue?.status || "Open");
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState(issue?.notes || []);
  const [timeline, setTimeline] = useState(issue?.timeline || []);
  const [assignedTo, setAssignedTo] = useState<string | null>(issue?.assignedTo || null);
  const [infoRequestText, setInfoRequestText] = useState("");
  const [showReassign, setShowReassign] = useState(false);
  const [reassignTarget, setReassignTarget] = useState("");

  const parseDaysElapsed = () => {
    if (!issue) return 0;
    const reported = new Date(issue.dateReported);
    const now = new Date("25 Mar 2026");
    return Math.max(0, Math.floor((now.getTime() - reported.getTime()) / 86400000));
  };

  const days = parseDaysElapsed();

  const handleAssignToMe = () => {
    setAssignedTo("Staff User");
    const now = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    setTimeline((prev: any[]) => [
      ...prev,
      { event: "Assigned to Staff User", date: now, type: "status" },
    ]);
  };

  const handleReassign = () => {
    if (!reassignTarget) return;

    setAssignedTo(reassignTarget);

    const now = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    setTimeline((prev: any[]) => [
      ...prev,
      { event: `Reassigned to ${reassignTarget}`, date: now, type: "status" },
    ]);

    setShowReassign(false);
    setReassignTarget("");
  };

  const handleSendInfoRequest = () => {
    if (!infoRequestText.trim()) return;

    const now = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    setTimeline((prev: any[]) => [
      ...prev,
      {
        event: "Information request sent to citizen",
        date: now,
        type: "note",
      },
    ]);

    setInfoRequestText("");
  };

  if (!issue) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <DashboardHeader pageTitle="Issue Details" />
            <main className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h2 className="text-lg font-heading font-semibold text-foreground mb-1">
                  Issue not found
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  The issue "{issueId}" could not be found.
                </p>
                <Button variant="outline" onClick={() => navigate("/staff/issues")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to All Issues
                </Button>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  const handleSaveStatus = () => {
    if (currentStatus !== issue.status) {
      const newEvent = {
        event: `Status changed to ${currentStatus}`,
        date: new Date().toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: "status",
      };
      setTimeline((prev: any[]) => [...prev, newEvent]);
    }
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;

    const now = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const newNote = {
      author: "Staff User",
      date: now,
      text: noteText.trim(),
    };

    const newEvent = {
      event: "Staff note added by Staff User",
      date: now,
      type: "note",
    };

    setNotes((prev: any[]) => [...prev, newNote]);
    setTimeline((prev: any[]) => [...prev, newEvent]);
    setNoteText("");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader pageTitle="Issue Details" />

          <main className="flex-1 p-5 lg:p-6 overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/staff/issues")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Back to All Issues
                </Button>

                <Separator orientation="vertical" className="h-5 hidden sm:block" />

                <span className="font-mono text-sm font-semibold text-primary">
                  {issue.id}
                </span>

                <Badge
                  variant="outline"
                  className={`text-xs font-medium ${statusVariant[currentStatus] || ""}`}
                >
                  {currentStatus}
                </Badge>

                <Badge
                  variant="outline"
                  className="text-xs font-medium bg-muted text-muted-foreground border-border"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {days === 0 ? "Today" : days === 1 ? "1 day ago" : `${days} days ago`}
                </Badge>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-1 min-w-0 space-y-5">
                <div className="bg-card rounded-lg border border-border p-6">
                  <h2 className="text-lg font-heading font-bold text-card-foreground mb-4">
                    {issue.title}
                  </h2>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <InfoField icon={FileText} label="Category" value={issue.category} />
                    <InfoField
                      icon={Calendar}
                      label="Date Reported"
                      value={issue.dateReported}
                    />
                    <InfoField
                      icon={Clock}
                      label="Last Updated"
                      value={issue.lastUpdated}
                    />

                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Status
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium ${statusVariant[currentStatus] || ""}`}
                      >
                        {currentStatus}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-sm font-heading font-semibold text-card-foreground mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Citizen Submitted Details
                  </h3>

                  <p className="text-sm text-card-foreground leading-relaxed mb-4">
                    {issue.description}
                  </p>

                  <div className="flex items-start gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                        Location
                      </p>
                      <p className="text-sm text-card-foreground">{issue.location}</p>
                    </div>
                  </div>

                  <div className="mt-4 border border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-xs">No images attached</p>
                  </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-sm font-heading font-semibold text-card-foreground mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Reporter Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InfoField icon={User} label="Name" value={issue.reporter.name} />
                    <InfoField icon={Mail} label="Email" value={issue.reporter.email} />
                    <InfoField
                      icon={Phone}
                      label="Phone"
                      value={issue.reporter.phone || "Not provided"}
                      muted={!issue.reporter.phone}
                    />
                  </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-sm font-heading font-semibold text-card-foreground mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    Case Timeline
                  </h3>

                  <div className="relative">
                    <div className="absolute left-[13px] top-3 bottom-3 w-px bg-border" />
                    <div className="space-y-4">
                      {timeline.map((entry: any, i: number) => {
                        const Icon = timelineIcon[entry.type] || AlertCircle;
                        const color =
                          timelineColor[entry.type] || "text-muted-foreground bg-muted";

                        return (
                          <div key={i} className="flex items-start gap-3 relative">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${color}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="pt-0.5">
                              <p className="text-sm text-card-foreground">{entry.event}</p>
                              <p className="text-xs text-muted-foreground">{entry.date}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-80 xl:w-96 shrink-0 space-y-5">
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-sm font-heading font-semibold text-card-foreground mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Assigned To
                  </h3>

                  {assignedTo ? (
                    <p className="text-sm text-card-foreground font-medium mb-3">
                      {assignedTo}
                    </p>
                  ) : (
                    <div className="mb-3">
                      <p className="text-sm text-muted-foreground italic mb-3">Unassigned</p>
                      <Button
                        onClick={handleAssignToMe}
                        variant="outline"
                        className="w-full h-10 text-sm font-semibold"
                      >
                        Assign to Me
                      </Button>
                    </div>
                  )}

                  {!showReassign ? (
                    <Button
                      onClick={() => setShowReassign(true)}
                      variant="outline"
                      className="w-full h-10 text-sm font-medium"
                    >
                      <UserPlus className="w-4 h-4 mr-1.5" />
                      Reassign To
                    </Button>
                  ) : (
                    <div className="space-y-2 border-t border-border pt-3">
                      <Select value={reassignTarget} onValueChange={setReassignTarget}>
                        <SelectTrigger className="h-10 text-sm bg-background">
                          <SelectValue placeholder="Select staff member..." />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "J. Martinez",
                            "S. Patel",
                            "R. Chen",
                            "Staff User",
                            "A. Williams",
                            "K. O'Brien",
                          ].map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleReassign}
                          disabled={!reassignTarget}
                          className="flex-1 h-9 text-sm font-semibold"
                        >
                          Confirm Reassignment
                        </Button>
                        <Button
                          onClick={() => {
                            setShowReassign(false);
                            setReassignTarget("");
                          }}
                          variant="ghost"
                          className="h-9 text-sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-sm font-heading font-semibold text-card-foreground mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                    Update Status
                  </h3>

                  <Select value={currentStatus} onValueChange={setCurrentStatus}>
                    <SelectTrigger className="h-10 text-sm bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={handleSaveStatus}
                    className="w-full mt-3 h-10 text-sm font-semibold"
                  >
                    Save Status Update
                  </Button>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-sm font-heading font-semibold text-card-foreground mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    Staff Notes
                  </h3>

                  <Textarea
                    placeholder="Add an internal note about this issue..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="min-h-[100px] text-sm bg-background resize-none"
                  />

                  <Button
                    onClick={handleAddNote}
                    disabled={!noteText.trim()}
                    className="w-full mt-3 h-10 text-sm font-semibold"
                  >
                    Add Note
                  </Button>

                  {notes.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-border space-y-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Previous Notes
                      </p>

                      {notes.map((note: any, i: number) => (
                        <div key={i} className="bg-muted/40 rounded-md p-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-card-foreground">
                              {note.author}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {note.date}
                            </span>
                          </div>
                          <p className="text-sm text-card-foreground leading-relaxed">
                            {note.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-sm font-heading font-semibold text-card-foreground mb-3 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    Request More Information
                  </h3>

                  <p className="text-xs text-muted-foreground mb-2">
                    Send a message to the citizen requesting additional details about this issue.
                  </p>

                  <Textarea
                    placeholder="Describe what additional information is needed..."
                    value={infoRequestText}
                    onChange={(e) => setInfoRequestText(e.target.value)}
                    className="min-h-[80px] text-sm bg-background resize-none"
                  />

                  <Button
                    onClick={handleSendInfoRequest}
                    disabled={!infoRequestText.trim()}
                    variant="secondary"
                    className="w-full mt-3 h-10 text-sm font-semibold"
                  >
                    Send Request
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const InfoField = ({
  icon: Icon,
  label,
  value,
  muted = false,
}: {
  icon: any;
  label: string;
  value: string;
  muted?: boolean;
}) => (
  <div className="flex items-start gap-2">
    <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className={`text-sm ${muted ? "text-muted-foreground italic" : "text-card-foreground"}`}>
        {value}
      </p>
    </div>
  </div>
);

export default StaffIssueDetails;