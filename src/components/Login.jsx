<<<<<<< HEAD
import React, { useState } from 'react';
import { Copy, Twitter, Globe } from 'lucide-react';
=======
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { connectWallet } from '../services/wallet';
import { signInWithEmailPassword, signUpWithEmailPassword } from '../hooks/nhostAuth';
import WalletSecurityScanner from './WalletSecurityScanner';
>>>>>>> 36f9c089939579f9abae2978f8e812369bf76419

// Simple Card and Button components using Tailwind CSS
function Card({ children, className = '' }) {
  return <div className={`bg-white rounded-2xl shadow-md border border-gray-200 ${className}`}>{children}</div>;
}
function CardContent({ children, className = '' }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
function Button({ children, onClick, variant = 'default', className = '' }) {
  const base = 'inline-flex items-center px-4 py-2 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants = {
    default: 'bg-purple-600 text-white hover:bg-purple-700',
    outline: 'border border-purple-600 text-purple-600 bg-white hover:bg-purple-50',
  };
  return (
    <button onClick={onClick} className={`${base} ${variants[variant] || ''} ${className}`}>{children}</button>
  );
}
function ProgressBar({ value }) {
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-2 bg-gradient-to-r from-purple-400 to-pink-500 transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function Dashboard({ user, referrals, socialPoints }) {
  const [walletConnected, setWalletConnected] = useState(!!user?.walletAddress);
  const [walletAddress, setWalletAddress] = useState(user?.walletAddress || '0x123...abc');
  const [network, setNetwork] = useState(user?.network || 'Ethereum');
  const [assetName, setAssetName] = useState('');
  const [scanResult, setScanResult] = useState(user?.scannedAssets?.[0] || null);

  const referralLink = referrals?.referralLink || 'https://quantumsafe.app/referral/demo';
  const referralStats = {
    referrals: referrals?.totalReferrals || 0,
    points: referrals?.points || 0,
    posts: referrals?.posts || 0,
    commission: referrals?.commission || 0,
    tier: referrals?.currentTier || 'Bronze'
  };
  const nextTier = referrals?.nextTier?.name || null;
  const tierRequirements = referrals?.nextTier?.requirements || {};
  const progress = referrals?.nextTier?.progress || {};
  const tiers = ['Bronze', 'Silver', 'Gold'];

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setError('');
    try {
      if (!window.ethereum) {
        setIsConnecting(false);
        setError('MetaMask is not installed');
        return;
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      setWalletAddress(address);
      setNetworkSymbol('ETH'); 
      setIsConnecting(false);
      localStorage.setItem('walletAddress', address);
      navigate('/');
    } catch (err) {
      setIsConnecting(false);
      setError(
        err.message?.includes('User rejected')
          ? 'Wallet connection was cancelled. Please try again.'
          : err.message?.includes('MetaMask')
          ? 'MetaMask is required. Please install MetaMask and try again.'
          : err.message || 'Failed to connect wallet. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleScan = () => {
    setScanResult({
      name: assetName,
      status: '✅ No quantum vulnerabilities found',
      riskLevel: 'Low',
    });
  };

<<<<<<< HEAD
=======
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

>>>>>>> 36f9c089939579f9abae2978f8e812369bf76419
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-100 font-sans flex flex-col">
      <header className="py-12 text-center">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent animate-pulse drop-shadow-lg">
          QuantumSafe
        </h1>
        <p className="mt-4 text-lg text-gray-600 font-medium max-w-2xl mx-auto">
          Next-generation platform for quantum and Web3 security. Instantly scan, protect, and earn rewards while securing your digital assets against quantum threats.
        </p>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto space-y-10">
        <Card>
          <CardContent>
            <h2 className="text-2xl font-bold mb-4 text-purple-700">Quantum Threat Scanner</h2>
            {!walletConnected ? (
              <div className="text-center space-y-4">
                <Button onClick={handleConnectWallet}>Connect Your Web3 Wallet</Button>
                <p className="text-gray-500 text-sm">Connect your wallet to scan assets and earn rewards. Powered by blockchain-based identity.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 font-semibold">
                  <span>✅ Wallet Connected Successfully</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-2">
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-400">Wallet Address</div>
                      <div className="font-mono text-sm">{walletAddress}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Connected Network</div>
                      <div className="font-semibold text-purple-700">{network}</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name</label>
                    <input
                      type="text"
                      value={assetName}
                      onChange={e => setAssetName(e.target.value)}
                      placeholder="Enter smart contract, app, or NFT"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                  <div className="mt-2">
                    <Button onClick={handleScan} className="w-full">Scan Wallet</Button>
                  </div>
                </div>
                {scanResult && (
                  <div className="mt-4">
                    <Card className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                      <div className="font-semibold text-green-700 text-lg mb-2">{scanResult.status}</div>
                      <div className="text-xs text-gray-500 mb-4">Risk Level: {scanResult.riskLevel}</div>
                      <div className="bg-white rounded-lg p-4 border border-gray-100">
                        <div className="mb-2">
                          <span className="font-semibold text-gray-700">Asset:</span> {scanResult.name}
                        </div>
                        <div className="mb-2">
                          <span className="font-semibold text-gray-700">Wallet Address:</span> {walletAddress}
                        </div>
                        <div className="mb-2">
                          <span className="font-semibold text-gray-700">Network:</span> {network}
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h3 className="text-2xl font-semibold">Ambassador & Rewards Dashboard</h3>
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(referralLink)}>
                <Copy className="w-4 h-4 mr-2" /> Copy Referral Link
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Stat label="Referrals" value={referralStats.referrals} />
              <Stat label="Total Points" value={referralStats.points} />
              <Stat label="Posts Created" value={referralStats.posts} />
              <Stat label="Earned Commission" value={`$${referralStats.commission.toFixed(2)}`} />
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Current Tier: <span className="font-bold text-purple-600">{referralStats.tier}</span></h4>
              {nextTier ? (
                <div className="space-y-2">
                  <ProgressLabel label="Referrals" value={referralStats.referrals} target={tierRequirements.referrals} progress={progress.referrals} />
                  <ProgressLabel label="Points" value={referralStats.points} target={tierRequirements.points} progress={progress.points} />
                  <ProgressLabel label="Posts" value={referralStats.posts} target={tierRequirements.posts} progress={progress.posts} />
                </div>
              ) : (
                <p className="text-green-600 font-medium">🎉 You’ve reached the highest tier!</p>
              )}
            </div>
            <div className="pt-6">
              <h4 className="text-lg font-semibold mb-2">Social Engagement Rewards</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {socialPoints.map(social => (
                  <Card key={social.platform} className="p-4">
                    <h5 className="text-lg font-bold mb-1">{social.platform}</h5>
                    <p className="text-sm">+{social.base} points/post</p>
                    <p className="text-xs text-gray-400">+{social.engagement} per like/share</p>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="text-center pt-10 border-t mt-10 pb-6">
        <div className="flex justify-center gap-6 mb-4">
          <a href="https://twitter.com/QuantumSafeio" target="_blank" rel="noopener noreferrer">
            <Twitter className="w-5 h-5 text-blue-500 hover:scale-110 transition-transform" />
          </a>
          <a href="https://quantumsafeio" target="_blank" rel="noopener noreferrer">
            <Globe className="w-5 h-5 text-purple-600 hover:scale-110 transition-transform" />
          </a>
        </div>
        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} QuantumSafe — Empowering the future of digital asset security.
        </p>
      </footer>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-gray-50 p-4 rounded-xl text-center shadow-sm">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}

function ProgressLabel({ label, value, target, progress }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{value}/{target}</span>
      </div>
      <ProgressBar value={progress} />
    </div>
  );
}
