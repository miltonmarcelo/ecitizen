import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MoreHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import AdminLayout from "@/components/layout/AdminLayout";
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
import { compareValues, formatDateTime, type AdminUser } from "@/lib/admin";
import type { Role } from "@/types/domain";
import { Input } from "@/components/ui/input";

const roleOptions: Role[] = ["ADMIN", "STAFF", "CITIZEN"];
const pageSizeOptions = [5, 10, 20, 50] as const;

type SortKey = keyof AdminUser;
type SortDir = "asc" | "desc";
type ConfirmAction = { user: AdminUser; action: "enable" | "disable" } | null;

const columns: { key: SortKey; label: string }[] = [
  { key: "id", label: "User ID" },
  { key: "fullName", label: "Full Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "isActive", label: "Status" },
  { key: "createdAt", label: "Created" },
  { key: "updatedAt", label: "Updated" },
];

function roleLabel(role: Role) {
  return role === "ADMIN" ? "Admin" : role === "STAFF" ? "Staff" : "Citizen";
}

export default function AdminUsers() {
  const { user, loading: authLoading } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const loadUsers = useCallback(async () => {
    if (!user) {
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await adminFetch<{ users: AdminUser[] }>(user, "/api/admin/users");
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message || "Unable to load users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) loadUsers();
  }, [authLoading, loadUsers]);

  const hasFilters = Boolean(search.trim()) || roleFilter !== "all" || statusFilter !== "all";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    // Runs search + role/status filters before shared sort logic.
    return [...users]
      .filter((item) => {
        const matchesSearch =
          !q ||
          String(item.id).toLowerCase().includes(q) ||
          item.fullName.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q);

        const matchesRole = roleFilter === "all" || item.role === roleFilter;
        const matchesStatus =
          statusFilter === "all" || (statusFilter === "active" ? item.isActive : !item.isActive);

        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        const result = compareValues(a[sortKey], b[sortKey]);
        return sortDir === "asc" ? result : -result;
      });
  }, [users, search, roleFilter, statusFilter, sortKey, sortDir]);

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

  const updateUser = async (
    userId: number,
    payload: Partial<Pick<AdminUser, "fullName" | "role" | "isActive">>
  ) => {
    if (!user) return;

    try {
      setSaving((current) => ({ ...current, [userId]: true }));

      // Sends partial user updates so role/status/name can be changed independently.
      const data = await adminFetch<{ user: AdminUser; message: string }>(
        user,
        `/api/admin/users/${userId}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      );

      setUsers((current) => current.map((item) => (item.id === userId ? data.user : item)));
      toast.success(data.message || "User updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Unable to update user");
    } finally {
      setSaving((current) => ({ ...current, [userId]: false }));
    }
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    await updateUser(editUser.id, { fullName: editName.trim() });
    setEditUser(null);
  };

  const handleRoleChange = async (row: AdminUser, role: Role) => {
    await updateUser(row.id, { role });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    // Uses the same update path for enable/disable by toggling isActive.
    await updateUser(confirmAction.user.id, {
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
        pageTitle="Users"
        breadcrumb="Users"
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search by name, email, or ID..."
      >
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Loading users...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      pageTitle="Users"
      breadcrumb="Users"
      searchValue={search}
      onSearchChange={(value) => {
        setSearch(value);
        setPage(1);
      }}
      searchPlaceholder="Search by name, email, or ID..."
    >
      <div className="mb-4">
        <h2 className="text-lg font-heading font-semibold text-foreground">
          Users Management
        </h2>
        <p className="text-sm text-muted-foreground">
          View and manage all user accounts in the system
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
            {filtered.length} users
          </Badge>
        </CardContent>
      </Card>

      <Card className="shadow-sm admin-table">
        <div className="admin-table__scroll">
          <Table className="admin-table__table">
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className="cursor-pointer select-none whitespace-nowrap"
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
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row) => (
                <TableRow key={row.id} className={!row.isActive ? "opacity-60" : ""}>
                  <TableCell className="font-mono text-xs whitespace-nowrap">{row.id}</TableCell>
                  <TableCell className="font-medium">{row.fullName}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{row.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.role === "ADMIN"
                          ? "default"
                          : row.role === "STAFF"
                          ? "secondary"
                          : "outline"
                      }
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
                  <TableCell className="text-sm whitespace-nowrap">{formatDateTime(row.createdAt)}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{formatDateTime(row.updatedAt)}</TableCell>
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
                            setEditUser(row);
                            setEditName(row.fullName);
                          }}
                        >
                          Edit Name
                        </DropdownMenuItem>

                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Change Role</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {roleOptions.map((role) => (
                              <DropdownMenuItem
                                key={role}
                                disabled={saving[row.id]}
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
                            className="text-destructive focus:text-destructive"
                            disabled={saving[row.id]}
                            onClick={() => setConfirmAction({ user: row, action: "disable" })}
                          >
                            Disable User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            disabled={saving[row.id]}
                            onClick={() => setConfirmAction({ user: row, action: "enable" })}
                          >
                            Enable User
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
        </div>

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

      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Name</DialogTitle>
            <DialogDescription>
              Update the name for user ID {editUser?.id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label>Full Name</Label>
              <Input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={!editName.trim() || (editUser ? saving[editUser.id] : false)}
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
              {confirmAction?.action === "disable" ? "Disable User" : "Enable User"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmAction?.action}{" "}
              <strong>{confirmAction?.user.fullName}</strong>?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmAction?.action === "disable" ? "destructive" : "default"}
              onClick={handleConfirmAction}
              disabled={confirmAction ? saving[confirmAction.user.id] : false}
            >
              {confirmAction?.action === "disable" ? "Disable" : "Enable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
