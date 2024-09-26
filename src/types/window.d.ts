import type { MetaMaskInpageProvider } from "@metamask/providers";

declare global {
  interface Window {
    ethereum: MetaMaskInpageProvider;
    gtag: any;
    dataLayer: any;
  }
}

export {};
