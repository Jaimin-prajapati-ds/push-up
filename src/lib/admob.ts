import { AdMob, BannerAdSize, BannerAdPosition, BannerAdOptions, RewardAdPluginEvents, AdOptions } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

let _isUserPro = false;
export function setAdProStatus(isPro: boolean) { _isUserPro = isPro; }

// Test IDs fallback
const bannerAdId = import.meta.env.VITE_ADMOB_BANNER_ID || 'ca-app-pub-3940256099942544/6300978111';
const interstitialAdId = import.meta.env.VITE_ADMOB_INTERSTITIAL_ID || 'ca-app-pub-3940256099942544/1033173712';
const rewardedAdId = import.meta.env.VITE_ADMOB_REWARDED_ID || 'ca-app-pub-3940256099942544/5224354917';
const appOpenAdId = import.meta.env.VITE_ADMOB_APP_OPEN_ID || 'ca-app-pub-3940256099942544/3419835294';

export async function initializeAdMob() {
  if (Capacitor.isNativePlatform()) {
    try {
      await AdMob.initialize({
        testingDevices: ['2077ef9a63d2b398840261c8221a0c9b'],
        initializeForTesting: import.meta.env.MODE !== 'production',
      });
      console.log('AdMob initialized');
    } catch (e) {
      console.error('Failed to initialize AdMob', e);
    }
  }
}

export async function showBannerAd() {
  if (!Capacitor.isNativePlatform()) return;
  if (_isUserPro) return; // Do not show ads to Pro users
  
  try {
    const options: BannerAdOptions = {
      adId: bannerAdId,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 80, // Push up by 80px to avoid bottom navigation blocking UI
      isTesting: import.meta.env.MODE !== 'production',
      npa: true
    };
    await AdMob.showBanner(options);
  } catch (e) {
    console.error('Failed to show banner ad', e);
  }
}

export async function hideBannerAd() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await AdMob.hideBanner();
  } catch (e) {
    console.error('Failed to hide banner ad', e);
  }
}

export async function showInterstitial() {
  if (!Capacitor.isNativePlatform() || _isUserPro) return;
  try {
    await AdMob.prepareInterstitial({
      adId: interstitialAdId,
      isTesting: import.meta.env.MODE !== 'production'
    });
    await AdMob.showInterstitial();
  } catch (e) {
    console.error('Interstitial failed', e);
  }
}

export async function showRewardVideo(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  if (_isUserPro) return true;

  return new Promise(async (resolve) => {
    try {
      await AdMob.prepareRewardVideoAd({
        adId: rewardedAdId,
        isTesting: import.meta.env.MODE !== 'production'
      });
      
      const listener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
        console.log('User earned reward', reward);
        resolve(true);
      });

      await AdMob.showRewardVideoAd();
    } catch (e) {
      console.error('Reward video failed', e);
      resolve(false);
    }
  });
}
export async function showAppOpenAd() {
  if (!Capacitor.isNativePlatform() || _isUserPro) return;
  try {
    await AdMob.showAppOpenAd({
      adId: appOpenAdId,
      isTesting: import.meta.env.MODE !== 'production'
    });
  } catch (e) {
    console.error('App open ad failed', e);
  }
}
