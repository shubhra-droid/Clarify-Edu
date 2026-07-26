"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Brain,
  Home,
  LayoutDashboard,
  Settings,
  Upload,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  disabled?: boolean;
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/upload", label: "Upload", icon: Upload },
  { href: "/dashboard/study", label: "Study", icon: BookOpen, disabled: true },
  { href: "/dashboard/mindmap", label: "Mind Map", icon: Brain, disabled: true },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r bg-card",
        className
      )}
      aria-label="Main navigation"
    >
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Link
          href="/"
          className="focus-ring flex items-center gap-2 rounded-md font-semibold text-primary"
          onClick={onNavigate}
        >
          <Brain className="h-5 w-5" aria-hidden="true" />
          ClarifyEdu
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Dashboard navigation">
        {NAV_ITEMS.map(({ href, label, icon: Icon, disabled }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          if (disabled) {
            return (
              <div
                key={href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground/60"
                aria-disabled="true"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
                <Badge variant="outline" className="ml-auto text-[10px]">
                  Soon
                </Badge>
              </div>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "focus-ring flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      <div className="p-3">
        <Link
          href="/dashboard/settings"
          onClick={onNavigate}
          className={cn(
            "focus-ring flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            pathname === "/dashboard/settings" && "bg-primary/10 text-primary"
          )}
          aria-current={
            pathname === "/dashboard/settings" ? "page" : undefined
          }
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
          Accessibility
        </Link>
        <Link
          href="/"
          onClick={onNavigate}
          className="focus-ring mt-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Home
        </Link>
      </div>
    </aside>
  );
}
