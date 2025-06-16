import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { scanAsset } from '../services/scanner';
import ScanResult from './ScanResult';

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

  useEffect(() => {
    if (user) {
      fetchUserData();
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
        .limit(5);
      
      setScanResults(scans || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
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

      // Refresh scan results
      fetchUserData();
      
    } catch (error) {
      console.error('Scan error:', error);
      alert('Failed to perform scan. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const assetTypes = [
    { value: 'contract', label: '🔐 Smart Contract', points: 10 },
    { value: 'wallet', label: '💰 Wallet', points: 10 },
    { value: 'nft', label: '🎨 NFT', points: 10 },
    { value: 'memecoin', label: '🚀 Memecoin', points: 10 },
    { value: 'app', label: '📱 DApp', points: 10 }
  ];

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid rgba(0, 245, 255, 0.3)',
          borderTop: '4px solid #00f5ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
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
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          padding: '20px',
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
              fontWeight: 'bold',
              margin: 0
            }}>
              🛡️ QuantumSafe Dashboard
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '5px 0 0 0' }}>
              Welcome back, {user?.email}
            </p>
          </div>
          <button
            onClick={signOut}
            style={{
              padding: '12px 24px',
              background: 'rgba(255, 0, 0, 0.2)',
              border: '1px solid rgba(255, 0, 0, 0.5)',
              borderRadius: '12px',
              color: '#ff4757',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🚪 Sign Out
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '25px',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💎</div>
            <h3 style={{ color: '#00f5ff', margin: '0 0 10px 0' }}>Total Points</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
              {userPoints}
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '25px',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔍</div>
            <h3 style={{ color: '#00ff88', margin: '0 0 10px 0' }}>Total Scans</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
              {userProfile?.total_scans || 0}
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '25px',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💰</div>
            <h3 style={{ color: '#ffa502', margin: '0 0 10px 0' }}>Wallet</h3>
            <p style={{ 
              fontSize: '14px', 
              color: 'rgba(255, 255, 255, 0.8)', 
              margin: 0,
              fontFamily: 'monospace',
              wordBreak: 'break-all'
            }}>
              {userProfile?.wallet_address ? 
                `${userProfile.wallet_address.slice(0, 6)}...${userProfile.wallet_address.slice(-4)}` : 
                'Not connected'
              }
            </p>
          </div>
        </div>

        {/* Scanning Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '25px',
          padding: '30px',
          marginBottom: '30px',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h2 style={{
            color: '#00f5ff',
            fontSize: '1.8rem',
            marginBottom: '25px',
            fontWeight: 'bold'
          }}>
            🔍 Quantum Threat Scanner
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '25px'
          }}>
            {assetTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedAssetType(type.value)}
                style={{
                  padding: '15px',
                  borderRadius: '15px',
                  border: selectedAssetType === type.value ? 
                    '2px solid #00f5ff' : '1px solid rgba(255, 255, 255, 0.3)',
                  background: selectedAssetType === type.value ? 
                    'rgba(0, 245, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  if (selectedAssetType !== type.value) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedAssetType !== type.value) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
              >
                <div>{type.label}</div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
                  {type.points} points
                </div>
              </button>
            ))}
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '10px'
            }}>
              Enter Asset Address:
            </label>
            <input
              type="text"
              value={assetInput}
              onChange={(e) => setAssetInput(e.target.value)}
              placeholder={`Enter ${selectedAssetType} address (e.g., 0x1234...abcd)`}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '16px',
                fontFamily: 'monospace'
              }}
              disabled={scanning}
            />
          </div>

          <button
            onClick={handleScan}
            disabled={scanning || !assetInput.trim() || userPoints < 10}
            style={{
              width: '100%',
              padding: '18px',
              borderRadius: '15px',
              border: 'none',
              background: scanning ? 
                'rgba(0, 245, 255, 0.5)' : 
                userPoints < 10 ? 
                  'rgba(255, 0, 0, 0.3)' :
                  'linear-gradient(45deg, #00f5ff, #0099cc)',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: scanning || userPoints < 10 ? 'not-allowed' : 'pointer',
              opacity: scanning || userPoints < 10 ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'all 0.3s ease'
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
                Scanning {selectedAssetType}...
              </>
            ) : userPoints < 10 ? (
              <>❌ Insufficient Points (Need 10 points)</>
            ) : (
              <>🔍 Start Quantum Scan (-10 points)</>
            )}
          </button>

          {userPoints < 10 && (
            <div style={{
              marginTop: '15px',
              padding: '15px',
              background: 'rgba(255, 165, 0, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 165, 0, 0.3)',
              color: '#ffa502',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              💡 You need more points to scan. Share your previous scans on Twitter or invite friends to earn points!
            </div>
          )}
        </div>

        {/* Scan Result */}
        {currentScanResult && (
          <ScanResult 
            result={currentScanResult} 
            assetType={selectedAssetType}
            user={user}
          />
        )}

        {/* Recent Scans */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '25px',
          padding: '30px',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3 style={{
            color: '#00f5ff',
            fontSize: '1.6rem',
            marginBottom: '25px',
            fontWeight: 'bold'
          }}>
            📊 Recent Scans
          </h3>
          
          {scanResults.length > 0 ? (
            <div style={{ display: 'grid', gap: '15px' }}>
              {scanResults.map((scan) => (
                <div 
                  key={scan.id} 
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '15px',
                    padding: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <div>
                      <strong style={{ color: '#ffffff', fontSize: '16px' }}>
                        {scan.asset_type.charAt(0).toUpperCase() + scan.asset_type.slice(1)}
                      </strong>
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        margin: '5px 0',
                        wordBreak: 'break-all'
                      }}>
                        {scan.asset_address}
                      </p>
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '12px',
                        margin: 0
                      }}>
                        {new Date(scan.scanned_at).toLocaleDateString()} at {new Date(scan.scanned_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <span style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
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
                          '#2ed573'}`
                    }}>
                      {scan.quantum_risk === 'high' ? '🚨' : 
                       scan.quantum_risk === 'medium' ? '⚠️' : '✅'} {scan.quantum_risk.toUpperCase()} RISK
                    </span>
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    {scan.vulnerabilities?.length || 0} vulnerabilities found
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🔍</div>
              <p style={{ fontSize: '18px', margin: 0 }}>No scans yet</p>
              <p style={{ fontSize: '14px', margin: '10px 0 0 0' }}>
                Start your first quantum threat scan above!
              </p>
            </div>
          )}
        </div>
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