// Twitter API configuration
const TWITTER_API_KEY = 'a53CYhaKrHlDQmXLJ9odT0a2g';
const TWITTER_API_SECRET = 'I6SYOWLUzPaj9cnwM7ZPtyY3J4Shqp8h70tkPBIAM0kM7tG9Zl';
const TWITTER_BEARER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAAJQ82QEAAAAAE7fW6XZRMK4KtaMLLFjXwSZKtXY%3DOrU8SwpMJ8NJAkUCeSAOz7rkUqzO3SUmGkJxSZuM3Lv1QMNcyJ';

// Twitter OAuth endpoints
const TWITTER_AUTH_URL = 'https://api.twitter.com/oauth/request_token';
const TWITTER_CALLBACK_URL = `${window.location.origin}/auth/twitter/callback`;

export async function initiateTwitterAuth() {
  try {
    // For now, we'll use a simple popup-based OAuth flow
    // In production, you'd want to implement proper OAuth 2.0 PKCE flow
    const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${TWITTER_API_KEY}&redirect_uri=${encodeURIComponent(TWITTER_CALLBACK_URL)}&scope=tweet.read%20users.read%20follows.read&state=state&code_challenge=challenge&code_challenge_method=plain`;
    
    const popup = window.open(authUrl, 'twitter-auth', 'width=600,height=600');
    
    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          reject(new Error('Twitter authentication was cancelled'));
        }
      }, 1000);

      // Listen for message from popup
      window.addEventListener('message', (event) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'TWITTER_AUTH_SUCCESS') {
          clearInterval(checkClosed);
          popup.close();
          resolve(event.data.user);
        } else if (event.data.type === 'TWITTER_AUTH_ERROR') {
          clearInterval(checkClosed);
          popup.close();
          reject(new Error(event.data.error));
        }
      });
    });
  } catch (error) {
    console.error('Twitter auth error:', error);
    throw new Error('Failed to initiate Twitter authentication');
  }
}

export async function shareOnTwitter(scanResult, assetType, user) {
  const text = `🛡️ QuantumSafe scan result for ${assetType}:

🎯 Quantum Threat Level: ${scanResult.quantumRisk}
🔍 Asset: ${scanResult.asset.slice(0, 20)}...

Scanned with QuantumSafe 🚀
${window.location.origin}/login?ref=${user?.id}

#QuantumSafe #BlockchainSecurity #QuantumThreat`;

  // Open Twitter intent URL
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(tweetUrl, '_blank');
  
  // Store tweet info for later tracking
  const tweetData = {
    userId: user?.id,
    content: text,
    assetType,
    scanId: scanResult.scanId,
    timestamp: Date.now()
  };
  
  localStorage.setItem(`tweet_${Date.now()}`, JSON.stringify(tweetData));
  
  return tweetData;
}

export async function trackTweetEngagement(twitterHandle) {
  if (!twitterHandle) {
    throw new Error('Twitter handle not provided');
  }

  try {
    // This would typically call your backend API to check tweet engagement
    // For now, we'll simulate the engagement tracking
    
    // In a real implementation, you would:
    // 1. Get recent tweets from the user
    // 2. Check engagement metrics (likes, retweets, comments)
    // 3. Calculate points based on engagement
    // 4. Return the points earned
    
    const mockEngagement = {
      likes: Math.floor(Math.random() * 10),
      retweets: Math.floor(Math.random() * 5),
      comments: Math.floor(Math.random() * 3)
    };
    
    // Calculate points: Every 3 likes/retweets = 1 point, every comment = 1 point
    const pointsFromLikesRetweets = Math.floor((mockEngagement.likes + mockEngagement.retweets) / 3);
    const pointsFromComments = mockEngagement.comments;
    const totalNewPoints = pointsFromLikesRetweets + pointsFromComments;
    
    return {
      engagement: mockEngagement,
      newPoints: totalNewPoints,
      breakdown: {
        likesRetweets: pointsFromLikesRetweets,
        comments: pointsFromComments
      }
    };
  } catch (error) {
    console.error('Error tracking tweet engagement:', error);
    return { newPoints: 0, engagement: null };
  }
}

export async function getUserTweets(twitterHandle, count = 10) {
  try {
    // This would call Twitter API v2 to get user tweets
    // For now, return mock data
    return {
      tweets: [],
      count: 0
    };
  } catch (error) {
    console.error('Error fetching user tweets:', error);
    return { tweets: [], count: 0 };
  }
}

export async function getTweetMetrics(tweetId) {
  try {
    // This would call Twitter API v2 to get tweet metrics
    // For now, return mock data
    return {
      likes: 0,
      retweets: 0,
      comments: 0,
      views: 0
    };
  } catch (error) {
    console.error('Error fetching tweet metrics:', error);
    return { likes: 0, retweets: 0, comments: 0, views: 0 };
  }
}