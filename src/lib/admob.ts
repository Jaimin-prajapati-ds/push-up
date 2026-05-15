import { AdMob, BannerAdSize, BannerAdPosition, BannerAdOptions, RewardAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

const TEST_ADS = import.meta.env.VITE_ADMOB_TEST_MODE === 'true';

const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';
const TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917';
const TEST_APP_OPEN_ID = 'ca-app-pub-3940256099942544/3419835294';

const bannerAdId = import.meta.env.VITE_ADMOB_BANNER_ID || (TEST_ADS ? TEST_BANNER_ID : '');
const interstitialAdId = import.meta.env.VITE_ADMOB_INTERSTITIAL_ID || (TEST_ADS ? TEST_INTERSTITIAL_ID : '');
const rewardedAdId = import.meta.env.VITE_ADMOB_REWARDED_ID || (TEST_ADS ? TEST_REWARDED_ID : '');
const appOpenAdId = import.meta.env.VITE_ADMOB_APP_OPEN_ID || (TEST_ADS ? TEST_APP_OPEN_ID : '');

export async function initializeAdMob() {
  if (Capacitor.isNativePlatform()) {
    try {
      await AdMob.initialize({
        initializeForTesting: TEST_ADS,
      });
    } catch (e) {
      console.error('Failed to initialize AdMob', e);
    }
  }
}

export async function showBannerAd() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const options: BannerAdOptions = {
      adId: bannerAdId,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 80,
      isTesting: TEST_ADS,
      npa: false
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
  if (!Capacitor.isNativePlatform()) return;
  try {
    await AdMob.prepareInterstitial({
      adId: interstitialAdId,
      isTesting: TEST_ADS
    });
    await AdMob.showInterstitial();
  } catch (e) {
    console.error('Interstitial failed', e);
  }
}

export async function showRewardVideo(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  return new Promise(async (resolve) => {
    try {
      await AdMob.prepareRewardVideoAd({
        adId: rewardedAdId,
        isTesting: TEST_ADS
      });
      const listener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
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
  if (!Capacitor.isNativePlatform()) return;
  try {
    // @ts-ignore - App Open Ad available at runtime
    await AdMob.showAppOpenAd({
      adId: appOpenAdId,
      isTesting: TEST_ADS
    });
  } catch (e) {
    console.error('App open ad failed', e);
  }
}
