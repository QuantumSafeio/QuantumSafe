import React, { useState } from 'react';
import { Copy, Twitter, Globe } from 'lucide-react';
import WalletConnectModal from './WalletConnectModal';
import InsurancePaymentModal from './InsurancePaymentModal';

// Simple Card and Button components using Tailwind CSS
function Card({ children, className = '' }) {
  return <div className={`bg-white rounded-2xl shadow-md border border-gray-200 ${className}`}>{children}</div>;
}
function CardContent({ children, className = '' }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
function Button({ children, onClick, variant = 'default', className = '', ...props }) {
  const base = 'inline-flex items-center px-5 py-2.5 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-300 active:scale-95';
  const variants = {
    default: 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white hover:from-pink-600 hover:to-purple-600 animate-pulse',
    outline: 'border-2 border-purple-500 text-purple-700 bg-white hover:bg-purple-50 hover:text-pink-600',
    card: 'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-white hover:from-pink-500 hover:to-blue-500 animate-gradient-x',
  };
  return (
    <button onClick={onClick} className={`${base} ${variants[variant] || ''} ${className}`} {...props}>{children}</button>
  );
}
function ProgressBar({ value }) {
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-2 bg-gradient-to-r from-purple-400 to-pink-500 transition-all duration-500 animate-gradient-x"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

// Utility for formatting wallet address
function formatAddress(address, network) {
  if (!address) return '';
  if (network === 'solana') return address.slice(0, 6) + '...' + address.slice(-4);
  if (network === 'bitcoin') return address.slice(0, 6) + '...' + address.slice(-4);
  // Default (ETH, SUI, etc.)
  return address.slice(0, 6) + '...' + address.slice(-4);
}
// Utility for network icon
function getNetworkIcon(network) {
  switch (network) {
    case 'ethereum': return '⟠';
    case 'solana': return '◎';
    case 'bitcoin': return '₿';
    case 'sui': return '🔷';
    default: return '🔗';
  }
}

export default function Dashboard({ user, referrals, socialPoints }) {
  const [walletConnected, setWalletConnected] = useState(!!user?.walletAddress);
  const [walletAddress, setWalletAddress] = useState(user?.walletAddress || '');
  const [network, setNetwork] = useState(user?.network || '');
  const [assetName, setAssetName] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState(user?.scannedAssets || []);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [insuranceType, setInsuranceType] = useState('insurance');
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');

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

  // Disconnect wallet
  const handleDisconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress('');
    setNetwork('');
    setScanResult(null);
    setScanHistory([]);
    localStorage.removeItem('walletAddress');
  };

  // Replace old connect logic with modal
  const handleConnectWallet = () => {
    setShowWalletModal(true);
    setConnectionError('');
  };
  const handleWalletConnected = (result) => {
    setWalletConnected(true);
    setWalletAddress(result.address);
    setNetwork(result.network || '');
    setShowWalletModal(false);
    setScanHistory(user?.scannedAssets || []);
    setScanResult(null);
    setConnectionError('');
    localStorage.setItem('walletAddress', result.address);
  };

  // Simulate scan and add to history
  const handleScan = () => {
    const result = {
      name: assetName,
      status: '✅ No quantum vulnerabilities found',
      riskLevel: 'Low',
      date: new Date().toLocaleString(),
    };
    setScanResult(result);
    setScanHistory([result, ...scanHistory]);
  };

  // Dynamic project description
  const projectDescriptions = [
    'Next-generation platform for quantum and Web3 security.',
    'Instantly scan, protect, and earn rewards while securing your digital assets against quantum threats.',
    'Empowering users with real-time quantum risk analysis and insurance.',
    'Your digital assets, protected for the quantum future.'
  ];
  const [descIndex, setDescIndex] = useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDescIndex(i => (i + 1) % projectDescriptions.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Add extra spacing and professional card wrappers between all main sections
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-100 font-sans flex flex-col">
      <WalletConnectModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} onConnect={handleWalletConnected} />
      <InsurancePaymentModal
        isOpen={showInsuranceModal}
        onClose={() => setShowInsuranceModal(false)}
        walletAddress={walletAddress}
        network={network}
        type={insuranceType}
        assetName={scanResult?.name || ''}
      />
      <header className="py-12 text-center relative flex flex-col items-center">
        {/* Glowing, animated project name */}
        <h1 className="text-6xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent animate-glow drop-shadow-2xl tracking-wide mb-2 animate-bounce-slow">
          QuantumSafe
        </h1>
        {/* Dynamic, animated project description */}
        <p className="mt-4 text-xl text-gray-700 font-semibold max-w-2xl mx-auto animate-fade-in-up transition-all duration-700 min-h-[48px]">
          {projectDescriptions[descIndex]}
        </p>
        {/* Wallet status and actions */}
        <div className="absolute right-6 top-6 flex items-center gap-4">
          {!walletConnected ? (
            <Button onClick={handleConnectWallet} className="text-base px-6 py-2 animate-pulse" variant="card">Connect Wallet</Button>
          ) : (
            <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-xl shadow border border-purple-200 animate-fade-in-up">
              <span className="inline-block w-3 h-3 rounded-full bg-green-400 animate-pulse mr-2"></span>
              <span className="text-xl mr-1">{getNetworkIcon(network.toLowerCase())}</span>
              <span className="font-mono text-xs text-purple-700">{formatAddress(walletAddress, network.toLowerCase())}</span>
              <span className="ml-2 px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200">{network}</span>
              <Button onClick={() => {navigator.clipboard.writeText(walletAddress);}} variant="outline" className="ml-2 px-2 py-1 text-xs">Copy</Button>
              <Button onClick={handleDisconnectWallet} variant="outline" className="ml-2 px-2 py-1 text-xs text-red-500 border-red-300 hover:bg-red-50">Disconnect</Button>
            </div>
          )}
        </div>
        {connectionError && <div className="text-red-600 mt-2 animate-fade-in-up">{connectionError}</div>}
      </header>
      <main className="flex-1 w-full max-w-4xl mx-auto space-y-14 px-2 sm:px-0">
        {/* Scanner Section */}
        <Card className="mb-10 bg-gradient-to-br from-white via-purple-50 to-purple-100 shadow-xl border-0 animate-fade-in-up">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4 text-purple-700 animate-fade-in-up">Quantum Threat Scanner</h2>
            {walletConnected && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 font-semibold animate-fade-in">
                  <span>✅ Wallet Connected Successfully</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-2 animate-fade-in-up">
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
                    <Button onClick={handleScan} className="w-full animate-gradient-x" variant="card">Scan Wallet</Button>
                  </div>
                </div>
                {/* Always show scan result card, with placeholder if no scan yet */}
                <div className="mt-4">
                  <Card className={`rounded-lg p-4 mb-6 animate-fade-in ${scanResult ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}> 
                    {scanResult ? (
                      <>
                        <div className="font-semibold text-green-700 text-lg mb-2 flex items-center gap-2 animate-fade-in-up">
                          {scanResult.riskLevel === 'Low' && <span>✅</span>}
                          {scanResult.riskLevel === 'Medium' && <span>⚠️</span>}
                          {scanResult.riskLevel === 'High' && <span>🚨</span>}
                          {scanResult.status}
                        </div>
                        <div className="text-xs text-gray-500 mb-4">Risk Level: <span className={
                          scanResult.riskLevel === 'Low' ? 'text-green-600' : scanResult.riskLevel === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                        }>{scanResult.riskLevel}</span></div>
                        <div className="bg-white rounded-lg p-4 border border-gray-100 mb-2">
                          <div className="mb-2">
                            <span className="font-semibold text-gray-700">Asset:</span> {scanResult.name}
                          </div>
                          <div className="mb-2">
                            <span className="font-semibold text-gray-700">Wallet Address:</span> {walletAddress}
                          </div>
                          <div className="mb-2">
                            <span className="font-semibold text-gray-700">Network:</span> {network}
                          </div>
                          <div className="mb-2 text-xs text-gray-400">Scan Date: {scanResult.date || new Date().toLocaleString()}</div>
                        </div>
                        <div className="mt-2">
                          <h4 className="font-semibold text-purple-700 mb-1">Detected Vulnerabilities</h4>
                          <ul className="list-disc pl-5 text-sm text-gray-700">
                            <li>No quantum vulnerabilities found</li>
                          </ul>
                        </div>
                        <div className="mt-2">
                          <h4 className="font-semibold text-purple-700 mb-1">Security Recommendations</h4>
                          <ul className="list-disc pl-5 text-sm text-gray-700">
                            <li>Keep your wallet software up to date</li>
                            <li>Use strong, unique passwords for all accounts</li>
                            <li>Enable two-factor authentication where possible</li>
                          </ul>
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-400 text-center py-8 animate-fade-in-up">
                        <div className="text-2xl mb-2">🔍</div>
                        <div className="font-semibold mb-1">No scan performed yet</div>
                        <div className="text-sm">Scan your wallet to see quantum risk and protection options.</div>
                      </div>
                    )}
                    {/* Insurance/payment buttons always visible */}
                    <div className="mt-4 flex flex-col sm:flex-row gap-4">
                      <Button className="w-full sm:w-auto animate-gradient-x" onClick={() => { setInsuranceType('insurance'); setShowInsuranceModal(true); }} variant="card">Get Insurance</Button>
                    </div>
                  </Card>
                </div>
                {/* Scan History Section always visible */}
                <div className="mt-6">
                  <Card className="bg-white/70 border border-gray-200 rounded-lg p-4 animate-fade-in">
                    <h4 className="font-semibold text-purple-700 mb-3 animate-fade-in-up">Scan History</h4>
                    {scanHistory.length > 0 ? (
                      <ul className="divide-y divide-gray-200">
                        {scanHistory.map((item, idx) => (
                          <li key={idx} className="py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2 animate-fade-in-up">
                            <span className="font-mono text-xs text-gray-500">{item.date}</span>
                            <span className="text-sm font-semibold text-gray-700">{item.name}</span>
                            <span className={
                              item.riskLevel === 'Low' ? 'text-green-600' : item.riskLevel === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                            }>{item.riskLevel}</span>
                            <span className="text-xs text-gray-400">{item.status}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-gray-400 text-center py-4 animate-fade-in-up">No scan history yet.</div>
                    )}
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rewards & Ambassador Section */}
        <Card className="mb-10 bg-gradient-to-br from-pink-50 via-white to-purple-50 shadow-xl border-0 animate-fade-in-up">
          <CardContent className="space-y-10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h3 className="text-2xl font-semibold flex items-center gap-2">
                Ambassador & Rewards Dashboard
                <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold animate-pulse transition-colors duration-500 ${
                  referralStats.tier === 'Gold' ? 'bg-yellow-400 text-yellow-900' : referralStats.tier === 'Silver' ? 'bg-gray-300 text-gray-700' : 'bg-orange-200 text-orange-700'
                }`}>
                  {referralStats.tier}
                </span>
              </h3>
              <Button variant="outline" onClick={() => {navigator.clipboard.writeText(referralLink); alert('Referral link copied!')}}>
                <Copy className="w-4 h-4 mr-2" /> Copy Referral Link
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Stat label="Referrals" value={referralStats.referrals} animate />
              <Stat label="Total Points" value={referralStats.points} animate />
              <Stat label="Posts Created" value={referralStats.posts} animate />
              <Stat label="Earned Commission" value={`$${referralStats.commission.toFixed(2)}`} animate />
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Current Tier: <span className="font-bold text-purple-600">{referralStats.tier}</span></h4>
              {nextTier ? (
                <div className="space-y-2">
                  <ProgressLabel label="Referrals" value={referralStats.referrals} target={tierRequirements.referrals} progress={progress.referrals} animate />
                  <ProgressLabel label="Points" value={referralStats.points} target={tierRequirements.points} progress={progress.points} animate />
                  <ProgressLabel label="Posts" value={referralStats.posts} target={tierRequirements.posts} progress={progress.posts} animate />
                </div>
              ) : (
                <p className="text-green-600 font-medium">🎉 You’ve reached the highest tier!</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Social Engagement Section */}
        <Card className="mb-10 bg-gradient-to-br from-blue-50 via-white to-pink-50 shadow-xl border-0 animate-fade-in-up">
          <CardContent className="space-y-6">
            <div className="pt-6">
              <h4 className="text-lg font-semibold mb-2">Social Engagement Rewards</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {socialPoints.map(social => (
                  <Card key={social.platform} className="p-4 transition-all duration-500 hover:scale-105 hover:shadow-lg animate-fade-in-up">
                    <h5 className="text-lg font-bold mb-1 flex items-center gap-2">
                      <span>{social.platform === 'Twitter' && '🐦'}{social.platform === 'Telegram' && '💬'}{social.platform === 'YouTube' && '▶️'}{social.platform === 'LinkedIn' && '💼'}</span>
                      {social.platform}
                    </h5>
                    <p className="text-sm">+{social.pointsPerPost || social.base} points/post</p>
                    <p className="text-xs text-gray-400">+{social.perEngagement || social.engagement} per engagement</p>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add a placeholder for future chart/graph section */}
        <Card className="mb-10 bg-gradient-to-br from-purple-50 via-white to-blue-50 shadow-xl border-0 animate-fade-in-up">
          <CardContent className="space-y-6 flex flex-col items-center justify-center min-h-[180px]">
            <div className="w-full flex flex-col items-center">
              <div className="w-full max-w-xs h-40 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center text-white text-2xl font-bold animate-glow opacity-60">
                {/* Placeholder for future chart/graph */}
                Coming soon: Interactive Analytics & Charts
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
          <a href="https://quantumsafeio.github.io/QuantumSafe/" target="_blank" rel="noopener noreferrer">
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

function Stat({ label, value, animate }) {
  return (
    <div className={`bg-gray-50 p-4 rounded-xl text-center shadow-sm transition-all duration-500 ${animate ? 'hover:scale-105 hover:shadow-lg' : ''}`}>
      <div className="text-2xl font-bold animate-fade-in-up">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}

function ProgressLabel({ label, value, target, progress, animate }) {
  return (
    <div className="transition-all duration-500">
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{value}/{target}</span>
      </div>
      <div className={animate ? 'animate-pulse' : ''}>
        <ProgressBar value={progress} />
      </div>
    </div>
  );
}