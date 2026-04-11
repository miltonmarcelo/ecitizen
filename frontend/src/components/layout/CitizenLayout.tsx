import { ReactNode } from "react";
import TopBar from "@/components/TopBar";

type CitizenLayoutProps = {
  children: ReactNode;
  width?: "narrow" | "default" | "wide";
  title?: string;
  showBack?: boolean;
  backTo?: string;
  showProfile?: boolean;
};

export default function CitizenLayout({
  children,
  width = "narrow",
  title,
  showBack = false,
  backTo = "/",
  showProfile = false,
}: CitizenLayoutProps) {
  const contentWidth =
    width === "wide"
      ? "page-content-wide"
      : width === "default"
      ? "page-content-default"
      : "page-content-narrow";

  return (
    <div className="page-shell">
      <TopBar
        width={width}
        title={title}
        showBack={showBack}
        backTo={backTo}
        showProfile={showProfile}
      />
      <main className={`page-content ${contentWidth}`}>{children}</main>
    </div>
  );
}
