const logos: Record<string, string> = {
  scout: "/apps/scout.svg",
  burrow: "/apps/burrow.svg",
  gonteractive: "/apps/burrow.svg",
}

export const appLogo = (name: string): string | undefined => logos[name.trim().toLowerCase()]
