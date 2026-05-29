"use client";

import {
  BookOpen,
  CheckCircle2,
  CircleDot,
  Code2,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  Inbox,
  MessageSquarePlus,
  PanelLeft,
  RefreshCcw,
  Send,
  Star,
  Webhook,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { MarkdownRichEditor } from "@/components/github/markdown-rich-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildLineReference,
  parseLineReference,
  parsePatch,
  type DiffLine,
  type DiffLineSide,
  type ParsedDiffFile,
} from "@/lib/diff/parse";
import type {
  AppRepository,
  AppWebhookEvent,
  PullRequestReviewData,
  PublishGitHubActionType,
  PublishGitHubCommentTarget,
} from "@/types/github";

type DiffMode = "unified" | "split";

type LineSelection = {
  path: string;
  side: DiffLineSide;
  startLine: number;
  endLine: number;
};

type ParsedPullRequestFile = PullRequestReviewData["files"][number] & {
  parsed: ParsedDiffFile;
};

type JsonPayload<T> = T & {
  error?: string;
};

type LineNumberForSideParams = {
  line: DiffLine;
  side: DiffLineSide;
};

type LineClassesParams = {
  kind: DiffLine["kind"];
  selected: boolean;
};

type SelectionContainsParams = {
  selection: LineSelection | undefined;
  path: string;
  side: DiffLineSide;
  lineNumber: number | null;
};

type ExtractSnippetParams = {
  files: ParsedDiffFile[];
  selection: LineSelection | undefined;
};

type AppendLineReferenceParams = {
  body: string;
  reference: string;
  snippet: string;
};

type ScrollToFileParams = {
  index: number;
  filename: string;
};

type UpdateLineSelectionParams = {
  path: string;
  side: DiffLineSide;
  line: number;
};

type RenderDiffLineParams = {
  file: ParsedDiffFile;
  line: DiffLine;
};

const inputClass =
  "h-8 w-full rounded-md border border-[#d0d7de] bg-white px-2.5 text-sm text-[#24292f] outline-none transition placeholder:text-[#57606a] focus-visible:border-[#0969da] focus-visible:ring-2 focus-visible:ring-[#0969da]/20";
const labelClass = "grid gap-1.5 text-sm font-medium text-[#24292f]";
const panelClass = "gap-0 rounded-md border-[#d0d7de] bg-white py-0";
const panelHeaderClass =
  "flex items-center justify-between gap-3 border-b border-[#d0d7de] bg-[#f6f8fa] px-4 py-3";

async function readJson<T>(response: Response) {
  const payload = (await response.json()) as JsonPayload<T>;

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }

  return payload;
}

function repositoryFileId(index: number) {
  return `pr-file-${index}`;
}

function lineNumberForSide({ line, side }: LineNumberForSideParams) {
  return side === "LEFT" ? line.oldNumber : line.newNumber;
}

function lineClasses({ kind, selected }: LineClassesParams) {
  if (selected) {
    return "bg-primary/10";
  }

  if (kind === "add") {
    return "bg-emerald-500/10";
  }

  if (kind === "delete") {
    return "bg-red-500/10";
  }

  if (kind === "hunk") {
    return "bg-muted text-muted-foreground";
  }

  return "bg-background";
}

function normalizeSelection(selection: LineSelection) {
  return {
    ...selection,
    startLine: Math.min(selection.startLine, selection.endLine),
    endLine: Math.max(selection.startLine, selection.endLine),
  };
}

function selectionContains({
  selection,
  path,
  side,
  lineNumber,
}: SelectionContainsParams) {
  if (!selection || lineNumber === null) {
    return false;
  }

  const normalized = normalizeSelection(selection);

  return (
    normalized.path === path &&
    normalized.side === side &&
    lineNumber >= normalized.startLine &&
    lineNumber <= normalized.endLine
  );
}

function extractSnippet({ files, selection }: ExtractSnippetParams) {
  if (!selection) {
    return "";
  }

  const normalized = normalizeSelection(selection);
  const file = files.find((item) => item.filename === normalized.path);

  if (!file) {
    return "";
  }

  return file.lines
    .filter((line) => {
      const number = lineNumberForSide({ line, side: normalized.side });
      return (
        number !== null &&
        number >= normalized.startLine &&
        number <= normalized.endLine
      );
    })
    .map((line) => {
      const number = lineNumberForSide({ line, side: normalized.side });
      return `${String(number ?? "").padStart(4, " ")}  ${line.content}`;
    })
    .join("\n");
}

