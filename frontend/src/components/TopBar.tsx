import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import UserProfileDropdown from "@/components/UserProfileDropdown";
import BrandLogo from "@/components/common/BrandLogo";

type TopBarProps = {
  title?: string;
  showBack?: boolean;
  backTo?: string;
  showProfile?: boolean;
  width?: "narrow" | "default" | "wide";
};

const TopBar = ({
  title = "eCitizen",
  showBack = false,
  backTo = "/",
  showProfile = false,
  width = "narrow",
}: TopBarProps) => {
  const navigate = useNavigate();
  const widthClass =
    width === "wide"
      ? "max-w-[1200px]"
      : width === "default"
      ? "max-w-[960px]"
      : "max-w-[640px]";

  return (
    <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
      <div className={`${widthClass} mx-auto flex items-center justify-between px-6 h-14`}>
        <div className="flex items-center gap-3 min-w-0">
          {showBack && (
            <button
              onClick={() => navigate(backTo)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={14} />
              Back
            </button>
          )}

          {title === "eCitizen" ? (
            <BrandLogo size="sm" showText={true} />
          ) : (
            <span className="text-lg font-bold tracking-tight text-foreground">{title}</span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {showProfile && <UserProfileDropdown />}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
