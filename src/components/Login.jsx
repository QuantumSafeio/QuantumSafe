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

          // Add initial points
          await supabase.from('user_points').insert({
            user_id: authData.user.id,
            points: 50
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '400px',
        width: '100%',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h1 style={{
          textAlign: 'center',
          marginBottom: '30px',
          fontSize: '2.5rem',
          background: 'linear-gradient(45deg, #00f5ff, #ff00ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold'
        }}>
          🛡️ QuantumSafe
        </h1>

        <p style={{
          textAlign: 'center',
          marginBottom: '30px',
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '16px'
        }}>
          Connect your wallet or Twitter to start scanning digital assets for quantum threats
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {!isMetaMaskInstalled() ? (
            <div style={{
              width: '100%',
              padding: '15px',
              borderRadius: '12px',
              background: 'rgba(255, 165, 0, 0.1)',
              border: '1px solid rgba(255, 165, 0, 0.3)',
              textAlign: 'center'
            }}>
              <p style={{ color: '#ffa500', marginBottom: '10px', fontSize: '14px' }}>
                🦊 MetaMask Required
              </p>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px', marginBottom: '15px' }}>
                Please install MetaMask to connect your wallet
              </p>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  background: 'linear-gradient(45deg, #f6851b, #e76f00)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold'
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
                padding: '15px',
                border: 'none',
                borderRadius: '12px',
                background: 'linear-gradient(45deg, #f6851b, #e76f00)',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              🦊 Connect MetaMask Wallet
            </button>
          )}

          <div style={{
            textAlign: 'center',
            margin: '10px 0',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '14px'
          }}>
            or
          </div>

          <button
            onClick={handleTwitterLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              border: 'none',
              borderRadius: '12px',
              background: 'linear-gradient(45deg, #1da1f2, #0d8bd9)',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            🐦 Connect Twitter Account
          </button>
        </div>

        {walletAddress && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(0, 255, 0, 0.1)',
            borderRadius: '10px',
            border: '1px solid rgba(0, 255, 0, 0.3)'
          }}>
            <p style={{ fontSize: '14px', color: '#00ff88', marginBottom: '5px' }}>
              ✅ Wallet Connected
            </p>
            <code style={{ fontSize: '12px', wordBreak: 'break-all' }}>
              {walletAddress}
            </code>
          </div>
        )}

        {error && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(255, 0, 0, 0.1)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 0, 0, 0.3)',
            color: '#ff6b6b',
            fontSize: '14px'
          }}>
            {error}
            {error.includes('MetaMask') && (
              <div style={{ marginTop: '10px' }}>
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#00f5ff',
                    textDecoration: 'underline'
                  }}
                >
                  Download MetaMask here
                </a>
              </div>
            )}
          </div>
        )}

        {referralCode && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(0, 255, 255, 0.1)',
            borderRadius: '10px',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            fontSize: '14px'
          }}>
            🎁 Referral Code: <strong>{referralCode}</strong>
            <br />
            <small style={{ opacity: 0.8 }}>You'll get bonus points when you sign up!</small>
          </div>
        )}
      </div>

      <div style={{
        marginTop: '30px',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '14px',
        maxWidth: '500px'
      }}>
        <p>
          <strong>🔐 How does QuantumSafe authentication work?</strong><br />
          • Connect your Web3 wallet for direct access to asset scanning<br />
          • Or link your Twitter account to track engagement and earn points<br />
          • Get 50 free points when you sign up!
        </p>
      </div>
    </div>
  );
}