function appendLineReference({
  body,
  reference,
  snippet,
}: AppendLineReferenceParams) {
  if (!reference) {
    return body;
  }

  return `${body.trim()}\n\n---\n${reference}\n\n\`\`\`\n${snippet || "Selected lines"}\n\`\`\``;
}

export function GitHubWorkspace() {
  const queryClient = useQueryClient();
  const [repositoryInput, setRepositoryInput] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [installWebhook, setInstallWebhook] = useState(true);
  const [selectedRepositoryId, setSelectedRepositoryId] = useState("");
  const [actionType, setActionType] =
    useState<PublishGitHubActionType>("ISSUE");
  const [title, setTitle] = useState("");
  const [markdownBody, setMarkdownBody] = useState("");
  const [targetNumber, setTargetNumber] = useState("");
  const [targetSha, setTargetSha] = useState("");
  const [baseBranch, setBaseBranch] = useState("main");
  const [headBranch, setHeadBranch] = useState("");
  const [path, setPath] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [commentTarget, setCommentTarget] =
    useState<PublishGitHubCommentTarget>("issue");
  const [pullNumber, setPullNumber] = useState("");
  const [diffMode, setDiffMode] = useState<DiffMode>("unified");
  const [activeFile, setActiveFile] = useState("");
  const [selection, setSelection] = useState<LineSelection>();
  const [isSelecting, setIsSelecting] = useState(false);
  const [reviewBody, setReviewBody] = useState("");
  const [manualReference, setManualReference] = useState("");

  const repositoriesQuery = useQuery({
    queryKey: ["github-repositories"],
    queryFn: async () => {
      const data = await fetch("/api/github/repositories").then((response) =>
        readJson<{ repositories: AppRepository[] }>(response)
      );
      return data.repositories;
    },
  });

  const selectedRepository =
    repositoriesQuery.data?.find((repository) => repository.id === selectedRepositoryId) ??
    repositoriesQuery.data?.[0];

  useEffect(() => {
    const stopSelecting = () => setIsSelecting(false);
    window.addEventListener("mouseup", stopSelecting);
    return () => window.removeEventListener("mouseup", stopSelecting);
  }, []);

  const eventsQuery = useQuery({
    queryKey: ["github-events", selectedRepository?.id],
    enabled: Boolean(selectedRepository?.id),
    queryFn: async () => {
      const params = new URLSearchParams({
        repositoryId: selectedRepository?.id ?? "",
        take: "20",
      });
      const data = await fetch(`/api/github/events?${params}`).then((response) =>
        readJson<{ events: AppWebhookEvent[] }>(response)
      );
      return data.events;
    },
  });

  const pullRequestQuery = useQuery({
    queryKey: ["github-pr", selectedRepository?.id, pullNumber],
    enabled:
      Boolean(selectedRepository?.id) &&
      Number.isInteger(Number(pullNumber)) &&
      Number(pullNumber) > 0,
    queryFn: async () => {
      const params = new URLSearchParams({
        repositoryId: selectedRepository?.id ?? "",
        number: pullNumber,
      });
      return fetch(`/api/github/pull-requests?${params}`).then((response) =>
        readJson<PullRequestReviewData>(response)
      );
    },
  });

  const parsedFiles = useMemo<ParsedPullRequestFile[]>(
    () =>
      pullRequestQuery.data?.files.map((file) => ({
        ...file,
        parsed: parsePatch({ filename: file.filename, patch: file.patch }),
      })) ?? [],
    [pullRequestQuery.data?.files]
  );

  const selectionReference = selection
    ? buildLineReference(normalizeSelection(selection))
    : "";
  const parsedManualReference = parseLineReference({ input: manualReference });
  const displayedReference =
    selectionReference ||
    (parsedManualReference ? buildLineReference(parsedManualReference) : "");
  const snippet = extractSnippet({
    files: parsedFiles.map((file) => file.parsed),
    selection,
  });

  const registerRepository = useMutation({
    mutationFn: async () =>
      fetch("/api/github/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repository: repositoryInput,
          webhookUrl: webhookUrl || undefined,
          installWebhook,
        }),
      }).then((response) =>
        readJson<{ repository: AppRepository; webhookError?: string }>(response)
      ),
    onSuccess: async (data) => {
      setSelectedRepositoryId(data.repository.id);
      setRepositoryInput("");
      await queryClient.invalidateQueries({ queryKey: ["github-repositories"] });
    },
  });

  const publishAction = useMutation({
    mutationFn: async () =>
      fetch("/api/github/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repositoryId: selectedRepository?.id,
          type: actionType,
          title,
          body: markdownBody,
          targetNumber: targetNumber ? Number(targetNumber) : undefined,
          targetSha,
          baseBranch,
          headBranch,
          path,
          commitMessage,
          fileContent,
          commentTarget,
        }),
      }).then((response) =>
        readJson<{ githubUrl?: string; error?: string }>(response)
      ),
  });

  const publishReviewComment = useMutation({
    mutationFn: async () => {
      const normalized = selection ? normalizeSelection(selection) : undefined;
      const reference =
        selectionReference ||
        (parsedManualReference ? buildLineReference(parsedManualReference) : "");

      return fetch("/api/github/pull-requests/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repositoryId: selectedRepository?.id,
          pullNumber: Number(pullNumber),
          body: appendLineReference({ body: reviewBody, reference, snippet }),
          commitId: pullRequestQuery.data?.pullRequest.head.sha,
          path: normalized?.path ?? parsedManualReference?.path,
          side: normalized?.side ?? "RIGHT",
          line: normalized?.endLine ?? parsedManualReference?.endLine,
          startLine:
            normalized && normalized.startLine !== normalized.endLine
              ? normalized.startLine
              : parsedManualReference &&
                  parsedManualReference.startLine !== parsedManualReference.endLine
                ? parsedManualReference.startLine
                : undefined,
          startSide:
            normalized && normalized.startLine !== normalized.endLine
              ? normalized.side
              : undefined,
        }),
      }).then((response) =>
        readJson<{ comment?: { html_url: string }; error?: string }>(response)
      );
    },
    onSuccess: () => {
      setReviewBody("");
      setManualReference("");
      setSelection(undefined);
    },
  });

  function scrollToFile({ index, filename }: ScrollToFileParams) {
    setActiveFile(filename);
    document
      .getElementById(repositoryFileId(index))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function startLineSelection({ path, side, line }: UpdateLineSelectionParams) {
    setSelection({
      path,
      side,
      startLine: line,
      endLine: line,
    });
    setIsSelecting(true);
  }

  function extendLineSelection({ path, side, line }: UpdateLineSelectionParams) {
    if (!isSelecting) {
      return;
    }

    setSelection((current) => {
      if (!current || current.path !== path || current.side !== side) {
        return current;
      }

      return {
        ...current,
        endLine: line,
      };
    });
  }

  function renderUnifiedLine({ file, line }: RenderDiffLineParams) {
    if (line.kind === "hunk") {
      return (
        <tr
          key={line.id}
          className={lineClasses({ kind: line.kind, selected: false })}
        >
          <td colSpan={3} className="px-3 py-1 font-mono text-xs">
            {line.content}
          </td>
        </tr>
      );
    }

    const side = line.side ?? "RIGHT";
    const lineNumber = lineNumberForSide({ line, side });
    const selected = selectionContains({
      selection,
      path: file.filename,
      side,
      lineNumber,
    });

    return (
      <tr
        key={line.id}
        className={`${lineClasses({ kind: line.kind, selected })} select-none`}
        onMouseEnter={() => {
          if (lineNumber) {
            extendLineSelection({ path: file.filename, side, line: lineNumber });
          }
        }}
      >
        <td
          className="w-12 cursor-crosshair border-r px-2 py-0.5 text-right font-mono text-xs text-muted-foreground"
          onMouseDown={() => {
            if (lineNumber) {
              startLineSelection({ path: file.filename, side, line: lineNumber });
            }
          }}
        >
          {line.oldNumber ?? ""}
        </td>
        <td
          className="w-12 cursor-crosshair border-r px-2 py-0.5 text-right font-mono text-xs text-muted-foreground"
          onMouseDown={() => {
            if (lineNumber) {
              startLineSelection({ path: file.filename, side, line: lineNumber });
            }
          }}
        >
          {line.newNumber ?? ""}
        </td>
        <td className="px-3 py-0.5 font-mono text-xs whitespace-pre">
          {line.kind === "add" ? "+" : line.kind === "delete" ? "-" : " "}
          {line.content}
        </td>
      </tr>
    );
  }

  function renderSplitLine({ file, line }: RenderDiffLineParams) {
    if (line.kind === "hunk") {
      return (
        <tr
          key={line.id}
          className={lineClasses({ kind: line.kind, selected: false })}
        >
          <td colSpan={4} className="px-3 py-1 font-mono text-xs">
            {line.content}
          </td>
        </tr>
      );
    }

    const leftNumber = line.oldNumber;
    const rightNumber = line.newNumber;
    const leftSelected = selectionContains({
      selection,
      path: file.filename,
      side: "LEFT",
      lineNumber: leftNumber,
    });
    const rightSelected = selectionContains({
      selection,
      path: file.filename,
      side: "RIGHT",
      lineNumber: rightNumber,
    });

    return (
      <tr key={line.id} className="select-none">
        <td
          className={`w-12 cursor-crosshair border-r px-2 py-0.5 text-right font-mono text-xs text-muted-foreground ${leftSelected ? "bg-primary/10" : line.kind === "delete" ? "bg-red-500/10" : ""}`}
          onMouseDown={() => {
            if (leftNumber) {
              startLineSelection({
                path: file.filename,
                side: "LEFT",
                line: leftNumber,
              });
            }
          }}
          onMouseEnter={() => {
            if (leftNumber) {
              extendLineSelection({
                path: file.filename,
                side: "LEFT",
                line: leftNumber,
              });
            }
          }}
        >
          {leftNumber ?? ""}
        </td>
        <td
          className={`w-1/2 border-r px-3 py-0.5 font-mono text-xs whitespace-pre ${leftSelected ? "bg-primary/10" : line.kind === "delete" ? "bg-red-500/10" : ""}`}
        >
          {line.kind === "add" ? "" : line.content}
        </td>
        <td
          className={`w-12 cursor-crosshair border-r px-2 py-0.5 text-right font-mono text-xs text-muted-foreground ${rightSelected ? "bg-primary/10" : line.kind === "add" ? "bg-emerald-500/10" : ""}`}
          onMouseDown={() => {
            if (rightNumber) {
              startLineSelection({
                path: file.filename,
                side: "RIGHT",
                line: rightNumber,
              });
            }
          }}
          onMouseEnter={() => {
            if (rightNumber) {
              extendLineSelection({
                path: file.filename,
                side: "RIGHT",
                line: rightNumber,
              });
            }
          }}
        >
          {rightNumber ?? ""}
        </td>
        <td
          className={`w-1/2 px-3 py-0.5 font-mono text-xs whitespace-pre ${rightSelected ? "bg-primary/10" : line.kind === "add" ? "bg-emerald-500/10" : ""}`}
        >
          {line.kind === "delete" ? "" : line.content}
        </td>
      </tr>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-6 px-4 py-6 text-[#24292f] lg:grid-cols-[280px_minmax(0,1fr)_320px]">
      <aside className="grid gap-4 lg:sticky lg:top-[72px] lg:self-start">
        <Card className={panelClass}>
          <div className={panelHeaderClass}>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <BookOpen className="size-4 text-[#57606a]" />
              Repositories
            </div>
            <Badge variant="outline" className="border-[#d0d7de] bg-white">
              {repositoriesQuery.data?.length ?? 0}
            </Badge>
          </div>
          <div className="grid gap-3 p-3">
            <Label className={labelClass}>
              Add repository
              <Input
                className={inputClass}
                placeholder="owner/repo"
                value={repositoryInput}
                onChange={(event) => setRepositoryInput(event.target.value)}
              />
            </Label>
            <Label className={labelClass}>
              Webhook URL
              <Input
                className={inputClass}
                placeholder="https://app.example.com/api/github/webhook"
                value={webhookUrl}
                onChange={(event) => setWebhookUrl(event.target.value)}
              />
            </Label>
            <div className="flex items-center justify-between gap-2">
              <Label className="flex h-8 items-center gap-2 text-sm text-[#57606a]">
                <Checkbox
                  checked={installWebhook}
                  onCheckedChange={(checked) =>
                    setInstallWebhook(checked === true)
                  }
                />
                Install webhook
              </Label>
              <Button
                type="button"
                className="bg-[#1f883d] text-white hover:bg-[#1a7f37]"
                disabled={!repositoryInput || registerRepository.isPending}
                onClick={() => registerRepository.mutate()}
              >
                <GitBranch data-icon="inline-start" />
                Add
              </Button>
            </div>
            {registerRepository.data?.webhookError ? (
              <div className="rounded-md border border-[#cf222e]/30 bg-[#ffebe9] p-3 text-sm text-[#cf222e]">
                {registerRepository.data.webhookError}
              </div>
            ) : null}
          </div>
          <div className="border-t border-[#d0d7de] p-2">
            {repositoriesQuery.data?.length ? (
              repositoriesQuery.data.map((repository) => (
                <button
                  key={repository.id}
                  type="button"
                  className={`flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-sm transition hover:bg-[#f6f8fa] ${
                    selectedRepository?.id === repository.id
                      ? "bg-[#ddf4ff]"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedRepositoryId(repository.id);
                    setBaseBranch(repository.defaultBranch ?? "main");
                  }}
                >
                  <span className="min-w-0 truncate font-semibold text-[#0969da]">
                    {repository.fullName}
                  </span>
                  <span className="rounded-full border border-[#d0d7de] px-2 py-0.5 text-xs text-[#57606a]">
                    {repository.webhookActive ? "webhook" : "local"}
                  </span>
                </button>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-[#d0d7de] p-3 text-sm text-[#57606a]">
                Register a repository to start the feed.
              </div>
            )}
          </div>
        </Card>

        <Card className={panelClass}>
          <div className={panelHeaderClass}>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Webhook className="size-4 text-[#57606a]" />
              Webhook endpoint
            </div>
          </div>
          <div className="grid gap-2 p-3 text-sm text-[#57606a]">
            <code className="break-all rounded-md bg-[#f6f8fa] px-2 py-1 text-xs text-[#24292f]">
              /api/github/webhook
            </code>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#1f883d]" />
              Signature verification enabled
            </div>
          </div>
        </Card>
      </aside>

      <main className="grid min-w-0 gap-4">
        <Card className={panelClass}>
          <div className={panelHeaderClass}>
            <div>
              <div className="text-sm font-semibold">Home feed</div>
              <div className="text-xs text-[#57606a]">
                Repository activity from webhooks
              </div>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => eventsQuery.refetch()}
              aria-label="Refresh webhook events"
            >
              <RefreshCcw />
            </Button>
          </div>
          <div className="divide-y divide-[#d0d7de]">
            {eventsQuery.data?.length ? (
              eventsQuery.data.map((event) => (
                <a
                  key={event.id}
                  href={event.htmlUrl ?? event.repository?.htmlUrl ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="grid grid-cols-[32px_1fr] gap-3 px-4 py-4 transition hover:bg-[#f6f8fa]"
                >
                  <div className="flex size-8 items-center justify-center rounded-full border border-[#d0d7de] bg-[#f6f8fa]">
                    {event.event === "pull_request" ? (
                      <GitPullRequest className="size-4 text-[#8250df]" />
                    ) : event.event === "issues" ? (
                      <CircleDot className="size-4 text-[#1f883d]" />
                    ) : event.event.includes("comment") ? (
                      <MessageSquarePlus className="size-4 text-[#0969da]" />
                    ) : (
                      <GitCommitHorizontal className="size-4 text-[#57606a]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-semibold">
                        {event.sender ?? "github"}
                      </span>
                      <span className="text-[#57606a]">
                        {event.summary ?? event.action ?? "received"}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-[#d0d7de] bg-white text-[#57606a]"
                      >
                        {event.event}
                      </Badge>
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold text-[#0969da]">
                      {event.title ?? event.repository?.fullName ?? "Webhook event"}
                    </div>
                    <div className="mt-1 text-xs text-[#57606a]">
                      {event.repository?.fullName ?? selectedRepository?.fullName}
                    </div>
                  </div>
                </a>
              ))
            ) : (
              <div className="grid place-items-center gap-2 px-6 py-12 text-center">
                <Inbox className="size-8 text-[#57606a]" />
                <div className="text-sm font-semibold">No activity yet</div>
                <div className="max-w-sm text-sm text-[#57606a]">
                  Once GitHub sends push, PR, issue, or comment webhooks, they
                  will appear here as a feed.
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className={panelClass}>
          <div className={panelHeaderClass}>
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <GitPullRequest className="size-4 text-[#8250df]" />
                Pull request review
              </div>
              <div className="text-xs text-[#57606a]">
                Browse files, switch diff mode, and comment on selected lines
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={diffMode === "unified" ? "default" : "outline"}
                onClick={() => setDiffMode("unified")}
              >
                Unified
              </Button>
              <Button
                type="button"
                size="sm"
                variant={diffMode === "split" ? "default" : "outline"}
                onClick={() => setDiffMode("split")}
              >
                Split
              </Button>
            </div>
          </div>

          <div className="grid gap-4 p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_120px]">
              <Label className={labelClass}>
                Repository
                <Select
                  value={selectedRepository?.id ?? ""}
                  onValueChange={setSelectedRepositoryId}
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Repository" />
                  </SelectTrigger>
                  <SelectContent>
                    {repositoriesQuery.data?.map((repository) => (
                      <SelectItem key={repository.id} value={repository.id}>
                        {repository.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Label>
              <Label className={labelClass}>
                PR number
                <Input
                  className={inputClass}
                  value={pullNumber}
                  onChange={(event) => setPullNumber(event.target.value)}
                  placeholder="1"
                />
              </Label>
            </div>

            {pullRequestQuery.data ? (
              <div className="flex items-center justify-between gap-3 rounded-md border border-[#d0d7de] bg-[#f6f8fa] p-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-semibold">
                    {pullRequestQuery.data.pullRequest.title}
                  </div>
                  <div className="text-[#57606a]">
                    {pullRequestQuery.data.pullRequest.base.ref} {"<-"}{" "}
                    {pullRequestQuery.data.pullRequest.head.ref}
                  </div>
                </div>
                <Badge variant="secondary">
                  <CheckCircle2 />
                  {pullRequestQuery.data.files.length} files
                </Badge>
              </div>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-[220px_1fr]">
              <aside className="xl:sticky xl:top-[72px] xl:self-start">
                <div className="overflow-hidden rounded-md border border-[#d0d7de]">
                  <div className="flex items-center gap-2 border-b border-[#d0d7de] bg-[#f6f8fa] px-3 py-2 text-sm font-semibold">
                    <PanelLeft className="size-4 text-[#57606a]" />
                    Files changed
                  </div>
                  <div className="max-h-[480px] overflow-auto p-2">
                    {parsedFiles.length ? (
                      parsedFiles.map((file, index) => (
                        <button
                          key={file.filename}
                          type="button"
                          className={`grid w-full gap-1 rounded-md px-2 py-2 text-left text-xs transition hover:bg-[#f6f8fa] ${
                            activeFile === file.filename ? "bg-[#ddf4ff]" : ""
                          }`}
                          onClick={() =>
                            scrollToFile({ index, filename: file.filename })
                          }
                        >
                          <span className="truncate font-mono font-semibold text-[#0969da]">
                            {file.filename}
                          </span>
                          <span className="text-[#57606a]">
                            +{file.additions} -{file.deletions}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-[#57606a]">
                        Load a PR to see changed files.
                      </div>
                    )}
                  </div>
                </div>
              </aside>

              <div className="grid min-w-0 gap-4">
                <div className="grid gap-3 rounded-md border border-[#d0d7de] bg-[#f6f8fa] p-3">
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
                    <Label className={labelClass}>
                      Line reference
                      <Input
                        className={inputClass}
                        value={selectionReference || manualReference}
                        onChange={(event) => {
                          setSelection(undefined);
                          setManualReference(event.target.value);
                        }}
                        placeholder="src/app/page.tsx:L10-L18"
                      />
                    </Label>
                    <div className={labelClass}>
                      Review comment
                      <MarkdownRichEditor
                        id="github-review-comment"
                        value={reviewBody}
                        onChange={setReviewBody}
                        placeholder="Write a Markdown review comment..."
                        minHeight="min-h-28"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                    {displayedReference ? (
                      <div className="overflow-hidden rounded-md border border-[#d0d7de] bg-white">
                        <div className="border-b border-[#d0d7de] bg-[#f6f8fa] px-3 py-2 font-mono text-xs text-[#57606a]">
                          {displayedReference}
                        </div>
                        <pre className="max-h-48 overflow-auto p-3 text-xs leading-5 text-[#24292f]">
                          {snippet || "Selected lines"}
                        </pre>
                      </div>
                    ) : (
                      <div className="rounded-md border border-dashed border-[#d0d7de] bg-white p-3 text-sm text-[#57606a]">
                        No line selected
                      </div>
                    )}
                    <Button
                      type="button"
                      className="bg-[#1f883d] text-white hover:bg-[#1a7f37]"
                      disabled={
                        !selectedRepository ||
                        !pullRequestQuery.data ||
                        !reviewBody ||
                        (!selection && !parsedManualReference) ||
                        publishReviewComment.isPending
                      }
                      onClick={() => publishReviewComment.mutate()}
                    >
                      <GitCommitHorizontal data-icon="inline-start" />
                      Comment
                    </Button>
                  </div>
                  {publishReviewComment.error ? (
                    <div className="rounded-md border border-[#cf222e]/30 bg-[#ffebe9] p-3 text-sm text-[#cf222e]">
                      {publishReviewComment.error.message}
                    </div>
                  ) : null}
                  {publishReviewComment.data?.comment?.html_url ? (
                    <a
                      className="text-sm font-medium text-[#0969da] underline"
                      href={publishReviewComment.data.comment.html_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open review comment
                    </a>
                  ) : null}
                </div>

                {pullRequestQuery.isError ? (
                  <div className="rounded-md border border-[#cf222e]/30 bg-[#ffebe9] p-3 text-sm text-[#cf222e]">
                    {pullRequestQuery.error.message}
                  </div>
                ) : null}

                {parsedFiles.map((file, index) => (
                  <section
                    key={file.filename}
                    id={repositoryFileId(index)}
                    className="scroll-mt-20 overflow-hidden rounded-md border border-[#d0d7de] bg-white"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d0d7de] bg-[#f6f8fa] px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate font-mono text-sm font-semibold">
                          {file.filename}
                        </div>
                        <div className="text-xs text-[#57606a]">
                          {file.status} · +{file.additions} -{file.deletions}
                        </div>
                      </div>
                      <Badge variant="outline">{file.changes} changes</Badge>
                    </div>
                    {file.parsed.lines.length ? (
                      <div className="overflow-auto">
                        <table className="w-full border-collapse text-left">
                          <tbody>
                            {file.parsed.lines.map((line) =>
                              diffMode === "split"
                                ? renderSplitLine({ file: file.parsed, line })
                                : renderUnifiedLine({ file: file.parsed, line })
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 text-sm text-[#57606a]">
                        GitHub did not include a textual patch for this file.
                      </div>
                    )}
                  </section>
                ))}

                {parsedFiles.length ? null : (
                  <div className="rounded-md border border-dashed border-[#d0d7de] bg-white p-6 text-sm text-[#57606a]">
                    Enter a PR number to load changed files and begin review.
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </main>

      <aside className="grid gap-4 lg:sticky lg:top-[72px] lg:self-start">
        <Card className={panelClass}>
          <div className={panelHeaderClass}>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquarePlus className="size-4 text-[#57606a]" />
              New
            </div>
            <Badge variant="outline" className="border-[#d0d7de] bg-white">
              Markdown
            </Badge>
          </div>
          <div className="grid gap-3 p-3">
            <div className="grid gap-3">
              <Label className={labelClass}>
                Type
                <Select
                  value={actionType}
                  onValueChange={(value) =>
                    setActionType(value as PublishGitHubActionType)
                  }
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ISSUE">Issue</SelectItem>
                    <SelectItem value="PULL_REQUEST">Pull request</SelectItem>
                    <SelectItem value="COMMENT">Comment</SelectItem>
                    <SelectItem value="COMMIT">Commit markdown file</SelectItem>
                  </SelectContent>
                </Select>
              </Label>
              <Label className={labelClass}>
                Title
                <Input
                  className={inputClass}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Issue or PR title"
                />
              </Label>
            </div>

            {actionType === "PULL_REQUEST" ? (
              <div className="grid gap-3">
                <Label className={labelClass}>
                  Base branch
                  <Input
                    className={inputClass}
                    value={baseBranch}
                    onChange={(event) => setBaseBranch(event.target.value)}
                  />
                </Label>
                <Label className={labelClass}>
                  Head branch
                  <Input
                    className={inputClass}
                    value={headBranch}
                    onChange={(event) => setHeadBranch(event.target.value)}
                    placeholder="feature-branch"
                  />
                </Label>
              </div>
            ) : null}

            {actionType === "COMMENT" ? (
              <div className="grid gap-3">
                <Label className={labelClass}>
                  Target
                  <Select
                    value={commentTarget}
                    onValueChange={(value) =>
                      setCommentTarget(value as PublishGitHubCommentTarget)
                    }
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="issue">Issue or PR number</SelectItem>
                      <SelectItem value="commit">Commit SHA</SelectItem>
                    </SelectContent>
                  </Select>
                </Label>
                {commentTarget === "issue" ? (
                  <Label className={labelClass}>
                    Number
                    <Input
                      className={inputClass}
                      value={targetNumber}
                      onChange={(event) => setTargetNumber(event.target.value)}
                      placeholder="42"
                    />
                  </Label>
                ) : (
                  <Label className={labelClass}>
                    Commit SHA
                    <Input
                      className={inputClass}
                      value={targetSha}
                      onChange={(event) => setTargetSha(event.target.value)}
                    />
                  </Label>
                )}
              </div>
            ) : null}

            {actionType === "COMMIT" ? (
              <div className="grid gap-3">
                <Label className={labelClass}>
                  Branch
                  <Input
                    className={inputClass}
                    value={headBranch}
                    onChange={(event) => setHeadBranch(event.target.value)}
                    placeholder={selectedRepository?.defaultBranch ?? "main"}
                  />
                </Label>
                <Label className={labelClass}>
                  Markdown path
                  <Input
                    className={inputClass}
                    value={path}
                    onChange={(event) => setPath(event.target.value)}
                    placeholder="docs/note.md"
                  />
                </Label>
                <Label className={labelClass}>
                  Commit message
                  <Input
                    className={inputClass}
                    value={commitMessage}
                    onChange={(event) => setCommitMessage(event.target.value)}
                    placeholder="docs: update note"
                  />
                </Label>
                <div className={labelClass}>
                  File content
                  <MarkdownRichEditor
                    id="github-file-content"
                    value={fileContent}
                    onChange={setFileContent}
                    placeholder="# Markdown content"
                    minHeight="min-h-52"
                  />
                </div>
              </div>
            ) : (
              <div className={labelClass}>
                Markdown body
                <MarkdownRichEditor
                  id="github-action-body"
                  value={markdownBody}
                  onChange={setMarkdownBody}
                  placeholder="Write GitHub-flavored Markdown..."
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="bg-[#1f883d] text-white hover:bg-[#1a7f37]"
                disabled={!selectedRepository || publishAction.isPending}
                onClick={() => publishAction.mutate()}
              >
                <Send data-icon="inline-start" />
                Publish
              </Button>
              {publishAction.data?.githubUrl ? (
                <a
                  className="text-sm font-medium text-[#0969da] underline"
                  href={publishAction.data.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open
                </a>
              ) : null}
            </div>
            {publishAction.error ? (
              <div className="rounded-md border border-[#cf222e]/30 bg-[#ffebe9] p-3 text-sm text-[#cf222e]">
                {publishAction.error.message}
              </div>
            ) : null}
          </div>
        </Card>

        <Card className={panelClass}>
          <div className={panelHeaderClass}>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Star className="size-4 text-[#57606a]" />
              Shortcuts
            </div>
          </div>
          <div className="grid gap-2 p-3 text-sm">
            <a className="text-[#0969da] hover:underline" href="#top">
              Dashboard
            </a>
            <button
              type="button"
              className="text-left text-[#0969da] hover:underline"
              onClick={() => eventsQuery.refetch()}
            >
              Refresh feed
            </button>
            <div className="flex items-center gap-2 text-[#57606a]">
              <Code2 className="size-4" />
              {selectedRepository?.fullName ?? "No repository selected"}
            </div>
          </div>
        </Card>
      </aside>
    </div>
  );
}
