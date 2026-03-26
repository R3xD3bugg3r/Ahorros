import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ahorros.app',
  appName: 'Ahorros',
  webDir: 'out',
  server: {
    url: 'https://ahorros-two.vercel.app/',
    cleartext: true
  }
};

export default config;
