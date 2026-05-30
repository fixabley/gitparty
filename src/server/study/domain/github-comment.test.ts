import { describe, expect, it } from "vitest";

import { formatPlatformAuthoredGitHubComment } from "@/server/study/domain/github-comment";

describe("GitHub comment formatting", () => {
  it("marks platform comments as Reverseed-authored with party nickname link", () => {
    expect(
      formatPlatformAuthoredGitHubComment({
        nickname: "river",
        platformUrl: "https://reverseed.test/parties/frontend#activity-1",
        bodyMarkdown: "Looks good to me.",
      })
    ).toBe(
      [
        "Looks good to me.",
        "",
        "---",
        "Posted from Reverseed by [river](https://reverseed.test/parties/frontend#activity-1).",
      ].join("\n")
    );
  });
});
