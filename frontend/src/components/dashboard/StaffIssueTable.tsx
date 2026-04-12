import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { StaffTableIssue } from "@/lib/staffIssues";
import { formatShortDate } from "@/lib/staffIssues";

type SortKey =
  | "caseId"
  | "title"
  | "category"
  | "status"
  | "createdAt"
  | "daysOpen"
  | "updatedAt";

type SortDir = "asc" | "desc";

type ColumnKey =
  | "caseId"
  | "title"
  | "category"
  | "status"
  | "createdAt"
  | "daysOpen"
  | "updatedAt"
  | "action";

type ColumnWidths = Record<ColumnKey, number>;

interface StaffIssueTableProps {
  issues: StaffTableIssue[];
  loading?: boolean;
  emptyMessage?: string;
}

const defaultWidths: ColumnWidths = {
  caseId: 130,
  title: 360,
  category: 180,
  status: 150,
  createdAt: 130,
  daysOpen: 110,
  updatedAt: 130,
  action: 100,
};

function getStatusPillClass(status: string): string {
  const normalized = status.toLowerCase().replace(/[\s-_]/g, "");

  if (normalized === "open") return "staff-status-pill staff-status-pill--created";
  if (normalized === "underreview") return "staff-status-pill staff-status-pill--review";
  if (normalized === "inprogress") return "staff-status-pill staff-status-pill--progress";
  if (normalized === "resolved") return "staff-status-pill staff-status-pill--resolved";
  if (normalized === "closed") return "staff-status-pill staff-status-pill--closed";
  if (normalized === "cancelled") return "staff-status-pill staff-status-pill--cancelled";

  return "staff-status-pill staff-status-pill--closed";
}

