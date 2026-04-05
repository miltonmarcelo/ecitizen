import { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  accentClass?: string;
}

const SummaryCard = ({ title, value, icon: Icon, trend, trendUp, accentClass = "text-primary bg-primary/10" }: SummaryCardProps) => {
  const [iconColor, iconBg] = accentClass.split(" ");

  return (
    <div className="bg-card rounded-lg border border-border p-5 flex items-start gap-4">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{title}</p>
        <p className="text-2xl font-heading font-bold text-card-foreground leading-none">{value}</p>
        {trend && (
          <p className={`text-xs mt-1.5 ${trendUp ? "text-accent" : "text-destructive"}`}>
            {trend}
          </p>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;
