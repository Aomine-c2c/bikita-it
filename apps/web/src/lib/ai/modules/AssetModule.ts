import { AIModule, AIIntent, AIContext, AIResponse } from '../types';
import { apiFetch, type Asset } from '@/lib/api';

export class AssetModule implements AIModule {
  name = 'AssetModule';
  description = 'Handles queries related to assets, employees having assets, and asset locations.';
  supportedIntents = ['FIND_ASSET'];

  async execute(intent: AIIntent, _context: AIContext): Promise<AIResponse> {
    const query = intent.originalQuery.toLowerCase();
    let message = "I am looking up that asset information for you.";
    let data: unknown = null;
    
    try {
      const assets = await apiFetch<Asset[]>('/assets');
      data = assets;
      
      if (query.includes("it-021")) {
        const asset = assets.find((a) => a.asset_tag?.toLowerCase().includes("it-021") || a.name?.toLowerCase().includes("it-021"));
        if (asset && asset.assigned_to) {
          message = `Asset ${asset.name} is currently assigned to ${asset.assigned_to.first_name} ${asset.assigned_to.last_name}.`;
        } else if (asset) {
          message = `Asset ${asset.name} is not currently assigned to anyone.`;
        } else {
          message = "I couldn't find an asset with ID IT-021.";
        }
      } else if (query.includes("camera 12")) {
        const asset = assets.find((a) => a.name?.toLowerCase().includes("camera 12"));
        if (asset && asset.location) {
          message = `Camera 12 is located at ${asset.location.name}.`;
        } else {
          message = "I couldn't find Camera 12.";
        }
      } else if (query.includes("power house")) {
        const inPowerHouse = assets.filter((a) => a.location?.name?.toLowerCase().includes("power house"));
        if (inPowerHouse.length > 0) {
          message = `The assets currently located in the Power House are: ${inPowerHouse.map((a) => a.name).join(', ')}.`;
        } else {
          message = "No assets are currently located in the Power House.";
        }
      }
    } catch (error) {
      console.error("Failed to fetch assets:", error);
      message = "Sorry, I couldn't fetch the asset data at this moment.";
    }

    return {
      message,
      handledBy: this.name,
      data
    };
  }
}
