import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  UserCheck,
  Inbox,
  LogOut,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/context/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const mainNav = [
  { title: "Dashboard", url: "/staff/dashboard", icon: LayoutDashboard },
  { title: "All Issues", url: "/staff/issues", icon: FileText },
  { title: "Issues Assigned to Me", url: "/staff/my-issues", icon: UserCheck },
  { title: "Unassigned Issues", url: "/staff/unassigned", icon: Inbox },
];

export function StaffAppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { logout, appUser } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-card">
      <SidebarContent>
        <div
          className={`flex items-center gap-2.5 px-4 pt-5 pb-3 ${
            collapsed ? "justify-center px-2" : ""
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-accent-foreground" />
          </div>
          {!collapsed && (
            <span className="text-base font-heading font-bold text-foreground tracking-tight">
              eCitizen
            </span>
          )}
        </div>

        <Separator className="mx-3 mb-1" />

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/staff/dashboard"}
                      className="hover:bg-muted/60 rounded-md"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {appUser?.role === "ADMIN" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={collapsed ? "Admin Panel" : undefined}>
                    <NavLink
                      to="/admin"
                      end
                      className="hover:bg-muted/60 rounded-md"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <Settings className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>Admin Panel</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip={collapsed ? "Sign Out" : undefined}
              className="hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="mx-auto mt-1 h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
