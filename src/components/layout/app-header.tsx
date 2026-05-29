import {
  Bell,
  Code2,
  GitPullRequest,
  Home,
  Plus,
  Search,
  Users,
} from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 text-foreground backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex min-h-14 w-full max-w-[1280px] items-center gap-3 px-4">
        <Button asChild variant="ghost" className="-ml-2 gap-2 px-2">
          <Link href="/">
            <Code2 data-icon="inline-start" />
            <span className="font-semibold">Reverseed</span>
          </Link>
        </Button>

        <div className="relative hidden min-w-0 flex-1 md:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            readOnly
            className="pl-8 shadow-none"
            placeholder="Search or jump to..."
          />
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          <Button asChild size="sm" variant="ghost">
            <Link href="/">
              <Home data-icon="inline-start" />
              Home
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href="/#parties">
              <Users data-icon="inline-start" />
              Parties
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href="/#pull-requests">
              <GitPullRequest data-icon="inline-start" />
              Pull requests
            </Link>
          </Button>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <Button asChild size="sm" variant="ghost">
            <Link href="/api/auth/signin">Sign in</Link>
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Create party"
          >
            <Plus />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Notifications"
          >
            <Bell />
          </Button>
        </div>
      </div>
    </header>
  );
}
