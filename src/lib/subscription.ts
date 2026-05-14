import { Purchases } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

export async function initializePurchases() {
  if (!Capacitor.isNativePlatform()) return;
  
  // DEEP FIX: Use a more robust way to check the key
  const envKey = (import.meta as any).env?.VITE_REVENUECAT_KEY;
  const apiKey = (envKey && envKey !== 'test_key' && envKey !== '') ? envKey : null;
  
  console.log('RevenueCat: Checking API Key...', apiKey ? 'Key Found' : 'No Valid Key');

  if (!apiKey) {
    console.warn('RevenueCat: No valid production API key found. Purchases disabled to prevent crash.');
    return;
  }

  try {
    await Purchases.configure({
      apiKey: apiKey,
    });
    console.log('RevenueCat: Initialized successfully with production key.');
  } catch (e) {
    console.error('RevenueCat: Initialization failed', e);
  }
}

export async function isUserSubscriber(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active['pro'] !== undefined;
  } catch (e) {
    console.error('RevenueCat: Failed to get subscriber info', e);
    return false;
  }
}
export async function restorePurchases(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    return customerInfo.entitlements.active['pro'] !== undefined;
  } catch (e) {
    console.error('RevenueCat: Failed to restore purchases', e);
    return false;
  }
}
