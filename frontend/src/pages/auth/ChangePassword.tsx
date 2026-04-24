import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";

import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/firebase/firebase";

const ChangePasswordPage = () => {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const passwordsMatch = newPassword === confirmPassword;
  const meetsLength = newPassword.length >= 8;

  const canSubmit =
    currentPassword.trim() !== "" &&
    newPassword.trim() !== "" &&
    confirmPassword.trim() !== "" &&
    passwordsMatch &&
    meetsLength &&
    !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setErrorMessage("");
    setIsLoading(true);

    try {
      const user = auth.currentUser;

      if (!user || !user.email) {
        setErrorMessage("You must be logged in to change your password.");
        setIsLoading(false);
        return;
      }

      // Re-checks current password so Firebase accepts the sensitive password change.
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );

      await reauthenticateWithCredential(user, credential);

      // Sends a fresh token so backend can verify identity before updating password.
      const idToken = await user.getIdToken(true);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to change password");
      }

      setSubmitted(true);
    } catch (error: any) {
      console.error("Change password error:", error);

      if (error?.code === "auth/invalid-credential") {
        setErrorMessage("The current password is incorrect.");
      } else if (error?.code === "auth/too-many-requests") {
        setErrorMessage("Too many attempts. Please wait a moment and try again.");
      } else if (error?.code === "auth/network-request-failed") {
        setErrorMessage("Network error. Please check your connection and try again.");
      } else {
        setErrorMessage(error?.message || "Unable to change password.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar showBack backTo="/dashboard" showProfile />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">

        <div className="card-civic p-6 sm:p-8">
          {!submitted ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-primary" />
                </div>

                <div>
                  <h1 className="text-lg font-bold text-foreground">Change Password</h1>
                  <p className="text-sm text-muted-foreground">
                    Update your password securely
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <PasswordField
                  id="current-password"
                  label="Current Password"
                  value={currentPassword}
                  onChange={(value) => {
                    setCurrentPassword(value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  show={showCurrent}
                  onToggle={() => setShowCurrent(!showCurrent)}
                  placeholder="Enter your current password"
                />

                <PasswordField
                  id="new-password"
                  label="New Password"
                  value={newPassword}
                  onChange={(value) => {
                    setNewPassword(value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  show={showNew}
                  onToggle={() => setShowNew(!showNew)}
                  placeholder="Enter a new password"
                />

                <PasswordField
                  id="confirm-password"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(value) => {
                    setConfirmPassword(value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  show={showConfirm}
                  onToggle={() => setShowConfirm(!showConfirm)}
                  placeholder="Re enter your new password"
                />

                <div className="space-y-1.5 text-xs">
                  <p
                    className={
                      newPassword
                        ? meetsLength
                          ? "text-emerald-600"
                          : "text-destructive"
                        : "text-muted-foreground"
                    }
                  >
                    • Minimum 8 characters
                  </p>

                  {confirmPassword && (
                    <p className={passwordsMatch ? "text-emerald-600" : "text-destructive"}>
                      • Passwords {passwordsMatch ? "match" : "do not match"}
                    </p>
                  )}
                </div>

                {errorMessage && (
                  <p className="text-sm text-destructive">{errorMessage}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={!canSubmit}
                    className="flex-1 h-11 text-sm font-semibold"
                  >
                    {isLoading ? "Updating..." : "Update Password"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                    className="h-11 text-sm"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>

              <h2 className="text-lg font-bold text-foreground mb-2">
                Password Updated
              </h2>

              <p className="text-sm text-muted-foreground mb-6">
                Your password has been updated successfully.
              </p>

              <Button
                onClick={() => navigate("/dashboard")}
                className="h-10 text-sm font-semibold"
              >
                Back to Dashboard
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
};

const PasswordField = ({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
}: PasswordFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>

      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 text-sm bg-background pr-10"
          required
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
