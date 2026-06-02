import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ai.vita.vitaia",
  appName: "Vita IA",
  webDir: "dist",
  server: {
    androidScheme: "https",
    cleartext: true,
    allowNavigation: ["*"],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#10b981",
    },
  },
  ios: {
    contentInset: "automatic",
    scheme: "VitaIA",
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