const StaffIssueTable = ({
  issues,
  loading = false,
  emptyMessage = "No issues found.",
}: StaffIssueTableProps) => {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(defaultWidths);

  const resizeStateRef = useRef<{
    column: ColumnKey;
    startX: number;
    startWidth: number;
  } | null>(null);

  const goToIssue = (caseId: string) => navigate(`/staff/issues/${caseId}`);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!resizeStateRef.current) return;

      const { column, startX, startWidth } = resizeStateRef.current;
      const nextWidth = Math.max(80, startWidth + (event.clientX - startX));

      setColumnWidths((prev) => ({
        ...prev,
        [column]: nextWidth,
      }));
    };

    const handleMouseUp = () => {
      resizeStateRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [issues.length, pageSize]);

  const handleResizeStart =
    (column: ColumnKey) => (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      resizeStateRef.current = {
        column,
        startX: event.clientX,
        startWidth: columnWidths[column],
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDir(key === "createdAt" || key === "updatedAt" || key === "daysOpen" ? "desc" : "asc");
  };

  const sortedIssues = useMemo(() => {
    const list = [...issues];
    const dir = sortDir === "asc" ? 1 : -1;

    list.sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;

      switch (sortKey) {
        case "createdAt":
          valueA = new Date(a.createdAt).getTime();
          valueB = new Date(b.createdAt).getTime();
          break;
        case "updatedAt":
          valueA = new Date(a.updatedAt).getTime();
          valueB = new Date(b.updatedAt).getTime();
          break;
        case "daysOpen":
          valueA = a.daysOpen;
          valueB = b.daysOpen;
          break;
        default:
          valueA = String(a[sortKey]).toLowerCase();
          valueB = String(b[sortKey]).toLowerCase();
          break;
      }

      if (valueA < valueB) return -1 * dir;
      if (valueA > valueB) return 1 * dir;
      return 0;
    });

    return list;
  }, [issues, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedIssues.length / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  const paginated = sortedIssues.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) {
      return <ChevronsUpDown className="w-3 h-3 opacity-40" />;
    }

    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3" />
    ) : (
      <ArrowDown className="w-3 h-3" />
    );
  };

  const HeadContent = ({
    label,
    column,
  }: {
    label: string;
    column: SortKey;
  }) => (
    <span className="staff-table__sort">
      {label} <SortIcon column={column} />
    </span>
  );

  const SortableHead = ({
    label,
    column,
    widthKey,
  }: {
    label: string;
    column: SortKey;
    widthKey: ColumnKey;
  }) => (
    <TableHead
      className="staff-table__head-cell"
      onClick={() => handleSort(column)}
    >
      <HeadContent label={label} column={column} />
      <div
        className="staff-table__resize-handle"
        onMouseDown={handleResizeStart(widthKey)}
      />
    </TableHead>
  );

  return (
    <div className="staff-table">
      <div className="staff-table__scroll">
        <Table>
          <colgroup>
            <col style={{ width: columnWidths.caseId }} />
            <col style={{ width: columnWidths.title }} />
            <col style={{ width: columnWidths.category }} />
            <col style={{ width: columnWidths.status }} />
            <col style={{ width: columnWidths.createdAt }} />
            <col style={{ width: columnWidths.daysOpen }} />
            <col style={{ width: columnWidths.updatedAt }} />
            <col style={{ width: columnWidths.action }} />
          </colgroup>

          <TableHeader>
            <TableRow className="staff-table__head-row">
              <SortableHead label="Issue ID" column="caseId" widthKey="caseId" />
              <SortableHead label="Title" column="title" widthKey="title" />
              <SortableHead label="Category" column="category" widthKey="category" />
              <SortableHead label="Status" column="status" widthKey="status" />
              <SortableHead label="Reported" column="createdAt" widthKey="createdAt" />
              <SortableHead label="Days Open" column="daysOpen" widthKey="daysOpen" />
              <SortableHead label="Updated" column="updatedAt" widthKey="updatedAt" />
              <TableHead className="staff-table__head-action">
                Action
                <div
                  className="staff-table__resize-handle"
                  onMouseDown={handleResizeStart("action")}
                />
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="staff-table__empty"
                >
                  Loading issues...
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="staff-table__empty"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((issue) => {
                const isUrgent = issue.daysOpen >= 7;
                const isWarning = issue.daysOpen >= 4 && issue.daysOpen < 7;

                return (
                  <TableRow
                    key={issue.caseId}
                    className="staff-table__row"
                    onClick={() => goToIssue(issue.caseId)}
                  >
                    <TableCell className="staff-table__case">
                      {issue.caseId}
                    </TableCell>

                    <TableCell className="staff-table__title">
                      <span className="staff-table__title-text">{issue.title}</span>
                    </TableCell>

                    <TableCell className="staff-table__category">
                      <span className="staff-table__category-text">{issue.category}</span>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className={getStatusPillClass(issue.status)}>
                        {issue.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="staff-table__date">
                      {formatShortDate(issue.createdAt)}
                    </TableCell>

                    <TableCell>
                      <span
                        className={`staff-table__days ${
                          isUrgent
                            ? "staff-table__days--urgent"
                            : isWarning
                            ? "staff-table__days--warning"
                            : ""
                        }`}
                      >
                        {issue.daysOpen === 0 ? "Today" : `${issue.daysOpen}d`}
                      </span>
                    </TableCell>

                    <TableCell className="staff-table__date">
                      {formatShortDate(issue.updatedAt)}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="staff-table__action"
                        onClick={(event) => {
                          event.stopPropagation();
                          goToIssue(issue.caseId);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="staff-table__pagination">
        <div className="staff-table__page-size">
          <span>Rows per page</span>
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="staff-table__page-size-trigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="staff-table__pager">
          <span className="staff-table__range">
            {sortedIssues.length === 0
              ? "0 of 0"
              : `${(safePage - 1) * pageSize + 1}–${Math.min(
                  safePage * pageSize,
                  sortedIssues.length
                )} of ${sortedIssues.length}`}
          </span>

          <Button
            variant="outline"
            size="icon"
            className="staff-table__pager-btn"
            disabled={safePage <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="staff-table__pager-btn"
            disabled={safePage >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StaffIssueTable;
