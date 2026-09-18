import {Linking} from 'react-native';

export interface DeveloperSponsorAd {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  badgeText?: string;
  sponsorName?: string;
  logoUrl?: string;
  accentColor?: string;
  impressionUrl?: string;
  clickUrl?: string;
  type?: 'ethicalads' | 'affiliate' | 'custom';
}

// ─── Default Package Author Publisher ID ───
// Once EthicalAds approves your publisher application, put your publisher slug here.
// Every developer who installs your npm package will automatically load ads that pay YOU directly.
export const DEFAULT_ETHICALADS_PUBLISHER_ID = '';

let _customPublisherId: string | null = null;
let _customEndpoint: string | null = null;

export function setSponsorPublisherId(publisherId: string): void {
  _customPublisherId = publisherId;
}

export function setCustomSponsorEndpoint(endpointUrl: string): void {
  _customEndpoint = endpointUrl;
}

// ─── Curated High-Converting Developer SaaS Sponsors (Affiliate Fallbacks) ───
const FALLBACK_SPONSORS: DeveloperSponsorAd[] = [
  {
    id: 'sentry-dev-partner',
    sponsorName: 'Sentry',
    badgeText: 'FEATURED PARTNER',
    title: 'Code breaks. Fix it faster with Sentry.',
    description: 'Real-time crash tracking, performance monitoring, and session replay for React Native.',
    ctaText: 'Try Sentry Free',
    ctaUrl: 'https://sentry.io/welcome/?utm_source=react-native-inapp-inspector&utm_medium=partner&utm_campaign=dev-tools',
    accentColor: '#6C5FC7',
    type: 'affiliate',
  },
  {
    id: 'requestly-api-mock',
    sponsorName: 'Requestly',
    badgeText: 'DEV SPOTLIGHT',
    title: 'Intercept & Mock APIs directly in Mobile Apps',
    description: 'Modify HTTP headers, redirect API endpoints, and simulate 500 errors on iOS & Android.',
    ctaText: 'Explore Requestly',
    ctaUrl: 'https://requestly.com/?utm_source=react-native-inapp-inspector&utm_medium=devtools&utm_campaign=mobile-inspect',
    accentColor: '#2563EB',
    type: 'affiliate',
  },
  {
    id: 'supabase-cloud-db',
    sponsorName: 'Supabase',
    badgeText: 'DEVELOPER CLOUD',
    title: 'The Open Source Firebase Alternative',
    description: 'Postgres database, Authentication, Instant APIs, Realtime subscriptions, and Edge Functions.',
    ctaText: 'Start Free Project',
    ctaUrl: 'https://supabase.com/?utm_source=react-native-inapp-inspector&utm_medium=partner&utm_campaign=rn-inspect',
    accentColor: '#3ECF8E',
    type: 'affiliate',
  },
  {
    id: 'digitalocean-cloud',
    sponsorName: 'DigitalOcean',
    badgeText: '$200 FREE CREDIT',
    title: 'Deploy React Native Backend & Nodes in Seconds',
    description: 'Simple, scalable cloud hosting with managed databases, App Platform, and 99.99% uptime.',
    ctaText: 'Claim $200 Credit',
    ctaUrl: 'https://m.do.co/c/react-native-inapp-inspector',
    accentColor: '#0080FF',
    type: 'affiliate',
  },
];

let _lastFetchedAd: DeveloperSponsorAd | null = null;
let _hasTrackedImpression = false;

export async function fetchDeveloperSponsor(
  publisherId?: string,
  customEndpoint?: string,
): Promise<DeveloperSponsorAd> {
  const pubId =
    publisherId || _customPublisherId || DEFAULT_ETHICALADS_PUBLISHER_ID;
  const endpoint = customEndpoint || _customEndpoint;

  // 1. If custom JSON endpoint is configured, fetch it
  if (endpoint) {
    try {
      const res = await fetch(endpoint, {
        headers: {Accept: 'application/json'},
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.title && data.ctaUrl) {
          _lastFetchedAd = {
            id: data.id || 'custom-sponsor',
            title: data.title,
            description: data.description || '',
            ctaText: data.ctaText || 'Learn More',
            ctaUrl: data.ctaUrl,
            badgeText: data.badgeText || 'SPONSORED',
            sponsorName: data.sponsorName || 'Featured Partner',
            logoUrl: data.logoUrl,
            accentColor: data.accentColor || '#6366F1',
            impressionUrl: data.impressionUrl,
            clickUrl: data.clickUrl,
            type: 'custom',
          };
          _hasTrackedImpression = false;
          return _lastFetchedAd;
        }
      }
    } catch {
      // fallback
    }
  }

  // 2. If EthicalAds Publisher ID is configured, query EthicalAds API (CPM / CPC)
  if (pubId) {
    try {
      const keywords = encodeURIComponent(
        'react-native|mobile|javascript|typescript|ios|android|developer-tools|cloud',
      );
      const url = `https://server.ethicalads.io/api/v1/decision/?publisher=${encodeURIComponent(
        pubId,
      )}&ad_types=image-and-text&format=json&keywords=${keywords}&placements=app-inspector`;
      const res = await fetch(url, {
        headers: {Accept: 'application/json'},
      });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.text || data.heading) && (data.link || data.click_url)) {
          _lastFetchedAd = {
            id: `ethicalads-${data.id || Date.now()}`,
            title: data.heading || data.company || 'Developer Spotlight',
            description: data.text || '',
            ctaText: 'Learn More',
            ctaUrl: data.link || data.click_url,
            badgeText: 'ETHICAL ADS',
            sponsorName: data.company || 'Sponsored Tool',
            logoUrl: data.image,
            accentColor: '#10B981',
            impressionUrl: data.view_url,
            clickUrl: data.click_url,
            type: 'ethicalads',
          };
          _hasTrackedImpression = false;
          return _lastFetchedAd;
        }
      }
    } catch {
      // fallback
    }
  }

  // 3. Fallback: Rotating high-converting developer affiliate partners
  const randomIndex = Math.floor(Math.random() * FALLBACK_SPONSORS.length);
  _lastFetchedAd = FALLBACK_SPONSORS[randomIndex];
  _hasTrackedImpression = false;
  return _lastFetchedAd;
}

export function trackSponsorImpression(ad: DeveloperSponsorAd): void {
  if (_hasTrackedImpression) return;
  _hasTrackedImpression = true;

  if (ad.impressionUrl) {
    fetch(ad.impressionUrl, {method: 'GET'}).catch(() => {});
  }
}

export function handleSponsorClick(ad: DeveloperSponsorAd): void {
  if (ad.clickUrl) {
    fetch(ad.clickUrl, {method: 'GET'}).catch(() => {});
  }
  if (ad.ctaUrl) {
    Linking.openURL(ad.ctaUrl).catch(() => {});
  }
}
