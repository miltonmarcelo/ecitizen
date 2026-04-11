type PageHeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

export default function PageHeader({
  title,
  subtitle,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`page-header ${className}`}>
      <h1 className="page-title">{title}</h1>
      {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
    </div>
  );
}
