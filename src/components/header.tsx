"use client";

import Link from "next/link";
import { UserStatus } from "@/components/user-status";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="relative z-10 border-b border-border/40">
      <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          founder<span className="text-primary">tea</span> 🍵
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/companies">
            <Button variant="ghost" size="sm">
              Companies
            </Button>
          </Link>
          <UserStatus />
          <Button variant="ghost" size="sm">
            About
          </Button>
        </div>
      </div>
    </header>
  );
}
