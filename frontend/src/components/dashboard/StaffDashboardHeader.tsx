import { useNavigate } from "react-router-dom";
import {
  Search,
  User,
  LogOut,
  Mail,
  BadgeCheck,
  Building2,
  Clock,
  KeyRound,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StaffDashboardHeaderProps {
  pageTitle?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

const StaffDashboardHeader = ({
  pageTitle = "Operational Dashboard",
  searchValue = "",
  onSearchChange,
}: StaffDashboardHeaderProps) => {
  const navigate = useNavigate();
  const { appUser, logout } = useAuth();

  const staffProfile = {
    name: appUser?.fullName || "Staff User",
    role: "Operational Staff",
    email: appUser?.email || "staff.user@council.gov.uk",
    department: "Operations",
    employeeId: appUser?.staffProfile?.id
      ? `STAFF-${appUser.staffProfile.id}`
      : "EMP-00421",
    lastLogin: "Current Session",
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="hidden sm:block text-sm font-heading font-semibold text-foreground">
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {onSearchChange && (
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search issue ID, title, or keyword..."
              className="pl-9 h-9 w-72 text-sm bg-background"
            />
          </div>
        )}

        <div className="pl-2 border-l border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-md p-1 pr-2 hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-medium text-foreground leading-none">
                    {staffProfile.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {staffProfile.department}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-72 p-0">
              <div className="p-4 bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {staffProfile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {staffProfile.role}
                    </p>
                  </div>
                </div>
              </div>

              <DropdownMenuSeparator className="m-0" />

              <div className="p-3 space-y-2.5">
                <ProfileRow icon={Mail} label="Email" value={staffProfile.email} />
                <ProfileRow icon={Building2} label="Department" value={staffProfile.department} />
                <ProfileRow icon={BadgeCheck} label="Employee ID" value={staffProfile.employeeId} />
                <ProfileRow icon={Clock} label="Last Login" value={staffProfile.lastLogin} />
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => navigate("/staff/change-password")}
                className="m-1 cursor-pointer"
              >
                <KeyRound className="w-4 h-4 mr-2" />
                Change Password
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleSignOut}
                className="m-1 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

const ProfileRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-2.5">
    <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground leading-none mb-0.5">
        {label}
      </p>
      <p className="text-xs text-foreground truncate">{value}</p>
    </div>
  </div>
);

export default StaffDashboardHeader;
