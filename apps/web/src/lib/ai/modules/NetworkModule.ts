import { AIModule, AIIntent, AIContext, AIResponse } from '../types';

export class NetworkModule implements AIModule {
  name = 'NetworkModule';
  description = 'Handles queries related to network devices, connectivity, and status.';
  supportedIntents = ['NETWORK_QUERY'];

  execute(intent: AIIntent, _context: AIContext): AIResponse {
    let message = "Let me check the network status.";
    
    if (intent.originalQuery.toLowerCase().includes("offline")) {
      message = "Currently, there are 3 devices offline: Printer 04, AP-Warehouse-2, and Switch 09.";
    } else if (intent.originalQuery.toLowerCase().includes("pulse main wifi")) {
      message = "There are currently 142 devices connected to the Bikita Main WiFi network.";
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
