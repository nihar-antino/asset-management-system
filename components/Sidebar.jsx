"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/assets", label: "Assets" },
  { href: "/employees", label: "Employees" },
  { href: "/assign", label: "Assign / Return" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-surface min-h-screen flex flex-col">
      <div className="px-5 py-6 border-b border-border">
        <p className="font-semibold text-[15px] leading-tight">Asset Registry</p>
        <p className="text-xs text-ink-soft mt-0.5">IT equipment tracking</p>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-white"
                  : "text-ink-soft hover:bg-bg hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-border text-xs text-ink-soft">
        Internal tool &middot; v1.0
      </div>
    </aside>
  );
}
