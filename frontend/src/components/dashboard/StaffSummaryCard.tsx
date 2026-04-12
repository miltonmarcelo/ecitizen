import type { LucideIcon } from "lucide-react";

interface StaffSummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "assigned" | "unassigned" | "resolved";
}

const StaffSummaryCard = ({
  title,
  value,
  icon: Icon,
  tone = "default",
}: StaffSummaryCardProps) => {
  const toneClass = `staff-summary-card staff-summary-card--${tone}`;

  return (
    <div className={toneClass}>
      <div className="staff-summary-card__top">
        <div>
          <p className="staff-summary-card__title">{title}</p>
          <p className="staff-summary-card__value">{value}</p>
        </div>

        <div className="staff-summary-card__icon">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default StaffSummaryCard;
