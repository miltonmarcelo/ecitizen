import { useEffect, useMemo, useState } from "react";
import {
  Search,
  MoreHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { adminFetch } from "@/lib/adminApi";
import { compareValues, formatDateTime, type AdminCategory } from "@/lib/admin";

type SortKey = keyof AdminCategory;
type SortDir = "asc" | "desc";

export default function AdminCategories() {
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [creating, setCreating] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<AdminCategory | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");

  const [confirmAction, setConfirmAction] = useState<{
    category: AdminCategory;
    action: "enable" | "disable" | "delete";
  } | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const data = await adminFetch<{ categories: AdminCategory[] }>(user, "/api/admin/categories");
        setCategories(data.categories || []);
      } catch (err: any) {
        setError(err.message || "Unable to load categories.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadCategories();
    }
  }, [authLoading, user]);

  const hasFilters = search || statusFilter !== "all";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    // Applies search + status filters first, then shared compare sort.
    return [...categories]
      .filter((item) => {
        const matchesSearch =
          !q ||
          item.name.toLowerCase().includes(q) ||
          String(item.description || "").toLowerCase().includes(q);
        const matchesStatus =
          statusFilter === "all" || (statusFilter === "active" ? item.isActive : !item.isActive);
        return matchesSearch && matchesStatus;
      })
      .sort((first, second) => {
        const result = compareValues(first[sortKey], second[sortKey]);
        return sortDir === "asc" ? result : result * -1;
      });
  }, [categories, search, sortDir, sortKey, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDir("asc");
  };

  const sortIndicator = (key: SortKey) => (sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "");

  const handleCreate = () => {
    setEditCategory(null);
    setFormName("");
    setFormDesc("");
    setFormOpen(true);
  };

  const handleEdit = (row: AdminCategory) => {
    setEditCategory(row);
    setFormName(row.name);
    setFormDesc(row.description || "");
    setFormOpen(true);
  };

  const handleFormSave = async () => {
    if (!user) return;

    try {
      if (editCategory) {
        setSaving((current) => ({ ...current, [editCategory.id]: true }));
        const data = await adminFetch<{ category: AdminCategory; message: string }>(
          user,
          `/api/admin/categories/${editCategory.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              name: formName.trim(),
              description: formDesc.trim(),
            }),
          }
        );

        setCategories((current) =>
          current.map((item) => (item.id === editCategory.id ? data.category : item))
        );
        toast.success(data.message || "Category updated successfully");
      } else {
        // New categories are created as active by default for immediate use.
        setCreating(true);
        const data = await adminFetch<{ category: AdminCategory; message: string }>(user, "/api/admin/categories", {
          method: "POST",
          body: JSON.stringify({
            name: formName.trim(),
            description: formDesc.trim(),
            isActive: true,
          }),
        });

        setCategories((current) => [data.category, ...current]);
        toast.success(data.message || "Category created successfully");
      }

      setFormOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Unable to save category");
    } finally {
      if (editCategory) {
        setSaving((current) => ({ ...current, [editCategory.id]: false }));
      }
      setCreating(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmAction || !user) return;

    const { category, action } = confirmAction;

    try {
      setSaving((current) => ({ ...current, [category.id]: true }));

      if (action === "delete") {
        // Delete path removes row locally after backend confirms hard delete.
        await adminFetch<{ message: string }>(user, `/api/admin/categories/${category.id}`, {
          method: "DELETE",
        });
        setCategories((current) => current.filter((item) => item.id !== category.id));
        toast.success("Category deleted successfully");
      } else {
        // Enable/disable path uses partial update and swaps in returned row.
        const data = await adminFetch<{ category: AdminCategory; message: string }>(
          user,
          `/api/admin/categories/${category.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({ isActive: action === "enable" }),
          }
        );

        setCategories((current) => current.map((item) => (item.id === category.id ? data.category : item)));
        toast.success(data.message || `Category ${action}d successfully`);
      }

      setConfirmAction(null);
    } catch (err: any) {
      toast.error(err.message || "Unable to update category");
    } finally {
      setSaving((current) => ({ ...current, [category.id]: false }));
    }
  };

  if (loading) {
    return (
      <AdminLayout
      pageTitle="Categories"
      breadcrumb="Categories"
      searchValue={search}
      onSearchChange={(value) => {
        setSearch(value);
        setPage(1);
      }}
      searchPlaceholder="Search categories..."
    >
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Loading categories...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      pageTitle="Categories"
      breadcrumb="Categories"
      searchValue={search}
      onSearchChange={(value) => {
        setSearch(value);
        setPage(1);
      }}
      searchPlaceholder="Search categories..."
    >
      <div className="mb-4">
        <h2 className="text-lg font-heading font-semibold text-foreground">Categories Management</h2>
        <p className="text-sm text-muted-foreground">Manage issue categories used across the portal</p>
      </div>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/5 mb-4">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <Card className="shadow-sm mb-4">
        <CardContent className="p-3 flex flex-wrap items-center gap-3">
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
          {hasFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setPage(1);
              }}
            >
              <X className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {filtered.length} categories
            </Badge>
            <Button size="sm" onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-1" /> Add Category
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm admin-table">
        <div className="admin-table__scroll">
          <Table className="admin-table__table">
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort("id")}>ID{sortIndicator("id")}</TableHead>
              <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort("name")}>Name{sortIndicator("name")}</TableHead>
              <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort("description")}>Description{sortIndicator("description")}</TableHead>
              <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort("isActive")}>Status{sortIndicator("isActive")}</TableHead>
              <TableHead className="whitespace-nowrap">Issues</TableHead>
              <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort("createdAt")}>Created{sortIndicator("createdAt")}</TableHead>
              <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort("updatedAt")}>Updated{sortIndicator("updatedAt")}</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row) => (
                <TableRow key={row.id} className={!row.isActive ? "opacity-60" : ""}>
                  <TableCell className="font-mono text-xs whitespace-nowrap">{row.id}</TableCell>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{row.description || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={row.isActive ? "default" : "destructive"}
                      className={`text-xs ${row.isActive ? "bg-accent text-accent-foreground" : ""}`}
                    >
                      {row.isActive ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>{row._count?.issues || 0}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{formatDateTime(row.createdAt)}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{formatDateTime(row.updatedAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => handleEdit(row)}>Edit Category</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {row.isActive ? (
                          <DropdownMenuItem
                            onClick={() => setConfirmAction({ category: row, action: "disable" })}
                            disabled={saving[row.id]}
                            className="text-destructive focus:text-destructive"
                          >
                            Disable
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => setConfirmAction({ category: row, action: "enable" })} disabled={saving[row.id]}>
                            Enable
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setConfirmAction({ category: row, action: "delete" })}
                          disabled={saving[row.id] || (row._count?.issues || 0) > 0}
                          className="text-destructive focus:text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
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
                {[5, 10, 20, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>
              {editCategory ? `Editing ${editCategory.name}` : "Create a new issue category"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Category Name</Label>
              <Input value={formName} onChange={(event) => setFormName(event.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formDesc} onChange={(event) => setFormDesc(event.target.value)} className="mt-1" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleFormSave}
              disabled={!formName.trim() || creating || (editCategory ? saving[editCategory.id] : false)}
            >
              {editCategory ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.action === "delete"
                ? "Delete Category"
                : confirmAction?.action === "disable"
                ? "Disable Category"
                : "Enable Category"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmAction?.action} <strong>{confirmAction?.category.name}</strong>?
              {confirmAction?.action === "delete"
                ? " This action cannot be undone, and it only works when no issues are linked to the category."
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmAction?.action === "enable" ? "default" : "destructive"}
              onClick={handleConfirm}
              disabled={confirmAction ? saving[confirmAction.category.id] : false}
            >
              {confirmAction?.action === "delete"
                ? "Delete"
                : confirmAction?.action === "disable"
                ? "Disable"
                : "Enable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
