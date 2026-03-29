import {
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  Tag,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  MessageSquare,
  ChevronRight,
  Image,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import TopBar from "@/components/TopBar";

const ISSUES_DB: Record<string, {
  id: string;
  title: string;
  category: string;
  status: string;
  statusColor: string;
  date: string;
  location: string;
  description: string;
  hasImage?: boolean;
  timeline: { label: string; date: string; done: boolean }[];
  staffNotes: { date: string; note: string }[];
  infoRequest?: { message: string; responded: boolean };
}> = {
  "EC-2026-00124": {
    id: "EC-2026-00124",
    title: "Broken streetlight near bus stop",
    category: "Street Lighting",
    status: "In Progress",
    statusColor: "bg-warning/15 text-warning",
    date: "21 Mar 2026",
    location: "Ranelagh Road",
    description:
      "The streetlight near the main bus stop has been flickering for two weeks and is now completely off. This poses a safety risk for pedestrians and commuters using the stop after dark. The pole appears intact but the light unit itself may need replacement.",
    hasImage: true,
    timeline: [
      { label: "Report submitted", date: "21 Mar 2026", done: true },
      { label: "Under review", date: "22 Mar 2026", done: true },
      { label: "In progress", date: "23 Mar 2026", done: true },
      { label: "Resolved", date: "", done: false },
      { label: "Closed", date: "", done: false },
    ],
    staffNotes: [
      { date: "22 Mar 2026", note: "Case reviewed by operations team." },
      { date: "23 Mar 2026", note: "Assigned for on-site inspection." },
      { date: "25 Mar 2026", note: "Repair scheduled for next week." },
    ],
  },
  "EC-2026-00118": {
    id: "EC-2026-00118",
    title: "Pothole near Main Street junction",
    category: "Roads & Pavements",
    status: "Open",
    statusColor: "bg-primary/15 text-primary",
    date: "18 Mar 2026",
    location: "Main St & 3rd Ave",
    description:
      "Large pothole approximately 30cm wide causing vehicles to swerve. Risk to cyclists. Located on the northbound lane near the junction with 3rd Avenue.",
    timeline: [
      { label: "Report submitted", date: "18 Mar 2026", done: true },
      { label: "Under review", date: "", done: false },
      { label: "In progress", date: "", done: false },
      { label: "Resolved", date: "", done: false },
      { label: "Closed", date: "", done: false },
    ],
    staffNotes: [],
  },
  "EC-2026-00115": {
    id: "EC-2026-00115",
    title: "Overflowing waste bin at park",
    category: "Waste & Recycling",
    status: "Resolved",
    statusColor: "bg-accent/15 text-accent",
    date: "10 Mar 2026",
    location: "Central Park, Gate B",
    description:
      "The public waste bin near Gate B has been overflowing since last weekend. Litter is spreading around the area and attracting pests.",
    timeline: [
      { label: "Report submitted", date: "10 Mar 2026", done: true },
      { label: "Under review", date: "11 Mar 2026", done: true },
      { label: "In progress", date: "12 Mar 2026", done: true },
      { label: "Resolved", date: "14 Mar 2026", done: true },
      { label: "Closed", date: "", done: false },
    ],
    staffNotes: [
      { date: "11 Mar 2026", note: "Reported to waste management unit." },
      { date: "14 Mar 2026", note: "Bin emptied and area cleaned." },
    ],
  },
  "EC-2026-00110": {
    id: "EC-2026-00110",
    title: "Graffiti on community hall wall",
    category: "Public Property",
    status: "Open",
    statusColor: "bg-primary/15 text-primary",
    date: "8 Mar 2026",
    location: "Oak Avenue Community Hall",
    description:
      "Large graffiti appeared on the south-facing wall of the community hall overnight. Offensive content visible from the main road.",
    timeline: [
      { label: "Report submitted", date: "8 Mar 2026", done: true },
      { label: "Under review", date: "", done: false },
      { label: "In progress", date: "", done: false },
      { label: "Resolved", date: "", done: false },
      { label: "Closed", date: "", done: false },
    ],
    staffNotes: [],
  },
  "EC-2026-00102": {
    id: "EC-2026-00102",
    title: "Blocked drainage on River Road",
    category: "Water & Drainage",
    status: "In Progress",
    statusColor: "bg-warning/15 text-warning",
    date: "3 Mar 2026",
    location: "River Road, near bridge",
    description:
      "Storm drain blocked with debris causing water to pool on the road during rain. Flooding risk during heavy rainfall.",
    timeline: [
      { label: "Report submitted", date: "3 Mar 2026", done: true },
      { label: "Under review", date: "4 Mar 2026", done: true },
      { label: "In progress", date: "6 Mar 2026", done: true },
      { label: "Resolved", date: "", done: false },
      { label: "Closed", date: "", done: false },
    ],
    staffNotes: [
      { date: "4 Mar 2026", note: "Drainage team notified." },
      { date: "6 Mar 2026", note: "Crew dispatched for clearing." },
    ],
  },
  "EC-2026-00098": {
    id: "EC-2026-00098",
    title: "Damaged park bench",
    category: "Public Property",
    status: "Resolved",
    statusColor: "bg-accent/15 text-accent",
    date: "28 Feb 2026",
    location: "Elm Park, east entrance",
    description:
      "Wooden bench near the east entrance has two broken slats and is unsafe to sit on.",
    timeline: [
      { label: "Report submitted", date: "28 Feb 2026", done: true },
      { label: "Under review", date: "1 Mar 2026", done: true },
      { label: "In progress", date: "3 Mar 2026", done: true },
      { label: "Resolved", date: "7 Mar 2026", done: true },
      { label: "Closed", date: "", done: false },
    ],
    staffNotes: [
      { date: "3 Mar 2026", note: "Bench repair added to maintenance schedule." },
      { date: "7 Mar 2026", note: "Bench repaired and confirmed safe." },
    ],
  },
  "EC-2026-00091": {
    id: "EC-2026-00091",
    title: "Illegal dumping near river",
    category: "Waste & Recycling",
    status: "Awaiting Info",
    statusColor: "bg-muted text-muted-foreground",
    date: "22 Feb 2026",
    location: "River Road, south bank",
    description:
      "Construction waste has been dumped along the south bank of the river near the walking trail. Materials include concrete blocks and metal rebar.",
    timeline: [
      { label: "Report submitted", date: "22 Feb 2026", done: true },
      { label: "Under review", date: "23 Feb 2026", done: true },
      { label: "Awaiting information", date: "25 Feb 2026", done: true },
      { label: "In progress", date: "", done: false },
      { label: "Resolved", date: "", done: false },
    ],
    staffNotes: [
      { date: "23 Feb 2026", note: "Initial review completed. Evidence collected." },
    ],
    infoRequest: {
      message: "Can you provide additional photos of the dumped materials and confirm the exact location on the trail?",
      responded: false,
    },
  },
  "EC-2026-00085": {
    id: "EC-2026-00085",
    title: "Faulty traffic signal at Oak Avenue",
    category: "Street Lighting",
    status: "Resolved",
    statusColor: "bg-accent/15 text-accent",
    date: "15 Feb 2026",
    location: "Oak Avenue & Birch St",
    description:
      "Traffic signal stuck on red for the north-south direction during peak hours. Causing significant delays.",
    timeline: [
      { label: "Report submitted", date: "15 Feb 2026", done: true },
      { label: "Under review", date: "15 Feb 2026", done: true },
      { label: "In progress", date: "16 Feb 2026", done: true },
      { label: "Resolved", date: "17 Feb 2026", done: true },
      { label: "Closed", date: "18 Feb 2026", done: true },
    ],
    staffNotes: [
      { date: "15 Feb 2026", note: "Urgent priority assigned." },
      { date: "16 Feb 2026", note: "Technician dispatched." },
      { date: "17 Feb 2026", note: "Signal controller replaced and tested." },
    ],
  },
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.35 },
});

