"use client";

import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from "@lexical/markdown";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { useEffect, useMemo, useRef } from "react";

type MarkdownRichEditorProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
};

type MarkdownSyncPluginProps = {
  value: string;
  onChange: (value: string) => void;
};

const editorTheme = {
  code: "my-2 block overflow-auto rounded-md border border-border bg-muted p-3 font-mono text-xs leading-5",
  heading: {
    h1: "mb-2 border-b border-border pb-1 text-2xl font-semibold leading-8",
    h2: "mb-2 border-b border-border pb-1 text-xl font-semibold leading-7",
    h3: "mb-2 text-base font-semibold leading-6",
  },
  link: "text-primary underline underline-offset-2",
  list: {
    listitem: "my-1",
    nested: {
      listitem: "my-1",
    },
    ol: "my-2 list-decimal pl-5",
    ul: "my-2 list-disc pl-5",
  },
  paragraph: "my-1 min-h-5",
  quote:
    "my-2 border-l-4 border-border pl-3 text-muted-foreground",
  text: {
    bold: "font-semibold",
    code: "rounded bg-muted px-1 py-0.5 font-mono text-[0.92em]",
    italic: "italic",
    strikethrough: "line-through",
  },
};

function MarkdownSyncPlugin({ value, onChange }: MarkdownSyncPluginProps) {
  const [editor] = useLexicalComposerContext();
  const lastMarkdownRef = useRef(value);

  useEffect(() => {
    if (value === lastMarkdownRef.current) {
      return;
    }

    editor.update(() => {
      $convertFromMarkdownString(value, TRANSFORMERS, undefined, true);
    });
    lastMarkdownRef.current = value;
  }, [editor, value]);

  return (
    <OnChangePlugin
      ignoreSelectionChange
      onChange={(editorState) => {
        editorState.read(() => {
          const nextMarkdown = $convertToMarkdownString(
            TRANSFORMERS,
            undefined,
            true
          );

          lastMarkdownRef.current = nextMarkdown;
          onChange(nextMarkdown);
        });
      }}
    />
  );
}

export function MarkdownRichEditor({
  id,
  value,
  onChange,
  placeholder = "Write Markdown...",
  minHeight = "min-h-40",
}: MarkdownRichEditorProps) {
  const initialConfig = useMemo(
    () => ({
      editorState: () =>
        $convertFromMarkdownString(value, TRANSFORMERS, undefined, true),
      namespace: id,
      nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, LinkNode],
      onError(error: Error) {
        throw error;
      },
      theme: editorTheme,
    }),
    [id, value]
  );

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative rounded-md border border-border bg-card focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              id={id}
              aria-label={placeholder}
              aria-placeholder={placeholder}
              className={`${minHeight} max-h-[520px] overflow-auto px-3 py-2 text-sm font-normal leading-6 text-foreground outline-none`}
              placeholder={
                <div className="pointer-events-none absolute left-3 top-2 text-sm font-normal text-muted-foreground">
                  {placeholder}
                </div>
              }
              spellCheck
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <MarkdownSyncPlugin value={value} onChange={onChange} />
      </div>
    </LexicalComposer>
  );
}
