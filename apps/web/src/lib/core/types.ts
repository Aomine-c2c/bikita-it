export interface SidebarExtension {
  section: string;
  label: string;
  href: string;
  iconName: string;
  roles: string[];
}

export interface ApiExtension {
  matchPrefix: string;
  handler: (path: string, options?: RequestInit) => Promise<unknown>;
}

export interface IModule {
  id: string;
  name: string;
  version: string;
  sidebarExtensions?: SidebarExtension[];
  apiExtensions?: ApiExtension[];
  init?: () => void;
}
