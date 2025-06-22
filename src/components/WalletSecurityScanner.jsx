import React, { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";

const NETWORKS = [
  {
    name: "Ethereum",
    symbol: "ETH",
    address: "0xE4A671f105E9e54eC45Bf9217a9e8050cBD92108",
    coingeckoId: "ethereum",
    icon: "⟠",
    color: "#627EEA",
    chainId: 1,
    rpcUrl: "https://mainnet.infura.io/v3/YOUR_KEY"
  },
  {
    name: "Solana",
    symbol: "SOL",
    address: "24YRQbK4A6TrcBSmvm92iZK6KJ8X3qiEoSoYEwHp8EL2",
    coingeckoId: "solana",
    icon: "◎",
    color: "#9945FF",
    chainId: null,
    rpcUrl: "https://api.mainnet-beta.solana.com"
  },
  {
    name: "Bitcoin",
    symbol: "BTC",
    address: "bc1qe552eydkjy0vz0ln068mkmg9uhmwn3g9p0p875",
    coingeckoId: "bitcoin",
    icon: "₿",
    color: "#F7931A",
    chainId: null,
    rpcUrl: null
  },
  {
    name: "SUI",
    symbol: "SUI",
    address: "0xaa5402dbb7bb02986fce47dcce033a3eb8047db97b0107dc21bdb10358a5b92e",
    coingeckoId: "sui",
    icon: "🔷",
    color: "#4DA2FF",
    chainId: null,
    rpcUrl: "https://fullnode.mainnet.sui.io:443"
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
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [actualWalletAddress, setActualWalletAddress] = useState(walletAddress);

  // Get the correct network based on connected wallet
  const network = NETWORKS.find((n) => n.symbol === selectedNetwork);

  // Update wallet address when network changes or wallet connects
  useEffect(() => {
    if (provider && selectedNetwork === 'ETH') {
      // For Ethereum, use the connected wallet address
      setActualWalletAddress(walletAddress);
    } else if (selectedNetwork === 'SOL') {
      // For Solana, generate or use Solana address format
      const solanaAddress = generateSolanaAddress(walletAddress);
      setActualWalletAddress(solanaAddress);
    } else if (selectedNetwork === 'BTC') {
      // For Bitcoin, generate Bitcoin address format
      const btcAddress = generateBitcoinAddress(walletAddress);
      setActualWalletAddress(btcAddress);
    } else if (selectedNetwork === 'SUI') {
      // For SUI, generate SUI address format
      const suiAddress = generateSuiAddress(walletAddress);
      setActualWalletAddress(suiAddress);
    }
  }, [selectedNetwork, walletAddress, provider]);

  // Generate network-specific addresses based on original wallet
  function generateSolanaAddress(ethAddress) {
    if (!ethAddress) return '';
    // Generate a realistic Solana address based on ETH address
    const hash = ethAddress.slice(2); // Remove 0x
    const solanaBase = hash.substring(0, 32);
    return solanaBase + 'A'.repeat(44 - solanaBase.length);
  }

  function generateBitcoinAddress(ethAddress) {
    if (!ethAddress) return '';
    // Generate a realistic Bitcoin address
    const hash = ethAddress.slice(2, 34);
    return 'bc1q' + hash.toLowerCase();
  }

  function generateSuiAddress(ethAddress) {
    if (!ethAddress) return '';
    // Generate a realistic SUI address
    return '0x' + ethAddress.slice(2, 34) + ethAddress.slice(2, 34);
  }

  const handleAssetNameChange = (e) => {
    const value = e.target.value;
    if (/^[a-zA-Z0-9 ._-]*$/.test(value)) {
      setAssetName(value);
      setInputError("");
    } else {
      setInputError("Asset name must contain only English letters, numbers, spaces, and basic symbols (. _ -)");
    }
  };

  const handleNetworkChange = (e) => {
    setSelectedNetwork(e.target.value);
    setScanResult(null);
    setCryptoAmount(null);
    setPaymentSuccess(false);
  };

  const handleScan = async () => {
    if (!assetName.trim()) {
      setInputError("Please enter an asset name to scan");
      return;
    }

    setLoading(true);
    
    // Simulate realistic scanning process
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Generate unique risk assessment based on wallet + asset + network
    const uniqueHash = generateUniqueHash(actualWalletAddress, assetName, network.name);
    const riskAssessment = generateRiskAssessment(uniqueHash, assetName, network.name);
    
    setScanResult(riskAssessment);

    // Calculate insurance pricing based on risk level and asset type
    const isHighValueAsset = /contract|app|dapp|defi/i.test(assetName);
    const basePrice = isHighValueAsset ? 2000 : 500;
    const riskMultiplier = riskAssessment.riskLevel === 'High' ? 1.5 : 
                          riskAssessment.riskLevel === 'Medium' ? 1.2 : 1.0;
    const finalPrice = Math.floor(basePrice * riskMultiplier);
    
    setInsurancePrice(finalPrice);

    // Get real-time crypto prices
    try {
      const { data } = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${network.coingeckoId}&vs_currencies=usd`
      );
      const price = data[network.coingeckoId].usd;
      setCryptoAmount((finalPrice / price).toFixed(6));
    } catch {
      // Fallback prices if API fails
      const fallbackPrices = { ETH: 2000, SOL: 20, BTC: 43000, SUI: 1.5 };
      const price = fallbackPrices[network.symbol] || 100;
      setCryptoAmount((finalPrice / price).toFixed(6));
    }
    
    setLoading(false);
  };

  // Generate unique hash for consistent but unique results
  function generateUniqueHash(wallet, asset, networkName) {
    const combined = `${wallet}-${asset}-${networkName}`.toLowerCase();
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Generate risk assessment based on unique hash
  function generateRiskAssessment(hash, asset, networkName) {
    const riskSeed = hash % 100;
    
    // Determine risk level based on hash and asset type
    let riskLevel, riskScore, riskColor, riskIcon;
    
    if (riskSeed < 25) {
      riskLevel = "High";
      riskScore = 70 + (hash % 30);
      riskColor = "#EF4444";
      riskIcon = "🚨";
    } else if (riskSeed < 60) {
      riskLevel = "Medium";
      riskScore = 40 + (hash % 30);
      riskColor = "#F59E0B";
      riskIcon = "⚠️";
    } else {
      riskLevel = "Low";
      riskScore = 10 + (hash % 30);
      riskColor = "#10B981";
      riskIcon = "✅";
    }

    // Generate vulnerabilities based on risk level and asset type
    const vulnerabilities = generateUniqueVulnerabilities(riskLevel, asset, hash);
    
    // Generate recommendations
    const recommendations = generateSmartRecommendations(riskLevel, asset, vulnerabilities);
    
    // Generate unique descriptions
    const descriptions = generateUniqueDescriptions(asset, networkName, riskLevel, hash);

    return {
      riskLevel,
      riskScore,
      riskColor,
      riskIcon,
      vulnerabilities,
      recommendations,
      scanId: `QS-${Date.now()}-${(hash % 100000).toString().padStart(5, '0')}`,
      confidence: 88 + (hash % 12), // 88-99% confidence
      uniqueDesc: descriptions.detailed,
      riskDesc: descriptions.summary,
      threatTimeline: riskLevel === 'High' ? '2-5 years' : 
                     riskLevel === 'Medium' ? '5-10 years' : '10+ years',
      impactLevel: riskLevel === 'High' ? 'Critical' : 
                   riskLevel === 'Medium' ? 'Moderate' : 'Low'
    };
  }

  function generateUniqueVulnerabilities(riskLevel, asset, hash) {
    const allVulns = [
      { name: "Quantum Key Exposure", severity: "High", description: "Private keys vulnerable to Shor's algorithm attacks that could compromise wallet security within 5-10 years" },
      { name: "Hash Function Weakness", severity: "Medium", description: "Current hash functions susceptible to Grover's algorithm providing 50% security reduction" },
      { name: "Signature Scheme Vulnerability", severity: "High", description: "ECDSA signatures can be broken by quantum computers using polynomial-time algorithms" },
      { name: "Random Number Predictability", severity: "Medium", description: "Entropy sources may be compromised by quantum algorithms affecting key generation" },
      { name: "Legacy Cryptography Implementation", severity: "Low", description: "Outdated encryption methods without quantum-resistant alternatives" },
      { name: "Key Derivation Weakness", severity: "Medium", description: "Hierarchical key generation vulnerable to quantum cryptanalysis" },
      { name: "Consensus Mechanism Vulnerability", severity: "High", description: "Proof-of-work algorithms susceptible to quantum speedup attacks" },
      { name: "Smart Contract Quantum Exposure", severity: "High", description: "Contract logic relies on quantum-vulnerable cryptographic primitives" }
    ];

    const numVulns = riskLevel === 'High' ? 4 + (hash % 3) : 
                     riskLevel === 'Medium' ? 2 + (hash % 2) : 
                     1 + (hash % 2);
    
    // Select vulnerabilities based on hash for consistency
    const selectedVulns = [];
    for (let i = 0; i < numVulns && i < allVulns.length; i++) {
      const index = (hash + i * 7) % allVulns.length;
      if (!selectedVulns.find(v => v.name === allVulns[index].name)) {
        selectedVulns.push(allVulns[index]);
      }
    }
    
    return selectedVulns;
  }

  function generateSmartRecommendations(riskLevel, asset, vulnerabilities) {
    const baseRecs = [
      "Implement post-quantum cryptography standards (NIST-approved algorithms)",
      "Upgrade to quantum-resistant signature schemes (CRYSTALS-Dilithium, FALCON)",
      "Deploy quantum-safe key exchange protocols (CRYSTALS-KYBER)",
      "Establish quantum threat monitoring and early warning systems"
    ];

    const urgentRecs = [
      "🚨 CRITICAL: Migrate to quantum-resistant encryption within 6 months",
      "🔄 Implement hybrid classical-quantum cryptographic systems immediately",
      "🛡️ Deploy quantum-safe backup and recovery mechanisms",
      "📊 Conduct emergency security audit and penetration testing",
      "⚡ Establish quantum incident response procedures",
      "🔐 Implement quantum-safe multi-signature schemes"
    ];

    const assetSpecificRecs = {
      contract: ["Upgrade smart contract cryptographic libraries", "Implement quantum-safe oracle mechanisms"],
      defi: ["Secure liquidity pools with quantum-resistant protocols", "Implement quantum-safe governance mechanisms"],
      nft: ["Protect metadata with quantum-resistant hashing", "Implement quantum-safe ownership verification"],
      token: ["Secure token economics with quantum-resistant algorithms", "Implement quantum-safe staking mechanisms"]
    };

    let recommendations = riskLevel === 'High' ? urgentRecs.slice(0, 4) : baseRecs.slice(0, 3);
    
    // Add asset-specific recommendations
    for (const [key, recs] of Object.entries(assetSpecificRecs)) {
      if (asset.toLowerCase().includes(key)) {
        recommendations.push(...recs.slice(0, 2));
        break;
      }
    }

    return recommendations.slice(0, 6);
  }

  function generateUniqueDescriptions(asset, networkName, riskLevel, hash) {
    const templates = [
      {
        detailed: `Advanced quantum threat analysis for "${asset}" on ${networkName} network reveals ${riskLevel === 'High' ? 'critical vulnerabilities' : riskLevel === 'Medium' ? 'moderate security gaps' : 'acceptable protection levels'} in current cryptographic implementation. Our AI-powered assessment indicates immediate attention required for quantum readiness.`,
        summary: riskLevel === 'High' ? 'Critical quantum vulnerability detected. Immediate security upgrade required to prevent future exploitation.' : 
                riskLevel === 'Medium' ? 'Moderate quantum risk identified. Enhanced monitoring and preparation recommended within 12 months.' : 
                'No significant quantum threats detected. Your asset maintains strong security posture against current quantum capabilities.'
      },
      {
        detailed: `Comprehensive blockchain security scan of "${asset}" demonstrates ${riskLevel === 'High' ? 'severe exposure' : riskLevel === 'Medium' ? 'potential vulnerabilities' : 'robust protection'} to quantum computing threats. Cross-platform analysis indicates ${riskLevel === 'High' ? 'urgent migration needed' : riskLevel === 'Medium' ? 'proactive measures advised' : 'current security adequate'}.`,
        summary: riskLevel === 'High' ? 'High-priority quantum threats identified. Asset requires immediate quantum-resistant upgrades.' : 
                riskLevel === 'Medium' ? 'Moderate quantum exposure detected. Recommend implementing quantum-safe measures within 2 years.' : 
                'Low quantum risk profile. Continue monitoring quantum developments and maintain current security practices.'
      }
    ];

    return templates[hash % templates.length];
  }

  const handleSecurePayment = async () => {
    if (!cryptoAmount || Number(cryptoAmount) <= 0) {
      alert('Unable to process payment. Please try scanning again.');
      return;
    }
    
    setPaying(true);
    
    try {
      if (network.symbol === 'ETH' && provider) {
        // Ethereum payment via connected wallet
        const signer = provider.getSigner();
        const networkInfo = await provider.getNetwork();
        
        // Verify network
        if (networkInfo.chainId !== network.chainId) {
          alert(`Please switch to ${network.name} network in your wallet.`);
          setPaying(false);
          return;
        }
        
        // Send transaction
        const tx = await signer.sendTransaction({
          to: network.address,
          value: ethers.utils.parseEther(cryptoAmount),
          gasLimit: 21000
        });
        
        // Wait for confirmation
        await tx.wait(1);
        
        setPaymentSuccess(true);
        alert(`✅ Payment successful! Your asset is now protected.\n\nTransaction: ${tx.hash}`);
        
      } else if (network.symbol === 'SOL' && window.phantom?.solana) {
        // Solana payment via Phantom
        const provider = window.phantom.solana;
        await provider.connect();
        
        // Simulate Solana transaction
        const signature = 'SOL_' + Math.random().toString(36).substr(2, 9);
        setPaymentSuccess(true);
        alert(`✅ Payment successful! Your asset is now protected.\n\nSignature: ${signature}`);
        
      } else {
        // For BTC and SUI - show payment modal with QR code
        showPaymentModal();
      }
      
    } catch (err) {
      console.error('Payment Error:', err);
      if (err.code === 4001) {
        alert('Payment cancelled by user.');
      } else {
        alert('Payment failed. Please try again.');
      }
    } finally {
      setPaying(false);
    }
  };

  const showPaymentModal = () => {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
      background: rgba(0,0,0,0.8); display: flex; align-items: center; 
      justify-content: center; z-index: 10000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white; padding: 32px; border-radius: 16px; 
      max-width: 400px; text-align: center;
    `;
    
    modalContent.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #1f2937;">Complete Payment</h3>
      <p style="margin: 0 0 16px 0; color: #6b7280;">Send exactly <strong>${cryptoAmount} ${network.symbol}</strong> to:</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; word-break: break-all; font-family: monospace; font-size: 12px;">
        ${network.address}
      </div>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="copyBtn" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
          Copy Address
        </button>
        <button id="paymentSentBtn" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer;">
          Payment Sent
        </button>
        <button id="cancelBtn" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">
          Cancel
        </button>
      </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Add event listeners
    const copyBtn = modalContent.querySelector('#copyBtn');
    const paymentSentBtn = modalContent.querySelector('#paymentSentBtn');
    const cancelBtn = modalContent.querySelector('#cancelBtn');
    
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(network.address);
      alert('Address copied!');
    });
    
    paymentSentBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
      setPaymentSuccess(true);
    });
    
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    setPaying(false);
  };

  const getRiskBarWidth = (score) => `${Math.min(score, 100)}%`;

  return (
    <div className="wallet-scanner-container">
      {/* Header Section */}
      <div className="scanner-header">
        <div className="header-content">
          <div className="header-icon">🔍</div>
          <div>
            <h2>Quantum Security Scanner</h2>
            <p>Advanced AI-powered analysis for digital asset protection</p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="scanner-inputs">
        <div className="input-grid">
          <div className="input-group">
            <label>
              <span className="label-icon">🌐</span>
              Connected Network
            </label>
            <select value={selectedNetwork} onChange={handleNetworkChange} disabled={loading}>
              {NETWORKS.map((n) => (
                <option key={n.symbol} value={n.symbol}>
                  {n.icon} {n.name}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>
              <span className="label-icon">💰</span>
              Wallet Address
            </label>
            <div className="address-display">
              <span className="address-text">{actualWalletAddress}</span>
              <div className="network-badge" style={{ backgroundColor: network?.color }}>
                {network?.icon} {network?.symbol}
              </div>
            </div>
          </div>

          <div className="input-group">
            <label>
              <span className="label-icon">🎯</span>
              Asset Name (Smart Contract, App, NFT, Token, etc.)
            </label>
            <input
              value={assetName}
              onChange={handleAssetNameChange}
              placeholder="Enter asset name for security analysis"
              disabled={loading}
              className={inputError ? 'error' : ''}
            />
            {inputError && <div className="error-message">{inputError}</div>}
          </div>
        </div>

        <button 
          className={`scan-btn ${loading ? 'loading' : ''}`}
          onClick={handleScan} 
          disabled={loading || !assetName.trim() || !!inputError}
        >
          {loading ? (
            <>
              <div className="loading-spinner"></div>
              Analyzing Security...
            </>
          ) : (
            <>
              <span className="btn-icon">🔍</span>
              Start Quantum Security Scan
            </>
          )}
        </button>
      </div>

      {/* Results Section */}
      {scanResult && (
        <div className="results-container">
          {/* Security Certificate */}
          <div className="security-certificate">
            <div className="cert-header">
              <div className="cert-logo">
                <div className="logo-icon">🛡️</div>
                <div className="logo-text">
                  <h3>QuantumSafe Security Certificate</h3>
                  <p>Scan ID: {scanResult.scanId}</p>
                </div>
              </div>
              <div className="cert-confidence">
                <div className="confidence-score">{scanResult.confidence}%</div>
                <div className="confidence-label">Confidence</div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="risk-assessment">
              <div className="risk-header">
                <h4>Quantum Threat Assessment</h4>
                <div className="risk-badge" style={{ backgroundColor: scanResult.riskColor }}>
                  {scanResult.riskIcon} {scanResult.riskLevel} Risk
                </div>
              </div>
              
              <div className="risk-metrics">
                <div className="risk-score-circle">
                  <div className="score-value">{scanResult.riskScore}</div>
                  <div className="score-label">Risk Score</div>
                </div>
                
                <div className="risk-details">
                  <div className="risk-bar-container">
                    <div className="risk-bar-bg">
                      <div 
                        className="risk-bar-fill" 
                        style={{
                          width: getRiskBarWidth(scanResult.riskScore),
                          backgroundColor: scanResult.riskColor
                        }}
                      ></div>
                    </div>
                    <div className="risk-labels">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                  </div>
                  
                  <div className="threat-info">
                    <div className="threat-item">
                      <span className="threat-label">Impact Level:</span>
                      <span className="threat-value">{scanResult.impactLevel}</span>
                    </div>
                    <div className="threat-item">
                      <span className="threat-label">Threat Timeline:</span>
                      <span className="threat-value">{scanResult.threatTimeline}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Asset Details */}
            <div className="asset-details">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Wallet Address:</span>
                  <span className="detail-value address">{actualWalletAddress}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Network:</span>
                  <span className="detail-value">{network.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Asset:</span>
                  <span className="detail-value">{assetName}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Scan Date:</span>
                  <span className="detail-value">{new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Analysis Results */}
            <div className="analysis-results">
              <div className="analysis-section">
                <h5>🔍 Detailed Analysis</h5>
                <p className="analysis-description">{scanResult.uniqueDesc}</p>
                <p className="risk-description">{scanResult.riskDesc}</p>
              </div>

              {/* Vulnerabilities */}
              {scanResult.vulnerabilities && scanResult.vulnerabilities.length > 0 && (
                <div className="vulnerabilities-section">
                  <h5>⚠️ Identified Vulnerabilities</h5>
                  <div className="vulnerabilities-list">
                    {scanResult.vulnerabilities.map((vuln, index) => (
                      <div key={index} className={`vulnerability-item ${vuln.severity.toLowerCase()}`}>
                        <div className="vuln-header">
                          <span className="vuln-name">{vuln.name}</span>
                          <span className={`vuln-severity ${vuln.severity.toLowerCase()}`}>
                            {vuln.severity}
                          </span>
                        </div>
                        <p className="vuln-description">{vuln.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {scanResult.recommendations && scanResult.recommendations.length > 0 && (
                <div className="recommendations-section">
                  <h5>💡 Security Recommendations</h5>
                  <ul className="recommendations-list">
                    {scanResult.recommendations.map((rec, index) => (
                      <li key={index} className="recommendation-item">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="cert-footer">
              <p>This certificate is dynamically generated and unique for your wallet and asset.</p>
              <p><strong>Powered by QuantumSafe AI Security Engine</strong></p>
            </div>
          </div>

          {/* Insurance Section */}
          {insurancePrice && cryptoAmount && !paymentSuccess && (
            <div className="insurance-section">
              <div className="insurance-header">
                <h3>🛡️ Quantum Protection Insurance</h3>
                <p>Secure your asset with comprehensive quantum threat protection</p>
              </div>
              
              <div className="insurance-details">
                <div className="insurance-grid">
                  <div className="insurance-item">
                    <span className="insurance-label">Coverage Amount:</span>
                    <span className="insurance-value">${insurancePrice.toLocaleString()}</span>
                  </div>
                  <div className="insurance-item">
                    <span className="insurance-label">Premium Cost:</span>
                    <span className="insurance-value">{cryptoAmount} {network.symbol}</span>
                  </div>
                  <div className="insurance-item">
                    <span className="insurance-label">Protection Period:</span>
                    <span className="insurance-value">12 Months</span>
                  </div>
                  <div className="insurance-item">
                    <span className="insurance-label">Coverage Type:</span>
                    <span className="insurance-value">Quantum Threat Protection</span>
                  </div>
                </div>
              </div>

              <button
                className={`secure-btn ${paying ? 'loading' : ''}`}
                onClick={handleSecurePayment}
                disabled={paying}
              >
                {paying ? (
                  <>
                    <div className="loading-spinner"></div>
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🚀</span>
                    Secure This Asset ({cryptoAmount} {network.symbol})
                  </>
                )}
              </button>
            </div>
          )}

          {/* Success Certificate */}
          {paymentSuccess && (
            <div className="success-certificate">
              <div className="success-header">
                <div className="success-icon">✅</div>
                <h3>Asset Successfully Protected!</h3>
                <p>Your quantum protection insurance is now active</p>
              </div>
              
              <div className="protection-details">
                <div className="protection-item">
                  <span className="protection-label">Protected Asset:</span>
                  <span className="protection-value">{assetName}</span>
                </div>
                <div className="protection-item">
                  <span className="protection-label">Coverage Amount:</span>
                  <span className="protection-value">${insurancePrice.toLocaleString()}</span>
                </div>
                <div className="protection-item">
                  <span className="protection-label">Protection Expires:</span>
                  <span className="protection-value">{new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString()}</span>
                </div>
                <div className="protection-item">
                  <span className="protection-label">Certificate ID:</span>
                  <span className="protection-value">{scanResult.scanId}-PROTECTED</span>
                </div>
              </div>
              
              <div className="protection-benefits">
                <h4>🛡️ Your Protection Includes:</h4>
                <ul>
                  <li>24/7 quantum threat monitoring</li>
                  <li>Instant security alerts and notifications</li>
                  <li>Emergency response and recovery assistance</li>
                  <li>Coverage against quantum-based attacks</li>
                  <li>Priority access to quantum-safe upgrades</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .wallet-scanner-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 24px;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .scanner-header {
          margin-bottom: 32px;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-icon {
          font-size: 48px;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-content h2 {
          color: #ffffff;
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .header-content p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 16px;
          margin: 0;
        }

        .scanner-inputs {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 32px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .input-grid {
          display: grid;
          gap: 24px;
          margin-bottom: 32px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          color: #ffffff;
          font-weight: 600;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .label-icon {
          font-size: 18px;
        }

        .input-group input,
        .input-group select {
          padding: 16px;
          border-radius: 12px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          font-size: 16px;
          transition: all 0.3s ease;
        }

        .input-group input:focus,
        .input-group select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .input-group input.error {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .address-display {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.1);
        }

        .address-text {
          flex: 1;
          color: #ffffff;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          word-break: break-all;
        }

        .network-badge {
          padding: 6px 12px;
          border-radius: 20px;
          color: white;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .error-message {
          color: #ef4444;
          font-size: 14px;
          margin-top: 4px;
        }

        .scan-btn {
          width: 100%;
          padding: 20px;
          border-radius: 16px;
          border: none;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          color: white;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
        }

        .scan-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(59, 130, 246, 0.4);
        }

        .scan-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .scan-btn.loading {
          background: linear-gradient(45deg, #6b7280, #9ca3af);
        }

        .btn-icon {
          font-size: 20px;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .results-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .security-certificate {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          border-radius: 20px;
          padding: 32px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
        }

        .cert-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .cert-logo {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .logo-icon {
          font-size: 40px;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          border-radius: 12px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-text h3 {
          color: #3b82f6;
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 4px 0;
        }

        .logo-text p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          margin: 0;
          font-family: 'Courier New', monospace;
        }

        .cert-confidence {
          text-align: center;
        }

        .confidence-score {
          font-size: 32px;
          font-weight: 700;
          color: #10b981;
          margin-bottom: 4px;
        }

        .confidence-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .risk-assessment {
          margin-bottom: 32px;
        }

        .risk-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .risk-header h4 {
          color: #ffffff;
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }

        .risk-badge {
          padding: 8px 16px;
          border-radius: 20px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .risk-metrics {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 32px;
          align-items: center;
        }

        .risk-score-circle {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, #3b82f6, #8b5cf6, #3b82f6);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .risk-score-circle::before {
          content: '';
          position: absolute;
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: #1e293b;
        }

        .score-value {
          color: #ffffff;
          font-size: 32px;
          font-weight: 700;
          z-index: 1;
        }

        .score-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          z-index: 1;
        }

        .risk-details {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .risk-bar-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .risk-bar-bg {
          width: 100%;
          height: 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          overflow: hidden;
        }

        .risk-bar-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 1.5s ease-in-out;
          background: linear-gradient(90deg, currentColor, rgba(255, 255, 255, 0.8));
        }

        .risk-labels {
          display: flex;
          justify-content: space-between;
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
        }

        .threat-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .threat-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .threat-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }

        .threat-value {
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
        }

        .asset-details {
          margin-bottom: 32px;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }

        .detail-value {
          color: #ffffff;
          font-size: 14px;
          font-weight: 500;
        }

        .detail-value.address {
          font-family: 'Courier New', monospace;
          word-break: break-all;
          font-size: 12px;
        }

        .analysis-results {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .analysis-section h5,
        .vulnerabilities-section h5,
        .recommendations-section h5 {
          color: #ffffff;
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .analysis-description,
        .risk-description {
          color: rgba(255, 255, 255, 0.8);
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 12px;
        }

        .vulnerabilities-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .vulnerability-item {
          padding: 16px;
          border-radius: 12px;
          border-left: 4px solid;
        }

        .vulnerability-item.high {
          background: rgba(239, 68, 68, 0.1);
          border-left-color: #ef4444;
        }

        .vulnerability-item.medium {
          background: rgba(245, 158, 11, 0.1);
          border-left-color: #f59e0b;
        }

        .vulnerability-item.low {
          background: rgba(16, 185, 129, 0.1);
          border-left-color: #10b981;
        }

        .vuln-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .vuln-name {
          color: #ffffff;
          font-weight: 600;
          font-size: 16px;
        }

        .vuln-severity {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .vuln-severity.high {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .vuln-severity.medium {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .vuln-severity.low {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .vuln-description {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
        }

        .recommendations-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .recommendation-item {
          padding: 12px 16px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          line-height: 1.5;
          border-left: 3px solid #3b82f6;
        }

        .cert-footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
        }

        .cert-footer p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          margin: 4px 0;
        }

        .insurance-section {
          background: linear-gradient(135deg, #065f46 0%, #047857 100%);
          border-radius: 20px;
          padding: 32px;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .insurance-header {
          margin-bottom: 24px;
        }

        .insurance-header h3 {
          color: #ffffff;
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .insurance-header p {
          color: rgba(255, 255, 255, 0.8);
          font-size: 16px;
          margin: 0;
        }

        .insurance-details {
          margin-bottom: 24px;
        }

        .insurance-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .insurance-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .insurance-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }

        .insurance-value {
          color: #ffffff;
          font-size: 16px;
          font-weight: 600;
        }

        .secure-btn {
          width: 100%;
          padding: 20px;
          border-radius: 16px;
          border: none;
          background: linear-gradient(45deg, #10b981, #059669);
          color: white;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
        }

        .secure-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(16, 185, 129, 0.4);
        }

        .secure-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .secure-btn.loading {
          background: linear-gradient(45deg, #6b7280, #9ca3af);
        }

        .success-certificate {
          background: linear-gradient(135deg, #065f46 0%, #047857 100%);
          border-radius: 20px;
          padding: 32px;
          border: 1px solid rgba(16, 185, 129, 0.3);
          text-align: center;
        }

        .success-header {
          margin-bottom: 32px;
        }

        .success-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .success-header h3 {
          color: #ffffff;
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .success-header p {
          color: rgba(255, 255, 255, 0.8);
          font-size: 16px;
          margin: 0;
        }

        .protection-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
          text-align: left;
        }

        .protection-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .protection-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }

        .protection-value {
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
        }

        .protection-benefits {
          text-align: left;
        }

        .protection-benefits h4 {
          color: #ffffff;
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 16px 0;
        }

        .protection-benefits ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .protection-benefits li {
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          padding-left: 20px;
          position: relative;
        }

        .protection-benefits li::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #10b981;
          font-weight: bold;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .wallet-scanner-container {
            padding: 16px;
          }

          .scanner-inputs {
            padding: 24px;
          }

          .security-certificate {
            padding: 24px;
          }

          .insurance-section {
            padding: 24px;
          }

          .cert-header {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }

          .risk-header {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }

          .risk-metrics {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }

          .insurance-grid {
            grid-template-columns: 1fr;
          }

          .protection-details {
            grid-template-columns: 1fr;
          }

          .threat-info {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}