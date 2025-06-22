import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { connectWallet } from '../services/wallet';
import { signInWithEmailPassword, signUpWithEmailPassword } from '../hooks/nhostAuth';
import WalletSecurityScanner from './WalletSecurityScanner';

export default function Login(props) {
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [networkSymbol, setNetworkSymbol] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [connectedWalletAddress, setConnectedWalletAddress] = useState("");
  const [connectedNetworkSymbol, setConnectedNetworkSymbol] = useState("");

  useEffect(() => {
    // Check for referral code in URL
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref);
      localStorage.setItem('referral_code', ref);
    }
  }, []);

  useEffect(() => {
    // For demo: set values after wallet connection (replace with real logic)
    if (!connectedWalletAddress) {
      setConnectedWalletAddress("0x1234abcd5678efgh9012ijkl3456mnop7890qrst");
    }
    if (!connectedNetworkSymbol) {
      setConnectedNetworkSymbol("ETH");
    }
  }, [connectedWalletAddress, connectedNetworkSymbol]);

  const handleWalletLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { address, signature } = await connectWallet();
      setWalletAddress(address);
      const walletEmail = `${address.toLowerCase()}@quantumsafe.wallet`;
      const walletPassword = `QS_${signature.slice(0, 32)}_${address.slice(-8)}`;
      // Try to sign in first
      let session, signInError;
      try {
        ({ session, error: signInError } = await signInWithEmailPassword(walletEmail, walletPassword));
      } catch (e) {
        signInError = e;
      }
      if (!session) {
        // If sign in fails, try to sign up
        const { session: signUpSession, error: signUpError } = await signUpWithEmailPassword(walletEmail, walletPassword);
        if (signUpError) throw signUpError;
        if (signUpSession?.user) {
          await insertUserProfile(signUpSession.user.id, address);
          await insertUserPoints(signUpSession.user.id, 5);
          // Handle referral (you can convert this to GraphQL later)
        }
      }
    } catch (err) {
      console.error('Wallet login error:', err);
      if (err.message && err.message.includes('User rejected')) {
        setError('Wallet connection was cancelled. Please try again.');
      } else if (err.message && err.message.includes('MetaMask')) {
        setError('MetaMask is required. Please install MetaMask and try again.');
      } else {
        setError(err.message || 'Failed to connect wallet. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  async function handleConnectWallet() {
    setIsConnecting(true);
    setError("");
    try {
      let actualWalletAddress = "";
      let actualNetworkSymbol = "";
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        actualWalletAddress = accounts[0];
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        switch (chainId) {
          case '0x1':
            actualNetworkSymbol = 'ETH';
            break;
          case '0x89':
            actualNetworkSymbol = 'MATIC';
            break;
          case '0x38':
            actualNetworkSymbol = 'BNB';
            break;
          default:
            actualNetworkSymbol = 'ETH';
        }
      } else {
        actualWalletAddress = "";
        actualNetworkSymbol = "ETH";
      }
      setWalletAddress(actualWalletAddress);
      setNetworkSymbol(actualNetworkSymbol);
      setIsConnecting(false);
    } catch (err) {
      setError("Wallet connection failed. Please try again.");
      setIsConnecting(false);
    }
  };

  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  // Example: Insert user profile
  async function insertUserProfile(user_id, wallet_address) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({ user_id, wallet_address })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Example: Insert user points
  async function insertUserPoints(user_id, points) {
    const { data, error } = await supabase
      .from('user_points')
      .insert({ user_id, points })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)'
    }}>
      {/* Hero Section */}
      <div style={{
        textAlign: 'center',
        marginBottom: '40px',
        maxWidth: '800px'
      }}>
        <h1 style={{
          fontSize: '4rem',
          background: 'linear-gradient(45deg, #00f5ff, #ff00ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold',
          marginBottom: '20px'
        }}>
          🛡️ QuantumSafe
        </h1>
        <p style={{
          fontSize: '1.5rem',
          color: 'rgba(255, 255, 255, 0.9)',
          marginBottom: '15px',
          lineHeight: '1.6'
        }}>
          Protect Your Digital Assets from Quantum Threats
        </p>
        <p style={{
          fontSize: '1.1rem',
          color: 'rgba(255, 255, 255, 0.7)',
          lineHeight: '1.6'
        }}>
          Advanced AI-powered scanning for smart contracts, wallets, NFTs, and DApps. 
          Detect quantum vulnerabilities before they become threats.
        </p>
      </div>

      {/* Login Card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderRadius: '25px',
        padding: '40px',
        maxWidth: '450px',
        width: '100%',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '30px',
          fontSize: '1.8rem',
          color: '#ffffff',
          fontWeight: 'bold'
        }}>
          Connect Your Web3 Wallet
        </h2>

        <p style={{
          textAlign: 'center',
          marginBottom: '30px',
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          Connect your Web3 wallet to start scanning digital assets and earning rewards. 
          Secure, decentralized authentication powered by blockchain technology.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!isMetaMaskInstalled() ? (
            <div style={{
              width: '100%',
              padding: '20px',
              borderRadius: '15px',
              background: 'rgba(255, 165, 0, 0.1)',
              border: '1px solid rgba(255, 165, 0, 0.3)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🦊</div>
              <p style={{ color: '#ffa500', marginBottom: '10px', fontSize: '16px', fontWeight: 'bold' }}>
                MetaMask Required
              </p>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '20px' }}>
                Please install MetaMask to connect your wallet and start scanning
              </p>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '12px 25px',
                  background: 'linear-gradient(45deg, #f6851b, #e76f00)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease'
                }}
              >
                Install MetaMask
              </a>
            </div>
          ) : (
            <>
              {!walletAddress ? (
                <button
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  style={{
                    width: '100%',
                    padding: '18px',
                    border: 'none',
                    borderRadius: '15px',
                    background: isConnecting 
                      ? 'rgba(246, 133, 27, 0.5)' 
                      : 'linear-gradient(45deg, #f6851b, #e76f00)',
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: isConnecting ? 'not-allowed' : 'pointer',
                    opacity: isConnecting ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    transition: 'all 0.3s ease',
                    boxShadow: isConnecting ? 'none' : '0 4px 15px rgba(246, 133, 27, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isConnecting) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(246, 133, 27, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isConnecting) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(246, 133, 27, 0.3)';
                    }
                  }}
                >
                  {isConnecting ? (
                    <>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Connecting Wallet...
                    </>
                  ) : (
                    <>
                      🦊 Connect MetaMask Wallet
                    </>
                  )}
                </button>
              ) : (
                <div style={{
                  marginTop: '25px',
                  padding: '20px',
                  background: 'rgba(0, 255, 0, 0.1)',
                  borderRadius: '15px',
                  border: '1px solid rgba(0, 255, 0, 0.3)'
                }}>
                  <p style={{ fontSize: '16px', color: '#00ff88', marginBottom: '8px', fontWeight: 'bold' }}>
                    ✅ Wallet Connected Successfully
                  </p>
                  <code style={{ 
                    fontSize: '13px', 
                    wordBreak: 'break-all',
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '8px',
                    borderRadius: '8px',
                    display: 'block',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}>
                    {walletAddress}
                  </code>
                </div>
              )}
            </>
          )}
        </div>

        {error && (
          <div style={{
            marginTop: '25px',
            padding: '20px',
            background: 'rgba(255, 0, 0, 0.1)',
            borderRadius: '15px',
            border: '1px solid rgba(255, 0, 0, 0.3)',
            color: '#ff6b6b',
            fontSize: '15px'
          }}>
            <strong>❌ Connection Error:</strong>
            <br />
            {error}
            {error.includes('MetaMask') && (
              <div style={{ marginTop: '15px' }}>
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#00f5ff',
                    textDecoration: 'underline',
                    fontWeight: 'bold'
                  }}
                >
                  📥 Download MetaMask here
                </a>
              </div>
            )}
          </div>
        )}

        {referralCode && (
          <div style={{
            marginTop: '25px',
            padding: '20px',
            background: 'rgba(0, 255, 255, 0.1)',
            borderRadius: '15px',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            fontSize: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🎁</div>
            <strong style={{ color: '#00f5ff' }}>Referral Bonus Active!</strong>
            <br />
            <span style={{ opacity: 0.9 }}>Code: <strong>{referralCode}</strong></span>
            <br />
            <small style={{ opacity: 0.8 }}>You'll get bonus points when you sign up!</small>
          </div>
        )}

        {/* Show WalletSecurityScanner only if wallet is connected */}
        {walletAddress && networkSymbol && (
          <>
            <h2 style={{color:'#4f8cff', marginTop:'32px', marginBottom:'16px'}}>Scan your wallet</h2>
            <WalletSecurityScanner
              walletAddress={walletAddress}
              networkKey={networkSymbol}
            />
          </>
        )}
      </div>

      {/* Benefits Section */}
      <div style={{
        marginTop: '50px',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '15px',
        maxWidth: '700px',
        lineHeight: '1.6'
      }}>
        <h3 style={{
          color: '#00f5ff',
          marginBottom: '20px',
          fontSize: '1.3rem'
        }}>
          🔐 Why Choose QuantumSafe?
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginTop: '25px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '20px',
            borderRadius: '15px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🎁</div>
            <strong>5 Free Points</strong>
            <br />
            <small>Get started with free scanning credits</small>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '20px',
            borderRadius: '15px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔍</div>
            <strong>Advanced Scanning</strong>
            <br />
            <small>Detect 10+ quantum vulnerabilities</small>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '20px',
            borderRadius: '15px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💰</div>
            <strong>Earn Rewards</strong>
            <br />
            <small>Points for scans, referrals & engagement</small>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '20px',
            borderRadius: '15px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🌐</div>
            <strong>Web3 Native</strong>
            <br />
            <small>Fully decentralized authentication</small>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}