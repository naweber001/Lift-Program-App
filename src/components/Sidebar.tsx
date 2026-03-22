"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/portfolio", label: "Portfolio", icon: "💼" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
  { href: "/recommendations", label: "Recommendations", icon: "💡" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[var(--card-bg)] border-r border-[var(--card-border)] flex flex-col z-50">
      <div className="p-6 border-b border-[var(--card-border)]">
        <h1 className="text-xl font-bold text-[var(--accent)]">InvestTracker</h1>
        <p className="text-xs text-[var(--muted)] mt-1">Portfolio Analytics</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/5"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-[var(--card-border)]">
        <p className="text-xs text-[var(--muted)]">Data from Alpha Vantage</p>
      </div>
    </aside>
  );
}
