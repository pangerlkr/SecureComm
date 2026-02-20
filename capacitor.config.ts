import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.securecomm.app',
  appName: 'SecureComm',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
