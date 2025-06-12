import React, { useState, useEffect } from 'react';
import { useAuthenticationStatus } from '@nhost/react';
import nhost from './nhost';

export default function Login() {
  const { isAuthenticated } = useAuthenticationStatus();
  const [wallet, setWallet] = useState(null);
  const [walletError, setWalletError] = useState('');
  const [referral, setReferral] = useState(null);

  // Capture referral code from URL and store it temporarily
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('referral', ref);
      setReferral(ref);
    }
  }, []);

  // Twitter OAuth login
  const handleTwitterLogin = () => {
    nhost.auth.signIn({ provider: 'twitter' });
  };

  // Web3 wallet login (MetaMask)
  const handleWeb3Login = async () => {
    setWalletError('');
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWallet(accounts[0]);
        // Optionally: send wallet address to backend or link to user in DB
      } catch (err) {
        setWalletError('Failed to connect to MetaMask wallet.');
      }
    } else {
      setWalletError('Please install MetaMask first.');
    }
  };

  if (isAuthenticated) {
    // Redirect to dashboard after successful login
    window.location.href = '/';
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 100 }}>
      <h2>Sign in to QuantumSafe</h2>
      <button
        style={{
          margin: 10,
          padding: 10,
          minWidth: 220,
          background: '#1da1f2',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: 16,
        }}
        onClick={handleTwitterLogin}
      >
        Sign in with Twitter
      </button>
      <button
        style={{
          margin: 10,
          padding: 10,
          minWidth: 220,
          background: '#f6851b',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: 16,
        }}
        onClick={handleWeb3Login}
      >
        Sign in with Web3 Wallet (MetaMask)
      </button>
      {wallet && (
        <div style={{ marginTop: 20, color: 'green' }}>
          ✅ Connected wallet: <b>{wallet}</b>
        </div>
      )}
      {walletError && (
        <div style={{ marginTop: 20, color: 'red' }}>
          {walletError}
        </div>
      )}
      {referral && (
        <div style={{ marginTop: 20, color: '#888', fontSize: 13 }}>
          Referral code detected: <b>{referral}</b>
        </div>
      )}
      <div style={{ marginTop: 40, color: '#888', fontSize: 13 }}>
        <p>
          <b>How does QuantumSafe login work?</b><br />
          - Sign in with Twitter to access your dashboard, scan assets, and earn points.<br />
          - Or connect your Web3 wallet to link your address and access asset scanning.<br />
          - If you have a referral code, it will be automatically linked to your account.
        </p>
      </div>
    </div>
  );
}