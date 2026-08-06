import { CommandCenter } from './CommandCenter';
import { AssetModule } from './modules/AssetModule';
import { NetworkModule } from './modules/NetworkModule';
import { InventoryModule } from './modules/InventoryModule';

const aiCommandCenter = new CommandCenter();

aiCommandCenter.registerModule(new AssetModule());
aiCommandCenter.registerModule(new NetworkModule());
aiCommandCenter.registerModule(new InventoryModule());

export { aiCommandCenter };
export * from './types';
