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

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalThreatsDetected: 0,
    criticalVulnerabilities: 0,
    assetsProtected: 0,
    riskReduction: 0
  });

  // Enhanced wallet connection state
  const [connectedWalletAddress, setConnectedWalletAddress] = useState('');
  const [connectedNetworkSymbol, setConnectedNetworkSymbol] = useState('');
  const [web3Provider, setWeb3Provider] = useState(null);
  const [web3Address, setWeb3Address] = useState('');
  const [web3Network, setWeb3Network] = useState('');
  const [currentNetworkType, setCurrentNetworkType] = useState('ETH');
  const [walletConnecting, setWalletConnecting] = useState(false);

  // Network configurations for real wallet integration
  const SUPPORTED_NETWORKS = {
    ETH: {
      name: 'Ethereum',
      symbol: 'ETH',
      chainId: 1,
      rpcUrl: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      icon: '⟠'
    },
    MATIC: {
      name: 'Polygon',
      symbol: 'MATIC', 
      chainId: 137,
      rpcUrl: 'https://polygon-rpc.com',
      icon: '⬟'
    },
    BNB: {
      name: 'BSC',
      symbol: 'BNB',
      chainId: 56,
      rpcUrl: 'https://bsc-dataseed.binance.org',
      icon: '🟡'
    }
  };

  // Enhanced wallet connection with real network detection
  const handleConnectWallet = async () => {
    if (walletConnecting) return;
    
    setWalletConnecting(true);
    try {
      if (!window.ethereum) {
        toast.error('MetaMask is required. Please install MetaMask from metamask.io');
        return;
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const web3modal = new Web3Modal({
        cacheProvider: true,
        providerOptions: {}
      });
      
      const instance = await web3modal.connect();
      const provider = new ethers.BrowserProvider(instance);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      
      // Detect actual network
      let networkSymbol = 'ETH';
      let networkName = 'Ethereum';
      
      switch (Number(network.chainId)) {
        case 1:
          networkSymbol = 'ETH';
          networkName = 'Ethereum';
          break;
        case 137:
          networkSymbol = 'MATIC';
          networkName = 'Polygon';
          break;
        case 56:
          networkSymbol = 'BNB';
          networkName = 'BSC';
          break;
        default:
          networkSymbol = 'ETH';
          networkName = 'Ethereum';
      }
      
      setWeb3Provider(provider);
      setWeb3Address(address);
      setWeb3Network(networkSymbol);
      setCurrentNetworkType(networkSymbol);
      setConnectedWalletAddress(address);
      setConnectedNetworkSymbol(networkSymbol);
      
      toast.success(`Connected to ${networkName} network`);
      
      // Listen for network and account changes
      if (window.ethereum) {
        window.ethereum.on('chainChanged', handleChainChanged);
        window.ethereum.on('accountsChanged', handleAccountsChanged);
      }
      
    } catch (err) {
      console.error('Wallet connection error:', err);
      if (err.code === 4001) {
        toast.warn('Wallet connection cancelled by user');
      } else if (err.code === -32002) {
        toast.warn('MetaMask is already processing a request. Please check MetaMask.');
      } else {
        toast.error('Failed to connect wallet. Please try again.');
      }
    } finally {
      setWalletConnecting(false);
    }
  };

  // Handle network changes
  const handleChainChanged = async (chainId) => {
    try {
      const chainIdNum = parseInt(chainId, 16);
      let networkSymbol = 'ETH';
      let networkName = 'Ethereum';
      
      switch (chainIdNum) {
        case 1:
          networkSymbol = 'ETH';
          networkName = 'Ethereum';
          break;
        case 137:
          networkSymbol = 'MATIC';
          networkName = 'Polygon';
          break;
        case 56:
          networkSymbol = 'BNB';
          networkName = 'BSC';
          break;
        default:
          networkSymbol = 'ETH';
          networkName = 'Ethereum';
      }
      
      setWeb3Network(networkSymbol);
      setCurrentNetworkType(networkSymbol);
      setConnectedNetworkSymbol(networkSymbol);
      
      // Update provider
      if (web3Provider) {
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        setWeb3Provider(newProvider);
      }
      
      toast.info(`Switched to ${networkName} network`);
    } catch (error) {
      console.error('Error handling chain change:', error);
    }
  };

  // Handle account changes
  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      // User disconnected wallet
      setWeb3Provider(null);
      setWeb3Address('');
      setWeb3Network('');
      setConnectedWalletAddress('');
      setConnectedNetworkSymbol('');
      setCurrentNetworkType('ETH');
      toast.warn('Wallet disconnected');
    } else {
      // User switched accounts
      setWeb3Address(accounts[0]);
      setConnectedWalletAddress(accounts[0]);
      toast.info('Account switched');
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
      generateReferralLink();
    }
  }, [user]);

  useEffect(() => {
    // Auto-connect if previously connected
    const initWeb3 = async () => {
      try {
        if (window.ethereum && window.ethereum.selectedAddress) {
          await handleConnectWallet();
        }
      } catch (err) {
        console.log('Auto-connect failed:', err);
      }
    };
    initWeb3();

    // Cleanup event listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const generateReferralLink = () => {
    if (user?.id && web3Address) {
      const baseUrl = 'https://quantumsafeio.github.io/QuantumSafe/';
      const link = `${baseUrl}?ref=${user.id}&wallet=${web3Address}`;
      setReferralLink(link);
    } else if (user?.id) {
      const baseUrl = 'https://quantumsafeio.github.io/QuantumSafe/';
      const link = `${baseUrl}?ref=${user.id}`;
      setReferralLink(link);
    }
  };

  // Update referral link when wallet connects
  useEffect(() => {
    if (user?.id) {
      generateReferralLink();
    }
  }, [user?.id, web3Address]);

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
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
        .select('points')
        .eq('user_id', user.id)
        .single();

      const { data: points } = await Promise.race([pointsPromise, timeout]);
      setUserPoints(points?.points || 0);

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
      toast.error('Please enter an asset address to scan');
      return;
    }

    if (userPoints < 10) {
      toast.error('You need at least 10 points to perform a scan');
      return;
    }

    setScanning(true);
    setCurrentScanResult(null);
    setError('');

    try {
      const scanTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Scan timeout')), 30000)
      );

      // Pass wallet and network info for unique scanning
      const scanPromise = scanAsset(
        selectedAssetType, 
        assetInput.trim(),
        web3Address || connectedWalletAddress,
        currentNetworkType
      );
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

      // Award points using the new system
      await supabase.rpc('award_points', {
        user_uuid: user.id,
        points_amount: -10,
        point_source: 'scan',
        point_platform: 'app',
        point_metadata: {
          asset_type: selectedAssetType,
          asset_address: assetInput.trim(),
          scan_id: scanData.id,
          network_type: currentNetworkType,
          wallet_address: web3Address || connectedWalletAddress
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
      toast.success('Scan completed successfully!');
      
    } catch (error) {
      console.error('Scan error:', error);
      setError('Failed to perform scan. Please try again.');
      toast.error('Scan failed. Please try again.');
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
    toast.success('Payment completed successfully!');
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
    { id: 'analytics', label: 'Security Analytics', icon: '📊' },
    { id: 'history', label: 'Scan History', icon: '📋' },
    { id: 'threats', label: 'Threat Intelligence', icon: '🛡️' },
    { id: 'points', label: 'Points & Rewards', icon: '💎' }
  ];

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
        gap: '20px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid rgba(0, 245, 255, 0.3)',
          borderTop: '4px solid #00f5ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{
          color: '#00f5ff',
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
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'rgba(255, 0, 0, 0.1)',
          border: '2px solid rgba(255, 0, 0, 0.3)',
          borderRadius: '15px',
          padding: '30px',
          maxWidth: '500px'
        }}>
          <h1 style={{
            color: '#ff4757',
            fontSize: '2rem',
            marginBottom: '20px'
          }}>
            ⚠️ Loading Error
          </h1>
          <p style={{
            color: '#ffffff',
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
              background: 'linear-gradient(45deg, #00f5ff, #ff00ff)',
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
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#ffffff'
    }}>
      {/* Professional Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Logo Section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #00f5ff, #ff00ff)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              boxShadow: '0 8px 32px rgba(0, 245, 255, 0.3)'
            }}>
              🛡️
            </div>
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: '700',
                background: 'linear-gradient(45deg, #00f5ff, #ff00ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
                lineHeight: 1
              }}>
                QuantumSafe
              </h1>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Quantum Security Platform
              </p>
            </div>
          </div>

          {/* User Info & Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            {/* Wallet Connection Status */}
            {web3Address ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: '#10b981',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }} />
                <div>
                  <div style={{
                    fontSize: '12px',
                    color: '#10b981',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    {SUPPORTED_NETWORKS[currentNetworkType]?.icon} {currentNetworkType} Connected
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontFamily: 'monospace'
                  }}>
                    {web3Address.slice(0, 6)}...{web3Address.slice(-4)}
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleConnectWallet}
                disabled={walletConnecting}
                style={{
                  padding: '12px 20px',
                  background: walletConnecting ? 'rgba(107, 114, 128, 0.5)' : 'linear-gradient(45deg, #00f5ff, #0099cc)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: walletConnecting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  boxShadow: walletConnecting ? 'none' : '0 4px 16px rgba(0, 245, 255, 0.3)'
                }}
              >
                {walletConnecting ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Connecting...
                  </>
                ) : (
                  <>
                    🔗 Connect Wallet
                  </>
                )}
              </button>
            )}
            
            {/* User Points Display */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '4px'
            }}>
              <div style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                {user?.email || 'User'}
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                background: 'linear-gradient(45deg, #ffd700, #ffed4e)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                💎 {userPoints.toLocaleString()} Points
              </div>
            </div>
            
            {/* Sign Out Button */}
            <button
              onClick={signOut}
              style={{
                padding: '10px 16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                e.target.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.color = 'rgba(255, 255, 255, 0.8)';
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '32px',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '6px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '16px 20px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === tab.id ? 'linear-gradient(45deg, #00f5ff, #0099cc)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: activeTab === tab.id ? '0 4px 16px rgba(0, 245, 255, 0.3)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'rgba(255, 255, 255, 0.7)';
                }
              }}
            >
              <span style={{ fontSize: '18px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scanner Tab */}
        {activeTab === 'scanner' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            padding: '40px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '40px'
            }}>
              <h2 style={{
                fontSize: '32px',
                fontWeight: '700',
                background: 'linear-gradient(45deg, #00f5ff, #ff00ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '12px'
              }}>
                🔍 Quantum Security Scanner
              </h2>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '18px',
                maxWidth: '600px',
                margin: '0 auto',
                lineHeight: '1.6'
              }}>
                Advanced AI-powered analysis to detect quantum vulnerabilities in your digital assets
              </p>
            </div>

            {/* Wallet Connection Status in Scanner */}
            {web3Address && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(45deg, #10b981, #059669)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  ✅
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    color: '#10b981',
                    fontWeight: '700',
                    fontSize: '18px',
                    marginBottom: '4px'
                  }}>
                    Wallet Connected - {SUPPORTED_NETWORKS[currentNetworkType]?.name} Network
                  </div>
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '14px',
                    fontFamily: 'monospace'
                  }}>
                    {web3Address}
                  </div>
                </div>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  color: '#10b981',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {SUPPORTED_NETWORKS[currentNetworkType]?.icon} {currentNetworkType}
                </div>
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '32px',
              marginBottom: '32px'
            }}>
              {/* Asset Type Selection */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: '12px'
                }}>
                  Asset Type:
                </label>
                <select
                  value={selectedAssetType}
                  onChange={(e) => setSelectedAssetType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    fontSize: '16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  {assetTypes.map((type) => (
                    <option key={type.value} value={type.value} style={{ background: '#1a1a2e', color: '#ffffff' }}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Asset Input */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#ffffff',
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
                    padding: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    fontSize: '16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                    backdropFilter: 'blur(10px)'
                  }}
                  disabled={scanning}
                />
              </div>
            </div>

            {/* Scan Button */}
            <button
              onClick={handleScan}
              disabled={scanning || !assetInput.trim() || userPoints < 10}
              style={{
                width: '100%',
                padding: '20px',
                borderRadius: '16px',
                border: 'none',
                background: scanning || userPoints < 10 ? 
                  'rgba(107, 114, 128, 0.5)' : 
                  'linear-gradient(45deg, #00f5ff, #ff00ff)',
                color: 'white',
                fontSize: '18px',
                fontWeight: '700',
                cursor: scanning || userPoints < 10 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                transition: 'all 0.3s ease',
                boxShadow: scanning || userPoints < 10 ? 
                  'none' : 
                  '0 8px 32px rgba(0, 245, 255, 0.4)',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              {scanning ? (
                <>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '3px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Scanning Asset...
                </>
              ) : userPoints < 10 ? (
                <>
                  ⚠️ Insufficient Points (Need 10 points)
                </>
              ) : (
                <>
                  🚀 Start Quantum Scan (10 points)
                </>
              )}
            </button>

            {userPoints < 10 && (
              <div style={{
                marginTop: '24px',
                padding: '20px',
                background: 'rgba(255, 165, 0, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 165, 0, 0.3)',
                color: '#ffa502',
                fontSize: '16px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>💡</div>
                <strong>Need more points?</strong> Share your results on social media, invite friends, or engage with our community to earn points!
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            padding: '40px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)'
          }}>
            <h3 style={{
              fontSize: '28px',
              fontWeight: '700',
              background: 'linear-gradient(45deg, #00f5ff, #ff00ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '32px',
              textAlign: 'center'
            }}>
              📋 Scan History
            </h3>
            
            {scanResults.length > 0 ? (
              <div style={{ display: 'grid', gap: '20px' }}>
                {scanResults.map((scan) => (
                  <div 
                    key={scan.id} 
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '16px',
                      padding: '24px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '16px'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#00f5ff',
                          marginBottom: '6px'
                        }}>
                          {scan.asset_type.charAt(0).toUpperCase() + scan.asset_type.slice(1)} Scan
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: 'rgba(255, 255, 255, 0.6)'
                        }}>
                          {new Date(scan.scanned_at).toLocaleDateString()} • {new Date(scan.scanned_at).toLocaleTimeString()}
                        </div>
                      </div>
                      
                      <div style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        background: scan.quantum_risk === 'high' ? 'rgba(239, 68, 68, 0.2)' : 
                                   scan.quantum_risk === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: scan.quantum_risk === 'high' ? '#ef4444' : 
                               scan.quantum_risk === 'medium' ? '#f59e0b' : '#10b981',
                        border: `1px solid ${scan.quantum_risk === 'high' ? '#ef4444' : 
                                scan.quantum_risk === 'medium' ? '#f59e0b' : '#10b981'}40`
                      }}>
                        {scan.quantum_risk === 'high' ? '🚨' : scan.quantum_risk === 'medium' ? '⚠️' : '✅'} {scan.quantum_risk} Risk
                      </div>
                    </div>
                    
                    <div style={{
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      {scan.asset_address}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '80px 20px',
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔍</div>
                <h3 style={{ fontSize: '24px', margin: '0 0 12px 0', color: '#ffffff' }}>
                  No Scans Yet
                </h3>
                <p style={{ fontSize: '16px', margin: 0, lineHeight: '1.6' }}>
                  Start your first quantum security scan to protect your digital assets and earn points!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Points & Rewards Tab */}
        {activeTab === 'points' && <PromoTweets />}

        {/* Scan Result Display */}
        {currentScanResult && (
          <ScanResult 
            result={currentScanResult} 
            assetType={selectedAssetType}
            user={user}
          />
        )}

        {/* Referral Section - Always visible at bottom */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '20px',
          padding: '32px',
          marginTop: '40px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            <h3 style={{
              fontSize: '28px',
              fontWeight: '700',
              background: 'linear-gradient(45deg, #ffd700, #ffed4e)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px'
            }}>
              🔗 Your Enhanced Referral Link
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '16px',
              margin: 0
            }}>
              Earn 7% of all points your referrals generate forever!
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <input
              type="text"
              value={referralLink}
              readOnly
              style={{
                flex: 1,
                padding: '16px 20px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                fontSize: '14px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                fontFamily: 'monospace',
                backdropFilter: 'blur(10px)'
              }}
            />
            <button
              onClick={copyReferralLink}
              style={{
                padding: '16px 24px',
                background: copied ? 
                  'linear-gradient(45deg, #10b981, #059669)' : 
                  'linear-gradient(45deg, #00f5ff, #0099cc)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 16px rgba(0, 245, 255, 0.3)'
              }}
            >
              {copied ? '✅ Copied!' : '📋 Copy Link'}
            </button>
          </div>

          {web3Address && (
            <div style={{
              marginTop: '20px',
              padding: '16px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              textAlign: 'center'
            }}>
              <div style={{
                color: '#10b981',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                ✨ Enhanced Referral: Your link is connected to wallet {web3Address.slice(0, 8)}...{web3Address.slice(-6)}
              </div>
            </div>
          )}
        </div>

        {/* Ambassador Program Section - Always visible */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '20px',
          padding: '32px',
          marginTop: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            <h3 style={{
              fontSize: '28px',
              fontWeight: '700',
              background: 'linear-gradient(45deg, #ffd700, #ffed4e)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px'
            }}>
              👑 Ambassador Program
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '16px',
              margin: 0
            }}>
              Unlock exclusive benefits and earn more points as you grow with QuantumSafe
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {/* Bronze Tier */}
            <div style={{
              background: 'rgba(205, 127, 50, 0.1)',
              border: '1px solid rgba(205, 127, 50, 0.3)',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-4px)';
              e.target.style.boxShadow = '0 12px 32px rgba(205, 127, 50, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🥉</div>
              <h4 style={{
                color: '#cd7f32',
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '16px'
              }}>
                Bronze Ambassador
              </h4>
              <div style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '14px',
                marginBottom: '20px',
                lineHeight: '1.6'
              }}>
                • 10+ Referrals<br/>
                • 500+ Points<br/>
                • 5+ Social Posts
              </div>
              <div style={{
                color: '#cd7f32',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                10% Bonus on all points
              </div>
            </div>

            {/* Silver Tier */}
            <div style={{
              background: 'rgba(192, 192, 192, 0.1)',
              border: '1px solid rgba(192, 192, 192, 0.3)',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-4px)';
              e.target.style.boxShadow = '0 12px 32px rgba(192, 192, 192, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🥈</div>
              <h4 style={{
                color: '#c0c0c0',
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '16px'
              }}>
                Silver Ambassador
              </h4>
              <div style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '14px',
                marginBottom: '20px',
                lineHeight: '1.6'
              }}>
                • 25+ Referrals<br/>
                • 1,500+ Points<br/>
                • 15+ Social Posts
              </div>
              <div style={{
                color: '#c0c0c0',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                15% Bonus + Monthly rewards
              </div>
            </div>

            {/* Gold Tier */}
            <div style={{
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-4px)';
              e.target.style.boxShadow = '0 12px 32px rgba(255, 215, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🥇</div>
              <h4 style={{
                color: '#ffd700',
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '16px'
              }}>
                Gold Ambassador
              </h4>
              <div style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '14px',
                marginBottom: '20px',
                lineHeight: '1.6'
              }}>
                • 50+ Referrals<br/>
                • 5,000+ Points<br/>
                • 30+ Social Posts
              </div>
              <div style={{
                color: '#ffd700',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                25% Bonus + Premium NFTs
              </div>
            </div>
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
            <WalletSecurityScanner
              walletAddress={web3Address}
              networkKey={web3Network}
              provider={web3Provider}
            />
          </div>
        )}
      </div>

      <ToastContainer 
        position="top-center" 
        autoClose={4000} 
        hideProgressBar 
        newestOnTop 
        closeOnClick 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover 
        theme="dark"
        toastStyle={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#ffffff'
        }}
      />
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #00f5ff, #ff00ff);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #0099cc, #cc00cc);
        }
      `}</style>
    </div>
  );
}