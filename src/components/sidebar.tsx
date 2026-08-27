"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Ticket,
  CalendarCheck,
  Users,
  Building2,
  ClipboardList,
  FileText,
  CreditCard,
  UserCheck,
  Plane,
  RotateCcw,
  BarChart3,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/upcoming-tickets", label: "التذاكر القريبة", icon: Ticket },
  { href: "/bookings", label: "الحجوزات", icon: CalendarCheck },
  { href: "/customers", label: "العملاء", icon: Users },
  { href: "/execution-companies", label: "شركات التنفيذ", icon: Building2 },
  { href: "/booking-requests", label: "طلبات الحجز", icon: ClipboardList },
  { href: "/execution-offers", label: "عروض شركات التنفيذ", icon: FileText },
  { href: "/passengers", label: "المسافرين", icon: UserCheck },
  { href: "/tickets", label: "التذاكر", icon: Ticket },
  { href: "/customer-payments", label: "مدفوعات العملاء", icon: CreditCard },
  { href: "/execution-payments", label: "مدفوعات شركات التنفيذ", icon: CreditCard },
  { href: "/modifications", label: "التعديلات والإلغاء", icon: RotateCcw },
  { href: "/reports", label: "التقارير", icon: BarChart3 },
];

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <Plane className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-bold">نظام الحجوزات</h1>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
            onClick={onNavClick}
          />
        ))}
      </nav>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden fixed top-0 right-0 z-50 flex items-center gap-2 border-b bg-background px-4 py-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" />}>
              <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <SidebarContent onNavClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <Plane className="h-5 w-5" />
        <span className="font-bold">نظام الحجوزات</span>
      </div>

      {/* Desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 border-l bg-background">
        <SidebarContent />
      </aside>
    </>
  );
}
