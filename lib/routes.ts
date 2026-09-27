/** Central place for app paths so links don't drift as routes evolve. */
export const routes = {
  home: "/",
  login: "/auth?mode=login",
  signup: "/auth?mode=signup",
  onboarding: "/onboarding",
  dashboard: "/dashboard",
  newInvestigation: "/investigations/new",
  clarifyingQuestions: "/investigations/new/questions",
  investigation: (id: string, tab?: string) => `/investigations/${id}${tab ? `/${tab}` : ""}`,
  memory: "/memory",
  context: "/context",
  dataSources: "/data-sources",
  research: "/research",
  decisions: "/decisions",
  settings: "/settings",
} as const;
