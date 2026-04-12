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
    size === "sm"
      ? "brand-logo__image--sm"
      : size === "lg"
      ? "brand-logo__image--lg"
      : "brand-logo__image--md";

  const textSizeClass =
    size === "sm"
      ? "brand-logo__text--sm"
      : size === "lg"
      ? "brand-logo__text--lg"
      : "brand-logo__text--md";

  return (
    <div className={`brand-logo ${className}`.trim()}>
      <img
        src={logo}
        alt="eCitizen logo"
        className={`brand-logo__image ${sizeClass}`}
      />

      {showText ? (
        <span
          className={`brand-logo__text ${textSizeClass} ${textClassName}`.trim()}
        >
          eCitizen
        </span>
      ) : null}
    </div>
  );
}