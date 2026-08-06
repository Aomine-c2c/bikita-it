import { IModule, SidebarExtension, ApiExtension } from './types';

export class PlatformRegistry {
  private static instance: PlatformRegistry;
  private modules: Map<string, IModule> = new Map();

  private constructor() {}

  public static getInstance(): PlatformRegistry {
    if (!PlatformRegistry.instance) {
      PlatformRegistry.instance = new PlatformRegistry();
    }
    return PlatformRegistry.instance;
  }

  public registerModule(module: IModule) {
    if (this.modules.has(module.id)) {
      console.warn(`Module ${module.id} is already registered.`);
      return;
    }
    this.modules.set(module.id, module);
    if (module.init) {
      module.init();
    }
    console.log(`[PlatformRegistry] Registered module: ${module.name} (v${module.version})`);
  }

  public getSidebarExtensions(): SidebarExtension[] {
    const extensions: SidebarExtension[] = [];
    for (const mod of this.modules.values()) {
      if (mod.sidebarExtensions) {
        extensions.push(...mod.sidebarExtensions);
      }
    }
    return extensions;
  }

  public getApiExtensions(): ApiExtension[] {
    const extensions: ApiExtension[] = [];
    for (const mod of this.modules.values()) {
      if (mod.apiExtensions) {
        extensions.push(...mod.apiExtensions);
      }
    }
    return extensions;
  }
}
