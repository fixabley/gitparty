import { describe, expect, it } from "vitest";

import {
  canDiscoverParty,
  canJoinMiniParty,
  canRevealGitHubActivityLink,
  canRevealGitHubIdentity,
  nextRepositoryRegistrationStatus,
} from "@/server/study/domain/policies";

describe("study domain policies", () => {
  it("reveals GitHub identity to self", () => {
    expect(
      canRevealGitHubIdentity({
        viewerUserId: "user-a",
        subjectUserId: "user-a",
        areFriends: false,
        subjectMarkedViewerCloseFriend: false,
      })
    ).toBe(true);
  });

  it("reveals GitHub identity when the subject marked the viewer as a close friend", () => {
    expect(
      canRevealGitHubIdentity({
        viewerUserId: "user-b",
        subjectUserId: "user-a",
        areFriends: true,
        subjectMarkedViewerCloseFriend: true,
      })
    ).toBe(true);
  });

  it("does not reveal GitHub identity for a one-way close-friend mark without accepted friendship", () => {
    expect(
      canRevealGitHubIdentity({
        viewerUserId: "user-b",
        subjectUserId: "user-a",
        areFriends: false,
        subjectMarkedViewerCloseFriend: true,
      })
    ).toBe(false);
  });

  it("reveals GitHub activity links to authors, repository registrants, and close friends", () => {
    expect(
      canRevealGitHubActivityLink({
        viewerUserId: "author",
        activityAuthorUserId: "author",
        repositoryRegisteredByUserId: "owner",
        areFriendsWithActor: false,
        actorMarkedViewerCloseFriend: false,
      })
    ).toBe(true);

    expect(
      canRevealGitHubActivityLink({
        viewerUserId: "owner",
        activityAuthorUserId: "author",
        repositoryRegisteredByUserId: "owner",
        areFriendsWithActor: false,
        actorMarkedViewerCloseFriend: false,
      })
    ).toBe(true);

    expect(
      canRevealGitHubActivityLink({
        viewerUserId: "close-friend",
        activityAuthorUserId: "author",
        repositoryRegisteredByUserId: "owner",
        areFriendsWithActor: true,
        actorMarkedViewerCloseFriend: true,
      })
    ).toBe(true);
  });

  it("keeps private parties undiscoverable without membership or invite", () => {
    expect(
      canDiscoverParty({
        visibility: "PRIVATE",
        viewerIsMember: false,
        hasInviteToken: false,
      })
    ).toBe(false);

    expect(
      canDiscoverParty({
        visibility: "PRIVATE",
        viewerIsMember: false,
        hasInviteToken: true,
      })
    ).toBe(true);
  });

  it("allows mini-party joins only to parent party members", () => {
    expect(
      canJoinMiniParty({
        visibility: "PUBLIC",
        viewerIsParentPartyMember: false,
        hasInviteToken: true,
      })
    ).toBe(false);

    expect(
      canJoinMiniParty({
        visibility: "PRIVATE",
        viewerIsParentPartyMember: true,
        hasInviteToken: true,
      })
    ).toBe(true);
  });

  it("separates repository request from GitHub App installation activation", () => {
    expect(
      nextRepositoryRegistrationStatus({
        currentStatus: "REQUESTED",
        appInstalled: false,
        installationFailed: false,
      })
    ).toBe("PENDING_INSTALLATION");

    expect(
      nextRepositoryRegistrationStatus({
        currentStatus: "PENDING_INSTALLATION",
        appInstalled: true,
        installationFailed: false,
      })
    ).toBe("ACTIVE");
  });
});
