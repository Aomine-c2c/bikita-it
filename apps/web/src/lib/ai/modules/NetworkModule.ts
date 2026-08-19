import { AIModule, AIIntent, AIContext, AIResponse } from '../types';
import { apiFetch, type NetworkDevice } from '@/lib/api';

export class NetworkModule implements AIModule {
  name = 'NetworkModule';
  description = 'Handles queries related to network devices, connectivity, and status.';
  supportedIntents = ['NETWORK_QUERY'];

  async execute(intent: AIIntent, _context: AIContext): Promise<AIResponse> {
    const query = intent.originalQuery.toLowerCase();
    let message = "Let me check the network status.";
    let data: unknown = null;
    
    try {
      const devices = await apiFetch<NetworkDevice[]>('/devices');
      data = devices;
      
      if (query.includes("offline")) {
        const offlineDevices = devices.filter((d) => d.status?.toLowerCase() === 'offline' || d.status?.toLowerCase() === 'down');
        if (offlineDevices.length > 0) {
          message = `Currently, there are ${offlineDevices.length} devices offline: ${offlineDevices.map((d) => d.name || d.hostname || d.ip_address).join(', ')}.`;
        } else {
          message = "All network devices are currently online.";
        }
      } else if (query.includes("pulse main wifi")) {
        const wifiDevices = devices.filter((d) => String(d.device_type || d.type || '').toLowerCase().includes('access_point') || String(d.device_type || d.type || '').toLowerCase().includes('wifi'));
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
