import { AIModule, AIIntent, AIContext, AIResponse } from '../types';
import { apiFetch } from '@/lib/api';

export class NetworkModule implements AIModule {
  name = 'NetworkModule';
  description = 'Handles queries related to network devices, connectivity, and status.';
  supportedIntents = ['NETWORK_QUERY'];

  async execute(intent: AIIntent, _context: AIContext): Promise<AIResponse> {
    const query = intent.originalQuery.toLowerCase();
    let message = "Let me check the network status.";
    let data = null;
    
    try {
      const devices = await apiFetch('/network/network') as any[];
      data = devices;
      
      if (query.includes("offline")) {
        const offlineDevices = devices.filter((d: any) => d.status === 'offline' || d.status === 'down');
        if (offlineDevices.length > 0) {
          message = `Currently, there are ${offlineDevices.length} devices offline: ${offlineDevices.map((d: any) => d.name).join(', ')}.`;
        } else {
          message = "All network devices are currently online.";
        }
      } else if (query.includes("pulse main wifi")) {
        // Assuming we look for devices with a specific SSID or type
        const wifiDevices = devices.filter((d: any) => d.device_type === 'access_point');
        // We'll return a general stat for now, as connected clients isn't in NetworkDevice typically
        message = `We have ${wifiDevices.length} access points supporting the WiFi network.`;
      }
    } catch (error) {
      console.error("Failed to fetch network devices:", error);
      message = "Sorry, I couldn't fetch the network status at this moment.";
    }

    return {
      message,
      handledBy: this.name,
      data
    };
  }
}
