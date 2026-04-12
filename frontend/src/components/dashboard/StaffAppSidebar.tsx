import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight,
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
import BrandLogo from "@/components/common/BrandLogo";

const mainNav = [
  { title: "Dashboard", url: "/staff/dashboard", icon: LayoutDashboard },
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
    <Sidebar collapsible="icon" className="staff-sidebar">
      <SidebarContent>
        <div
          className={`staff-sidebar__brand ${
            collapsed ? "staff-sidebar__brand--collapsed" : ""
          }`}
        >
          {collapsed ? (
            <BrandLogo size="sm" showText={false} className="staff-sidebar__logo-center" />
          ) : (
            <BrandLogo size="md" showText={true} />
          )}
        </div>

        <Separator className="staff-sidebar__divider" />

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
                      className="staff-sidebar__link"
                      activeClassName="staff-sidebar__link--active"
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
                      to="/admin/dashboard"
                      end
                      className="staff-sidebar__link"
                      activeClassName="staff-sidebar__link--active"
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

      <SidebarFooter className="staff-sidebar__footer">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip={collapsed ? "Sign Out" : undefined}
              className="staff-sidebar__signout"
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
          className="staff-sidebar__toggle"
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
