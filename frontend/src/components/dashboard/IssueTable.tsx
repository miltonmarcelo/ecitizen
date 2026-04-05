import { useState, useMemo } from "react";
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

export interface Issue {
  id: string;
  title: string;
  category: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  dateReported: string;
  lastUpdated: string;
}

const statusVariant: Record<Issue["status"], string> = {
  Open: "bg-blue-50 text-blue-700 border-blue-200",
  "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
  Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Closed: "bg-muted text-muted-foreground border-border",
};

const parseDate = (d: string) => new Date(d).getTime();

const getDaysOpen = (dateReported: string): number => {
  const now = new Date("2026-03-25").getTime();
  return Math.max(0, Math.floor((now - parseDate(dateReported)) / 86400000));
};

type SortKey =
  | "id"
  | "title"
  | "category"
  | "status"
  | "dateReported"
  | "daysOpen"
  | "lastUpdated";

type SortDir = "asc" | "desc";

interface IssueTableProps {
  issues: Issue[];
}

const IssueTable = ({ issues }: IssueTableProps) => {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const goToIssue = (id: string) => navigate(`/staff/issues/${id}`);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "id" ? "desc" : "asc");
    }
  };

  const sorted = useMemo(() => {
    const list = [...issues];
    const dir = sortDir === "asc" ? 1 : -1;

    list.sort((a, b) => {
      let va: string | number;
      let vb: string | number;

      switch (sortKey) {
        case "daysOpen":
          va = getDaysOpen(a.dateReported);
          vb = getDaysOpen(b.dateReported);
          break;
        case "dateReported":
          va = parseDate(a.dateReported);
          vb = parseDate(b.dateReported);
          break;
        case "lastUpdated":
          va = parseDate(a.lastUpdated);
          vb = parseDate(b.lastUpdated);
          break;
        default:
          va = String(a[sortKey]).toLowerCase();
          vb = String(b[sortKey]).toLowerCase();
      }

      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });

    return list;
  }, [issues, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handlePageSizeChange = (val: string) => {
    setPageSize(Number(val));
    setPage(1);
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) {
      return <ChevronsUpDown className="w-3 h-3 opacity-40" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3" />
    ) : (
      <ArrowDown className="w-3 h-3" />
    );
  };

  const thClass =
    "text-xs font-semibold uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors";

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className={`${thClass} w-28`} onClick={() => handleSort("id")}>
                <span className="flex items-center gap-1">
                  Issue ID <SortIcon col="id" />
                </span>
              </TableHead>

              <TableHead className={thClass} onClick={() => handleSort("title")}>
                <span className="flex items-center gap-1">
                  Title <SortIcon col="title" />
                </span>
              </TableHead>

              <TableHead
                className={`${thClass} w-32`}
                onClick={() => handleSort("category")}
              >
                <span className="flex items-center gap-1">
                  Category <SortIcon col="category" />
                </span>
              </TableHead>

              <TableHead
                className={`${thClass} w-28`}
                onClick={() => handleSort("status")}
              >
                <span className="flex items-center gap-1">
                  Status <SortIcon col="status" />
                </span>
              </TableHead>

              <TableHead
                className={`${thClass} w-28`}
                onClick={() => handleSort("dateReported")}
              >
                <span className="flex items-center gap-1">
                  Reported <SortIcon col="dateReported" />
                </span>
              </TableHead>

              <TableHead
                className={`${thClass} w-24`}
                onClick={() => handleSort("daysOpen")}
              >
                <span className="flex items-center gap-1">
                  Days Open <SortIcon col="daysOpen" />
                </span>
              </TableHead>

              <TableHead
                className={`${thClass} w-28`}
                onClick={() => handleSort("lastUpdated")}
              >
                <span className="flex items-center gap-1">
                  Updated <SortIcon col="lastUpdated" />
                </span>
              </TableHead>

              <TableHead className="text-xs font-semibold uppercase tracking-wide w-24 text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginated.map((issue) => {
              const days = getDaysOpen(issue.dateReported);
              const isUrgent = days >= 7;
              const isWarning = days >= 4 && days < 7;

              return (
                <TableRow
                  key={issue.id}
                  className="hover:bg-muted/30 cursor-pointer"
                  onClick={() => goToIssue(issue.id)}
                >
                  <TableCell className="font-mono text-xs text-primary font-medium">
                    {issue.id}
                  </TableCell>

                  <TableCell className="text-sm font-medium text-card-foreground">
                    {issue.title}
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {issue.category}
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium ${statusVariant[issue.status]}`}
                    >
                      {issue.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {issue.dateReported}
                  </TableCell>

                  <TableCell>
                    <span
                      className={`text-sm font-medium ${
                        isUrgent
                          ? "text-destructive"
                          : isWarning
                          ? "text-amber-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {days === 0 ? "Today" : `${days}d`}
                    </span>
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {issue.lastUpdated}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        goToIssue(issue.id);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Rows per page</span>
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="h-8 w-[70px] text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of{" "}
            {sorted.length}
          </span>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IssueTable;