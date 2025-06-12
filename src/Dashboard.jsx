import React, { useState, useEffect } from 'react';
import { useUserData, useSignOut } from '@nhost/react';
import { scanAsset } from './ghost';
import Content from './content';
import { getUserPoints, getReferralLink } from './utils';

export default function Dashboard() {
  const { user } = useUserData();
  const { signOut } = useSignOut();
  const [assetType, setAssetType] = useState('contract');
  const [assetInput, setAssetInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState(0);
  const [refCopied, setRefCopied] = useState(false);

  useEffect(() => {
    if (user?.id) {
      getUserPoints(user.id).then(setPoints);
    }
  }, [user]);

  const handleScan = async () => {
    if (points < 10) {
      alert('You do not have enough points to scan!');
      return;
    }
    setLoading(true);
    const result = await scanAsset(assetType, assetInput);
    setScanResult(result);
    setLoading(false);
    setPoints(points - 10);
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(getReferralLink(user.id));
    setRefCopied(true);
    setTimeout(() => setRefCopied(false), 2000);
  };

  return (
    <div style={{ padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Welcome, {user?.displayName || user?.email}</h2>
        <button onClick={signOut}>Sign Out</button>
      </div>
      <p>Your Points: <b>{points}</b></p>
      <div style={{ marginBottom: 16 }}>
        <span>Your Referral Link:</span>
        <input
          type="text"
          value={getReferralLink(user.id)}
          readOnly
          style={{ width: 320, margin: '0 8px' }}
        />
        <button onClick={handleCopyReferral}>
          {refCopied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <hr style={{ margin: '16px 0' }} />
      <h3>Scan a Digital Asset</h3>
      <div style={{ marginBottom: 12 }}>
        <select value={assetType} onChange={e => setAssetType(e.target.value)} style={{ marginRight: 8 }}>
          <option value="contract">Smart Contract</option>
          <option value="wallet">Wallet</option>
          <option value="nft">NFT</option>
          <option value="memecoin">Memecoin</option>
          <option value="app">App</option>
        </select>
        <input
          type="text"
          placeholder="Enter asset address or data"
          value={assetInput}
          onChange={e => setAssetInput(e.target.value)}
          style={{ marginRight: 8, width: 220 }}
        />
        <button onClick={handleScan} disabled={loading || points < 10}>
          {loading ? 'Scanning...' : 'Scan'}
        </button>
      </div>
      {scanResult && <Content result={scanResult} assetType={assetType} user={user} />}
      <div style={{ marginTop: 32, color: '#888', fontSize: 13 }}>
        <p>
          <b>How to earn points?</b><br />
          - Every 3 likes or retweets on your shared scan = 1 point.<br />
          - Every comment on your shared scan = 1 point.<br />
          - Invite friends using your referral link to get bonus points!
        </p>
        <p>
          <b>Note:</b> Each scan costs 10 points. You can share your results on Twitter or insure your asset after scanning.
        </p>
      </div>
    </div>
  );
}