import { useNavigate } from "react-router-dom";
import {
  Search,
  User,
  LogOut,
  Mail,
  BadgeCheck,
  KeyRound,
  ArrowLeft,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  searchPlaceholder?: string;
  showBackButton?: boolean;
  backTo?: string;
  backLabel?: string;
}

const StaffDashboardHeader = ({
  pageTitle = "Operational Dashboard",
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search issue ID, title, or category",
  showBackButton = false,
  backTo = "/staff/dashboard",
  backLabel = "Back",
}: StaffDashboardHeaderProps) => {
  const navigate = useNavigate();
  const { appUser, logout } = useAuth();

  // Switches profile label text based on current app role.
  const isAdmin = appUser?.role === "ADMIN";

  const staffProfile = {
    name: appUser?.fullName || "Staff User",
    role: isAdmin ? "Administrator" : "Operational Staff",
    email: appUser?.email || "staff.user@ecitizen.ie",
    // Uses real staff ID when available, otherwise shows a placeholder employee code.
    employeeId: appUser?.staffProfile?.id
      ? `STAFF-${appUser.staffProfile.id}`
      : "EMP-00421",
  };

  const handleSignOut = async () => {
    try {
      // Calls shared logout so auth guards can redirect to public pages.
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="staff-header">
      <div className="staff-header__left">
        {showBackButton ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(backTo)}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {backLabel}
          </Button>
        ) : null}

        <h1 className="staff-header__title">{pageTitle}</h1>
      </div>

      <div className="staff-header__right">
        {onSearchChange ? (
          <div className="staff-header__search">
            <Search className="staff-header__search-icon" />
            <Input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="staff-header__search-input"
            />
          </div>
        ) : null}

        <div className="staff-header__profile-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="staff-header__profile-trigger focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="staff-header__avatar">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="staff-header__profile-summary">
                  <p className="staff-header__profile-name">{staffProfile.name}</p>
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-72 p-0">
              <div className="staff-profile-card">
                <div className="staff-profile-card__identity">
                  <div className="staff-profile-card__avatar">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="staff-profile-card__name">{staffProfile.name}</p>
                    <p className="staff-profile-card__role">{staffProfile.role}</p>
                  </div>
                </div>
              </div>

              <DropdownMenuSeparator className="m-0" />

              <div className="staff-profile-list">
                <ProfileRow icon={Mail} label="Email" value={staffProfile.email} />
                <ProfileRow icon={BadgeCheck} label="Employee ID" value={staffProfile.employeeId} />
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => navigate("/staff/change-password")}
                className="staff-profile-action"
              >
                <KeyRound className="w-4 h-4 mr-2" />
                Change Password
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleSignOut}
                className="staff-profile-action staff-profile-action--danger"
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
  icon: LucideIcon;
  label: string;
  value: string;
}) => (
  <div className="staff-profile-row">
    <Icon className="staff-profile-row__icon" />
    <div className="staff-profile-row__meta">
      <p className="staff-profile-row__label">{label}</p>
      <p className="staff-profile-row__value">{value}</p>
    </div>
  </div>
);

export default StaffDashboardHeader;
