// Enhanced Twitter API service with improved points system
const TWITTER_API_KEY = 'a53CYhaKrHlDQmXLJ9odT0a2g';
const TWITTER_API_SECRET = 'I6SYOWLUzPaj9cnwM7ZPtyY3J4Shqp8h70tkPBIAM0kM7tG9Zl';
const TWITTER_BEARER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAAJQ82QEAAAAAE7fW6XZRMK4KtaMLLFjXwSZKtXY%3DOrU8SwpMJ8NJAkUCeSAOz7rkUqzO3SUmGkJxSZuM3Lv1QMNcyJ';

const TWITTER_CALLBACK_URL = `${window.location.origin}/auth/twitter/callback`;

export async function initiateTwitterAuth() {
  try {
    const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${TWITTER_API_KEY}&redirect_uri=${encodeURIComponent(TWITTER_CALLBACK_URL)}&scope=tweet.read%20users.read%20follows.read&state=state&code_challenge=challenge&code_challenge_method=plain`;
    
    const popup = window.open(authUrl, 'twitter-auth', 'width=600,height=600');
    
    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          reject(new Error('Twitter authentication was cancelled'));
        }
      }, 1000);

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
  const text = `🛡️ QuantumSafe scan completed for ${assetType}:

🎯 Quantum Threat Level: ${scanResult.quantumRisk}
🔍 Asset: ${scanResult.asset.slice(0, 20)}...
⚡ Vulnerabilities Found: ${scanResult.details.length}

Protect your digital assets with QuantumSafe 🚀
${window.location.origin}/login?ref=${user?.id}

#QuantumSafe #BlockchainSecurity #QuantumThreat #CryptoSecurity`;

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(tweetUrl, '_blank');
  
  const tweetData = {
    userId: user?.id,
    content: text,
    assetType,
    scanId: scanResult.scanId,
    timestamp: Date.now(),
    basePoints: 1 // 1 point for posting tweet
  };
  
  localStorage.setItem(`tweet_${Date.now()}`, JSON.stringify(tweetData));
  
  return tweetData;
}

export async function trackTweetEngagement(twitterHandle) {
  if (!twitterHandle) {
    throw new Error('Twitter handle not provided');
  }

  try {
    // Simulate engagement tracking with new points system
    const mockEngagement = {
      tweets: Math.floor(Math.random() * 5) + 1, // 1-5 tweets
      likes: Math.floor(Math.random() * 21), // 0-20 likes
      retweets: Math.floor(Math.random() * 14), // 0-13 retweets
      comments: Math.floor(Math.random() * 9) // 0-8 comments
    };
    
    // New points calculation system:
    // - 1 point per tweet
    // - 0.5 points per 7 likes/retweets
    // - 0.5 points per 3 comments
    const pointsFromTweets = mockEngagement.tweets * 1;
    const pointsFromLikesRetweets = Math.floor((mockEngagement.likes + mockEngagement.retweets) / 7) * 0.5;
    const pointsFromComments = Math.floor(mockEngagement.comments / 3) * 0.5;
    const totalNewPoints = pointsFromTweets + pointsFromLikesRetweets + pointsFromComments;
    
    return {
      engagement: mockEngagement,
      newPoints: Math.round(totalNewPoints * 10) / 10, // Round to 1 decimal place
      breakdown: {
        tweets: pointsFromTweets,
        likesRetweets: Math.round(pointsFromLikesRetweets * 10) / 10,
        comments: Math.round(pointsFromComments * 10) / 10
      },
      details: {
        tweetsCount: mockEngagement.tweets,
        totalLikesRetweets: mockEngagement.likes + mockEngagement.retweets,
        commentsCount: mockEngagement.comments
      }
    };
  } catch (error) {
    console.error('Error tracking tweet engagement:', error);
    return { newPoints: 0, engagement: null };
  }
}

export async function getUserTweets(twitterHandle, count = 10) {
  try {
    // Mock implementation - in production, use Twitter API v2
    const mockTweets = Array.from({ length: Math.min(count, 5) }, (_, i) => ({
      id: `tweet_${Date.now()}_${i}`,
      text: `Sample tweet ${i + 1} about quantum security`,
      created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      public_metrics: {
        like_count: Math.floor(Math.random() * 10),
        retweet_count: Math.floor(Math.random() * 5),
        reply_count: Math.floor(Math.random() * 3)
      }
    }));

    return {
      tweets: mockTweets,
      count: mockTweets.length
    };
  } catch (error) {
    console.error('Error fetching user tweets:', error);
    return { tweets: [], count: 0 };
  }
}

export async function getTweetMetrics(tweetId) {
  try {
    // Mock implementation - in production, use Twitter API v2
    return {
      likes: Math.floor(Math.random() * 20),
      retweets: Math.floor(Math.random() * 10),
      comments: Math.floor(Math.random() * 5),
      views: Math.floor(Math.random() * 100) + 50
    };
  } catch (error) {
    console.error('Error fetching tweet metrics:', error);
    return { likes: 0, retweets: 0, comments: 0, views: 0 };
  }
}