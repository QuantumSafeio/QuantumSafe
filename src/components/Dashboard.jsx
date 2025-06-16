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
    if (!user) {
      alert('Please connect your wallet or Twitter account to start scanning!');
      return;
    }

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
    if (!user) {
      alert('Please connect your account first!');
      return;
    }
    const referralLink = `${window.location.origin}/login?ref=${user.id}`;
    navigator.clipboard.writeText(referralLink);
    setRefCopied(true);
    setTimeout(() => setRefCopied(false), 2000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const checkTweetEngagement = async () => {
    if (!user) {
      alert('Please connect your Twitter account first!');
      return;
    }

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
    return user ? `${window.location.origin}/login?ref=${user.id}` : '#';
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
      color: '#ffffff'
    }}>
      {/* Header with Connection Buttons */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '15px 20px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <h1 style={{
              fontSize: '1.8rem',
              background: 'linear-gradient(45deg, #00f5ff, #ff00ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
              fontWeight: 'bold'
            }}>
              🛡️ QuantumSafe
            </h1>
            {user && (
              <div style={{
                background: 'linear-gradient(45deg, #00f5ff, #ff00ff)',
                padding: '8px 20px',
                borderRadius: '25px',
                fontWeight: 'bold',
                fontSize: '14px',
                boxShadow: '0 4px 15px rgba(0, 245, 255, 0.3)'
              }}>
                💎 {userStats.points} Points
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {!user ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => window.location.href = '/login'}
                  style={{
                    padding: '12px 20px',
                    background: 'linear-gradient(45deg, #f6851b, #e76f00)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  🦊 Connect Wallet
                </button>
                <button
                  onClick={() => window.location.href = '/login'}
                  style={{
                    padding: '12px 20px',
                    background: 'linear-gradient(45deg, #1da1f2, #0d8bd9)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  🐦 Connect Twitter
                </button>
              </div>
            ) : (
              <>
                {userStats.profile?.twitter_handle && (
                  <button
                    onClick={checkTweetEngagement}
                    disabled={engagementLoading}
                    style={{
                      padding: '10px 16px',
                      background: engagementLoading 
                        ? 'rgba(29, 161, 242, 0.1)' 
                        : 'rgba(29, 161, 242, 0.2)',
                      border: '1px solid rgba(29, 161, 242, 0.5)',
                      borderRadius: '10px',
                      color: '#1da1f2',
                      cursor: engagementLoading ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
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
                    padding: '10px 16px',
                    background: 'rgba(255, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 0, 0, 0.5)',
                    borderRadius: '10px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '40px 20px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Hero Section */}
          <div style={{
            textAlign: 'center',
            marginBottom: '60px',
            padding: '60px 20px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '30px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h2 style={{
              fontSize: '3.5rem',
              background: 'linear-gradient(45deg, #00f5ff, #ff00ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '20px',
              fontWeight: 'bold'
            }}>
              Protect Your Digital Assets from Quantum Threats
            </h2>
            <p style={{
              fontSize: '1.3rem',
              opacity: 0.9,
              maxWidth: '800px',
              margin: '0 auto 40px',
              lineHeight: '1.6'
            }}>
              Advanced AI-powered scanning for smart contracts, wallets, NFTs, and DApps. 
              Detect quantum vulnerabilities before they become threats.
            </p>
            
            {/* Key Features */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '30px',
              marginTop: '50px'
            }}>
              <div style={{
                background: 'rgba(0, 245, 255, 0.1)',
                padding: '30px',
                borderRadius: '20px',
                border: '1px solid rgba(0, 245, 255, 0.3)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🔍</div>
                <h3 style={{ color: '#00f5ff', marginBottom: '10px' }}>Advanced Scanning</h3>
                <p style={{ opacity: 0.8, fontSize: '14px' }}>
                  Detect 10+ quantum vulnerabilities using cutting-edge algorithms
                </p>
              </div>
              
              <div style={{
                background: 'rgba(255, 0, 255, 0.1)',
                padding: '30px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 0, 255, 0.3)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🎯</div>
                <h3 style={{ color: '#ff00ff', marginBottom: '10px' }}>Multi-Asset Support</h3>
                <p style={{ opacity: 0.8, fontSize: '14px' }}>
                  Scan contracts, wallets, NFTs, memecoins, and DApps
                </p>
              </div>
              
              <div style={{
                background: 'rgba(0, 255, 136, 0.1)',
                padding: '30px',
                borderRadius: '20px',
                border: '1px solid rgba(0, 255, 136, 0.3)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>💎</div>
                <h3 style={{ color: '#00ff88', marginBottom: '10px' }}>Earn Rewards</h3>
                <p style={{ opacity: 0.8, fontSize: '14px' }}>
                  Get points for scans, referrals, and social engagement
                </p>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '2fr 1fr', 
            gap: '40px',
            '@media (max-width: 1024px)': {
              gridTemplateColumns: '1fr'
            }
          }}>
            {/* Scanning Section */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '25px',
              padding: '40px',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h2 style={{ 
                marginBottom: '30px', 
                color: '#00f5ff',
                fontSize: '2rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                🔍 Digital Asset Scanner
                {!user && (
                  <span style={{
                    background: 'rgba(255, 165, 0, 0.2)',
                    color: '#ffa500',
                    padding: '8px 15px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    border: '1px solid rgba(255, 165, 0, 0.3)'
                  }}>
                    Connect to unlock
                  </span>
                )}
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
                  disabled={!user}
                  style={{
                    width: '100%',
                    padding: '15px',
                    borderRadius: '12px',
                    border: 'none',
                    background: user ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    color: user ? 'white' : 'rgba(255, 255, 255, 0.5)',
                    fontSize: '16px',
                    cursor: user ? 'pointer' : 'not-allowed'
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
                  placeholder={user ? "Enter asset address or data to scan" : "Connect your account to start scanning"}
                  value={assetInput}
                  onChange={(e) => setAssetInput(e.target.value)}
                  disabled={!user}
                  style={{
                    width: '100%',
                    padding: '15px',
                    borderRadius: '12px',
                    border: 'none',
                    background: user ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    color: user ? 'white' : 'rgba(255, 255, 255, 0.5)',
                    fontSize: '16px',
                    cursor: user ? 'text' : 'not-allowed'
                  }}
                />
              </div>

              <button
                onClick={handleScan}
                disabled={loading || !user || (user && userStats.points < 10)}
                style={{
                  width: '100%',
                  padding: '18px',
                  borderRadius: '15px',
                  border: 'none',
                  background: !user 
                    ? 'rgba(128, 128, 128, 0.3)' 
                    : (loading || userStats.points < 10)
                      ? 'rgba(128, 128, 128, 0.5)' 
                      : 'linear-gradient(45deg, #00f5ff, #ff00ff)',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: !user || loading || (user && userStats.points < 10) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: !user || loading || (user && userStats.points < 10)
                    ? 'none' 
                    : '0 4px 15px rgba(0, 245, 255, 0.3)'
                }}
              >
                {!user 
                  ? '🔒 Connect Account to Scan' 
                  : loading 
                    ? '🔄 Scanning...' 
                    : '🚀 Start Scan (10 Points)'
                }
              </button>

              {scanResult && (
                <ScanResult 
                  result={scanResult} 
                  assetType={assetType} 
                  user={user} 
                />
              )}
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              {/* User Stats */}
              {user ? (
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
              ) : (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  padding: '25px',
                  backdropFilter: 'blur(15px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  textAlign: 'center'
                }}>
                  <h3 style={{ 
                    marginBottom: '15px', 
                    color: '#00f5ff',
                    fontSize: '1.3rem',
                    fontWeight: 'bold'
                  }}>
                    🎁 Get Started
                  </h3>
                  <p style={{ marginBottom: '20px', opacity: 0.8 }}>
                    Connect your wallet or Twitter to start earning points and scanning assets!
                  </p>
                  <div style={{
                    background: 'rgba(0, 255, 136, 0.1)',
                    padding: '15px',
                    borderRadius: '10px',
                    border: '1px solid rgba(0, 255, 136, 0.3)',
                    marginBottom: '15px'
                  }}>
                    <strong style={{ color: '#00ff88' }}>🎉 50 Free Points</strong>
                    <br />
                    <small style={{ opacity: 0.8 }}>Get 50 points when you sign up!</small>
                  </div>
                </div>
              )}

              {/* Referral Section */}
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
                    {user ? (
                      <>
                        <strong>Total Referrals: {userStats.referrals.totalReferrals}</strong>
                        <br />
                        <strong>Bonus Points: {userStats.referrals.totalPointsEarned}</strong>
                      </>
                    ) : (
                      <strong>Connect to start referring friends!</strong>
                    )}
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

              {/* Pricing Section */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '25px',
                backdropFilter: 'blur(15px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <h3 style={{ 
                  marginBottom: '20px', 
                  color: '#ffa500',
                  fontSize: '1.3rem',
                  fontWeight: 'bold'
                }}>
                  💰 Scan Pricing
                </h3>
                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    padding: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <span>🔐 Smart Contract:</span>
                    <strong>10 Points</strong>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    padding: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <span>🦊 Wallet:</span>
                    <strong>10 Points</strong>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    padding: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <span>🎨 NFT:</span>
                    <strong>10 Points</strong>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    padding: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <span>🚀 Memecoin:</span>
                    <strong>10 Points</strong>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <span>📱 DApp:</span>
                    <strong>10 Points</strong>
                  </div>
                </div>
              </div>

              {/* Recent Scans */}
              {user && userStats.recentScans.length > 0 && (
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

          {/* Quantum Threats Section */}
          <div style={{
            marginTop: '60px',
            padding: '40px',
            background: 'rgba(255, 0, 0, 0.05)',
            borderRadius: '25px',
            border: '1px solid rgba(255, 0, 0, 0.2)'
          }}>
            <h3 style={{ 
              color: '#ff4757', 
              marginBottom: '30px',
              fontSize: '2rem',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              ⚠️ Detected Quantum Vulnerabilities
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '25px' 
            }}>
              {[
                { name: "Shor's Algorithm Exposure", desc: "Breaks RSA/ECDSA encryption", risk: "Critical" },
                { name: "Grover's Algorithm Weaknesses", desc: "Hash collision vulnerabilities", risk: "High" },
                { name: "Post-Quantum Key Exchange", desc: "Lack of quantum-safe protocols", risk: "High" },
                { name: "Lattice Cryptography Gap", desc: "Missing quantum-resistant methods", risk: "Medium" },
                { name: "Weak Signature Schemes", desc: "ECDSA/RSA vulnerabilities", risk: "Critical" },
                { name: "Legacy Code Issues", desc: "Non-upgradable quantum risks", risk: "Medium" }
              ].map((vuln, index) => (
                <div key={index} style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '25px',
                  borderRadius: '15px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <h4 style={{ color: '#ffffff', margin: 0, fontSize: '16px' }}>
                      {vuln.name}
                    </h4>
                    <span style={{
                      background: vuln.risk === 'Critical' ? '#ff4757' : vuln.risk === 'High' ? '#ffa502' : '#2ed573',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '15px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {vuln.risk}
                    </span>
                  </div>
                  <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>
                    {vuln.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* How to Earn Points */}
          <div style={{
            marginTop: '60px',
            padding: '40px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '25px',
            fontSize: '15px',
            lineHeight: '1.8',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ 
              color: '#00f5ff', 
              marginBottom: '30px',
              fontSize: '2rem',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              💡 How to Earn Points
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '30px' 
            }}>
              <div style={{
                background: 'rgba(0, 245, 255, 0.1)',
                padding: '30px',
                borderRadius: '20px',
                border: '1px solid rgba(0, 245, 255, 0.3)'
              }}>
                <h4 style={{ color: '#00f5ff', marginBottom: '15px', fontSize: '1.3rem' }}>🐦 Twitter Engagement</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                  <li>1 point per tweet posted</li>
                  <li>0.5 points per 7 likes/retweets</li>
                  <li>0.5 points per 3 comments</li>
                  <li>Daily engagement tracking</li>
                </ul>
              </div>
              <div style={{
                background: 'rgba(255, 0, 255, 0.1)',
                padding: '30px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 0, 255, 0.3)'
              }}>
                <h4 style={{ color: '#ff00ff', marginBottom: '15px', fontSize: '1.3rem' }}>👥 Referral Program</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                  <li>10 points for each friend invited</li>
                  <li>7% bonus from their earned points</li>
                  <li>Lifetime passive income</li>
                  <li>Unlimited referrals</li>
                </ul>
              </div>
              <div style={{
                background: 'rgba(0, 255, 136, 0.1)',
                padding: '30px',
                borderRadius: '20px',
                border: '1px solid rgba(0, 255, 136, 0.3)'
              }}>
                <h4 style={{ color: '#00ff88', marginBottom: '15px', fontSize: '1.3rem' }}>🎁 Bonuses & Rewards</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                  <li>50 free points for registration</li>
                  <li>Daily login bonuses</li>
                  <li>Special event rewards</li>
                  <li>Achievement milestones</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            marginTop: '60px',
            padding: '40px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '20px',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{
              background: 'linear-gradient(45deg, #00f5ff, #ff00ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '20px',
              fontSize: '1.5rem'
            }}>
              🛡️ QuantumSafe - The Future of Digital Security
            </h3>
            <p style={{ opacity: 0.8, maxWidth: '600px', margin: '0 auto' }}>
              Protecting your digital assets from quantum threats with advanced AI-powered scanning, 
              comprehensive vulnerability detection, and a rewarding community ecosystem.
            </p>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
              <a href="https://x.com/QuantumSafeIo" target="_blank" rel="noopener noreferrer" style={{
                color: '#1da1f2',
                textDecoration: 'none',
                fontWeight: 'bold'
              }}>
                🐦 Follow us on Twitter
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}