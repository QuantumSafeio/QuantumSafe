import React, { useState, useEffect } from 'react';
import { supabase, getUserPoints, updateUserPoints, saveScanResult } from '../lib/supabase';
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
  const [points, setPoints] = useState(0);
  const [refCopied, setRefCopied] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  // Load user data on component mount
  useEffect(() => {
    if (user?.id) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      // Load user points
      const userPoints = await getUserPoints(user.id);
      setPoints(userPoints);

      // Load user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setUserProfile(profile);

      // Load scan history
      const { data: scans } = await supabase
        .from('scan_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setScanHistory(scans || []);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Handle asset scanning
  const handleScan = async () => {
    if (points < 10) {
      alert('Insufficient points! You need at least 10 points to scan.');
      return;
    }

    if (!assetInput.trim()) {
      alert('Please enter an asset address or data to scan.');
      return;
    }

    setLoading(true);
    
    try {
      // Perform the scan
      const result = await scanAsset(assetType, assetInput);
      setScanResult(result);

      // Save scan result
      await saveScanResult(user.id, result);

      // Deduct points
      const newPoints = points - 10;
      await updateUserPoints(user.id, newPoints);
      setPoints(newPoints);

      // Update scan history
      loadUserData();
    } catch (error) {
      console.error('Error during scan:', error);
      alert('An error occurred during scanning. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Copy referral link
  const handleCopyReferral = () => {
    const referralLink = `${window.location.origin}/login?ref=${user.id}`;
    navigator.clipboard.writeText(referralLink);
    setRefCopied(true);
    setTimeout(() => setRefCopied(false), 2000);
  };

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Check tweet engagement and award points
  const checkTweetEngagement = async () => {
    try {
      const engagement = await trackTweetEngagement(userProfile?.twitter_handle);
      if (engagement.newPoints > 0) {
        const newPoints = points + engagement.newPoints;
        await updateUserPoints(user.id, newPoints);
        setPoints(newPoints);
        alert(`🎉 You earned ${engagement.newPoints} points from Twitter engagement!`);
      }
    } catch (error) {
      console.error('Error checking tweet engagement:', error);
    }
  };

  const getReferralLink = () => {
    return `${window.location.origin}/login?ref=${user.id}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          backdropFilter: 'blur(10px)'
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              background: 'linear-gradient(45deg, #00f5ff, #ff00ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              🛡️ QuantumSafe
            </h1>
            <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>
              Welcome, {userProfile?.wallet_address ? 
                `${userProfile.wallet_address.slice(0, 6)}...${userProfile.wallet_address.slice(-4)}` : 
                user?.email}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              background: 'linear-gradient(45deg, #00f5ff, #ff00ff)',
              padding: '10px 20px',
              borderRadius: '25px',
              fontWeight: 'bold'
            }}>
              💎 {points} Points
            </div>
            {userProfile?.twitter_handle && (
              <button
                onClick={checkTweetEngagement}
                style={{
                  padding: '10px 15px',
                  background: 'rgba(29, 161, 242, 0.2)',
                  border: '1px solid rgba(29, 161, 242, 0.5)',
                  borderRadius: '10px',
                  color: '#1da1f2',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🐦 Check Engagement
              </button>
            )}
            <button
              onClick={handleSignOut}
              style={{
                padding: '10px 20px',
                background: 'rgba(255, 0, 0, 0.2)',
                border: '1px solid rgba(255, 0, 0, 0.5)',
                borderRadius: '10px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
          {/* Main scanning section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '30px',
            backdropFilter: 'blur(10px)'
          }}>
            <h2 style={{ marginBottom: '25px', color: '#00f5ff' }}>
              🔍 Digital Asset Scanner
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                Asset Type:
              </label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '16px'
                }}
              >
                <option value="contract">Smart Contract</option>
                <option value="wallet">Wallet</option>
                <option value="nft">NFT</option>
                <option value="memecoin">Memecoin</option>
                <option value="app">DApp</option>
              </select>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                Asset Address or Data:
              </label>
              <input
                type="text"
                placeholder="Enter asset address or data to scan"
                value={assetInput}
                onChange={(e) => setAssetInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '16px'
                }}
              />
            </div>

            <button
              onClick={handleScan}
              disabled={loading || points < 10}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '15px',
                border: 'none',
                background: loading || points < 10 
                  ? 'rgba(128, 128, 128, 0.5)' 
                  : 'linear-gradient(45deg, #00f5ff, #ff00ff)',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: loading || points < 10 ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? '🔄 Scanning...' : '🚀 Start Scan (10 Points)'}
            </button>

            {/* Scan result */}
            {scanResult && (
              <ScanResult 
                result={scanResult} 
                assetType={assetType} 
                user={user} 
              />
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Referral link */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '15px',
              padding: '20px',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#ff00ff' }}>
                🎁 Referral Link
              </h3>
              <input
                type="text"
                value={getReferralLink()}
                readOnly
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '12px',
                  marginBottom: '10px'
                }}
              />
              <button
                onClick={handleCopyReferral}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: refCopied ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                {refCopied ? '✅ Copied!' : '📋 Copy Link'}
              </button>
            </div>

            {/* Quick stats */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '15px',
              padding: '20px',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#00f5ff' }}>
                📊 Statistics
              </h3>
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                <p>🔍 Total Scans: {scanHistory.length}</p>
                <p>💎 Available Points: {points}</p>
                <p>🎯 Level: {points > 100 ? 'Advanced' : points > 50 ? 'Intermediate' : 'Beginner'}</p>
                {userProfile?.wallet_address && (
                  <p>🦊 Wallet: Connected</p>
                )}
                {userProfile?.twitter_handle && (
                  <p>🐦 Twitter: @{userProfile.twitter_handle}</p>
                )}
              </div>
            </div>

            {/* Scan history */}
            {scanHistory.length > 0 && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '15px',
                padding: '20px',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{ marginBottom: '15px', color: '#ff00ff' }}>
                  📝 Recent Scans
                </h3>
                <div style={{ fontSize: '12px' }}>
                  {scanHistory.slice(0, 3).map((scan, index) => (
                    <div key={index} style={{
                      padding: '8px',
                      marginBottom: '8px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontWeight: 'bold' }}>
                        {scan.asset_type} - {scan.quantum_risk}
                      </div>
                      <div style={{ opacity: 0.7 }}>
                        {new Date(scan.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional info */}
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '15px',
          fontSize: '14px',
          lineHeight: '1.6'
        }}>
          <h3 style={{ color: '#00f5ff', marginBottom: '15px' }}>
            💡 How to Earn Points
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            <div>• Every 3 likes or retweets = 1 point</div>
            <div>• Every comment on your tweet = 1 point</div>
            <div>• Invite friends = 10 points per friend</div>
            <div>• New registration = 50 free points</div>
          </div>
        </div>
      </div>
    </div>
  );
}