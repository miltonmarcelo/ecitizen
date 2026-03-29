import { User, Mail, Shield, CalendarDays, CheckCircle, LogOut, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

import { auth } from "@/firebase/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const UserProfileDropdown = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const fullName = user?.displayName || "Citizen User";
  const firstName = fullName ? fullName.split(" ")[0] : "";
  const email = user?.email || "No email available";

  const creationTime = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-IE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Not available";

  const lastSignInTime = user?.metadata?.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).toLocaleString("en-IE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not available";

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {firstName && (
        <span className="text-sm text-muted-foreground hidden sm:inline">
          Hi, <span className="font-medium text-foreground">{firstName}</span>
        </span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={16} className="text-primary" />
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-72 p-0">
          <div className="p-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
                <p className="text-xs text-muted-foreground">Citizen</p>
              </div>
            </div>
          </div>

          <DropdownMenuSeparator className="m-0" />

          <div className="p-3 space-y-3">
            <ProfileRow icon={Mail} label="Email" value={email} />
            <ProfileRow icon={CalendarDays} label="Member Since" value={creationTime} />
            <ProfileRow icon={CheckCircle} label="Account Status" value="Active" />
            <ProfileRow icon={CalendarDays} label="Last Login" value={lastSignInTime} />
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleSignOut}
            className="m-1 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

type ProfileRowProps = {
  icon: React.ElementType;
  label: string;
  value: string;
};

const ProfileRow = ({ icon: Icon, label, value }: ProfileRowProps) => {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground leading-none mb-0.5">{label}</p>
        <p className="text-xs text-foreground truncate">{value}</p>
      </div>
    </div>
  );
};

export default UserProfileDropdown;