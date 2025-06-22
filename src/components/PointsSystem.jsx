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

  // Enhanced Points calculation rates based on requirements
  const POINTS_RATES = {
    twitter: {
      post: 3, // 3 points per tweet
      engagement: 0.05 // 0.05 points per like/retweet/comment
    },
    telegram: {
      post: 5, // 5 points per post
      engagement: 0.01 // 0.01 points per interaction
    },
    youtube: {
      video: 17, // 17 points per video
      engagement: 0.3 // 0.3 points per engagement
    },
    linkedin: {
      article: 22, // 22 points per article
      engagement: 0.7 // 0.7 points per engagement
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
        .select('points, social_media_points, referral_points, scan_points')
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
      const totalEarned = referralData?.reduce((sum, ref) => sum + (ref.total_earned || 0), 0) || 0;

      setReferralStats({
        totalReferrals,
        totalEarned,
        pendingRewards: 0
      });

      // Fetch social media stats
      const { data: socialData } = await supabase
        .from('social_media_stats')
        .select('*')
        .eq('user_id', user.id);

      const socialStatsMap = {
        twitter: { posts: 0, engagement: 0, points: 0 },
        telegram: { posts: 0, engagement: 0, points: 0 },
        youtube: { videos: 0, engagement: 0, points: 0 },
        linkedin: { articles: 0, engagement: 0, points: 0 }
      };

      socialData?.forEach(stat => {
        if (socialStatsMap[stat.platform]) {
          socialStatsMap[stat.platform] = {
            posts: stat.posts_count || 0,
            engagement: stat.engagement_count || 0,
            points: stat.total_points || 0
          };
        }
      });

      setSocialStats(socialStatsMap);

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

  const simulateEngagement = async (platform) => {
    try {
      // Simulate adding engagement for demo purposes
      const engagementBonus = Math.floor(Math.random() * 10) + 1;
      const pointsEarned = engagementBonus * POINTS_RATES[platform].engagement;
      
      await supabase.rpc('award_points', {
        user_uuid: user.id,
        points_amount: pointsEarned,
        point_source: 'social',
        point_platform: platform,
        point_metadata: {
          engagement_count: engagementBonus,
          simulated: true
        }
      });

      toast.success(`+${pointsEarned.toFixed(2)} points from ${platform} engagement!`);
      fetchPointsData();
    } catch (error) {
      console.error('Error simulating engagement:', error);
      toast.error('Failed to update engagement');
    }
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
      {/* Enhanced Points Overview Header */}
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
              <span className="breakdown-value">{referralStats.totalEarned.toFixed(1)}</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Scans</span>
              <span className="breakdown-value">{pointsHistory.filter(h => h.source === 'scan').length * 10}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Social Media Points Section */}
      <div className="social-points-section">
        <h3>📱 Enhanced Social Media Engagement System</h3>
        <div className="rates-overview">
          <div className="rate-card twitter">
            <div className="rate-header">
              <span className="rate-icon">🐦</span>
              <span className="rate-title">Twitter</span>
            </div>
            <div className="rate-details">
              <div className="rate-item">📝 {POINTS_RATES.twitter.post} points per tweet</div>
              <div className="rate-item">❤️ {POINTS_RATES.twitter.engagement} points per engagement</div>
            </div>
          </div>
          
          <div className="rate-card telegram">
            <div className="rate-header">
              <span className="rate-icon">📱</span>
              <span className="rate-title">Telegram</span>
            </div>
            <div className="rate-details">
              <div className="rate-item">📝 {POINTS_RATES.telegram.post} points per post</div>
              <div className="rate-item">👥 {POINTS_RATES.telegram.engagement} points per interaction</div>
            </div>
          </div>
          
          <div className="rate-card youtube">
            <div className="rate-header">
              <span className="rate-icon">📺</span>
              <span className="rate-title">YouTube</span>
            </div>
            <div className="rate-details">
              <div className="rate-item">🎥 {POINTS_RATES.youtube.video} points per video</div>
              <div className="rate-item">👍 {POINTS_RATES.youtube.engagement} points per engagement</div>
            </div>
          </div>
          
          <div className="rate-card linkedin">
            <div className="rate-header">
              <span className="rate-icon">💼</span>
              <span className="rate-title">LinkedIn</span>
            </div>
            <div className="rate-details">
              <div className="rate-item">📄 {POINTS_RATES.linkedin.article} points per article</div>
              <div className="rate-item">💬 {POINTS_RATES.linkedin.engagement} points per engagement</div>
            </div>
          </div>
        </div>

        <div className="social-platforms">
          {Object.entries(socialStats).map(([platform, stats]) => (
            <div key={platform} className={`platform-card ${platform}`}>
              <div className="platform-header">
                <div className="platform-icon">
                  {platform === 'twitter' ? '🐦' : 
                   platform === 'telegram' ? '📱' : 
                   platform === 'youtube' ? '📺' : '💼'}
                </div>
                <div className="platform-info">
                  <h4>{platform.charAt(0).toUpperCase() + platform.slice(1)}</h4>
                  <p>
                    {platform === 'twitter' ? '@QuantumSafeIo' :
                     platform === 'telegram' ? 'Community Posts' :
                     platform === 'youtube' ? 'Educational Videos' : 'Professional Articles'}
                  </p>
                </div>
                <div className="platform-points">{stats.points.toFixed(1)}</div>
              </div>
              
              <div className="platform-stats">
                <div className="stat-item">
                  <span className="stat-label">
                    {platform === 'youtube' ? 'Videos' : 
                     platform === 'linkedin' ? 'Articles' : 'Posts'}
                  </span>
                  <span className="stat-value">{stats.posts}</span>
                  <span className="stat-points">
                    +{(stats.posts * (platform === 'youtube' ? POINTS_RATES.youtube.video : 
                                     platform === 'linkedin' ? POINTS_RATES.linkedin.article :
                                     POINTS_RATES[platform].post)).toFixed(1)} pts
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Engagement</span>
                  <span className="stat-value">{stats.engagement}</span>
                  <span className="stat-points">
                    +{(stats.engagement * POINTS_RATES[platform].engagement).toFixed(2)} pts
                  </span>
                </div>
              </div>
              
              <button 
                className="simulate-btn"
                onClick={() => simulateEngagement(platform)}
              >
                Simulate Engagement
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Referral System Section */}
      <div className="referral-section">
        <h3>🔗 Enhanced Referral Program (7% Commission)</h3>
        <div className="referral-overview">
          <div className="referral-stats">
            <div className="referral-stat">
              <div className="stat-number">{referralStats.totalReferrals}</div>
              <div className="stat-label">Total Referrals</div>
            </div>
            <div className="referral-stat">
              <div className="stat-number">{referralStats.totalEarned.toFixed(1)}</div>
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
          <h4>💰 How the Enhanced Referral System Works</h4>
          <div className="referral-benefits">
            <div className="benefit-item">
              <div className="benefit-icon">🎁</div>
              <div className="benefit-text">
                <strong>Earn 7% Forever</strong>
                <p>Get 7% of all points your referrals earn from any activity, for life!</p>
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
                <p>No limit on referrals or earnings - build your quantum security empire!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Points History */}
      <div className="points-history-section">
        <h3>📊 Recent Points Activity</h3>
        <div className="history-list">
          {pointsHistory.length > 0 ? (
            pointsHistory.slice(0, 10).map((transaction, index) => (
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
                     transaction.source === 'social' ? `${transaction.platform || 'Social'} Media` : 'Points Activity'}
                  </div>
                  <div className="history-date">
                    {new Date(transaction.created_at).toLocaleDateString()} • {new Date(transaction.created_at).toLocaleTimeString()}
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
          padding: 0;
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
          color: rgba(255, 255, 255, 0.7);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(0, 245, 255, 0.3);
          border-top: 3px solid #00f5ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .points-header {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 32px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
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
          background: linear-gradient(45deg, #ffd700, #ffed4e);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(255, 215, 0, 0.3);
        }

        .points-info h2 {
          color: #ffffff;
          font-size: 48px;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(45deg, #ffd700, #ffed4e);
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
          color: #00f5ff;
          font-size: 24px;
          font-weight: 700;
        }

        .social-points-section {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 32px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
        }

        .social-points-section h3 {
          color: #ffffff;
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 24px 0;
          text-align: center;
        }

        .rates-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .rate-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
        }

        .rate-card.twitter {
          border-left: 4px solid #1da1f2;
        }

        .rate-card.telegram {
          border-left: 4px solid #0088cc;
        }

        .rate-card.youtube {
          border-left: 4px solid #ff0000;
        }

        .rate-card.linkedin {
          border-left: 4px solid #0077b5;
        }

        .rate-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .rate-icon {
          font-size: 24px;
        }

        .rate-title {
          color: #ffffff;
          font-size: 18px;
          font-weight: 600;
        }

        .rate-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .rate-item {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
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
          color: #ffd700;
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

        .simulate-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(45deg, #00f5ff, #0099cc);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .simulate-btn:hover {
          background: linear-gradient(45deg, #0099cc, #007acc);
          transform: translateY(-1px);
        }

        .referral-section {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 32px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
        }

        .referral-section h3 {
          color: #ffffff;
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 24px 0;
          text-align: center;
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
          color: #ffd700;
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
          background: linear-gradient(45deg, #00f5ff, #0099cc);
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
          background: linear-gradient(45deg, #0099cc, #007acc);
        }

        .copy-button.copied {
          background: linear-gradient(45deg, #10b981, #059669);
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

        .points-history-section {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 32px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
        }

        .points-history-section h3 {
          color: #ffffff;
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 24px 0;
          text-align: center;
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
          background: rgba(0, 245, 255, 0.2);
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

          .rates-overview {
            grid-template-columns: 1fr;
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