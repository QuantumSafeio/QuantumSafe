import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { scanAsset } from '../services/scanner';
import ScanResult from './ScanResult';
import PromoTweets from './PromoTweets';
import MultiChainPaymentModal from './MultiChainPaymentModal';
import WalletSecurityScanner from './WalletSecurityScanner';
import { Web3Modal } from 'web3modal';
import { ethers } from 'ethers';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Dashboard(props) {
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [scanResults, setScanResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Scanning state
  const [scanning, setScanning] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState('contract');
  const [assetInput, setAssetInput] = useState('');
  const [currentScanResult, setCurrentScanResult] = useState(null);
  const [activeTab, setActiveTab] = useState('scanner');

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');

  // Referral state
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    totalEarned: 0,
    activeReferrals: 0
  });

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalThreatsDetected: 0,
    criticalVulnerabilities: 0,
    assetsProtected: 0,
    riskReduction: 0
  });

  // Wallet connection state
  const [connectedWalletAddress, setConnectedWalletAddress] = useState('');
  const [connectedNetworkSymbol, setConnectedNetworkSymbol] = useState('');

  // Web3Modal state
  const [web3Provider, setWeb3Provider] = useState(null);
  const [web3Address, setWeb3Address] = useState('');
  const [web3Network, setWeb3Network] = useState('');

  // Ambassador state
  const [ambassadorTier, setAmbassadorTier] = useState('none');
  const [socialStats, setSocialStats] = useState({
    twitter: { posts: 0, engagement: 0, points: 0 },
    telegram: { posts: 0, engagement: 0, points: 0 },
    youtube: { videos: 0, engagement: 0, points: 0 },
    linkedin: { articles: 0, engagement: 0, points: 0 }
  });

  // Connect wallet handler
  const handleConnectWallet = async () => {
    try {
      const web3modal = new Web3Modal({
        cacheProvider: true,
        providerOptions: {}
      });
      const instance = await web3modal.connect();
      const provider = new ethers.providers.Web3Provider(instance);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      setWeb3Provider(provider);
      console.log('Web3Provider set:', provider);
      setWeb3Address(address);
      setWeb3Network(network.name.toUpperCase());
    } catch (err) {
      alert('Wallet connection cancelled or failed.');
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
      generateReferralLink();
      fetchReferralStats();
      fetchSocialStats();
    }
  }, [user]);

  useEffect(() => {
    const initWeb3 = async () => {
      try {
        const web3modal = new Web3Modal({
          cacheProvider: true,
          providerOptions: {}
        });
        const instance = await web3modal.connect();
        const provider = new ethers.providers.Web3Provider(instance);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        const network = await provider.getNetwork();
        setWeb3Provider(provider);
        setWeb3Address(address);
        setWeb3Network(network.name.toUpperCase());
      } catch (err) {
        // fallback to old logic if user cancels
      }
    };
    initWeb3();
  }, []);

  useEffect(() => {
    if (!web3Provider && (web3Address || web3Network)) {
      setWeb3Address('');
      setWeb3Network('');
      setCurrentScanResult(null);
      toast.warn('Wallet disconnected. Please reconnect your wallet.');
    }
  }, [web3Provider]);

  const generateReferralLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const link = `${baseUrl}?ref=${user?.id}`;
    setReferralLink(link);
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchReferralStats = async () => {
    try {
      const { data: referrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id);

      setReferralStats({
        totalReferrals: referrals?.length || 0,
        totalEarned: referrals?.reduce((sum, ref) => sum + (ref.total_earned || 0), 0) || 0,
        activeReferrals: referrals?.filter(ref => ref.is_active).length || 0
      });
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    }
  };

  const fetchSocialStats = async () => {
    try {
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
      console.error('Error fetching social stats:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      );

      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: profile } = await Promise.race([profilePromise, timeout]);
      setUserProfile(profile);

      const pointsPromise = supabase
        .from('user_points')
        .select('points, ambassador_tier')
        .eq('user_id', user.id)
        .single();

      const { data: points } = await Promise.race([pointsPromise, timeout]);
      setUserPoints(points?.points || 0);
      setAmbassadorTier(points?.ambassador_tier || 'none');

      const scansPromise = supabase
        .from('scan_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: scans } = await Promise.race([scansPromise, timeout]);
      setScanResults(scans || []);

      await calculateAnalytics(scans || []);
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = async (scans) => {
    try {
      const totalThreats = scans.reduce((sum, scan) => 
        sum + (scan.vulnerabilities?.length || 0), 0);
      
      const criticalVulns = scans.filter(scan => 
        scan.quantum_risk === 'high').length;
      
      const assetsProtected = scans.length;
      const riskReduction = Math.min(assetsProtected * 15, 95);

      setAnalytics({
        totalThreatsDetected: totalThreats,
        criticalVulnerabilities: criticalVulns,
        assetsProtected,
        riskReduction
      });
    } catch (error) {
      console.error('Error calculating analytics:', error);
    }
  };

  const handleScan = async () => {
    if (!assetInput.trim()) {
      alert('Please enter an asset address to scan');
      return;
    }

    if (userPoints < 10) {
      alert('You need at least 10 points to perform a scan');
      return;
    }

    setScanning(true);
    setCurrentScanResult(null);
    setError('');

    try {
      const scanTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Scan timeout')), 30000)
      );

      const scanPromise = scanAsset(selectedAssetType, assetInput.trim(), web3Address, web3Network);
      const result = await Promise.race([scanPromise, scanTimeout]);
      
      const { data: scanData, error: scanError } = await supabase
        .from('scan_results')
        .insert({
          user_id: user.id,
          asset_type: selectedAssetType,
          asset_address: assetInput.trim(),
          quantum_risk: result.quantumRisk.toLowerCase(),
          vulnerabilities: result.details,
          scanned_at: new Date().toISOString()
        })
        .select()
        .single();

      if (scanError) throw scanError;

      await supabase
        .from('user_points')
        .update({ points: userPoints - 10 })
        .eq('user_id', user.id);

      await supabase
        .from('points_transactions')
        .insert({
          user_id: user.id,
          points_change: -10,
          source: 'scan',
          metadata: {
            asset_type: selectedAssetType,
            asset_address: assetInput.trim(),
            scan_id: scanData.id
          }
        });

      setUserPoints(prev => prev - 10);
      setCurrentScanResult(result);
      
      if (userProfile) {
        await supabase
          .from('user_profiles')
          .update({ 
            total_scans: (userProfile.total_scans || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        
        setUserProfile(prev => ({
          ...prev,
          total_scans: (prev.total_scans || 0) + 1
        }));
      }

      fetchUserData();
      
    } catch (error) {
      console.error('Scan error:', error);
      setError('Failed to perform scan. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handlePaymentClick = (serviceType) => {
    setSelectedService(serviceType);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (paymentResult) => {
    console.log('Payment successful:', paymentResult);
    fetchUserData();
  };

  const assetTypes = [
    { value: 'contract', label: 'Smart Contract', icon: '🔐' },
    { value: 'wallet', label: 'Wallet', icon: '💰' },
    { value: 'nft', label: 'NFT', icon: '🎨' },
    { value: 'memecoin', label: 'Memecoin', icon: '🚀' },
    { value: 'app', label: 'App', icon: '📱' }
  ];

  const tabs = [
    { id: 'scanner', label: 'Quantum Scanner', icon: '🔍' },
    { id: 'benefits', label: 'Why QuantumSafe?', icon: '🔐' },
    { id: 'referrals', label: 'Referral System', icon: '🔗' },
    { id: 'ambassadors', label: 'Ambassador Program', icon: '👑' },
    { id: 'social', label: 'Social Media Points', icon: '📱' },
    { id: 'analytics', label: 'Security Analytics', icon: '📊' },
    { id: 'history', label: 'Scan History', icon: '📋' },
    { id: 'threats', label: 'Threat Intelligence', icon: '🛡️' },
    { id: 'marketing', label: 'Marketing & Promotion', icon: '🚀' }
  ];

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f9fafb',
        gap: '20px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{
          color: '#6366f1',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Loading QuantumSafe Dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f9fafb',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          background: '#fef2f2',
          border: '2px solid #fecaca',
          borderRadius: '15px',
          padding: '30px',
          maxWidth: '500px'
        }}>
          <h1 style={{
            color: '#dc2626',
            fontSize: '2rem',
            marginBottom: '20px'
          }}>
            ⚠️ Loading Error
          </h1>
          <p style={{
            color: '#111827',
            fontSize: '16px',
            marginBottom: '20px',
            lineHeight: '1.6'
          }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: '#6366f1',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🔄 Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f9fafb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              animation: 'fadeIn 0.5s ease-in'
            }}>
              🛡️
            </div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#6366f1',
              margin: 0,
              animation: 'fadeIn 0.5s ease-in'
            }}>
              QuantumSafe
            </h1>
          </div>

          {/* User Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '4px'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#6b7280'
              }}>
                {user?.email || 'User'}
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#16a34a'
              }}>
                {userPoints} Points
              </div>
              {ambassadorTier !== 'none' && (
                <div style={{
                  fontSize: '12px',
                  color: '#fbbf24',
                  fontWeight: 'bold'
                }}>
                  👑 {ambassadorTier.charAt(0).toUpperCase() + ambassadorTier.slice(1)} Ambassador
                </div>
              )}
            </div>
            <button
              onClick={signOut}
              style={{
                padding: '8px 16px',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                color: '#374151',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Referral Section */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '16px'
          }}>
            🔗 Referral Link (7% Commission Forever)
          </h3>
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <input
              type="text"
              value={referralLink}
              readOnly
              style={{
                width: '320px',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: '#f9fafb',
                color: '#6b7280'
              }}
            />
            <button
              onClick={copyReferralLink}
              style={{
                width: '100px',
                padding: '12px',
                background: copied ? '#16a34a' : '#4f46e5',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            <div>
              <strong style={{ color: '#16a34a' }}>Total Referrals:</strong>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                {referralStats.totalReferrals}
              </div>
            </div>
            <div>
              <strong style={{ color: '#16a34a' }}>Total Earned:</strong>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                {referralStats.totalEarned.toFixed(1)} points
              </div>
            </div>
            <div>
              <strong style={{ color: '#16a34a' }}>Commission Rate:</strong>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                7% Forever
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '24px',
          background: 'white',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflowX: 'auto'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: '0 0 auto',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab.id ? '#6366f1' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#6b7280',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scanner Tab */}
        {activeTab === 'scanner' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '8px'
            }}>
              🔍 Scan a Digital Asset
            </h2>
            <p style={{
              color: '#6b7280',
              marginBottom: '32px',
              fontSize: '16px'
            }}>
              Analyze your digital assets for quantum vulnerabilities
            </p>

            {/* Asset Type Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '12px'
              }}>
                Asset Type:
              </label>
              <select
                value={selectedAssetType}
                onChange={(e) => setSelectedAssetType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  background: 'white'
                }}
              >
                {assetTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Asset Input */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '12px'
              }}>
                Address or Link:
              </label>
              <input
                type="text"
                value={assetInput}
                onChange={(e) => setAssetInput(e.target.value)}
                placeholder="Enter asset address or link"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
                disabled={scanning}
              />
            </div>

            {/* Scan Button */}
            <button
              onClick={handleScan}
              disabled={scanning || !assetInput.trim() || userPoints < 10}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '8px',
                border: 'none',
                background: scanning || userPoints < 10 ? '#d1d5db' : '#6366f1',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: scanning || userPoints < 10 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {scanning ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Scanning...
                </>
              ) : userPoints < 10 ? (
                'Insufficient Points (Need 10 points)'
              ) : (
                'Start Scan (10 points)'
              )}
            </button>

            {userPoints < 10 && (
              <div style={{
                marginTop: '16px',
                padding: '16px',
                background: '#fef3c7',
                borderRadius: '8px',
                border: '1px solid #f59e0b',
                color: '#92400e',
                fontSize: '14px'
              }}>
                💡 <strong>Need more points?</strong> Share your results on Twitter or invite friends to earn points!
              </div>
            )}
          </div>
        )}

        {/* Benefits Tab - Why Choose QuantumSafe? */}
        {activeTab === 'benefits' && (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '40px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              color: '#6366f1',
              marginBottom: '32px',
              fontSize: '2.5rem',
              fontWeight: '700',
              textAlign: 'center',
              background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              🔐 Why Choose QuantumSafe?
            </h2>
            
            {/* Main Benefits Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
              marginBottom: '40px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                padding: '32px',
                borderRadius: '20px',
                border: '2px solid #0ea5e9',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-8px)';
                e.target.style.boxShadow = '0 20px 40px rgba(14, 165, 233, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎁</div>
                <strong style={{ 
                  fontSize: '1.25rem', 
                  color: '#0369a1',
                  display: 'block',
                  marginBottom: '8px'
                }}>5 Free Points</strong>
                <small style={{ 
                  color: '#0284c7',
                  fontSize: '1rem',
                  lineHeight: '1.5'
                }}>Get started with free scanning credits</small>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                padding: '32px',
                borderRadius: '20px',
                border: '2px solid #22c55e',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-8px)';
                e.target.style.boxShadow = '0 20px 40px rgba(34, 197, 94, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
                <strong style={{ 
                  fontSize: '1.25rem', 
                  color: '#15803d',
                  display: 'block',
                  marginBottom: '8px'
                }}>Advanced Scanning</strong>
                <small style={{ 
                  color: '#16a34a',
                  fontSize: '1rem',
                  lineHeight: '1.5'
                }}>Detect 10+ quantum vulnerabilities</small>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
                padding: '32px',
                borderRadius: '20px',
                border: '2px solid #eab308',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-8px)';
                e.target.style.boxShadow = '0 20px 40px rgba(234, 179, 8, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💰</div>
                <strong style={{ 
                  fontSize: '1.25rem', 
                  color: '#a16207',
                  display: 'block',
                  marginBottom: '8px'
                }}>Earn Rewards</strong>
                <small style={{ 
                  color: '#ca8a04',
                  fontSize: '1rem',
                  lineHeight: '1.5'
                }}>Points for scans, referrals & engagement</small>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)',
                padding: '32px',
                borderRadius: '20px',
                border: '2px solid #a855f7',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-8px)';
                e.target.style.boxShadow = '0 20px 40px rgba(168, 85, 247, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌐</div>
                <strong style={{ 
                  fontSize: '1.25rem', 
                  color: '#7c3aed',
                  display: 'block',
                  marginBottom: '8px'
                }}>Web3 Native</strong>
                <small style={{ 
                  color: '#8b5cf6',
                  fontSize: '1rem',
                  lineHeight: '1.5'
                }}>Fully decentralized authentication</small>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Referral System Tab */}
        {activeTab === 'referrals' && (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '40px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              color: '#16a34a',
              marginBottom: '32px',
              fontSize: '2.5rem',
              fontWeight: '700',
              textAlign: 'center'
            }}>
              🔗 Enhanced Referral System
            </h2>
            
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              padding: '32px',
              borderRadius: '16px',
              border: '2px solid #22c55e',
              marginBottom: '32px'
            }}>
              <h3 style={{ color: '#15803d', marginBottom: '16px', fontSize: '1.5rem' }}>
                💰 7% Commission Forever
              </h3>
              <p style={{ color: '#166534', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '24px' }}>
                Earn 7% of all points your referrals earn from any activity, for life! No limits, no expiration.
              </p>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px'
              }}>
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  border: '1px solid #bbf7d0'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👥</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#15803d' }}>
                    {referralStats.totalReferrals}
                  </div>
                  <div style={{ color: '#166534', fontSize: '14px' }}>Total Referrals</div>
                </div>
                
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  border: '1px solid #bbf7d0'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💎</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#15803d' }}>
                    {referralStats.totalEarned.toFixed(1)}
                  </div>
                  <div style={{ color: '#166534', fontSize: '14px' }}>Points Earned</div>
                </div>
                
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  border: '1px solid #bbf7d0'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📈</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#15803d' }}>
                    7%
                  </div>
                  <div style={{ color: '#166534', fontSize: '14px' }}>Commission Rate</div>
                </div>
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <h4 style={{ color: '#334155', marginBottom: '16px' }}>
                🚀 How It Works
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: 'white',
                  borderRadius: '8px'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>📤</span>
                  <div>
                    <strong style={{ color: '#334155' }}>Share Your Link</strong>
                    <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                      Copy and share your unique referral link
                    </p>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: 'white',
                  borderRadius: '8px'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>👥</span>
                  <div>
                    <strong style={{ color: '#334155' }}>Friends Join</strong>
                    <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                      They sign up using your link
                    </p>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: 'white',
                  borderRadius: '8px'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>💰</span>
                  <div>
                    <strong style={{ color: '#334155' }}>Earn Forever</strong>
                    <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                      Get 7% of all their points, forever
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ambassador Program Tab */}
        {activeTab === 'ambassadors' && (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '40px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              color: '#fbbf24',
              marginBottom: '32px',
              fontSize: '2.5rem',
              fontWeight: '700',
              textAlign: 'center'
            }}>
              👑 Ambassador Program
            </h2>
            
            <div style={{
              background: 'linear-gradient(135deg, #fef7cd 0%, #fef3c7 100%)',
              padding: '32px',
              borderRadius: '16px',
              border: '2px solid #f59e0b',
              marginBottom: '32px',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#92400e', marginBottom: '16px' }}>
                Your Current Tier: <span style={{ color: '#d97706' }}>
                  {ambassadorTier === 'none' ? 'Not Qualified' : 
                   ambassadorTier.charAt(0).toUpperCase() + ambassadorTier.slice(1)}
                </span>
              </h3>
              <p style={{ color: '#a16207', fontSize: '1.1rem' }}>
                Become an ambassador and earn exclusive bonuses on all your activities!
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px'
            }}>
              {/* Bronze Tier */}
              <div style={{
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                padding: '32px',
                borderRadius: '16px',
                border: '2px solid #cd7f32',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🥉</div>
                <h3 style={{ color: '#cd7f32', marginBottom: '16px', fontSize: '1.5rem' }}>
                  Bronze Ambassador
                </h3>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ color: '#7f1d1d', marginBottom: '8px' }}>Requirements:</div>
                  <div style={{ color: '#991b1b', fontSize: '14px' }}>
                    • 10 referrals<br/>
                    • 500 points<br/>
                    • 5 social posts
                  </div>
                </div>
                <div style={{
                  background: 'rgba(205, 127, 50, 0.2)',
                  padding: '16px',
                  borderRadius: '8px',
                  color: '#cd7f32',
                  fontWeight: 'bold',
                  fontSize: '1.2rem'
                }}>
                  10% Bonus on All Points
                </div>
              </div>

              {/* Silver Tier */}
              <div style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                padding: '32px',
                borderRadius: '16px',
                border: '2px solid #c0c0c0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🥈</div>
                <h3 style={{ color: '#6b7280', marginBottom: '16px', fontSize: '1.5rem' }}>
                  Silver Ambassador
                </h3>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ color: '#374151', marginBottom: '8px' }}>Requirements:</div>
                  <div style={{ color: '#4b5563', fontSize: '14px' }}>
                    • 25 referrals<br/>
                    • 1500 points<br/>
                    • 15 social posts
                  </div>
                </div>
                <div style={{
                  background: 'rgba(192, 192, 192, 0.3)',
                  padding: '16px',
                  borderRadius: '8px',
                  color: '#6b7280',
                  fontWeight: 'bold',
                  fontSize: '1.2rem'
                }}>
                  15% Bonus on All Points
                </div>
              </div>

              {/* Gold Tier */}
              <div style={{
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                padding: '32px',
                borderRadius: '16px',
                border: '2px solid #ffd700',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🥇</div>
                <h3 style={{ color: '#d97706', marginBottom: '16px', fontSize: '1.5rem' }}>
                  Gold Ambassador
                </h3>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ color: '#92400e', marginBottom: '8px' }}>Requirements:</div>
                  <div style={{ color: '#a16207', fontSize: '14px' }}>
                    • 50 referrals<br/>
                    • 5000 points<br/>
                    • 30 social posts
                  </div>
                </div>
                <div style={{
                  background: 'rgba(255, 215, 0, 0.3)',
                  padding: '16px',
                  borderRadius: '8px',
                  color: '#d97706',
                  fontWeight: 'bold',
                  fontSize: '1.2rem'
                }}>
                  25% Bonus on All Points
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Social Media Points Tab */}
        {activeTab === 'social' && (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '40px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              color: '#3b82f6',
              marginBottom: '32px',
              fontSize: '2.5rem',
              fontWeight: '700',
              textAlign: 'center'
            }}>
              📱 Enhanced Social Media Points System
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px'
            }}>
              {/* Twitter */}
              <div style={{
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                padding: '24px',
                borderRadius: '16px',
                border: '2px solid #1da1f2'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '2rem' }}>🐦</span>
                  <h3 style={{ color: '#1e40af', margin: 0 }}>Twitter</h3>
                </div>
                <div style={{ color: '#1e3a8a', marginBottom: '16px' }}>
                  <div><strong>3 points</strong> per tweet</div>
                  <div><strong>0.05 points</strong> per engagement</div>
                </div>
                <div style={{
                  background: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#1e40af'
                }}>
                  Posts: {socialStats.twitter.posts} | 
                  Engagement: {socialStats.twitter.engagement} | 
                  Points: {socialStats.twitter.points.toFixed(1)}
                </div>
              </div>

              {/* Telegram */}
              <div style={{
                background: 'linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%)',
                padding: '24px',
                borderRadius: '16px',
                border: '2px solid #0088cc'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '2rem' }}>📱</span>
                  <h3 style={{ color: '#0277bd', margin: 0 }}>Telegram</h3>
                </div>
                <div style={{ color: '#01579b', marginBottom: '16px' }}>
                  <div><strong>5 points</strong> per post</div>
                  <div><strong>0.01 points</strong> per interaction</div>
                </div>
                <div style={{
                  background: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#0277bd'
                }}>
                  Posts: {socialStats.telegram.posts} | 
                  Engagement: {socialStats.telegram.engagement} | 
                  Points: {socialStats.telegram.points.toFixed(1)}
                </div>
              </div>

              {/* YouTube */}
              <div style={{
                background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                padding: '24px',
                borderRadius: '16px',
                border: '2px solid #ff0000'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '2rem' }}>📺</span>
                  <h3 style={{ color: '#c62828', margin: 0 }}>YouTube</h3>
                </div>
                <div style={{ color: '#b71c1c', marginBottom: '16px' }}>
                  <div><strong>17 points</strong> per video</div>
                  <div><strong>0.3 points</strong> per engagement</div>
                </div>
                <div style={{
                  background: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#c62828'
                }}>
                  Videos: {socialStats.youtube.videos} | 
                  Engagement: {socialStats.youtube.engagement} | 
                  Points: {socialStats.youtube.points.toFixed(1)}
                </div>
              </div>

              {/* LinkedIn */}
              <div style={{
                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                padding: '24px',
                borderRadius: '16px',
                border: '2px solid #0077b5'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '2rem' }}>💼</span>
                  <h3 style={{ color: '#0d47a1', margin: 0 }}>LinkedIn</h3>
                </div>
                <div style={{ color: '#1565c0', marginBottom: '16px' }}>
                  <div><strong>22 points</strong> per article</div>
                  <div><strong>0.7 points</strong> per engagement</div>
                </div>
                <div style={{
                  background: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#0d47a1'
                }}>
                  Articles: {socialStats.linkedin.articles} | 
                  Engagement: {socialStats.linkedin.engagement} | 
                  Points: {socialStats.linkedin.points.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '24px'
            }}>
              📋 Scan History
            </h3>
            
            {scanResults.length > 0 ? (
              <div style={{ display: 'grid', gap: '16px' }}>
                {scanResults.map((scan) => (
                  <div 
                    key={scan.id} 
                    style={{
                      background: '#f9fafb',
                      borderRadius: '8px',
                      padding: '20px',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#6366f1',
                          marginBottom: '4px'
                        }}>
                          {scan.asset_type.charAt(0).toUpperCase() + scan.asset_type.slice(1)}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280'
                        }}>
                          {new Date(scan.scanned_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: scan.quantum_risk === 'high' ? '#fef2f2' : 
                                   scan.quantum_risk === 'medium' ? '#fef3c7' : '#f0fdf4',
                        color: scan.quantum_risk === 'high' ? '#dc2626' : 
                               scan.quantum_risk === 'medium' ? '#d97706' : '#16a34a'
                      }}>
                        {scan.quantum_risk.toUpperCase()} RISK
                      </div>
                    </div>
                    
                    <div style={{
                      fontSize: '14px',
                      color: '#374151',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                      background: 'white',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #e5e7eb'
                    }}>
                      {scan.asset_address}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <h3 style={{ fontSize: '18px', margin: 0, color: '#111827' }}>
                  No Scans Yet
                </h3>
                <p style={{ fontSize: '14px', margin: 0 }}>
                  Start your first quantum security scan to protect your digital assets!
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'marketing' && <PromoTweets />}

        {/* Scan Result Display */}
        {currentScanResult && (
          <ScanResult 
            result={currentScanResult} 
            assetType={selectedAssetType}
            user={user}
          />
        )}

        {/* Enhanced Points System Info */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginTop: '24px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '16px'
          }}>
            🎁 Enhanced Points & Rewards System
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            <div>🐦 <strong>Twitter:</strong> 3 points per tweet + 0.05 per engagement</div>
            <div>📱 <strong>Telegram:</strong> 5 points per post + 0.01 per interaction</div>
            <div>📺 <strong>YouTube:</strong> 17 points per video + 0.3 per engagement</div>
            <div>💼 <strong>LinkedIn:</strong> 22 points per article + 0.7 per engagement</div>
            <div>🔗 <strong>Referrals:</strong> 7% commission forever</div>
            <div>🔍 <strong>Each scan:</strong> 10 points</div>
          </div>
        </div>

        {/* Multi-Chain Payment Modal */}
        <MultiChainPaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          serviceType={selectedService}
          onPaymentSuccess={handlePaymentSuccess}
        />

        {/* Wallet Security Scanner */}
        {web3Address && web3Network && (
          <div style={{ marginTop: '32px' }}>
            <h2 style={{ color: '#4f8cff', marginBottom: '16px' }}>Scan your wallet</h2>
            <WalletSecurityScanner
              walletAddress={web3Address}
              networkKey={web3Network}
              provider={web3Provider}
            />
          </div>
        )}

        {/* Wallet Connect Button */}
        {!web3Address && (
          <div style={{ textAlign: 'center', margin: '32px 0' }}>
            <button
              onClick={handleConnectWallet}
              style={{
                padding: '16px 32px',
                fontSize: '18px',
                borderRadius: '10px',
                background: 'linear-gradient(90deg, #4f8cff, #52c41a)',
                color: '#fff',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 16px #4f8cff33'
              }}
            >
              Connect Wallet
            </button>
          </div>
        )}
      </div>

      <ToastContainer position="top-center" autoClose={4000} hideProgressBar newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
}