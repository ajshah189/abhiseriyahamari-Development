export const SECRET_MESSAGES = [
  {
    id: "msg-001",
    message: "Thank you for travelling all the way to celebrate with us. It means the world. ✈",
    from: "Abhishek & Riya"
  },
  {
    id: "msg-002",
    message: "Hope you've tried the jalebi! Ask for seconds — we ordered extra just for you. 🍯",
    from: "Riya"
  },
  {
    id: "msg-003",
    message: "Seven years ago we met. Tonight we dance. Thank you for being part of this chapter. 💛",
    from: "Abhishek"
  },
  {
    id: "msg-004",
    message: "If this is your first time visiting Panvel, we hope you fall a little in love with it too. 🌿",
    from: "Abhishek & Riya"
  },
  {
    id: "msg-005",
    message: "Every memory made this week becomes a story we'll tell for the rest of our lives. Make it a good one. 📸",
    from: "Riya"
  },
  {
    id: "msg-006",
    message: "The treasure hunt clues were written at 2am. We're sorry if they're confusing. We were very tired. 😄",
    from: "Abhishek"
  },
  {
    id: "msg-007",
    message: "We designed every detail of this wedding with love. We hope you feel it. 💍",
    from: "Abhishek & Riya"
  },
  {
    id: "msg-008",
    message: "If you need anything — literally anything — the Ground Crew is here. Tap the 🛎 bell.",
    from: "Riya"
  },
  {
    id: "msg-009",
    message: "You are not just a guest. You are part of this story. Always will be. ❤️",
    from: "Abhishek & Riya"
  },
  {
    id: "msg-010",
    message: "The best part of this whole journey? Getting to celebrate with the people we love most. That's you. 🙏",
    from: "Abhishek & Riya"
  }
];

export function getUnseenMessage() {
  let seen;
  try { seen = JSON.parse(localStorage.getItem("ar_seen_messages") || "[]"); } catch { seen = []; }
  const unseen = SECRET_MESSAGES.filter(m => !seen.includes(m.id));
  if (!unseen.length) return null;
  return unseen[Math.floor(Math.random() * unseen.length)];
}

export function markMessageSeen(id) {
  let seen;
  try { seen = JSON.parse(localStorage.getItem("ar_seen_messages") || "[]"); } catch { seen = []; }
  if (!seen.includes(id)) seen.push(id);
  try { localStorage.setItem("ar_seen_messages", JSON.stringify(seen)); } catch {}
}
