export function canAccessStaffRoute(userRole?: string | null): boolean {
  return userRole === "STAFF" || userRole === "ADMIN";
}
