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
    if (user?.id) {
      const baseUrl = 'https://quantumsafeio.github.io/QuantumSafe/';
      const link = `${baseUrl}?ref=${user.id}`;
      setReferralLink(link);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
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
    { id: 'marketing', label: 'Points & Rewards', icon: '💎' }
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

          {/* User Info & Wallet Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* Wallet Connection Status */}
            {web3Address ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: '#16a34a',
                  borderRadius: '50%'
                }} />
                <span style={{
                  fontSize: '12px',
                  color: '#16a34a',
                  fontWeight: '600'
                }}>
                  {SUPPORTED_NETWORKS[currentNetworkType]?.icon} {currentNetworkType} Connected
                </span>
              </div>
            ) : (
              <button
                onClick={handleConnectWallet}
                disabled={walletConnecting}
                style={{
                  padding: '8px 16px',
                  background: walletConnecting ? '#9ca3af' : '#6366f1',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: walletConnecting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {walletConnecting ? (
                  <>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Connecting...
                  </>
                ) : (
                  'Connect Wallet'
                )}
              </button>
            )}
            
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
        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '24px',
          background: 'white',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
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
                gap: '8px'
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

            {/* Wallet Connection Status in Scanner */}
            {web3Address && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    background: '#16a34a',
                    borderRadius: '50%'
                  }} />
                  <span style={{
                    color: '#16a34a',
                    fontWeight: '600',
                    fontSize: '16px'
                  }}>
                    Wallet Connected - {SUPPORTED_NETWORKS[currentNetworkType]?.name} Network
                  </span>
                </div>
                <div style={{
                  color: '#15803d',
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}>
                  {web3Address}
                </div>
              </div>
            )}

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
                'Start Quantum Scan (10 points)'
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
                💡 <strong>Need more points?</strong> Share your results on social media or invite friends to earn points!
              </div>
            )}
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
      />
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}