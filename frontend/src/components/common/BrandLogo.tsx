import logo from "@/assets/branding/logo.png";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  textClassName?: string;
};

export default function BrandLogo({
  size = "md",
  showText = true,
  className = "",
  textClassName = "",
}: BrandLogoProps) {
  const sizeClass =
    size === "sm" ? "w-6 h-6" : size === "lg" ? "w-10 h-10" : "w-8 h-8";

  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      <img
        src={logo}
        alt="eCitizen logo"
        className={`${sizeClass} object-contain shrink-0`}
      />
      {showText ? (
        <span
          className={`font-heading font-bold tracking-tight text-primary truncate ${textClassName}`}
        >
          eCitizen
        </span>
      ) : null}
    </div>
  );
}
