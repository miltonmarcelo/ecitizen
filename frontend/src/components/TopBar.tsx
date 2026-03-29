import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebase/firebase";
import UserProfileDropdown from "@/components/UserProfileDropdown";

type TopBarProps = {
  title?: string;
  showBack?: boolean;
  backTo?: string;
  showProfile?: boolean;
};

const TopBar = ({
  title = "eCitizen",
  showBack = false,
  backTo = "/",
  showProfile = false,
}: TopBarProps) => {
  const navigate = useNavigate();
  const fullName = auth.currentUser?.displayName || "";
  const firstName = fullName ? fullName.split(" ")[0] : "";

  return (
    <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
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

          <span className="text-lg font-bold tracking-tight text-foreground">
            {title === "eCitizen" ? (
              <>
                <span className="text-primary">e</span>Citizen
              </>
            ) : (
              title
            )}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {firstName && (
            <span className="text-sm text-muted-foreground">
              Hi, <span className="font-medium text-foreground">{firstName}</span>
            </span>
          )}

          {showProfile && <UserProfileDropdown />}
        </div>
      </div>
    </header>
  );
};

export default TopBar;