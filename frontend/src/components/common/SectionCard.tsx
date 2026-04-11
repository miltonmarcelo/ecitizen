import { ReactNode } from "react";

type SectionCardProps = {
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export default function SectionCard({
  children,
  className = "",
  bodyClassName = "",
}: SectionCardProps) {
  return (
    <section className={`card-base ${className}`}>
      <div className={`card-body ${bodyClassName}`}>{children}</div>
    </section>
  );
}
