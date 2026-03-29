import {
  Bell,
  User,
  Plus,
  List,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MapPin,
  ChevronRight,
  Zap,
  Lightbulb,
  Trash2,
  RefreshCw,
  ThumbsUp,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";

const STATS = [
  { label: "Open", value: 3, icon: AlertCircle, color: "text-primary", bg: "bg-primary/10" },
  { label: "In Progress", value: 2, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
  { label: "Resolved", value: 7, icon: CheckCircle2, color: "text-accent", bg: "bg-accent/10" },
  { label: "Awaiting Info", value: 1, icon: HelpCircle, color: "text-muted-foreground", bg: "bg-muted" },
];

const MY_ISSUES = [
  {
    id: 1,
    title: "Broken streetlight on Elm Road",
    location: "Elm Road, Ward 5",
    status: "Open",
    statusColor: "bg-primary/15 text-primary",
    date: "22 Mar 2026",
  },
  {
    id: 2,
    title: "Pothole near Main Street junction",
    location: "Main St & 3rd Ave",
    status: "In Progress",
    statusColor: "bg-warning/15 text-warning",
    date: "18 Mar 2026",
  },
  {
    id: 3,
    title: "Overflowing waste bin at park",
    location: "Central Park, Gate B",
    status: "Resolved",
    statusColor: "bg-accent/15 text-accent",
    date: "10 Mar 2026",
  },
];

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
    area: "River Road, 0.8 km away",
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

const QUICK_ACTIONS = [
  { icon: AlertCircle, label: "Report pothole", color: "text-primary" },
  { icon: Lightbulb, label: "Streetlight issue", color: "text-warning" },
  { icon: Trash2, label: "Waste issue", color: "text-accent" },
  { icon: RefreshCw, label: "Request update", color: "text-muted-foreground" },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
});

const DashboardPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top App Bar */}
      <TopBar showProfile />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-6">
        {/* Welcome Section */}
        <motion.div {...fadeUp(0)}>
          <h1 className="text-xl font-bold text-foreground">Hello, Milton</h1>
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
              <List size={16} /> View My Issues
            </button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div {...fadeUp(0.1)}>
          <div className="grid grid-cols-4 gap-2.5">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                onClick={() => navigate(`/my-issues?status=${encodeURIComponent(stat.label)}`)}
                className="card-civic flex flex-col items-center py-3 px-1 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full ${stat.bg} flex items-center justify-center mb-1.5`}>
                  <stat.icon size={15} className={stat.color} />
                </div>
                <span className="text-lg font-bold text-foreground leading-none">{stat.value}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{stat.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* My Recent Issues */}
        <motion.div {...fadeUp(0.2)}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">My Recent Issues</h2>
            <button onClick={() => navigate("/my-issues")} className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5">
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2.5">
            {MY_ISSUES.map((issue) => (
              <div key={issue.id} className="card-civic flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{issue.title}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPin size={11} className="text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">{issue.location}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${issue.statusColor}`}>
                      {issue.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{issue.date}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const idMap: Record<number, string> = { 1: "EC-2026-00124", 2: "EC-2026-00118", 3: "EC-2026-00115" };
                    navigate(`/issue/${idMap[issue.id] || "EC-2026-00124"}`);
                  }}
                  className="shrink-0 text-xs text-primary font-medium hover:underline mt-1"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Issues Near Me */}
        <motion.div {...fadeUp(0.3)}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Issues Near Me</h2>
            <button onClick={() => navigate("/area-issues")} className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5">
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
                  <ArrowRight size={14} className="text-muted-foreground hover:text-foreground transition-colors" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div {...fadeUp(0.4)}>
          <h2 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                className="card-civic flex items-center gap-2.5 py-3 hover:bg-muted/50 transition-colors"
              >
                <action.icon size={16} className={action.color} />
                <span className="text-xs font-medium text-foreground">{action.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardPage;
