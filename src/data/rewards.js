/**
 * AR Airways — Reward Catalogue
 * Redeemable prizes for AR Miles earned during the wedding.
 *
 * Categories:
 * - experience: special access or moments
 * - gift: physical items
 * - lucky-draw: entries into lucky draw (can buy multiple)
 * - recognition: bragging rights / visibility
 */

export const REWARDS = [
  {
    id: "rwd-001",
    name: "Lucky Draw Entry",
    category: "lucky-draw",
    description: "One entry into the grand lucky draw. Buy multiple to increase your odds.",
    cost: 200,
    icon: "🎰",
    maxPerGuest: 10,
    totalAvailable: null,
    featured: false
  },
  {
    id: "rwd-002",
    name: "VIP Photo Booth Session",
    category: "experience",
    description: "Priority 15-minute session at the premium photo booth with props and instant prints.",
    cost: 500,
    icon: "📸",
    maxPerGuest: 1,
    totalAvailable: 20,
    featured: true
  },
  {
    id: "rwd-003",
    name: "Dessert Upgrade",
    category: "gift",
    description: "A special dessert platter delivered to your table at dinner.",
    cost: 300,
    icon: "🍰",
    maxPerGuest: 2,
    totalAvailable: 30,
    featured: false
  },
  {
    id: "rwd-004",
    name: "DJ Song Request",
    category: "experience",
    description: "Guaranteed song request played during Garba or Sangeet night.",
    cost: 400,
    icon: "🎵",
    maxPerGuest: 2,
    totalAvailable: 15,
    featured: true
  },
  {
    id: "rwd-005",
    name: "First Class Upgrade",
    category: "recognition",
    description: "Your boarding pass upgrades to First Class for the rest of the wedding. Visible on the leaderboard.",
    cost: 2000,
    icon: "👑",
    maxPerGuest: 1,
    totalAvailable: 5,
    featured: true
  },
  {
    id: "rwd-006",
    name: "Mystery Gift Box",
    category: "gift",
    description: "A surprise gift curated by Riya and Abhishek. No peeking.",
    cost: 800,
    icon: "🎁",
    maxPerGuest: 1,
    totalAvailable: 25,
    featured: false
  },
  {
    id: "rwd-007",
    name: "Couple Photo With Bride & Groom",
    category: "experience",
    description: "A dedicated photo moment with Riya and Abhishek at a scheduled time.",
    cost: 1500,
    icon: "💑",
    maxPerGuest: 1,
    totalAvailable: 10,
    featured: true
  },
  {
    id: "rwd-008",
    name: "Resort Spa Voucher",
    category: "gift",
    description: "30-minute spa session at the Aayush Resort spa.",
    cost: 1000,
    icon: "💆",
    maxPerGuest: 1,
    totalAvailable: 10,
    featured: false
  }
];

/**
 * Get rewards sorted: featured first, then by cost ascending.
 */
export function getSortedRewards() {
  return [...REWARDS].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return a.cost - b.cost;
  });
}

/**
 * Check if a guest can afford a reward.
 */
export function canAfford(reward, currentBalance) {
  return currentBalance >= reward.cost;
}
