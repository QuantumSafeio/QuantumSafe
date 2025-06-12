// Fetch user points from a real backend API using userId
export async function getUserPoints(userId) {
  try {
    const response = await fetch(`/api/points?user=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch points');
    const data = await response.json();
    return typeof data.points === 'number' ? data.points : 0;
  } catch (e) {
    // In case of error, return 0 points
    return 0;
  }
}

// Calculate points from Twitter engagement (likes, retweets, comments)
export function calculatePoints({ likes = 0, retweets = 0, comments = 0 }) {
  // Every 3 likes or retweets = 1 point, every comment = 1 point
  return Math.floor((likes + retweets) / 3) + comments;
}

// Generate a referral link for the current user
export function getReferralLink(userId) {
  return `${window.location.origin}/login?ref=${userId}`;
}

// Save referral info to backend after user signs up with a referral code
export async function saveReferral(newUserId, referrerId) {
  try {
    const response = await fetch('/api/referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newUserId, referrerId }),
    });
    return response.ok;
  } catch (e) {
    return false;
  }
}