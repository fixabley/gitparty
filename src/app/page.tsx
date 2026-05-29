import {
  Bell,
  CircleDot,
  Code2,
  GitPullRequest,
  Inbox,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";

import { GitHubWorkspace } from "@/components/github/github-workspace";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main id="top" className="min-h-screen bg-[#f6f8fa] text-[#24292f]">
      <header className="sticky top-0 z-40 border-b border-[#57606a] bg-[#24292f] text-white">
        <div className="mx-auto flex min-h-14 w-full max-w-[1280px] items-center gap-3 px-4">
          <Code2 className="size-8 shrink-0" />
          <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-md border border-[#57606a] bg-[#24292f] px-2.5 py-1.5 text-sm text-[#c9d1d9] md:flex">
            <Search className="size-4 shrink-0" />
            <span className="truncate">Search or jump to...</span>
          </div>
          <nav className="hidden items-center gap-4 text-sm font-semibold lg:flex">
            <a className="hover:text-[#c9d1d9]" href="#top">
              Dashboard
            </a>
            <a className="hover:text-[#c9d1d9]" href="#top">
              Pull requests
            </a>
            <a className="hover:text-[#c9d1d9]" href="#top">
              Issues
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/api/auth/signin">Sign in</Link>
            </Button>
            <Button
              asChild
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/api/auth/session" aria-label="Session JSON">
                <Inbox />
              </Link>
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
              aria-label="Create"
            >
              <Plus />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
              aria-label="Notifications"
            >
              <Bell />
            </Button>
          </div>
        </div>
      </header>

      <div className="border-b border-[#d0d7de] bg-white">
        <div className="mx-auto flex w-full max-w-[1280px] items-center gap-6 overflow-x-auto px-4 text-sm">
          <a className="flex h-12 shrink-0 items-center gap-2 border-b-2 border-[#fd8c73] font-semibold">
            <Inbox className="size-4" />
            Feed
          </a>
          <a className="flex h-12 shrink-0 items-center gap-2 text-[#57606a]">
            <GitPullRequest className="size-4" />
            Pull requests
          </a>
          <a className="flex h-12 shrink-0 items-center gap-2 text-[#57606a]">
            <CircleDot className="size-4" />
            Issues
          </a>
        </div>
      </div>

      <GitHubWorkspace />
    </main>
  );
}
