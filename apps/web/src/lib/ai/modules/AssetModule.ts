import { AIModule, AIIntent, AIContext, AIResponse } from '../types';

export class AssetModule implements AIModule {
  name = 'AssetModule';
  description = 'Handles queries related to assets, employees having assets, and asset locations.';
  supportedIntents = ['FIND_ASSET'];

  execute(intent: AIIntent, _context: AIContext): AIResponse {
    // This is a stub. In the future this will query the database/API.
    
    let message = "I am looking up that asset information for you.";
    
    if (intent.originalQuery.toLowerCase().includes("it-021")) {
      message = "Laptop IT-021 is currently assigned to John Doe.";
    } else if (intent.originalQuery.toLowerCase().includes("camera 12")) {
      message = "Camera 12 is located at the Main Gate.";
    } else if (intent.originalQuery.toLowerCase().includes("power house")) {
      message = "The assets currently located in the Power House are: Generator 1, AC Unit 4, and UPS System 2.";
    }

    return {
      message,
      handledBy: this.name,
      data: {
        mock: true
      }
    };
  }
}
