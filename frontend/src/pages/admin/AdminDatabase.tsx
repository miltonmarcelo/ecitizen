import { useCallback, useEffect, useMemo, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Database,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/AuthContext";
import { adminFetch } from "@/lib/adminApi";
import type {
  AdminCategory,
  AdminHistory,
  AdminIssue,
  AdminNote,
  AdminStaff,
  AdminUser,
} from "@/lib/admin";

type DbTableKey = "users" | "staff" | "categories" | "issues" | "notes" | "history";
type TableRowData = Record<string, any>;

type TableDefinition = {
  key: DbTableKey;
  name: string;
  rows: TableRowData[];
};

const pageSizeOptions = [5, 10, 20, 50] as const;

export default function AdminDatabase() {
  const { user, loading: authLoading } = useAuth();

  const [search, setSearch] = useState("");
  const [selectedTable, setSelectedTable] = useState<DbTableKey>("users");
  const [sortCol, setSortCol] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [detailRow, setDetailRow] = useState<TableRowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [staff, setStaff] = useState<AdminStaff[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [issues, setIssues] = useState<AdminIssue[]>([]);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [history, setHistory] = useState<AdminHistory[]>([]);

  const loadDatabase = useCallback(async () => {
    if (!user) {
      setUsers([]);
      setStaff([]);
      setCategories([]);
      setIssues([]);
      setNotes([]);
      setHistory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        usersData,
        staffData,
        categoriesData,
        issuesData,
        notesData,
        historyData,
      ] = await Promise.all([
        adminFetch<{ users: AdminUser[] }>(user, "/api/admin/users"),
        adminFetch<{ staff: AdminStaff[] }>(user, "/api/admin/staff"),
        adminFetch<{ categories: AdminCategory[] }>(user, "/api/admin/categories"),
        adminFetch<{ issues: AdminIssue[] }>(user, "/api/admin/issues"),
        adminFetch<{ notes: AdminNote[] }>(user, "/api/admin/notes"),
        adminFetch<{ history: AdminHistory[] }>(user, "/api/admin/history"),
      ]);

      setUsers(usersData.users || []);
      setStaff(staffData.staff || []);
      setCategories(categoriesData.categories || []);
      setIssues(issuesData.issues || []);
      setNotes(notesData.notes || []);
      setHistory(historyData.history || []);
    } catch (err: any) {
      setError(err.message || "Unable to load database tables.");
      setUsers([]);
      setStaff([]);
      setCategories([]);
      setIssues([]);
      setNotes([]);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) loadDatabase();
  }, [authLoading, loadDatabase]);

  const tables = useMemo<TableDefinition[]>(
    () => [
      {
        key: "users",
        name: "Users",
        rows: users.map((item) => ({
          id: item.id,
          firebaseUid: item.firebaseUid,
          email: item.email,
          fullName: item.fullName,
          role: item.role,
          isActive: item.isActive,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
      },
      {
        key: "staff",
        name: "Staff",
        rows: staff.map((item) => ({
          id: item.id,
          userId: item.userId,
          fullName: item.user.fullName,
          email: item.user.email,
          role: item.user.role,
          isActive: item.user.isActive,
          jobTitle: item.jobTitle,
          assignedIssues: item._count?.assignedIssues || 0,
          notes: item._count?.notes || 0,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
      },
      {
        key: "categories",
        name: "Categories",
        rows: categories.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          isActive: item.isActive,
          issues: item._count?.issues || 0,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
      },
      {
        key: "issues",
        name: "Issues",
        rows: issues.map((item) => ({
          id: item.id,
          caseId: item.caseId,
          title: item.title,
          status: item.status,
          category: item.category?.name || "",
          citizen: item.citizen?.fullName || "",
          assignedTo: item.staff?.user?.fullName || "",
          addressLine1: item.addressLine1,
          area: item.area,
          city: item.city,
          county: item.county,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
      },
      {
        key: "notes",
        name: "Notes",
        rows: notes.map((item) => ({
          id: item.id,
          caseId: item.issue.caseId,
          issueTitle: item.issue.title,
          status: item.issue.status,
          staffName: item.staff.user?.fullName || "",
          jobTitle: item.staff.jobTitle,
          content: item.content,
          createdAt: item.createdAt,
        })),
      },
      {
        key: "history",
        name: "Issue History",
        rows: history.map((item) => ({
          id: item.id,
          caseId: item.issue.caseId,
          issueTitle: item.issue.title,
          eventType: item.eventType,
          fromStatus: item.fromStatus,
          toStatus: item.toStatus,
          changedBy: item.changedByUser.fullName,
          role: item.changedByUser.role,
          comment: item.comment,
          changedAt: item.changedAt,
        })),
      },
    ],
    [users, staff, categories, issues, notes, history]
  );

  const selectedTableDef = useMemo(
    () => tables.find((table) => table.key === selectedTable) || tables[0],
    [selectedTable, tables]
  );

  const columns = useMemo(() => {
    const firstRow = selectedTableDef?.rows[0];
    return firstRow ? Object.keys(firstRow) : [];
  }, [selectedTableDef]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return [...(selectedTableDef?.rows || [])]
      .filter((row) =>
        !q
          ? true
          : Object.values(row).some((value) =>
              String(value ?? "").toLowerCase().includes(q)
            )
      )
      .sort((a, b) => {
        if (!sortCol) return 0;
        const result = String(a[sortCol] ?? "").localeCompare(String(b[sortCol] ?? ""));
        return sortDir === "asc" ? result : -result;
      });
  }, [search, selectedTableDef, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page, perPage]
  );

  const switchTable = (key: DbTableKey) => {
    setSelectedTable(key);
    setSearch("");
    setSortCol("");
    setSortDir("asc");
    setPage(1);
  };

  const toggleSort = (column: string) => {
    if (sortCol === column) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(column);
      setSortDir("asc");
    }
  };

  const formatHeader = (value: string) =>
    value.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());

  const renderCellValue = (value: any) => {
    if (typeof value === "boolean") {
      return (
        <Badge
          variant={value ? "default" : "destructive"}
          className={`text-xs ${value ? "bg-accent text-accent-foreground" : ""}`}
        >
          {value ? "Active" : "Disabled"}
        </Badge>
      );
    }

    return String(value ?? "—");
  };

  if (loading) {
    return (
      <AdminLayout
        pageTitle="Database Explorer"
        breadcrumb="Database Explorer"
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search records..."
      >
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Loading database tables...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      pageTitle="Database Explorer"
      breadcrumb="Database Explorer"
      searchValue={search}
      onSearchChange={(value) => {
        setSearch(value);
        setPage(1);
      }}
      searchPlaceholder="Search records..."
    >
      <div className="mb-4">
        <h2 className="text-lg font-heading font-semibold text-foreground">
          Database Explorer
        </h2>
        <p className="text-sm text-muted-foreground">
          Browse and inspect all database tables
        </p>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5 mb-4">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="flex gap-6">
        <Card className="shadow-sm w-56 shrink-0">
          <CardContent className="p-0">
            <div className="p-3 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Tables
              </p>
            </div>

            <div className="py-1">
              {tables.map((table) => (
                <button
                  key={table.key}
                  onClick={() => switchTable(table.key)}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors hover:bg-muted/60 ${
                    selectedTable === table.key
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 shrink-0" />
                    {table.name}
                  </span>
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {table.rows.length}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex-1 min-w-0">
          <Card className="shadow-sm mb-4">
            <CardContent className="p-3 flex flex-wrap items-center gap-3">
              {search && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                >
                  <X className="w-3.5 h-3.5 mr-1" /> Clear
                </Button>
              )}

              <Badge variant="secondary" className="ml-auto text-xs">
                {filtered.length} records
              </Badge>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead
                        key={column}
                        className="cursor-pointer select-none whitespace-nowrap"
                        onClick={() => toggleSort(column)}
                      >
                        {formatHeader(column)}
                        {sortCol === column ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                      </TableHead>
                    ))}
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginated.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length + 1}
                        className="text-center py-10 text-muted-foreground"
                      >
                        No records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((row, index) => (
                      <TableRow key={`${selectedTable}-${index}`}>
                        {columns.map((column) => (
                          <TableCell
                            key={column}
                            className="text-sm whitespace-nowrap max-w-[250px] truncate"
                          >
                            {renderCellValue(row[column])}
                          </TableCell>
                        ))}
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setDetailRow(row)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Rows per page</span>
                <Select
                  value={String(perPage)}
                  onValueChange={(value) => {
                    setPerPage(Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={!!detailRow} onOpenChange={() => setDetailRow(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Details</DialogTitle>
            <DialogDescription>
              Full record from the {selectedTableDef?.name || "selected"} table
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {detailRow &&
              Object.entries(detailRow).map(([key, value]) => (
                <div key={key} className="flex gap-3">
                  <span className="text-xs font-medium text-muted-foreground w-32 shrink-0 pt-0.5">
                    {formatHeader(key)}
                  </span>
                  <span className="text-sm text-foreground break-all">
                    {renderCellValue(value)}
                  </span>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}