import React, { useState, useEffect } from 'react';
import { supabase, getUserStats, updateUserPoints, saveScanResult, addPointsToUser } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { scanAsset } from '../services/scanner';
import { trackTweetEngagement } from '../services/twitter';
import ScanResult from './ScanResult';

export default function Dashboard() {
  const { user } = useAuth();
  const [assetType, setAssetType] = useState('contract');
  const [assetInput, setAssetInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState({
    points: 0,
    profile: null,
    totalScans: 0,
    recentScans: [],
    referrals: { totalReferrals: 0, totalPointsEarned: 0 }
  });
  const [refCopied, setRefCopied] = useState(false);
  const [engagementLoading, setEngagementLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const stats = await getUserStats(user.id);
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleScan = async () => {
    if (userStats.points < 10) {
      alert('Insufficient points! You need at least 10 points to scan.');
      return;
    }

    if (!assetInput.trim()) {
      alert('Please enter an asset address or data to scan.');
      return;
    }

    setLoading(true);
    
    try {
      const result = await scanAsset(assetType, assetInput);
      setScanResult(result);

      await saveScanResult(user.id, result);

      const newPoints = userStats.points - 10;
      await updateUserPoints(user.id, newPoints);
      
      setUserStats(prev => ({ ...prev, points: newPoints }));
      
      await loadUserData();
    } catch (error) {
      console.error('Error during scan:', error);
      alert('An error occurred during scanning. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferral = () => {
    const referralLink = `${window.location.origin}/login?ref=${user.id}`;
    navigator.clipboard.writeText(referralLink);
    setRefCopied(true);
    setTimeout(() => setRefCopied(false), 2000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const checkTweetEngagement = async () => {
    if (!userStats.profile?.twitter_handle) {
      alert('Please connect your Twitter account first to track engagement.');
      return;
    }

    setEngagementLoading(true);
    
    try {
      const engagement = await trackTweetEngagement(userStats.profile.twitter_handle);
      
      if (engagement.newPoints > 0) {
        await addPointsToUser(user.id, engagement.newPoints, 'twitter_engagement');
        
        setUserStats(prev => ({ 
          ...prev, 
          points: prev.points + engagement.newPoints 
        }));
        
        alert(`🎉 You earned ${engagement.newPoints} points from Twitter engagement!
        
Breakdown:
• Tweets: ${engagement.breakdown.tweets} points
• Likes/Retweets: ${engagement.breakdown.likesRetweets} points  
• Comments: ${engagement.breakdown.comments} points

Details:
• ${engagement.details.tweetsCount} tweets posted
• ${engagement.details.totalLikesRetweets} total likes/retweets
• ${engagement.details.commentsCount} comments received`);
      } else {
        alert('No new engagement points earned. Keep tweeting and engaging with your audience!');
      }
    } catch (error) {
      console.error('Error checking tweet engagement:', error);
      alert('Error checking Twitter engagement. Please try again later.');
    } finally {
      setEngagementLoading(false);
    }
  };

  const getReferralLink = () => {
    return `${window.location.origin}/login?ref=${user.id}`;
  };

  const getUserLevel = (points) => {
    if (points >= 500) return { name: 'Quantum Master', color: '#ff00ff', emoji: '🚀' };
    if (points >= 200) return { name: 'Security Expert', color: '#00f5ff', emoji: '🛡️' };
    if (points >= 100) return { name: 'Advanced', color: '#00ff88', emoji: '⚡' };
    if (points >= 50) return { name: 'Intermediate', color: '#ffa500', emoji: '🔥' };
    return { name: 'Beginner', color: '#ffffff', emoji: '🌟' };
  };

  const level = getUserLevel(userStats.points);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Enhanced Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          padding: '25px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div>
            <h1 style={{
              fontSize: '2.5rem',
              background: 'linear-gradient(45deg, #00f5ff, #ff00ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
              fontWeight: 'bold'
            }}>
              🛡️ QuantumSafe
            </h1>
            <p style={{ 
              margin: '8px 0 0 0', 
              opacity: 0.9,
              fontSize: '16px'
            }}>
              Welcome, {userStats.profile?.wallet_address ? 
                `${userStats.profile.wallet_address.slice(0, 8)}...${userStats.profile.wallet_address.slice(-6)}` : 
                user?.email}
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginTop: '5px'
            }}>
              <span style={{ color: level.color, fontSize: '14px' }}>
                {level.emoji} {level.name}
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              background: 'linear-gradient(45deg, #00f5ff, #ff00ff)',
              padding: '12px 25px',
              borderRadius: '30px',
              fontWeight: 'bold',
              fontSize: '18px',
              boxShadow: '0 4px 15px rgba(0, 245, 255, 0.3)'
            }}>
              💎 {userStats.points} Points
            </div>
            
            {userStats.profile?.twitter_handle && (
              <button
                onClick={checkTweetEngagement}
                disabled={engagementLoading}
                style={{
                  padding: '12px 18px',
                  background: engagementLoading 
                    ? 'rgba(29, 161, 242, 0.1)' 
                    : 'rgba(29, 161, 242, 0.2)',
                  border: '1px solid rgba(29, 161, 242, 0.5)',
                  borderRadius: '12px',
                  color: '#1da1f2',
                  cursor: engagementLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  opacity: engagementLoading ? 0.7 : 1
                }}
              >
                {engagementLoading ? '🔄 Checking...' : '🐦 Check Engagement'}
              </button>
            )}
            
            <button
              onClick={handleSignOut}
              style={{
                padding: '12px 20px',
                background: 'rgba(255, 0, 0, 0.2)',
                border: '1px solid rgba(255, 0, 0, 0.5)',
                borderRadius: '12px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '2fr 1fr', 
          gap: '30px',
          '@media (max-width: 1024px)': {
            gridTemplateColumns: '1fr'
          }
        }}>
          {/* Enhanced Main scanning section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '25px',
            padding: '35px',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h2 style={{ 
              marginBottom: '30px', 
              color: '#00f5ff',
              fontSize: '1.8rem',
              fontWeight: 'bold'
            }}>
              🔍 Digital Asset Scanner
            </h2>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '12px', 
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                Asset Type:
              </label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '15px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                <option value="contract">Smart Contract</option>
                <option value="wallet">Wallet</option>
                <option value="nft">NFT</option>
                <option value="memecoin">Memecoin</option>
                <option value="app">DApp</option>
              </select>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '12px', 
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                Asset Address or Data:
              </label>
              <input
                type="text"
                placeholder="Enter asset address or data to scan"
                value={assetInput}
                onChange={(e) => setAssetInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '15px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '16px'
                }}
              />
            </div>

            <button
              onClick={handleScan}
              disabled={loading || userStats.points < 10}
              style={{
                width: '100%',
                padding: '18px',
                borderRadius: '15px',
                border: 'none',
                background: loading || userStats.points < 10 
                  ? 'rgba(128, 128, 128, 0.5)' 
                  : 'linear-gradient(45deg, #00f5ff, #ff00ff)',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: loading || userStats.points < 10 ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: loading || userStats.points < 10 
                  ? 'none' 
                  : '0 4px 15px rgba(0, 245, 255, 0.3)'
              }}
            >
              {loading ? '🔄 Scanning...' : '🚀 Start Scan (10 Points)'}
            </button>

            {scanResult && (
              <ScanResult 
                result={scanResult} 
                assetType={assetType} 
                user={user} 
              />
            )}
          </div>

          {/* Enhanced Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            {/* Enhanced Referral section */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '25px',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3 style={{ 
                marginBottom: '20px', 
                color: '#ff00ff',
                fontSize: '1.3rem',
                fontWeight: 'bold'
              }}>
                🎁 Referral Program
              </h3>
              <div style={{
                background: 'rgba(255, 0, 255, 0.1)',
                padding: '15px',
                borderRadius: '10px',
                marginBottom: '15px',
                border: '1px solid rgba(255, 0, 255, 0.3)'
              }}>
                <p style={{ 
                  margin: 0, 
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  Earn 7% of points from friends you refer!
                  <br />
                  <strong>Total Referrals: {userStats.referrals.totalReferrals}</strong>
                  <br />
                  <strong>Bonus Points: {userStats.referrals.totalPointsEarned}</strong>
                </p>
              </div>
              <input
                type="text"
                value={getReferralLink()}
                readOnly
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '12px',
                  marginBottom: '12px'
                }}
              />
              <button
                onClick={handleCopyReferral}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: refCopied ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {refCopied ? '✅ Copied!' : '📋 Copy Referral Link'}
              </button>
            </div>

            {/* Enhanced Statistics */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '25px',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3 style={{ 
                marginBottom: '20px', 
                color: '#00f5ff',
                fontSize: '1.3rem',
                fontWeight: 'bold'
              }}>
                📊 Your Statistics
              </h3>
              <div style={{ fontSize: '15px', lineHeight: '1.8' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span>🔍 Total Scans:</span>
                  <strong>{userStats.totalScans}</strong>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span>💎 Available Points:</span>
                  <strong>{userStats.points}</strong>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span>🎯 Level:</span>
                  <strong style={{ color: level.color }}>
                    {level.emoji} {level.name}
                  </strong>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span>👥 Referrals:</span>
                  <strong>{userStats.referrals.totalReferrals}</strong>
                </div>
                {userStats.profile?.wallet_address && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span>🦊 Wallet:</span>
                    <strong style={{ color: '#00ff88' }}>Connected</strong>
                  </div>
                )}
                {userStats.profile?.twitter_handle && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between'
                  }}>
                    <span>🐦 Twitter:</span>
                    <strong style={{ color: '#1da1f2' }}>@{userStats.profile.twitter_handle}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Recent Scans */}
            {userStats.recentScans.length > 0 && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '25px',
                backdropFilter: 'blur(15px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <h3 style={{ 
                  marginBottom: '20px', 
                  color: '#ff00ff',
                  fontSize: '1.3rem',
                  fontWeight: 'bold'
                }}>
                  📝 Recent Scans
                </h3>
                <div style={{ fontSize: '13px' }}>
                  {userStats.recentScans.slice(0, 3).map((scan, index) => (
                    <div key={index} style={{
                      padding: '12px',
                      marginBottom: '10px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <div style={{ 
                        fontWeight: 'bold',
                        marginBottom: '5px'
                      }}>
                        {scan.asset_type.toUpperCase()} - {scan.quantum_risk}
                      </div>
                      <div style={{ 
                        opacity: 0.8,
                        fontSize: '12px'
                      }}>
                        {new Date(scan.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Points System Info */}
        <div style={{
          marginTop: '40px',
          padding: '30px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '20px',
          fontSize: '15px',
          lineHeight: '1.8',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ 
            color: '#00f5ff', 
            marginBottom: '25px',
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}>
            💡 How to Earn Points
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '20px' 
          }}>
            <div style={{
              background: 'rgba(0, 245, 255, 0.1)',
              padding: '20px',
              borderRadius: '15px',
              border: '1px solid rgba(0, 245, 255, 0.3)'
            }}>
              <h4 style={{ color: '#00f5ff', marginBottom: '10px' }}>🐦 Twitter Engagement</h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>1 point per tweet posted</li>
                <li>0.5 points per 7 likes/retweets</li>
                <li>0.5 points per 3 comments</li>
              </ul>
            </div>
            <div style={{
              background: 'rgba(255, 0, 255, 0.1)',
              padding: '20px',
              borderRadius: '15px',
              border: '1px solid rgba(255, 0, 255, 0.3)'
            }}>
              <h4 style={{ color: '#ff00ff', marginBottom: '10px' }}>👥 Referral Program</h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>10 points for each friend you invite</li>
                <li>7% bonus from their earned points</li>
                <li>Lifetime passive income</li>
              </ul>
            </div>
            <div style={{
              background: 'rgba(0, 255, 136, 0.1)',
              padding: '20px',
              borderRadius: '15px',
              border: '1px solid rgba(0, 255, 136, 0.3)'
            }}>
              <h4 style={{ color: '#00ff88', marginBottom: '10px' }}>🎁 Bonuses</h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>50 free points for new registration</li>
                <li>Daily login bonuses</li>
                <li>Special event rewards</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}