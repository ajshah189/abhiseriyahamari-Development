export const APP_CONFIG = {
  websiteTitle: "Aayush Resort — Wedding Map",

  brandName: "AR Airways",

  coupleNames: {
    bride: "Riya",
    groom: "Abhishek",
    display: "Riya & Abhishek",
  },

  weddingDate: {
    display: "22–24 Jan 2027",
    start: "2027-01-22",
    end: "2027-01-24",
  },

  resortName: "Aayush Resort",

  defaultZoom: {
    baseScaleMultiplier: 0.96,
    minScaleMultiplier: 0.5,
    maxScaleMultiplier: 6,
  },

  mapImages: {
    blank: "assets/map-blank.png",
    labeled: "assets/map-labeled.png",
  },

  animationDurations: {
    cameraMs: 520,
    zoomButtonMs: 320,
    routeFitMs: 620,
    searchHighlightMs: 3500,
  },

  themeColors: {
    night: "#0c0f14",
    night2: "#151a22",
    night3: "#1b212b",
    gold: "#d4af6a",
    goldBright: "#e6c886",
    cream: "#f5efe1",
    routeGold: "#c9a34d",
    rose: "#c1272d",
    entryMarker: "#2ec4d6",
    road: "#7a8a9a",
  },

  // ===========================
  // Passenger System
  // ===========================
  passenger: {
    defaultStatus: "Explorer",
    defaultAvatar: "assets/avatars/default.png",
    defaultCountry: "India",
  },

  // ===========================
  // AR Miles
  // ===========================
  arMiles: {
    currencyName: "AR Miles",
    symbol: "✈",
    startingBalance: 0,

    tiers: [
      {
        id: 1,
        name: "Explorer",
        minimumMiles: 0,
      },
      {
        id: 2,
        name: "Silver Traveller",
        minimumMiles: 2500,
      },
      {
        id: 3,
        name: "Gold Traveller",
        minimumMiles: 7500,
      },
      {
        id: 4,
        name: "Platinum Voyager",
        minimumMiles: 15000,
      },
      {
        id: 5,
        name: "Global Ambassador",
        minimumMiles: 30000,
      },
    ],
  },

  // ===========================
  // Dashboard
  // ===========================
  dashboard: {
    showWeather: true,
    showLeaderboard: true,
    showJourneyProgress: true,
    showRecentActivity: true,
    recentActivityLimit: 5,
  },

  // ===========================
  // Passport
  // ===========================
  passport: {
    maxCountries: 25,
    maxStamps: 25,
  },

  // ===========================
  // Leaderboards
  // ===========================
  leaderboard: {
    defaultView: "overall",
    maximumEntries: 100,
  },

  // ===========================
  // Rewards
  // ===========================
  rewards: {
    redemptionEnabled: true,
    luckyDrawEnabled: true,
  },

  // ===========================
  // Admin
  // ===========================
  // Organiser convenience gate for a 3-day offline wedding app, not a
  // security product — PIN lives in config on purpose.
  admin: {
    pin: "2727",
    pinLength: 4,
  },

  // ===========================
  // Auth
  // ===========================
  auth: {
    storageKey: "ar_guest_id",       // localStorage key for persisted login
    viewerKey: "ar_viewer_mode",     // localStorage key for viewer mode flag
    sessionKey: "ar_current_guest",  // sessionStorage key for guest snapshot cache
  },

  // ===========================
  // PWA
  // ===========================
  pwa: {
    cacheName: "ar-airways-v33",
    cacheVersion: 33,
    installDismissedKey: "ar_install_dismissed",
  },

  // ===========================
  // Feature Flags
  // ===========================
  features: {
    dashboard: true,
    passport: true,
    boardingPass: true,
    arMiles: true,
    rewards: true,
    leaderboard: true,
    treasureHunt: true,
    notifications: true,
    adminPanel: true,
  },
};