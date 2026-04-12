import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MoreHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { adminFetch } from "@/lib/adminApi";
import { compareValues, formatDateTime, type AdminStaff } from "@/lib/admin";
import type { Role } from "@/types/domain";
import { Input } from "@/components/ui/input";

type StaffRow = {
  id: number;
  userId: number;
  name: string;
  email: string;
  jobTitle: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignedIssues: number;
  notes: number;
  source: AdminStaff;
};

type SortKey = keyof StaffRow;
type SortDir = "asc" | "desc";
type ConfirmAction = {
  staff: StaffRow;
  action: "enable" | "disable";
} | null;

const roleOptions: Role[] = ["ADMIN", "STAFF"];
const pageSizeOptions = [5, 10, 20, 50] as const;

const columns: { key: SortKey; label: string }[] = [
  { key: "id", label: "Staff ID" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "jobTitle", label: "Job Title" },
  { key: "role", label: "Role" },
  { key: "isActive", label: "Status" },
  { key: "createdAt", label: "Created" },
];

function roleLabel(role: Role) {
  return role === "ADMIN" ? "Admin" : role === "STAFF" ? "Staff" : "Citizen";
}

export default function AdminStaff() {
  const { user, loading: authLoading } = useAuth();

  const [staff, setStaff] = useState<AdminStaff[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingStaff, setSavingStaff] = useState<Record<number, boolean>>({});
  const [savingUsers, setSavingUsers] = useState<Record<number, boolean>>({});

  const [editStaff, setEditStaff] = useState<StaffRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editJobTitle, setEditJobTitle] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const loadStaff = useCallback(async () => {
    if (!user) {
      setStaff([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await adminFetch<{ staff: AdminStaff[] }>(user, "/api/admin/staff");
      setStaff(data.staff || []);
    } catch (err: any) {
      setError(err.message || "Unable to load staff records.");
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) loadStaff();
  }, [authLoading, loadStaff]);

  const rows = useMemo<StaffRow[]>(
    () =>
      staff.map((item) => ({
        id: item.id,
        userId: item.userId,
        name: item.user.fullName,
        email: item.user.email,
        jobTitle: item.jobTitle,
        role: item.user.role,
        isActive: item.user.isActive,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        assignedIssues: item._count?.assignedIssues || 0,
        notes: item._count?.notes || 0,
        source: item,
      })),
    [staff]
  );

  const hasFilters = Boolean(search.trim()) || roleFilter !== "all" || statusFilter !== "all";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return [...rows]
      .filter((item) => {
        const matchesSearch =
          !q ||
          String(item.id).toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          item.jobTitle.toLowerCase().includes(q);

        const matchesRole = roleFilter === "all" || item.role === roleFilter;
        const matchesStatus =
          statusFilter === "all" || (statusFilter === "active" ? item.isActive : !item.isActive);

        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        const result = compareValues(a[sortKey], b[sortKey]);
        return sortDir === "asc" ? result : -result;
      });
  }, [rows, search, roleFilter, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page, perPage]
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  const updateStaffProfile = async (staffId: number, jobTitle: string) => {
    if (!user) return null;

    try {
      setSavingStaff((current) => ({ ...current, [staffId]: true }));

      const data = await adminFetch<{ staff: AdminStaff; message: string }>(
        user,
        `/api/admin/staff/${staffId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ jobTitle }),
        }
      );

      setStaff((current) => current.map((item) => (item.id === staffId ? data.staff : item)));
      toast.success(data.message || "Staff profile updated successfully");
      return data.staff;
    } catch (err: any) {
      toast.error(err.message || "Unable to update staff profile");
      return null;
    } finally {
      setSavingStaff((current) => ({ ...current, [staffId]: false }));
    }
  };

  const updateStaffUser = async (
    userId: number,
    payload: Partial<{ fullName: string; role: Role; isActive: boolean }>
  ) => {
    if (!user) return null;

    try {
      setSavingUsers((current) => ({ ...current, [userId]: true }));

      const data = await adminFetch<{ user: Partial<AdminStaff["user"]>; message: string }>(
        user,
        `/api/admin/users/${userId}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      );

      setStaff((current) =>
        current.map((item) =>
          item.userId === userId
            ? {
                ...item,
                user: {
                  ...item.user,
                  ...data.user,
                },
              }
            : item
        )
      );

      toast.success(data.message || "Staff user updated successfully");
      return data.user;
    } catch (err: any) {
      toast.error(err.message || "Unable to update staff user");
      return null;
    } finally {
      setSavingUsers((current) => ({ ...current, [userId]: false }));
    }
  };

  const handleEditSave = async () => {
    if (!editStaff) return;

    const [userUpdated, staffUpdated] = await Promise.all([
      updateStaffUser(editStaff.userId, { fullName: editName.trim() }),
      updateStaffProfile(editStaff.id, editJobTitle.trim()),
    ]);

    if (userUpdated && staffUpdated) setEditStaff(null);
  };

  const handleRoleChange = async (row: StaffRow, role: Role) => {
    await updateStaffUser(row.userId, { role });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    await updateStaffUser(confirmAction.staff.userId, {
      isActive: confirmAction.action === "enable",
    });
    setConfirmAction(null);
  };

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    setPage(1);
  };

  if (loading) {
    return (
      <AdminLayout
        pageTitle="Staff"
        breadcrumb="Staff"
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search by name, email, ID, or job title..."
      >
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Loading staff records...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      pageTitle="Staff"
      breadcrumb="Staff"
      searchValue={search}
      onSearchChange={(value) => {
        setSearch(value);
        setPage(1);
      }}
      searchPlaceholder="Search by name, email, ID, or job title..."
    >
      <div className="mb-4">
        <h2 className="text-lg font-heading font-semibold text-foreground">
          Staff Management
        </h2>
        <p className="text-sm text-muted-foreground">
          View and manage all staff records
        </p>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5 mb-4">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card className="shadow-sm mb-4">
        <CardContent className="p-3 flex flex-wrap items-center gap-3">
          <Select
            value={roleFilter}
            onValueChange={(value) => {
              setRoleFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-36 text-sm">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roleOptions.map((role) => (
                <SelectItem key={role} value={role}>
                  {roleLabel(role)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-36 text-sm">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
          )}

          <Badge variant="secondary" className="ml-auto text-xs">
            {filtered.length} staff
          </Badge>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort(column.key)}
                >
                  {column.label}
                  {sortIndicator(column.key)}
                </TableHead>
              ))}
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-10 text-muted-foreground">
                  No staff found
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row) => (
                <TableRow key={row.id} className={!row.isActive ? "opacity-60" : ""}>
                  <TableCell className="font-mono text-xs">{row.id}</TableCell>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-sm">{row.email}</TableCell>
                  <TableCell className="text-sm">{row.jobTitle}</TableCell>
                  <TableCell>
                    <Badge
                      variant={row.role === "ADMIN" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {roleLabel(row.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={row.isActive ? "default" : "destructive"}
                      className={`text-xs ${row.isActive ? "bg-accent text-accent-foreground" : ""}`}
                    >
                      {row.isActive ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatDateTime(row.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditStaff(row);
                            setEditName(row.name);
                            setEditJobTitle(row.jobTitle);
                          }}
                        >
                          Edit Details
                        </DropdownMenuItem>

                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Change Role</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {roleOptions.map((role) => (
                              <DropdownMenuItem
                                key={role}
                                disabled={savingUsers[row.userId]}
                                onClick={() => handleRoleChange(row, role)}
                              >
                                {roleLabel(role)} {row.role === role ? "✓" : ""}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSeparator />

                        {row.isActive ? (
                          <DropdownMenuItem
                            onClick={() => setConfirmAction({ staff: row, action: "disable" })}
                            className="text-destructive focus:text-destructive"
                            disabled={savingUsers[row.userId]}
                          >
                            Disable Staff
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => setConfirmAction({ staff: row, action: "enable" })}
                            disabled={savingUsers[row.userId]}
                          >
                            Enable Staff
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

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

      <Dialog open={!!editStaff} onOpenChange={() => setEditStaff(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Details</DialogTitle>
            <DialogDescription>
              Update details for staff ID {editStaff?.id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label>Name</Label>
              <Input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Job Title</Label>
              <Input
                value={editJobTitle}
                onChange={(event) => setEditJobTitle(event.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStaff(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={
                !editName.trim() ||
                !editJobTitle.trim() ||
                (editStaff ? savingUsers[editStaff.userId] || savingStaff[editStaff.id] : false)
              }
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.action === "disable" ? "Disable Staff" : "Enable Staff"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmAction?.action}{" "}
              <strong>{confirmAction?.staff.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmAction?.action === "disable" ? "destructive" : "default"}
              onClick={handleConfirmAction}
              disabled={confirmAction ? savingUsers[confirmAction.staff.userId] : false}
            >
              {confirmAction?.action === "disable" ? "Disable" : "Enable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}