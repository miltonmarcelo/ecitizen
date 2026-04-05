import { AlertTriangle, Clock, User } from "lucide-react";

const attentionItems = [
  { id: "ISS-1042", label: "Pothole — Main Street", reason: "No update in 5 days", icon: AlertTriangle },
  { id: "ISS-1038", label: "Graffiti — Library Wall", reason: "Escalated by citizen", icon: AlertTriangle },
  { id: "ISS-1045", label: "Blocked Drain — Oak Ave", reason: "High priority", icon: AlertTriangle },
];

const recentActivity = [
  { user: "J. Martinez", action: "Updated status to In Progress", issue: "ISS-1041", time: "12 min ago" },
  { user: "S. Patel", action: "Added staff note", issue: "ISS-1039", time: "34 min ago" },
  { user: "R. Chen", action: "Resolved issue", issue: "ISS-1035", time: "1 hr ago" },
  { user: "J. Martinez", action: "Assigned to field team", issue: "ISS-1044", time: "2 hrs ago" },
];

const SidePanel = () => {
  return (
    <div className="space-y-5">
      {/* Cases needing attention */}
      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="text-sm font-heading font-semibold text-card-foreground mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Needs Attention
        </h3>
        <div className="space-y-3">
          {attentionItems.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-md bg-amber-50/60 border border-amber-100">
              <div className="mt-0.5">
                <span className="text-xs font-mono font-medium text-primary">{item.id}</span>
                <p className="text-sm text-card-foreground font-medium leading-tight">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick status overview */}
      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="text-sm font-heading font-semibold text-card-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          Quick Overview
        </h3>
        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Avg. resolution time</span>
            <span className="font-medium text-card-foreground">3.2 days</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Reported today</span>
            <span className="font-medium text-card-foreground">7</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Resolved this week</span>
            <span className="font-medium text-card-foreground">23</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Overdue cases</span>
            <span className="font-medium text-destructive">4</span>
          </div>
        </div>
      </div>

      {/* Recent staff activity */}
      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="text-sm font-heading font-semibold text-card-foreground mb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {recentActivity.map((activity, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-primary">
                  {activity.user.split(" ").map(n => n[0]).join("")}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm text-card-foreground leading-tight">
                  <span className="font-medium">{activity.user}</span>{" "}
                  <span className="text-muted-foreground">{activity.action}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <span className="font-mono text-primary">{activity.issue}</span> · {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SidePanel;
