import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { scanAsset } from '../services/scanner';
import ScanResult from './ScanResult';
import PromoTweets from './PromoTweets';
import MultiChainPaymentModal from './MultiChainPaymentModal';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [scanResults, setScanResults] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Scanning state
  const [scanning, setScanning] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState('contract');
  const [assetInput, setAssetInput] = useState('');
  const [currentScanResult, setCurrentScanResult] = useState(null);
  const [activeTab, setActiveTab] = useState('scanner');

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalThreatsDetected: 0,
    criticalVulnerabilities: 0,
    assetsProtected: 0,
    riskReduction: 0
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
      calculateAnalytics();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setUserProfile(profile);

      // Fetch user points
      const { data: points } = await supabase
        .from('user_points')
        .select('points')
        .eq('user_id', user.id)
        .single();
      
      setUserPoints(points?.points || 0);

      // Fetch recent scan results
      const { data: scans } = await supabase
        .from('scan_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      setScanResults(scans || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = async () => {
    try {
      const { data: scans } = await supabase
        .from('scan_results')
        .select('*')
        .eq('user_id', user.id);

      if (scans) {
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
      }
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

    try {
      // Perform the scan
      const result = await scanAsset(selectedAssetType, assetInput.trim());
      
      // Save scan result to database
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

      // Deduct points
      await supabase
        .from('user_points')
        .update({ points: userPoints - 10 })
        .eq('user_id', user.id);

      // Add points transaction
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

      // Update local state
      setUserPoints(prev => prev - 10);
      setCurrentScanResult(result);
      
      // Update scan count in profile
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

      // Refresh data
      fetchUserData();
      calculateAnalytics();
      
    } catch (error) {
      console.error('Scan error:', error);
      alert('Failed to perform scan. Please try again.');
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
    // Refresh user data to show updated points
    fetchUserData();
  };

  const assetTypes = [
    { 
      value: 'contract', 
      label: 'Smart Contract', 
      icon: '🔐', 
      points: 10,
      description: 'Scan smart contracts for quantum vulnerabilities',
      riskLevel: 'High'
    },
    { 
      value: 'wallet', 
      label: 'Wallet', 
      icon: '💰', 
      points: 10,
      description: 'Analyze wallet security against quantum threats',
      riskLevel: 'High'
    },
    { 
      value: 'nft', 
      label: 'NFT Collection', 
      icon: '🎨', 
      points: 10,
      description: 'Verify NFT authenticity and quantum resistance',
      riskLevel: 'Medium'
    },
    { 
      value: 'memecoin', 
      label: 'Token', 
      icon: '🚀', 
      points: 10,
      description: 'Evaluate token security and consensus mechanisms',
      riskLevel: 'Medium'
    },
    { 
      value: 'app', 
      label: 'DApp', 
      icon: '📱', 
      points: 10,
      description: 'Comprehensive DApp security assessment',
      riskLevel: 'High'
    }
  ];

  const tabs = [
    { id: 'scanner', label: 'Quantum Scanner', icon: '🔍' },
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
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
        gap: '20px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
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
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header with Glowing Effect */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          padding: '25px 30px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <div>
            <h1 style={{
              fontSize: '2.8rem',
              background: 'linear-gradient(45deg, #00f5ff, #ff00ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold',
              margin: 0,
              letterSpacing: '-0.02em',
              animation: 'glow 2s ease-in-out infinite alternate',
              textShadow: '0 0 20px rgba(0, 245, 255, 0.5)'
            }}>
              🛡️ QuantumSafe
            </h1>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.8)', 
              margin: '8px 0 0 0',
              fontSize: '16px'
            }}>
              Enterprise Quantum Security Platform
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              marginTop: '10px'
            }}>
              <div style={{
                background: 'rgba(0, 255, 136, 0.2)',
                color: '#00ff88',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                border: '1px solid rgba(0, 255, 136, 0.3)',
                animation: 'pulse 2s infinite'
              }}>
                ✅ ACTIVE
              </div>
              <div style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '14px'
              }}>
                User ID: {user?.id?.slice(0, 8)}...
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              background: 'rgba(0, 245, 255, 0.1)',
              padding: '15px 20px',
              borderRadius: '15px',
              border: '1px solid rgba(0, 245, 255, 0.3)',
              textAlign: 'center'
            }}>
              <div style={{ 
                color: '#00f5ff', 
                fontSize: '24px', 
                fontWeight: 'bold',
                animation: 'glow 2s ease-in-out infinite alternate'
              }}>
                {userPoints}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px' }}>
                POINTS
              </div>
            </div>
            <button
              onClick={signOut}
              style={{
                padding: '12px 24px',
                background: 'rgba(255, 71, 87, 0.2)',
                border: '1px solid rgba(255, 71, 87, 0.5)',
                borderRadius: '12px',
                color: '#ff4757',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 71, 87, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 71, 87, 0.2)';
              }}
            >
              🚪 Sign Out
            </button>
          </div>
        </div>

        {/* Key Metrics Dashboard */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '25px',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #00f5ff, #0099cc)'
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '2.5rem', marginBottom: '5px' }}>🔍</div>
                <h3 style={{ color: '#00f5ff', margin: '0 0 8px 0', fontSize: '16px' }}>
                  Total Scans
                </h3>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                  {userProfile?.total_scans || 0}
                </p>
              </div>
              <div style={{
                background: 'rgba(0, 245, 255, 0.2)',
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                📊
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '25px',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #ff4757, #ff3742)'
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '2.5rem', marginBottom: '5px' }}>🚨</div>
                <h3 style={{ color: '#ff4757', margin: '0 0 8px 0', fontSize: '16px' }}>
                  Threats Detected
                </h3>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                  {analytics.totalThreatsDetected}
                </p>
              </div>
              <div style={{
                background: 'rgba(255, 71, 87, 0.2)',
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                ⚠️
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '25px',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #2ed573, #1dd1a1)'
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '2.5rem', marginBottom: '5px' }}>🛡️</div>
                <h3 style={{ color: '#2ed573', margin: '0 0 8px 0', fontSize: '16px' }}>
                  Assets Protected
                </h3>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                  {analytics.assetsProtected}
                </p>
              </div>
              <div style={{
                background: 'rgba(46, 213, 115, 0.2)',
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                ✅
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '25px',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #ffa502, #ff9500)'
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '2.5rem', marginBottom: '5px' }}>📈</div>
                <h3 style={{ color: '#ffa502', margin: '0 0 8px 0', fontSize: '16px' }}>
                  Risk Reduction
                </h3>
                <p style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                  {analytics.riskReduction}%
                </p>
              </div>
              <div style={{
                background: 'rgba(255, 165, 2, 0.2)',
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                💪
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '5px',
          marginBottom: '30px',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '8px',
          borderRadius: '16px',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '15px 20px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === tab.id ? 
                  'rgba(0, 245, 255, 0.2)' : 'transparent',
                color: activeTab === tab.id ? '#00f5ff' : 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.background = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '18px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'scanner' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '25px',
            padding: '35px',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            marginBottom: '30px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              marginBottom: '30px'
            }}>
              <div style={{
                background: 'linear-gradient(45deg, #00f5ff, #0099cc)',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                🔍
              </div>
              <div>
                <h2 style={{
                  color: '#00f5ff',
                  fontSize: '2rem',
                  margin: 0,
                  fontWeight: 'bold'
                }}>
                  Quantum Threat Scanner
                </h2>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  margin: '5px 0 0 0',
                  fontSize: '16px'
                }}>
                  Advanced AI-powered quantum vulnerability detection
                </p>
              </div>
            </div>

            {/* Asset Type Selection */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              {assetTypes.map((type) => (
                <div
                  key={type.value}
                  onClick={() => setSelectedAssetType(type.value)}
                  style={{
                    padding: '25px',
                    borderRadius: '18px',
                    border: selectedAssetType === type.value ? 
                      '2px solid #00f5ff' : '1px solid rgba(255, 255, 255, 0.2)',
                    background: selectedAssetType === type.value ? 
                      'rgba(0, 245, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedAssetType !== type.value) {
                      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedAssetType !== type.value) {
                      e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    marginBottom: '15px'
                  }}>
                    <div style={{
                      fontSize: '2.5rem',
                      background: selectedAssetType === type.value ? 
                        'rgba(0, 245, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      width: '60px',
                      height: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {type.icon}
                    </div>
                    <div>
                      <h3 style={{
                        color: '#ffffff',
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}>
                        {type.label}
                      </h3>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginTop: '5px'
                      }}>
                        <span style={{
                          background: type.riskLevel === 'High' ? 
                            'rgba(255, 71, 87, 0.2)' : 'rgba(255, 165, 2, 0.2)',
                          color: type.riskLevel === 'High' ? '#ff4757' : '#ffa502',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}>
                          {type.riskLevel} Risk
                        </span>
                        <span style={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: '12px'
                        }}>
                          {type.points} points
                        </span>
                      </div>
                    </div>
                  </div>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '14px',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    {type.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Asset Input */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '15px'
              }}>
                Enter {assetTypes.find(t => t.value === selectedAssetType)?.label} Address:
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={assetInput}
                  onChange={(e) => setAssetInput(e.target.value)}
                  placeholder={`Enter ${selectedAssetType} address (e.g., 0x1234...abcd)`}
                  style={{
                    width: '100%',
                    padding: '20px 60px 20px 20px',
                    borderRadius: '15px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontFamily: 'monospace',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid #00f5ff';
                    e.target.style.boxShadow = '0 0 20px rgba(0, 245, 255, 0.3)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255, 255, 255, 0.3)';
                    e.target.style.boxShadow = 'none';
                  }}
                  disabled={scanning}
                />
                <div style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '24px'
                }}>
                  🔍
                </div>
              </div>
            </div>

            {/* Scan Button */}
            <button
              onClick={handleScan}
              disabled={scanning || !assetInput.trim() || userPoints < 10}
              style={{
                width: '100%',
                padding: '20px',
                borderRadius: '15px',
                border: 'none',
                background: scanning ? 
                  'rgba(0, 245, 255, 0.5)' : 
                  userPoints < 10 ? 
                    'rgba(255, 71, 87, 0.3)' :
                    'linear-gradient(45deg, #00f5ff, #0099cc)',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: scanning || userPoints < 10 ? 'not-allowed' : 'pointer',
                opacity: scanning || userPoints < 10 ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '15px',
                transition: 'all 0.3s ease',
                boxShadow: scanning || userPoints < 10 ? 'none' : '0 8px 25px rgba(0, 245, 255, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!scanning && userPoints >= 10) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 12px 35px rgba(0, 245, 255, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!scanning && userPoints >= 10) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 25px rgba(0, 245, 255, 0.3)';
                }
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
                  Scanning {assetTypes.find(t => t.value === selectedAssetType)?.label}...
                </>
              ) : userPoints < 10 ? (
                <>❌ Insufficient Points (Need 10 points)</>
              ) : (
                <>🚀 Start Quantum Security Scan (-10 points)</>
              )}
            </button>

            {userPoints < 10 && (
              <div style={{
                marginTop: '20px',
                padding: '20px',
                background: 'rgba(255, 165, 0, 0.1)',
                borderRadius: '15px',
                border: '1px solid rgba(255, 165, 0, 0.3)',
                color: '#ffa502',
                fontSize: '16px',
                textAlign: 'center',
                lineHeight: '1.6'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💡</div>
                <strong>Need More Points?</strong>
                <br />
                Share your scan results on Twitter, invite friends, or use our crypto payment system to get instant access!
                <br />
                <button
                  onClick={() => handlePaymentClick('wallet_scan')}
                  style={{
                    marginTop: '15px',
                    padding: '12px 25px',
                    background: 'linear-gradient(45deg, #00f5ff, #0099cc)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  💳 Pay with Crypto
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '25px',
            padding: '35px',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <h3 style={{
              color: '#00f5ff',
              fontSize: '1.8rem',
              marginBottom: '25px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <span style={{ fontSize: '2rem' }}>📋</span>
              Scan History & Reports
            </h3>
            
            {scanResults.length > 0 ? (
              <div style={{ display: 'grid', gap: '20px' }}>
                {scanResults.map((scan) => (
                  <div 
                    key={scan.id} 
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '18px',
                      padding: '25px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: scan.quantum_risk === 'high' ? 
                        'linear-gradient(90deg, #ff4757, #ff3742)' : 
                        scan.quantum_risk === 'medium' ? 
                          'linear-gradient(90deg, #ffa502, #ff9500)' : 
                          'linear-gradient(90deg, #2ed573, #1dd1a1)'
                    }} />
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '15px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '15px',
                          marginBottom: '10px'
                        }}>
                          <div style={{
                            background: 'rgba(0, 245, 255, 0.2)',
                            borderRadius: '10px',
                            padding: '8px 15px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: '#00f5ff'
                          }}>
                            {scan.asset_type.charAt(0).toUpperCase() + scan.asset_type.slice(1)}
                          </div>
                          <div style={{
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontSize: '14px'
                          }}>
                            {new Date(scan.scanned_at).toLocaleDateString()} • {new Date(scan.scanned_at).toLocaleTimeString()}
                          </div>
                        </div>
                        
                        <div style={{
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontSize: '16px',
                          fontFamily: 'monospace',
                          marginBottom: '10px',
                          wordBreak: 'break-all',
                          background: 'rgba(0, 0, 0, 0.3)',
                          padding: '10px',
                          borderRadius: '8px'
                        }}>
                          {scan.asset_address}
                        </div>
                        
                        <div style={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: '14px'
                        }}>
                          {scan.vulnerabilities?.length || 0} vulnerabilities detected
                        </div>
                      </div>
                      
                      <div style={{
                        padding: '12px 20px',
                        borderRadius: '25px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        background: scan.quantum_risk === 'high' ? 
                          'rgba(255, 71, 87, 0.2)' : 
                          scan.quantum_risk === 'medium' ? 
                            'rgba(255, 165, 2, 0.2)' : 
                            'rgba(46, 213, 115, 0.2)',
                        color: scan.quantum_risk === 'high' ? 
                          '#ff4757' : 
                          scan.quantum_risk === 'medium' ? 
                            '#ffa502' : 
                            '#2ed573',
                        border: `1px solid ${scan.quantum_risk === 'high' ? 
                          '#ff4757' : 
                          scan.quantum_risk === 'medium' ? 
                            '#ffa502' : 
                            '#2ed573'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {scan.quantum_risk === 'high' ? '🚨' : 
                         scan.quantum_risk === 'medium' ? '⚠️' : '✅'} 
                        {scan.quantum_risk.toUpperCase()} RISK
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔍</div>
                <h3 style={{ fontSize: '24px', margin: '0 0 15px 0', color: '#ffffff' }}>
                  No Scans Yet
                </h3>
                <p style={{ fontSize: '16px', margin: 0, lineHeight: '1.6' }}>
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
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes glow {
          from {
            text-shadow: 0 0 20px rgba(0, 245, 255, 0.5), 0 0 30px rgba(0, 245, 255, 0.3), 0 0 40px rgba(0, 245, 255, 0.2);
          }
          to {
            text-shadow: 0 0 30px rgba(0, 245, 255, 0.8), 0 0 40px rgba(0, 245, 255, 0.5), 0 0 50px rgba(0, 245, 255, 0.3);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}