import React, { useState } from 'react';
import { CheckCircle, X, Loader2, AlertTriangle } from 'lucide-react';
import { multiChainWallet } from '../services/multiChainWallet';

const INSURANCE_ADDRESSES = {
  ethereum: '0xE4A671f105E9e54eC45Bf9217a9e8050cBD92108',
  sui: '0xaa5402dbb7bb02986fce47dcce47dcce033a3eb8047db97b0107dc21bdb10358a5b92e',
  bitcoin: 'bc1qe552eydkjy0vz0ln068mkmg9uhmwn3g9p0p875',
  solana: '24YRQbK4A6TrcBSmvm92iZK6KJ8X3qiEoSoYEwHp8EL2',
};

function getInsuranceAmount(assetName) {
  // $2000 for apps/games/projects with smart contracts, $500 for others
  if (!assetName) return 500;
  const lower = assetName.toLowerCase();
  if (lower.includes('app') || lower.includes('game') || lower.includes('project') || lower.includes('contract')) return 2000;
  return 500;
}

export default function InsurancePaymentModal({ isOpen, onClose, walletAddress, network, type, assetName }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');

  // Determine insurance amount based on assetName (dynamic, accurate)
  const insuranceUSD = getInsuranceAmount(assetName);
  // Example conversion rates (should be dynamic in production)
  const rates = { ethereum: 3500, solana: 150, bitcoin: 65000, sui: 1.5 };
  const networkKey = (network || '').toLowerCase();
  const priceCrypto = (insuranceUSD / (rates[networkKey] || 1)).toFixed(6);
  const recipient = INSURANCE_ADDRESSES[networkKey] || '';

  const handlePay = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    setTxHash('');
    try {
      const result = await multiChainWallet.sendPayment(networkKey, priceCrypto, recipient);
      setTxHash(result.hash);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Payment failed.');
    }
    setLoading(false);
  };

  // Only allow payment if assetName is present
  const canPay = !!assetName && walletAddress && network;

  if (!isOpen) return null;
  // Show dynamic, accurate insurance info based on assetName
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-fade-in-up border-2 border-purple-200">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500" onClick={onClose}><X size={24} /></button>
        <h2 className="text-2xl font-bold mb-4 text-center text-purple-700">QuantumSafe Insurance</h2>
        <div className="mb-4 text-center">
          <div className="mt-2 text-xs text-blue-700 font-semibold">
            {assetName && canPay
              ? (insuranceUSD === 2000
                ? `This asset (${assetName}) is classified as an app, game, or project with smart contracts. Insurance fee: $2000.`
                : `This asset (${assetName}) is classified as an NFT, token, memecoin, user wallet, or other. Insurance fee: $500.`)
              : 'Connect your wallet and scan an asset to enable insurance payment.'}
          </div>
        </div>
        {error && <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3 mb-2 animate-fade-in-up"><AlertTriangle size={18} /> <span>{error}</span></div>}
        {success ? (
          <div className="flex flex-col items-center gap-2 text-green-700 animate-fade-in-up">
            <CheckCircle size={36} />
            <div className="font-bold text-lg">QuantumSafe Insurance Certificate</div>
            <div className="bg-gradient-to-br from-white via-purple-50 to-purple-100 rounded-lg p-4 border-2 border-purple-300 w-full mt-2 text-left text-xs text-gray-700 shadow-inner">
              <div className="mb-2 text-center text-purple-700 font-bold text-base">Certificate of Quantum Threat Insurance</div>
              <div><b>Insured Wallet:</b> <span className="font-mono">{walletAddress}</span></div>
              <div><b>Network:</b> {network}</div>
              <div><b>Asset Name:</b> {assetName || 'N/A'}</div>
              <div><b>Insurance Type:</b> {type === 'premium' ? 'Premium Protection' : 'Standard Insurance'}</div>
              <div><b>Amount Paid:</b> {priceCrypto} {networkKey.toUpperCase()} (~${insuranceUSD} USD)</div>
              <div><b>Recipient Address:</b> <span className="font-mono">{recipient}</span></div>
              <div><b>Transaction Hash:</b> <span className="break-all font-mono">{txHash}</span></div>
              <div><b>Date:</b> {new Date().toLocaleString()}</div>
              <div className="mt-3 text-green-800 font-bold text-xs text-center">QuantumSafe guarantees quantum threat protection for this asset as of the above date. This certificate is valid for the insured asset and wallet only. Please keep this certificate for your records.</div>
            </div>
            <button className="mt-4 px-4 py-2 rounded bg-purple-600 text-white font-bold shadow hover:bg-purple-700" onClick={onClose}>Close</button>
          </div>
        ) : (
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white hover:from-pink-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-60 disabled:pointer-events-none shadow-lg"
            onClick={handlePay}
            disabled={!canPay || loading}
          >
            {loading && <Loader2 className="animate-spin" size={20} />} Get Insurance
          </button>
        )}
      </div>
    </div>
  );
}
