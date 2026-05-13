import { Purchases } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

export async function initializePurchases() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Purchases.configure({
      apiKey: (import.meta as any).env?.VITE_REVENUECAT_KEY || 'test_key',
    });
  } catch (e) {
    console.error('Failed to init purchases', e);
  }
}
