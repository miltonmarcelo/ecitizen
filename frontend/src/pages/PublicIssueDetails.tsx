import {
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  Tag,
  ThumbsUp,
  Camera,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSearch,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import TopBar from "@/components/TopBar";

const ISSUES_DATA: Record<string, {
  id: string; title: string; category: string; status: string; statusColor: string;
  date: string; location: string; description: string; supporters: number;
  timeline: { label: string; date: string; done: boolean }[];
  updates: { date: string; text: string }[];
}> = {
  "PUB-2026-00201": {
    id: "PUB-2026-00201",
    title: "Pothole near bus stop",
    category: "Roads & Pavements",
    status: "In Progress",
    statusColor: "bg-warning/15 text-warning",
    date: "20 Mar 2026",
    location: "Ranelagh Road",
    description: "Large pothole approximately 40cm wide near the main bus stop causing traffic to swerve. Multiple vehicles and cyclists have reported damage. The pothole appears to have worsened after recent heavy rainfall.",
    supporters: 14,
    timeline: [
      { label: "Reported", date: "20 Mar 2026", done: true },
      { label: "Under Review", date: "21 Mar 2026", done: true },
      { label: "In Progress", date: "23 Mar 2026", done: true },
      { label: "Resolved", date: "", done: false },
      { label: "Closed", date: "", done: false },
    ],
    updates: [
      { date: "23 Mar 2026", text: "Repair crew dispatched. Work scheduled for this week." },
      { date: "21 Mar 2026", text: "Issue reviewed and assigned to roads maintenance team." },
      { date: "20 Mar 2026", text: "Report received and logged in the system." },
    ],
  },
  "PUB-2026-00198": {
    id: "PUB-2026-00198",
    title: "Power outage in Block C",
    category: "Electricity & Power",
    status: "Open",
    statusColor: "bg-primary/15 text-primary",
    date: "19 Mar 2026",
    location: "Block C, Ranelagh",
    description: "Intermittent power outages affecting the entire block since last Tuesday evening. Multiple residents have reported the issue. The outages typically last 15–30 minutes and occur several times per day.",
    supporters: 12,
    timeline: [
      { label: "Reported", date: "19 Mar 2026", done: true },
      { label: "Under Review", date: "", done: false },
      { label: "In Progress", date: "", done: false },
      { label: "Resolved", date: "", done: false },
      { label: "Closed", date: "", done: false },
    ],
    updates: [
      { date: "19 Mar 2026", text: "Report received and logged in the system." },
    ],
  },
};

const DEFAULT_ISSUE = {
  id: "PUB-2026-00000",
  title: "Public Issue",
  category: "General",
  status: "Open",
  statusColor: "bg-primary/15 text-primary",
  date: "Mar 2026",
  location: "Ranelagh",
  description: "Details for this issue are being loaded.",
  supporters: 0,
  timeline: [
    { label: "Reported", date: "Mar 2026", done: true },
    { label: "Under Review", date: "", done: false },
    { label: "In Progress", date: "", done: false },
    { label: "Resolved", date: "", done: false },
    { label: "Closed", date: "", done: false },
  ],
  updates: [{ date: "Mar 2026", text: "Report received." }],
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.35 },
});

const TIMELINE_ICONS = [AlertCircle, FileSearch, Clock, CheckCircle2, CheckCircle2];

const PublicIssueDetailsPage = () => {
  const navigate = useNavigate();
  const { issueId } = useParams();
  const issue = (issueId && ISSUES_DATA[issueId]) || DEFAULT_ISSUE;
  const [supported, setSupported] = useState(false);
  const supportCount = issue.supporters + (supported ? 1 : 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar showBack backTo="/dashboard" showProfile />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-5">
        {/* Header Card */}
        <motion.div {...fadeUp(0)} className="card-civic space-y-3">
          <h2 className="text-base font-bold text-foreground">{issue.title}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${issue.statusColor}`}>
              {issue.status}
            </span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Tag size={11} /> {issue.category}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><FileSearch size={11} /> {issue.id}</span>
            <span className="flex items-center gap-1"><MapPin size={11} /> {issue.location}</span>
            <span className="flex items-center gap-1"><Calendar size={11} /> {issue.date}</span>
          </div>
        </motion.div>

        {/* Support Section */}
        <motion.div {...fadeUp(0.05)} className="card-civic">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ThumbsUp size={18} className="text-primary" />
              <div>
                <p className="text-lg font-bold text-foreground leading-none">{supportCount}</p>
                <p className="text-[11px] text-muted-foreground">community supporters</p>
              </div>
            </div>
            <button
              onClick={() => setSupported(true)}
              disabled={supported}
              className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${
                supported
                  ? "bg-accent/15 text-accent cursor-default"
                  : "btn-primary-civic"
              }`}
            >
              {supported ? "✓ Supported" : "Support This Issue"}
            </button>
          </div>
          {supported && (
            <p className="text-xs text-accent mt-2">You have already supported this issue.</p>
          )}
        </motion.div>

        {/* Description */}
        <motion.div {...fadeUp(0.1)} className="card-civic space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Description</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{issue.description}</p>
          <div className="rounded-xl bg-muted/50 border border-border p-4 flex items-center gap-3">
            <Camera size={20} className="text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-foreground">Photo attached</p>
              <p className="text-[11px] text-muted-foreground">1 image submitted with this report</p>
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div {...fadeUp(0.15)} className="card-civic space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Status Timeline</h3>
          <div className="space-y-0">
            {issue.timeline.map((step, idx) => {
              const Icon = TIMELINE_ICONS[idx];
              const isLast = idx === issue.timeline.length - 1;
              return (
                <div key={step.label} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      step.done ? "bg-primary/15" : "bg-muted"
                    }`}>
                      <Icon size={13} className={step.done ? "text-primary" : "text-muted-foreground"} />
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 h-6 ${step.done ? "bg-primary/30" : "bg-border"}`} />
                    )}
                  </div>
                  <div className="pt-1">
                    <p className={`text-xs font-medium ${step.done ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                    {step.date && (
                      <p className="text-[10px] text-muted-foreground">{step.date}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Official Updates */}
        <motion.div {...fadeUp(0.2)} className="card-civic space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Official Updates</h3>
          <div className="space-y-3">
            {issue.updates.map((update, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">{update.date}</p>
                  <p className="text-xs text-foreground mt-0.5">{update.text}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div {...fadeUp(0.25)} className="space-y-2.5 pb-4">
          <button
            onClick={() => navigate("/area-issues")}
            className="w-full flex items-center justify-center gap-2 text-sm rounded-xl border border-border bg-card px-4 py-2.5 font-medium text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft size={14} /> Back to Area Issues
          </button>
          <button
            onClick={() => navigate("/report")}
            className="w-full flex items-center justify-center gap-2 text-sm text-primary font-medium hover:underline py-2"
          >
            Report Another Issue <ArrowRight size={14} />
          </button>
        </motion.div>
      </main>
    </div>
  );
};

export default PublicIssueDetailsPage;
