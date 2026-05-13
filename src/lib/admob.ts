import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, BannerAdPluginEvents, AdMobBannerSize, RewardAdOptions, AdMobRewardItem, RewardAdPluginEvents, AdOptions } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// Test IDs fallback
const bannerAdId = import.meta.env.VITE_ADMOB_BANNER_ID || (Capacitor.getPlatform() === 'ios' ? 'ca-app-pub-3940256099942544/2934735716' : 'ca-app-pub-3940256099942544/6300978111');
const rewardAdId = import.meta.env.VITE_ADMOB_REWARD_ID || (Capacitor.getPlatform() === 'ios' ? 'ca-app-pub-3940256099942544/1712485313' : 'ca-app-pub-3940256099942544/5224354917');
const interstitialAdId = import.meta.env.VITE_ADMOB_INTERSTITIAL_ID || (Capacitor.getPlatform() === 'ios' ? 'ca-app-pub-3940256099942544/4411468910' : 'ca-app-pub-3940256099942544/1033173712');

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
  const isPro = localStorage.getItem('pushchamp_is_pro') === 'true';
  if (isPro) return; // Do not show ads to Pro users
  
  try {
    const options: BannerAdOptions = {
      adId: bannerAdId,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 80, // Push up by 80px to avoid bottom navigation blocking UI
      isTesting: true,
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

export async function showRewardVideo(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true; // Mock success for web
  const isPro = localStorage.getItem('pushchamp_is_pro') === 'true';
  if (isPro) return true;
  
  return new Promise(async (resolve) => {
    try {
      let rewarded = false;

      const rewardedListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        rewarded = true;
      });

      const dismissedListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        rewardedListener.remove();
        dismissedListener.remove();
        resolve(rewarded);
      });

      const options: RewardAdOptions = {
        adId: rewardAdId,
        isTesting: import.meta.env.MODE !== 'production',
        npa: true
      };

      await AdMob.prepareRewardVideoAd(options);
      await AdMob.showRewardVideoAd();
    } catch (e) {
      console.error('Failed to show reward video', e);
      resolve(false);
    }
  });
}

export async function showInterstitialAd() {
  if (!Capacitor.isNativePlatform()) return;
  const isPro = localStorage.getItem('pushchamp_is_pro') === 'true';
  if (isPro) return; // Do not show ads to Pro users
  
  try {
    const options: AdOptions = {
      adId: interstitialAdId,
      isTesting: true,
      npa: true
    };
    
    await AdMob.prepareInterstitial(options);
    await AdMob.showInterstitial();
  } catch (e) {
    console.error('Failed to show interstitial ad', e);
  }
}
