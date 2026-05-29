export type DiffLineSide = "LEFT" | "RIGHT";
export type DiffLineKind = "context" | "add" | "delete" | "hunk";

export type DiffLine = {
  id: string;
  kind: DiffLineKind;
  content: string;
  oldNumber: number | null;
  newNumber: number | null;
  side: DiffLineSide | null;
};

export type ParsedDiffFile = {
  filename: string;
  patch?: string;
  lines: DiffLine[];
};

export type ParsePatchParams = {
  filename: string;
  patch?: string;
};

const HUNK_RE = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

export function parsePatch({
  filename,
  patch,
}: ParsePatchParams): ParsedDiffFile {
  if (!patch) {
    return { filename, patch, lines: [] };
  }

  let oldLine = 0;
  let newLine = 0;

  const lines = patch.split("\n").map((line, index): DiffLine => {
    const hunk = line.match(HUNK_RE);

    if (hunk) {
      oldLine = Number(hunk[1]);
      newLine = Number(hunk[3]);

      return {
        id: `${filename}-hunk-${index}`,
        kind: "hunk",
        content: line,
        oldNumber: null,
        newNumber: null,
        side: null,
      };
    }

    if (line.startsWith("+")) {
      const current = newLine;
      newLine += 1;

      return {
        id: `${filename}-right-${current}-${index}`,
        kind: "add",
        content: line.slice(1),
        oldNumber: null,
        newNumber: current,
        side: "RIGHT",
      };
    }

    if (line.startsWith("-")) {
      const current = oldLine;
      oldLine += 1;

      return {
        id: `${filename}-left-${current}-${index}`,
        kind: "delete",
        content: line.slice(1),
        oldNumber: current,
        newNumber: null,
        side: "LEFT",
      };
    }

    const currentOld = oldLine;
    const currentNew = newLine;
    oldLine += 1;
    newLine += 1;

    return {
      id: `${filename}-context-${currentNew}-${index}`,
      kind: "context",
      content: line.startsWith(" ") ? line.slice(1) : line,
      oldNumber: currentOld,
      newNumber: currentNew,
      side: "RIGHT",
    };
  });

  return { filename, patch, lines };
}

export type LineReference = {
  path: string;
  startLine: number;
  endLine: number;
};

export type ParseLineReferenceParams = {
  input: string;
};

export type BuildLineReferenceParams = LineReference;

export function parseLineReference({
  input,
}: ParseLineReferenceParams): LineReference | undefined {
  const trimmed = input.trim();
  const match = trimmed.match(/^(.+?)(?::|#)L(\d+)(?:-L?(\d+))?$/);

  if (!match) {
    return undefined;
  }

  const startLine = Number(match[2]);
  const endLine = Number(match[3] ?? match[2]);

  if (!Number.isInteger(startLine) || !Number.isInteger(endLine)) {
    return undefined;
  }

  return {
    path: match[1],
    startLine: Math.min(startLine, endLine),
    endLine: Math.max(startLine, endLine),
  };
}

export function buildLineReference({
  path,
  startLine,
  endLine,
}: BuildLineReferenceParams) {
  return `${path}:L${startLine}${startLine === endLine ? "" : `-L${endLine}`}`;
}
