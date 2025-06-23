import React, { useState } from 'react';
import { Copy, Twitter, Globe } from 'lucide-react';
import Dashboard from './components/Dashboard';

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

export default function App() {
  // Get wallet address from localStorage dynamically
  const walletAddress = localStorage.getItem('walletAddress') || '';
  // Dynamic user data based on wallet
  const user = {
    walletAddress: walletAddress,
    network: 'Ethereum',
    scannedAssets: walletAddress ? [
      {
        name: 'My NFT Collection',
        status: 'No quantum vulnerabilities found',
        riskLevel: 'Low',
        date: new Date().toLocaleString()
      },
      {
        name: 'Old Contract',
        status: '1 quantum vulnerability found',
        riskLevel: 'Medium',
        date: new Date(Date.now() - 86400000).toLocaleString()
      }
    ] : []
  };
  const referrals = {
    referralLink: `https://quantumsafe.app?ref=${walletAddress.slice(-6) || 'USER123'}`,
    totalReferrals: walletAddress ? 18 : 0,
    points: walletAddress ? 1325 : 0,
    commission: walletAddress ? 87.45 : 0,
    posts: walletAddress ? 9 : 0,
    currentTier: walletAddress ? 'Bronze' : '',
    nextTier: walletAddress ? {
      name: 'Silver',
      requirements: { referrals: 25, points: 1500, posts: 15 },
      progress: { referrals: 72, points: 88, posts: 60 }
    } : null
  };
  const socialPoints = [
    { platform: 'Twitter', pointsPerPost: 3, perEngagement: 0.05 },
    { platform: 'Telegram', pointsPerPost: 5, perEngagement: 0.01 },
    { platform: 'YouTube', pointsPerPost: 17, perEngagement: 0.3 },
    { platform: 'LinkedIn', pointsPerPost: 22, perEngagement: 0.7 }
  ];

  return <Dashboard user={user} referrals={referrals} socialPoints={socialPoints} />;
}
