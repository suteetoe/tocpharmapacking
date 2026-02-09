export {};

declare global {
  interface Window {
    appConfig: {
      VITE_APP_NAME: string;
      VITE_APP_BASE_URL: string;
      VITE_API_URL: string;
      [key: string]: string;
    };
  }
}
