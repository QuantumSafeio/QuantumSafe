import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

export default function PointsSystem() {
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState(0);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    totalEarned: 0,
    pendingRewards: 0
  });
  const [socialStats, setSocialStats] = useState({
    twitter: { posts: 0, engagement: 0, points: 0 },
    telegram: { posts: 0, engagement: 0, points: 0 },
    youtube: { videos: 0, engagement: 0, points: 0 },
    linkedin: { articles: 0, engagement: 0, points: 0 }
  });
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Points calculation rates
  const POINTS_RATES = {
    twitter: {
      post: 3,
      engagement: 0.05 // per like/retweet/comment
    },
    telegram: {
      post: 5,
      engagement: 0.01 // per interaction
    },
    youtube: {
      video: 17,
      engagement: 0.3 // per view/like/comment
    },
    linkedin: {
      article: 22,
      engagement: 0.7 // per like/comment/share
    },
    referral: {
      percentage: 7 // 7% of referred user's points
    }
  };

  useEffect(() => {
    if (user) {
      fetchPointsData();
      generateReferralLink();
    }
  }, [user]);

  const generateReferralLink = () => {
    if (user?.id) {
      const baseUrl = 'https://quantumsafeio.github.io/QuantumSafe/';
      const link = `${baseUrl}?ref=${user.id}`;
      setReferralLink(link);
    }
  };

  const fetchPointsData = async () => {
    try {
      setLoading(true);

      // Fetch user points
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('points')
        .eq('user_id', user.id)
        .single();

      setUserPoints(pointsData?.points || 0);

      // Fetch points history
      const { data: historyData } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setPointsHistory(historyData || []);

      // Fetch referral stats
      const { data: referralData } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id);

      const totalReferrals = referralData?.length || 0;
      const totalEarned = referralData?.reduce((sum, ref) => sum + (ref.points_awarded || 0), 0) || 0;

      setReferralStats({
        totalReferrals,
        totalEarned,
        pendingRewards: 0
      });

      // Simulate social stats (in real app, fetch from social APIs)
      setSocialStats({
        twitter: { posts: 12, engagement: 340, points: 53 },
        telegram: { posts: 8, engagement: 156, points: 41.56 },
        youtube: { videos: 3, engagement: 89, points: 77.7 },
        linkedin: { articles: 2, engagement: 45, points: 75.5 }
      });

    } catch (error) {
      console.error('Error fetching points data:', error);
      toast.error('Failed to load points data');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const shareReferralLink = (platform) => {
    const text = `🚀 Join me on QuantumSafe - The future of blockchain security!

🛡️ Advanced quantum threat protection
🔍 AI-powered security scanning
💰 Earn points for engagement
🎁 Get bonus points with my referral link

Join now: ${referralLink}

#QuantumSafe #BlockchainSecurity #CryptoSecurity #Web3`;

    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank');
    }
  };

  const calculateTotalSocialPoints = () => {
    return Object.values(socialStats).reduce((total, platform) => total + platform.points, 0);
  };

  if (loading) {
    return (
      <div className="points-loading">
        <div className="loading-spinner"></div>
        <p>Loading points data...</p>
      </div>
    );
  }

  return (
    <div className="points-system-container">
      {/* Points Overview Header */}
      <div className="points-header">
        <div className="points-overview">
          <div className="total-points">
            <div className="points-icon">💎</div>
            <div className="points-info">
              <h2>{userPoints.toLocaleString()}</h2>
              <p>Total Points</p>
            </div>
          </div>
          <div className="points-breakdown">
            <div className="breakdown-item">
              <span className="breakdown-label">Social Media</span>
              <span className="breakdown-value">{calculateTotalSocialPoints().toFixed(1)}</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Referrals</span>
              <span className="breakdown-value">{referralStats.totalEarned}</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Scans</span>
              <span className="breakdown-value">{pointsHistory.filter(h => h.source === 'scan').length * 10}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Social Media Points Section */}
      <div className="social-points-section">
        <h3>📱 Social Media Engagement Points</h3>
        <div className="social-platforms">
          <div className="platform-card twitter">
            <div className="platform-header">
              <div className="platform-icon">🐦</div>
              <div className="platform-info">
                <h4>Twitter</h4>
                <p>@QuantumSafeIo</p>
              </div>
              <div className="platform-points">{socialStats.twitter.points}</div>
            </div>
            <div className="platform-stats">
              <div className="stat-item">
                <span className="stat-label">Posts</span>
                <span className="stat-value">{socialStats.twitter.posts}</span>
                <span className="stat-points">+{socialStats.twitter.posts * POINTS_RATES.twitter.post} pts</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Engagement</span>
                <span className="stat-value">{socialStats.twitter.engagement}</span>
                <span className="stat-points">+{(socialStats.twitter.engagement * POINTS_RATES.twitter.engagement).toFixed(1)} pts</span>
              </div>
            </div>
            <div className="platform-rates">
              <div className="rate-item">📝 {POINTS_RATES.twitter.post} points per tweet</div>
              <div className="rate-item">❤️ {POINTS_RATES.twitter.engagement} points per engagement</div>
            </div>
          </div>

          <div className="platform-card telegram">
            <div className="platform-header">
              <div className="platform-icon">📱</div>
              <div className="platform-info">
                <h4>Telegram</h4>
                <p>Community Posts</p>
              </div>
              <div className="platform-points">{socialStats.telegram.points}</div>
            </div>
            <div className="platform-stats">
              <div className="stat-item">
                <span className="stat-label">Posts</span>
                <span className="stat-value">{socialStats.telegram.posts}</span>
                <span className="stat-points">+{socialStats.telegram.posts * POINTS_RATES.telegram.post} pts</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Interactions</span>
                <span className="stat-value">{socialStats.telegram.engagement}</span>
                <span className="stat-points">+{(socialStats.telegram.engagement * POINTS_RATES.telegram.engagement).toFixed(2)} pts</span>
              </div>
            </div>
            <div className="platform-rates">
              <div className="rate-item">📝 {POINTS_RATES.telegram.post} points per post</div>
              <div className="rate-item">👥 {POINTS_RATES.telegram.engagement} points per interaction</div>
            </div>
          </div>

          <div className="platform-card youtube">
            <div className="platform-header">
              <div className="platform-icon">📺</div>
              <div className="platform-info">
                <h4>YouTube</h4>
                <p>Educational Videos</p>
              </div>
              <div className="platform-points">{socialStats.youtube.points}</div>
            </div>
            <div className="platform-stats">
              <div className="stat-item">
                <span className="stat-label">Videos</span>
                <span className="stat-value">{socialStats.youtube.videos}</span>
                <span className="stat-points">+{socialStats.youtube.videos * POINTS_RATES.youtube.video} pts</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Engagement</span>
                <span className="stat-value">{socialStats.youtube.engagement}</span>
                <span className="stat-points">+{(socialStats.youtube.engagement * POINTS_RATES.youtube.engagement).toFixed(1)} pts</span>
              </div>
            </div>
            <div className="platform-rates">
              <div className="rate-item">🎥 {POINTS_RATES.youtube.video} points per video</div>
              <div className="rate-item">👍 {POINTS_RATES.youtube.engagement} points per engagement</div>
            </div>
          </div>

          <div className="platform-card linkedin">
            <div className="platform-header">
              <div className="platform-icon">💼</div>
              <div className="platform-info">
                <h4>LinkedIn</h4>
                <p>Professional Articles</p>
              </div>
              <div className="platform-points">{socialStats.linkedin.points}</div>
            </div>
            <div className="platform-stats">
              <div className="stat-item">
                <span className="stat-label">Articles</span>
                <span className="stat-value">{socialStats.linkedin.articles}</span>
                <span className="stat-points">+{socialStats.linkedin.articles * POINTS_RATES.linkedin.article} pts</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Engagement</span>
                <span className="stat-value">{socialStats.linkedin.engagement}</span>
                <span className="stat-points">+{(socialStats.linkedin.engagement * POINTS_RATES.linkedin.engagement).toFixed(1)} pts</span>
              </div>
            </div>
            <div className="platform-rates">
              <div className="rate-item">📄 {POINTS_RATES.linkedin.article} points per article</div>
              <div className="rate-item">💬 {POINTS_RATES.linkedin.engagement} points per engagement</div>
            </div>
          </div>
        </div>
      </div>

      {/* Referral System Section */}
      <div className="referral-section">
        <h3>🔗 Referral Program</h3>
        <div className="referral-overview">
          <div className="referral-stats">
            <div className="referral-stat">
              <div className="stat-number">{referralStats.totalReferrals}</div>
              <div className="stat-label">Total Referrals</div>
            </div>
            <div className="referral-stat">
              <div className="stat-number">{referralStats.totalEarned}</div>
              <div className="stat-label">Points Earned</div>
            </div>
            <div className="referral-stat">
              <div className="stat-number">{POINTS_RATES.referral.percentage}%</div>
              <div className="stat-label">Commission Rate</div>
            </div>
          </div>
          
          <div className="referral-link-section">
            <h4>Your Referral Link</h4>
            <div className="referral-link-container">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="referral-input"
              />
              <button
                onClick={copyReferralLink}
                className={`copy-button ${copied ? 'copied' : ''}`}
              >
                {copied ? '✅ Copied!' : '📋 Copy'}
              </button>
            </div>
            
            <div className="share-buttons">
              <button onClick={() => shareReferralLink('twitter')} className="share-btn twitter">
                🐦 Twitter
              </button>
              <button onClick={() => shareReferralLink('telegram')} className="share-btn telegram">
                📱 Telegram
              </button>
              <button onClick={() => shareReferralLink('linkedin')} className="share-btn linkedin">
                💼 LinkedIn
              </button>
              <button onClick={() => shareReferralLink('whatsapp')} className="share-btn whatsapp">
                💬 WhatsApp
              </button>
            </div>
          </div>
        </div>

        <div className="referral-info">
          <h4>💰 How Referrals Work</h4>
          <div className="referral-benefits">
            <div className="benefit-item">
              <div className="benefit-icon">🎁</div>
              <div className="benefit-text">
                <strong>Earn 7% Forever</strong>
                <p>Get 7% of all points your referrals earn, for life!</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">🚀</div>
              <div className="benefit-text">
                <strong>Instant Rewards</strong>
                <p>Points are credited immediately when your referrals earn them</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">📈</div>
              <div className="benefit-text">
                <strong>Unlimited Potential</strong>
                <p>No limit on referrals or earnings - the sky's the limit!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ambassador Program Section */}
      <div className="ambassador-section">
        <h3>👑 Ambassador Program</h3>
        <div className="ambassador-tiers">
          <div className="tier-card bronze">
            <div className="tier-header">
              <div className="tier-icon">🥉</div>
              <h4>Bronze Ambassador</h4>
            </div>
            <div className="tier-requirements">
              <div className="requirement">• 10+ Referrals</div>
              <div className="requirement">• 500+ Points</div>
              <div className="requirement">• 5+ Social Posts</div>
            </div>
            <div className="tier-benefits">
              <div className="benefit">🎁 10% Bonus on all points</div>
              <div className="benefit">📱 Exclusive Discord access</div>
              <div className="benefit">🏆 Bronze badge on profile</div>
            </div>
          </div>

          <div className="tier-card silver">
            <div className="tier-header">
              <div className="tier-icon">🥈</div>
              <h4>Silver Ambassador</h4>
            </div>
            <div className="tier-requirements">
              <div className="requirement">• 25+ Referrals</div>
              <div className="requirement">• 1,500+ Points</div>
              <div className="requirement">• 15+ Social Posts</div>
            </div>
            <div className="tier-benefits">
              <div className="benefit">🎁 15% Bonus on all points</div>
              <div className="benefit">💰 Monthly crypto rewards</div>
              <div className="benefit">🎯 Early feature access</div>
            </div>
          </div>

          <div className="tier-card gold">
            <div className="tier-header">
              <div className="tier-icon">🥇</div>
              <h4>Gold Ambassador</h4>
            </div>
            <div className="tier-requirements">
              <div className="requirement">• 50+ Referrals</div>
              <div className="requirement">• 5,000+ Points</div>
              <div className="requirement">• 30+ Social Posts</div>
            </div>
            <div className="tier-benefits">
              <div className="benefit">🎁 25% Bonus on all points</div>
              <div className="benefit">💎 Premium NFT rewards</div>
              <div className="benefit">🤝 Direct team contact</div>
            </div>
          </div>
        </div>
      </div>

      {/* Points History */}
      <div className="points-history-section">
        <h3>📊 Points History</h3>
        <div className="history-list">
          {pointsHistory.length > 0 ? (
            pointsHistory.map((transaction, index) => (
              <div key={index} className="history-item">
                <div className="history-icon">
                  {transaction.source === 'scan' ? '🔍' :
                   transaction.source === 'referral' ? '🔗' :
                   transaction.source === 'social' ? '📱' : '💎'}
                </div>
                <div className="history-details">
                  <div className="history-title">
                    {transaction.source === 'scan' ? 'Asset Scan' :
                     transaction.source === 'referral' ? 'Referral Bonus' :
                     transaction.source === 'social' ? 'Social Media' : 'Points Earned'}
                  </div>
                  <div className="history-date">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className={`history-points ${transaction.points_change > 0 ? 'positive' : 'negative'}`}>
                  {transaction.points_change > 0 ? '+' : ''}{transaction.points_change}
                </div>
              </div>
            ))
          ) : (
            <div className="no-history">
              <div className="no-history-icon">📈</div>
              <h4>No Points History Yet</h4>
              <p>Start earning points by scanning assets, referring friends, or engaging on social media!</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .points-system-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .points-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          gap: 20px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(59, 130, 246, 0.3);
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .points-header {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          border-radius: 20px;
          padding: 32px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .points-overview {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 32px;
          flex-wrap: wrap;
        }

        .total-points {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .points-icon {
          font-size: 48px;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .points-info h2 {
          color: #ffffff;
          font-size: 48px;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .points-info p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 18px;
          margin: 0;
        }

        .points-breakdown {
          display: flex;
          gap: 32px;
        }

        .breakdown-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .breakdown-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .breakdown-value {
          color: #3b82f6;
          font-size: 24px;
          font-weight: 700;
        }

        .social-points-section {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 32px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .social-points-section h3 {
          color: #ffffff;
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 24px 0;
        }

        .social-platforms {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .platform-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .platform-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
        }

        .platform-card.twitter {
          border-left: 4px solid #1da1f2;
        }

        .platform-card.telegram {
          border-left: 4px solid #0088cc;
        }

        .platform-card.youtube {
          border-left: 4px solid #ff0000;
        }

        .platform-card.linkedin {
          border-left: 4px solid #0077b5;
        }

        .platform-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }

        .platform-icon {
          font-size: 32px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .platform-info {
          flex: 1;
        }

        .platform-info h4 {
          color: #ffffff;
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .platform-info p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          margin: 0;
        }

        .platform-points {
          color: #3b82f6;
          font-size: 24px;
          font-weight: 700;
        }

        .platform-stats {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .stat-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
        }

        .stat-value {
          color: #ffffff;
          font-weight: 600;
        }

        .stat-points {
          color: #10b981;
          font-size: 12px;
          font-weight: 600;
        }

        .platform-rates {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .rate-item {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
        }

        .referral-section {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 32px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .referral-section h3 {
          color: #ffffff;
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 24px 0;
        }

        .referral-overview {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 32px;
          margin-bottom: 32px;
        }

        .referral-stats {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .referral-stat {
          text-align: center;
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-number {
          color: #3b82f6;
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .stat-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .referral-link-section h4 {
          color: #ffffff;
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 16px 0;
        }

        .referral-link-container {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .referral-input {
          flex: 1;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #ffffff;
          font-size: 14px;
          font-family: 'Courier New', monospace;
        }

        .copy-button {
          padding: 12px 20px;
          background: #3b82f6;
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .copy-button:hover {
          background: #2563eb;
        }

        .copy-button.copied {
          background: #10b981;
        }

        .share-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .share-btn {
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .share-btn.twitter {
          background: #1da1f2;
        }

        .share-btn.telegram {
          background: #0088cc;
        }

        .share-btn.linkedin {
          background: #0077b5;
        }

        .share-btn.whatsapp {
          background: #25d366;
        }

        .share-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .referral-info h4 {
          color: #ffffff;
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 20px 0;
        }

        .referral-benefits {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .benefit-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 12px;
          border-left: 4px solid #10b981;
        }

        .benefit-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .benefit-text strong {
          color: #ffffff;
          font-size: 16px;
          display: block;
          margin-bottom: 4px;
        }

        .benefit-text p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          margin: 0;
        }

        .ambassador-section {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 32px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .ambassador-section h3 {
          color: #ffffff;
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 24px 0;
        }

        .ambassador-tiers {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .tier-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .tier-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        .tier-card.bronze {
          border-top: 4px solid #cd7f32;
        }

        .tier-card.silver {
          border-top: 4px solid #c0c0c0;
        }

        .tier-card.gold {
          border-top: 4px solid #ffd700;
        }

        .tier-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .tier-icon {
          font-size: 32px;
        }

        .tier-header h4 {
          color: #ffffff;
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .tier-requirements {
          margin-bottom: 20px;
        }

        .requirement {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          margin-bottom: 8px;
          padding-left: 16px;
          position: relative;
        }

        .requirement::before {
          content: '•';
          color: #3b82f6;
          position: absolute;
          left: 0;
        }

        .tier-benefits {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .benefit {
          color: #10b981;
          font-size: 14px;
          font-weight: 500;
        }

        .points-history-section {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 32px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .points-history-section h3 {
          color: #ffffff;
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 24px 0;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .history-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .history-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .history-icon {
          font-size: 24px;
          background: rgba(59, 130, 246, 0.2);
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .history-details {
          flex: 1;
        }

        .history-title {
          color: #ffffff;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .history-date {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        .history-points {
          font-size: 18px;
          font-weight: 700;
        }

        .history-points.positive {
          color: #10b981;
        }

        .history-points.negative {
          color: #ef4444;
        }

        .no-history {
          text-align: center;
          padding: 60px 20px;
        }

        .no-history-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .no-history h4 {
          color: #ffffff;
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 12px 0;
        }

        .no-history p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 16px;
          margin: 0;
          line-height: 1.5;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .points-system-container {
            padding: 16px;
            gap: 24px;
          }

          .points-overview {
            flex-direction: column;
            text-align: center;
          }

          .points-breakdown {
            justify-content: center;
          }

          .social-platforms {
            grid-template-columns: 1fr;
          }

          .referral-overview {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .referral-stats {
            flex-direction: row;
            justify-content: space-around;
          }

          .ambassador-tiers {
            grid-template-columns: 1fr;
          }

          .share-buttons {
            justify-content: center;
          }

          .referral-link-container {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}