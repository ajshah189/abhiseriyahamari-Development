/**
 * AR Airways — Wedding Rituals
 * Aayush Resort, 22–24 January 2027
 *
 * Each ritual is a meaningful ceremony in the Riya & Abhishek wedding journey.
 * Read-only — no guest editing.
 */

export const RITUALS = [
  {
    id: "mameru",
    name: "Mameru",
    icon: "🎁",
    day: 2,
    date: "2027-01-23",
    time: "11:00 AM",
    venue: "Palace Lawn",
    venueLabel: "Palace Lawn — Main Garden",
    tagline: "A mother's brother's blessing",
    description:
      "Mameru is a beautiful Gujarati tradition where the bride's maternal uncle (mama) brings gifts and blessings for the couple. The ceremony marks the family's formal welcome into the wedding celebrations and is filled with warmth, songs, and heartfelt moments.",
    significance:
      "In Gujarati culture, the mama holds a special role — second only to the father. His gifts to the bride symbolise love, protection, and the maternal family's blessing for her new journey.",
    whatToExpect: [
      "The mama arrives with a trousseau of gifts — jewellery, sarees, and sweets",
      "Traditional songs (geet) are sung by the women of the family",
      "The bride is adorned with some of the gifted jewellery",
      "Sweets are distributed to all guests",
      "Family photos and blessings follow the ritual",
    ],
    dresscode: "Traditional Indian attire — bright colours encouraged",
  },
  {
    id: "haldi",
    name: "Haldi",
    icon: "💛",
    day: 2,
    date: "2027-01-23",
    time: "10:00 AM",
    venue: "Pool Deck",
    venueLabel: "Pool Deck — Sunrise Side",
    tagline: "Golden blessings before the big day",
    description:
      "Haldi is the joyful turmeric ceremony held separately for the bride and groom before the wedding. Family members apply a paste of turmeric, sandalwood, and rose water to bless the couple with health, beauty, and prosperity.",
    significance:
      "Turmeric has been used in Indian weddings for centuries — it purifies, protects, and gives the bride and groom a natural glow. The ceremony is believed to ward off evil and invite divine blessings.",
    whatToExpect: [
      "Everyone is expected to get a little yellow — wear clothes you don't mind staining",
      "Family and close friends apply haldi to the bride and groom",
      "Dhol beats keep the energy high throughout",
      "Rose petals and marigold garlands decorate the space",
      "After the ritual, head to the pool for the unofficial splash!",
    ],
    dresscode: "Old clothes or white kurta/saree — you WILL get haldi on you",
  },
  {
    id: "lagna",
    name: "Lagna (Wedding)",
    icon: "💍",
    day: 3,
    date: "2027-01-24",
    time: "07:00 AM",
    venue: "Palace",
    venueLabel: "The Palace — Grand Hall",
    tagline: "Seven sacred steps. One lifetime.",
    description:
      "Lagna is the main Gujarati wedding ceremony where Riya and Abhishek take their vows before the sacred fire. The ceremony follows Vedic traditions — from the Kanyadaan (giving away of the bride) to the Saptapadi (seven steps around the fire).",
    significance:
      "Lagna is the most sacred moment of the wedding. The couple circles the fire seven times, each round representing a vow: prosperity, strength, devotion, happiness, children, harmony, and lifelong friendship.",
    whatToExpect: [
      "Ganesh puja to begin the ceremony with blessings",
      "Kanyadaan — the bride's parents give her hand in marriage",
      "Mangalphera — four sacred rounds of the fire",
      "Saptapadi — seven steps and seven vows",
      "Sindoor and Mangalsutra — the final symbols of union",
      "Vidaai — the emotional farewell of the bride",
    ],
    dresscode: "Formal Indian attire — guests are encouraged to wear gold or pastels",
  },
];

export function getRitualById(id) {
  return RITUALS.find(r => r.id === id) || null;
}
