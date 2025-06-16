import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { connectWallet } from '../services/wallet';
import { initiateTwitterAuth } from '../services/twitter';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    // Check for referral code in URL
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref);
      localStorage.setItem('referral_code', ref);
    }
  }, []);

  const handleWalletLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { address, signature } = await connectWallet();
      setWalletAddress(address);
      
      // Create or get user with wallet address
      const { data: existingUser, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('wallet_address', address)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (!existingUser) {
        // Create new user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: `${address}@wallet.local`,
          password: signature.slice(0, 20) + 'QuantumSafe2024!'
        });

        if (authError) throw authError;

        if (authData.user) {
          // Create user profile
          await supabase.from('user_profiles').insert({
            user_id: authData.user.id,
            wallet_address: address
          });

          // Add initial points (5 points for new users)
          await supabase.from('user_points').insert({
            user_id: authData.user.id,
            points: 5
          });

          // Handle referral if exists
          const storedReferral = localStorage.getItem('referral_code');
          if (storedReferral) {
            await supabase.from('referrals').insert({
              new_user_id: authData.user.id,
              referrer_id: storedReferral,
              points_awarded: 10
            });
            
            // Award points to referrer
            const { data: referrerPoints } = await supabase
              .from('user_points')
              .select('points')
              .eq('user_id', storedReferral)
              .single();
            
            if (referrerPoints) {
              await supabase
                .from('user_points')
                .update({ points: referrerPoints.points + 10 })
                .eq('user_id', storedReferral);
            }
            
            localStorage.removeItem('referral_code');
          }
        }
      } else {
        // Sign in existing user
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: `${address}@wallet.local`,
          password: signature.slice(0, 20) + 'QuantumSafe2024!'
        });

        if (signInError) throw signInError;
      }
    } catch (err) {
      console.error('Wallet login error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleTwitterLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      await initiateTwitterAuth();
    } catch (err) {
      console.error('Twitter login error:', err);
      setError(err.message || 'Failed to connect Twitter');
    } finally {
      setLoading(false);
    }
  };

  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

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
          Connect Your Account
        </h2>

        <p style={{
          textAlign: 'center',
          marginBottom: '30px',
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          Connect your wallet or Twitter to start scanning digital assets and earning rewards
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
            <button
              onClick={handleWalletLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '18px',
                border: 'none',
                borderRadius: '15px',
                background: loading 
                  ? 'rgba(246, 133, 27, 0.5)' 
                  : 'linear-gradient(45deg, #f6851b, #e76f00)',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                transition: 'all 0.3s ease',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(246, 133, 27, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(246, 133, 27, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(246, 133, 27, 0.3)';
                }
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Connecting...
                </>
              ) : (
                <>
                  🦊 Connect MetaMask Wallet
                </>
              )}
            </button>
          )}

          <div style={{
            textAlign: 'center',
            margin: '10px 0',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            or
          </div>

          <button
            onClick={handleTwitterLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '18px',
              border: 'none',
              borderRadius: '15px',
              background: loading 
                ? 'rgba(29, 161, 242, 0.5)' 
                : 'linear-gradient(45deg, #1da1f2, #0d8bd9)',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'all 0.3s ease',
              boxShadow: loading ? 'none' : '0 4px 15px rgba(29, 161, 242, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(29, 161, 242, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(29, 161, 242, 0.3)';
              }
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Connecting...
              </>
            ) : (
              <>
                🐦 Connect Twitter Account
              </>
            )}
          </button>
        </div>

        {walletAddress && (
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
              display: 'block'
            }}>
              {walletAddress}
            </code>
          </div>
        )}

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