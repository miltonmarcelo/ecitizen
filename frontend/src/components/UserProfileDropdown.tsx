import { useEffect, useState } from "react";
import {
  User,
  Mail,
  CalendarDays,
  LogOut,
  KeyRound,
  MessageSquare,
  Pencil,
  X,
  LayoutDashboard,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const { user, appUser, refreshAppUser } = useAuth();

  const fullName = appUser?.fullName || "Citizen User";
  const firstName = fullName ? fullName.split(" ")[0] : "";
  const email = appUser?.email || user?.email || "No email available";
  const role = String(appUser?.role || "").toLowerCase();
  const showDashboardLink = role === "citizen" && location.pathname !== "/dashboard";

  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(appUser?.fullName || "");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    setDraftName(appUser?.fullName || "");
  }, [appUser?.fullName]);

  const creationTime = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-IE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
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

  const handleChangePassword = () => {
    navigate("/change-password");
  };

  const handleContactUs = () => {
    navigate("/contact");
  };

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  const handleSaveName = async () => {
    if (!user) return;

    const cleanedName = draftName.trim().replace(/\s+/g, " ");

    if (!cleanedName) {
      setNameError("Please enter your full name.");
      return;
    }

    try {
      setSavingName(true);
      setNameError("");

      const token = await user.getIdToken();

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: cleanedName,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to update name");
      }

      await refreshAppUser();
      setIsEditingName(false);
    } catch (error: any) {
      setNameError(error.message || "Unable to update name.");
    } finally {
      setSavingName(false);
    }
  };

  const handleCancelEdit = () => {
    setDraftName(appUser?.fullName || "");
    setNameError("");
    setIsEditingName(false);
  };

  return (
    <div className="flex items-center gap-4">
      {firstName && (
        <span className="hidden min-[360px]:inline text-sm text-muted-foreground">
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

              <div className="min-w-0 flex-1">
                {!isEditingName ? (
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftName(appUser?.fullName || "");
                        setNameError("");
                        setIsEditingName(true);
                      }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Edit name"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      className="app-input h-9 text-sm"
                      placeholder="Enter your full name"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveName}
                        disabled={savingName}
                        className="app-btn app-btn--primary h-8 px-3 text-xs"
                      >
                        {savingName ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={savingName}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
                        aria-label="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {nameError ? <p className="text-xs text-destructive">{nameError}</p> : null}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">Citizen</p>
              </div>
            </div>
          </div>

          <DropdownMenuSeparator className="m-0" />

          <div className="p-3 space-y-3">
            <ProfileRow icon={Mail} label="Email" value={email} />
            <ProfileRow icon={CalendarDays} label="Joined" value={creationTime} />
          </div>

          <DropdownMenuSeparator />

          {showDashboardLink && (
            <DropdownMenuItem
              onClick={handleGoToDashboard}
              className="m-1 cursor-pointer focus:bg-primary/10 focus:text-primary data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary"
            >
              <LayoutDashboard className="w-4 h-4 mr-2 text-current" />
              Go to My Dashboard
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={handleChangePassword}
            className="m-1 cursor-pointer focus:bg-primary/10 focus:text-primary data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary"
          >
            <KeyRound className="w-4 h-4 mr-2 text-current" />
            Change Password
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleContactUs}
            className="m-1 cursor-pointer focus:bg-primary/10 focus:text-primary data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary"
          >
            <MessageSquare className="w-4 h-4 mr-2 text-current" />
            Contact Us
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleSignOut}
            className="m-1 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive"
          >
            <LogOut className="w-4 h-4 mr-2 text-current" />
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