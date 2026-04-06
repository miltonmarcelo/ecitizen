import type { LucideIcon } from "lucide-react";

interface StaffSummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  accentClass?: string;
  cardClassName?: string;
}

const StaffSummaryCard = ({
  title,
  value,
  icon: Icon,
  accentClass = "text-primary bg-primary/10",
  cardClassName = "",
}: StaffSummaryCardProps) => {
  return (
    <div className={`rounded-lg border p-5 ${cardClassName || "bg-card border-border"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold text-card-foreground mt-2">{value}</p>
        </div>

        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${accentClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default StaffSummaryCard;
