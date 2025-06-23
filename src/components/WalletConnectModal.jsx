import React, { useState } from 'react';
import { Copy, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { multiChainWallet } from '../services/multiChainWallet';

const WALLETS = [
  { key: 'ethereum', name: 'MetaMask', icon: '🦊', color: 'bg-yellow-400' },
  { key: 'solana', name: 'Phantom', icon: '👻', color: 'bg-purple-500' },
  { key: 'bitcoin', name: 'UniSat', icon: '₿', color: 'bg-yellow-600' },
  { key: 'sui', name: 'SUI Wallet', icon: '🔷', color: 'bg-blue-400' },
];

export default function WalletConnectModal({ isOpen, onClose, onConnect }) {
  const [connecting, setConnecting] = useState('');
  const [error, setError] = useState('');

  const handleConnect = async (networkKey) => {
    setConnecting(networkKey);
    setError('');
    try {
      const result = await multiChainWallet.connectWallet(networkKey);
      setConnecting('');
      onConnect(result);
    } catch (err) {
      setConnecting('');
      setError(err.message || 'Failed to connect wallet.');
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-fade-in-up">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500" onClick={onClose}><X size={24} /></button>
        <h2 className="text-2xl font-bold mb-4 text-center">Connect Your Wallet</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {WALLETS.map(w => (
            <button
              key={w.key}
              className={`flex flex-col items-center justify-center rounded-xl p-4 font-semibold text-lg shadow-md transition-all duration-300 hover:scale-105 focus:outline-none ${w.color} text-white ${connecting === w.key ? 'opacity-60 pointer-events-none' : ''}`}
              onClick={() => handleConnect(w.key)}
              disabled={!!connecting}
            >
              <span className="text-3xl mb-2 animate-bounce-slow">{w.icon}</span>
              {w.name}
              {connecting === w.key && <span className="mt-2 text-xs animate-pulse">🔄 Connecting...</span>}
            </button>
          ))}
        </div>
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3 mb-2 animate-fade-in-up">
            <AlertTriangle size={18} /> <span>{error}</span>
          </div>
        )}
        <p className="text-xs text-gray-400 text-center mt-2">Your wallet is used for authentication and secure payments only. No transactions are made without your approval.</p>
      </div>
    </div>
  );
}
