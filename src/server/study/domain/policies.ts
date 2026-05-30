export type PartyVisibility = "PUBLIC" | "PRIVATE";

export type PartyMembershipStatus = "ACTIVE" | "PENDING" | "LEFT" | "BANNED";

export type PartyRepositoryStatus =
  | "REQUESTED"
  | "PENDING_INSTALLATION"
  | "ACTIVE"
  | "INSTALLATION_FAILED";

export type GitHubIdentityVisibilityContext = {
  viewerUserId: string;
  subjectUserId: string;
  areFriends: boolean;
  subjectMarkedViewerCloseFriend: boolean;
};

export type GitHubActivityLinkVisibilityContext = {
  viewerUserId: string;
  activityAuthorUserId?: string | null;
  githubActorMatchedUserId?: string | null;
  repositoryRegisteredByUserId?: string | null;
  areFriendsWithActor: boolean;
  actorMarkedViewerCloseFriend: boolean;
};

export type PartyDiscoveryContext = {
  visibility: PartyVisibility;
  viewerIsMember: boolean;
  hasInviteToken: boolean;
};

export type MiniPartyJoinContext = {
  visibility: PartyVisibility;
  viewerIsParentPartyMember: boolean;
  hasInviteToken: boolean;
};

export type RepositoryRegistrationTransitionContext = {
  currentStatus: PartyRepositoryStatus;
  appInstalled: boolean;
  installationFailed: boolean;
};

export function canRevealGitHubIdentity({
  viewerUserId,
  subjectUserId,
  areFriends,
  subjectMarkedViewerCloseFriend,
}: GitHubIdentityVisibilityContext) {
  if (viewerUserId === subjectUserId) {
    return true;
  }

  return areFriends && subjectMarkedViewerCloseFriend;
}

export function canRevealGitHubActivityLink({
  viewerUserId,
  activityAuthorUserId,
  githubActorMatchedUserId,
  repositoryRegisteredByUserId,
  areFriendsWithActor,
  actorMarkedViewerCloseFriend,
}: GitHubActivityLinkVisibilityContext) {
  if (
    viewerUserId === activityAuthorUserId ||
    viewerUserId === githubActorMatchedUserId ||
    viewerUserId === repositoryRegisteredByUserId
  ) {
    return true;
  }

  return areFriendsWithActor && actorMarkedViewerCloseFriend;
}

export function canDiscoverParty({
  visibility,
  viewerIsMember,
  hasInviteToken,
}: PartyDiscoveryContext) {
  if (visibility === "PUBLIC") {
    return true;
  }

  return viewerIsMember || hasInviteToken;
}

export function canJoinMiniParty({
  visibility,
  viewerIsParentPartyMember,
  hasInviteToken,
}: MiniPartyJoinContext) {
  if (!viewerIsParentPartyMember) {
    return false;
  }

  if (visibility === "PUBLIC") {
    return true;
  }

  return hasInviteToken;
}

export function nextRepositoryRegistrationStatus({
  currentStatus,
  appInstalled,
  installationFailed,
}: RepositoryRegistrationTransitionContext): PartyRepositoryStatus {
  if (appInstalled) {
    return "ACTIVE";
  }

  if (installationFailed) {
    return "INSTALLATION_FAILED";
  }

  if (currentStatus === "REQUESTED") {
    return "PENDING_INSTALLATION";
  }

  return currentStatus;
}