const IssueDetailsPage = () => {
  const navigate = useNavigate();
  const { issueId } = useParams<{ issueId: string }>();

  const issue = issueId ? ISSUES_DB[issueId] : null;

  if (!issue) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <FileText className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-1">Issue Not Found</h2>
        <p className="text-sm text-muted-foreground mb-6">The report you're looking for doesn't exist.</p>
        <button onClick={() => navigate("/my-issues")} className="btn-primary text-sm px-6 py-2.5">
          Back to My Issues
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top App Bar */}
      <TopBar showBack backTo="/dashboard" showProfile />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-4">
        {/* Header Card */}
        <motion.div {...fadeUp(0)} className="card-civic space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-base font-bold text-foreground leading-snug flex-1">
              {issue.title}
            </h2>
            <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap ${issue.statusColor}`}>
              {issue.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <FileText size={12} className="shrink-0" /> {issue.id}
            </span>
            <span className="flex items-center gap-1.5">
              <Tag size={12} className="shrink-0" /> {issue.category}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="shrink-0" /> {issue.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={12} className="shrink-0" /> {issue.date}
            </span>
          </div>
        </motion.div>

        {/* Description */}
        <motion.div {...fadeUp(0.05)} className="card-civic space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Description</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{issue.description}</p>
          {issue.hasImage && (
            <div className="flex items-center gap-2 pt-1">
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                <Image size={20} className="text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">1 photo attached</span>
            </div>
          )}
        </motion.div>

        {/* Status Timeline */}
        <motion.div {...fadeUp(0.1)} className="card-civic space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Status Timeline</h3>
          <div className="relative pl-5">
            {issue.timeline.map((step, idx) => {
              const isLast = idx === issue.timeline.length - 1;
              return (
                <div key={idx} className="relative pb-4 last:pb-0">
                  {/* Vertical line */}
                  {!isLast && (
                    <div className={`absolute left-0 top-3 w-px h-full ${step.done ? "bg-accent" : "bg-border"}`} />
                  )}
                  {/* Dot */}
                  <div
                    className={`absolute -left-1.5 top-0.5 w-3 h-3 rounded-full border-2 ${
                      step.done
                        ? "bg-accent border-accent"
                        : "bg-card border-border"
                    }`}
                  />
                  <div className="ml-3">
                    <p className={`text-xs font-medium ${step.done ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                    {step.date && (
                      <p className="text-[11px] text-muted-foreground">{step.date}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Staff Notes */}
        {issue.staffNotes.length > 0 && (
          <motion.div {...fadeUp(0.15)} className="card-civic space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <MessageSquare size={14} /> Official Updates
            </h3>
            <div className="space-y-2.5">
              {issue.staffNotes.map((note, idx) => (
                <div key={idx} className="flex gap-2.5">
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap mt-0.5 w-20 shrink-0">
                    {note.date}
                  </span>
                  <p className="text-xs text-foreground leading-relaxed">{note.note}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Information Request */}
        {issue.infoRequest && (
          <motion.div {...fadeUp(0.2)} className="card-civic border-warning/30 bg-warning/5 space-y-2.5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <AlertCircle size={14} className="text-warning" /> Information Requested
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{issue.infoRequest.message}</p>
            {!issue.infoRequest.responded ? (
              <button className="btn-primary text-xs px-4 py-2">
                Respond to Request
              </button>
            ) : (
              <span className="text-xs text-accent font-medium flex items-center gap-1">
                <CheckCircle2 size={12} /> Response submitted
              </span>
            )}
          </motion.div>
        )}

        {/* Actions */}
        <motion.div {...fadeUp(0.25)} className="space-y-2.5 pt-2">
          <button
            onClick={() => navigate("/my-issues")}
            className="btn-primary w-full text-sm py-3"
          >
            Back to My Issues
          </button>
          <div className="flex gap-2.5">
            <button
              onClick={() => navigate("/report")}
              className="flex-1 text-sm font-medium py-2.5 rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors"
            >
              Report Another Issue
            </button>
            <button className="flex-1 text-sm font-medium py-2.5 rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors">
              Request Update
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default IssueDetailsPage;
