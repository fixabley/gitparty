export type PlatformCommentSignature = {
  nickname: string;
  platformUrl: string;
  bodyMarkdown: string;
};

export function formatPlatformAuthoredGitHubComment({
  nickname,
  platformUrl,
  bodyMarkdown,
}: PlatformCommentSignature) {
  return [
    bodyMarkdown.trim(),
    "",
    "---",
    `Posted from Reverseed by [${nickname}](${platformUrl}).`,
  ].join("\n");
}
