import { PrivategptApiClient } from 'privategpt-sdk-web';

export const checkIsPgptHealthy = async (url: string) => {
  const isHealthy = await PrivategptClient.getInstance(url).health.health();
  return isHealthy.status === 'ok';
};

export class PrivategptClient {
  static instance: PrivategptApiClient;

  static getInstance(url?: string) {
    if (!this.instance) {
      if (!url) {
        throw new Error('PrivategptClient instance not initialized with a url');
      }
      this.instance = new PrivategptApiClient({ environment: url });
    }
    if (url) {
      this.instance = new PrivategptApiClient({ environment: url });
    }
    return this.instance;
  }
}
