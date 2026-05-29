"use client";

import { useQuery } from "@tanstack/react-query";
import { RefreshCcw, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppStore } from "@/store/app-store";

export function StackStatus() {
  const launches = useAppStore((state) => state.launches);
  const incrementLaunches = useAppStore((state) => state.incrementLaunches);
  const resetLaunches = useAppStore((state) => state.resetLaunches);

  const status = useQuery({
    queryKey: ["starter-status"],
    queryFn: async () => ({
      checkedAt: new Date().toLocaleTimeString(),
      ready: true,
    }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Runtime</CardTitle>
        <CardDescription>TanStack Query and Zustand are active.</CardDescription>
        <CardAction>
          <Badge variant={status.data?.ready ? "secondary" : "outline"}>
            {status.isFetching ? "Syncing" : "Ready"}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">Local launch count</p>
          <p className="text-3xl font-semibold tracking-normal">{launches}</p>
          <p className="text-xs text-muted-foreground">
            Last query check: {status.data?.checkedAt ?? "pending"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={incrementLaunches}>
            <RefreshCcw data-icon="inline-start" />
            Increment
          </Button>
          <Button type="button" variant="outline" onClick={resetLaunches}>
            <RotateCcw data-icon="inline-start" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
