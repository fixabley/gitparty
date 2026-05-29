export type SlugifyParams = {
  value: string;
};

export function slugify({ value }: SlugifyParams) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function randomInviteToken() {
  return crypto.randomUUID().replaceAll("-", "");
}
