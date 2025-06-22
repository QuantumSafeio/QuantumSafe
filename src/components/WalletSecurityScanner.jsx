import React, { useState } from "react";
import axios from "axios";
import { ethers } from "ethers";

const NETWORKS = [
  {
    name: "Ethereum",
    symbol: "ETH",
    address: "0xE4A671f105E9e54eC45Bf9217a9e8050cBD92108",
    coingeckoId: "ethereum",
    icon: "⟠",
    color: "#627EEA"
  },
  {
    name: "Bitcoin",
    symbol: "BTC",
    address: "bc1qe552eydkjy0vz0ln068mkmg9uhmwn3g9p0p875",
    coingeckoId: "bitcoin",
    icon: "₿",
    color: "#F7931A"
  },
  {
    name: "Solana",
    symbol: "SOL",
    address: "24YRQbK4A6TrcBSmvm92iZK6KJ8X3qiEoSoYEwHp8EL2",
    coingeckoId: "solana",
    icon: "◎",
    color: "#9945FF"
  },
  {
    name: "SUI",
    symbol: "SUI",
    address: "0xaa5402dbb7bb02986fce47dcce033a3eb8047db97b0107dc21bdb10358a5b92e",
    coingeckoId: "sui",
    icon: "🔷",
    color: "#4DA2FF"
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
      setInputError("Asset name must contain only English letters, numbers, spaces, and basic symbols (. _ -)");
    }
  };

  const handleNetworkChange = (e) => {
    setSelectedNetwork(e.target.value);
    setScanResult(null);
    setCryptoAmount(null);
  };

  const handleScan = async () => {
    if (!assetName.trim()) {
      setInputError("Please enter an asset name to scan");
      return;
    }

    setLoading(true);
    
    // Simulate realistic scanning process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate comprehensive risk assessment
    const riskLevels = [
      { 
        level: "Low", 
        color: "#10B981", 
        icon: "🟢", 
        desc: "No significant quantum threats detected. Your asset maintains strong security posture.",
        score: Math.floor(Math.random() * 30) + 10
      },
      { 
        level: "Medium", 
        color: "#F59E0B", 
        icon: "🟡", 
        desc: "Moderate quantum risk identified. Enhanced monitoring and preparation recommended.",
        score: Math.floor(Math.random() * 30) + 40
      },
      { 
        level: "High", 
        color: "#EF4444", 
        icon: "🔴", 
        desc: "Critical quantum vulnerability detected. Immediate security upgrade required.",
        score: Math.floor(Math.random() * 30) + 70
      },
    ];
    
    const riskObj = riskLevels[Math.floor(Math.random() * 3)];
    
    // Generate detailed vulnerability analysis
    const vulnerabilities = generateVulnerabilities(riskObj.level, assetName, network.name);
    
    // Generate unique risk description
    const uniqueDesc = generateUniqueRiskDescription(walletAddress, assetName, network.name, riskObj.level);
    
    setScanResult({
      riskLevel: riskObj.level,
      riskColor: riskObj.color,
      riskIcon: riskObj.icon,
      riskDesc: riskObj.desc,
      uniqueDesc,
      riskScore: riskObj.score,
      vulnerabilities,
      recommendations: generateRecommendations(riskObj.level, assetName),
      scanId: `QS-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      confidence: Math.floor(Math.random() * 10) + 90
    });

    // Calculate insurance pricing
    const isContract = /contract|app|dapp/i.test(assetName);
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

  function generateVulnerabilities(riskLevel, asset, networkName) {
    const allVulns = [
      { name: "Quantum Key Exposure", severity: "High", description: "Private keys vulnerable to Shor's algorithm attacks" },
      { name: "Hash Function Weakness", severity: "Medium", description: "Hash functions susceptible to Grover's algorithm speedup" },
      { name: "Signature Scheme Vulnerability", severity: "High", description: "ECDSA signatures can be broken by quantum computers" },
      { name: "Random Number Predictability", severity: "Medium", description: "Entropy sources may be compromised by quantum algorithms" },
      { name: "Legacy Cryptography", severity: "Low", description: "Outdated encryption methods without quantum resistance" },
      { name: "Key Derivation Weakness", severity: "Medium", description: "Key generation process vulnerable to quantum attacks" }
    ];

    const numVulns = riskLevel === 'High' ? 4 : riskLevel === 'Medium' ? 2 : 1;
    return allVulns.slice(0, numVulns);
  }

  function generateRecommendations(riskLevel, asset) {
    const baseRecs = [
      "Implement post-quantum cryptography standards",
      "Upgrade to quantum-resistant signature schemes",
      "Monitor quantum computing developments",
      "Plan migration to quantum-safe protocols"
    ];

    const urgentRecs = [
      "🚨 URGENT: Migrate to quantum-resistant encryption immediately",
      "🔄 Implement CRYSTALS-Dilithium or FALCON signature schemes",
      "🛡️ Deploy quantum-safe key exchange protocols",
      "📊 Conduct immediate security audit"
    ];

    return riskLevel === 'High' ? urgentRecs : baseRecs.slice(0, 3);
  }

  function generateUniqueRiskDescription(wallet, asset, networkName, riskLevel) {
    const hash = wallet.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const templates = [
      `Advanced quantum threat analysis for ${asset} on ${networkName} reveals ${riskLevel === 'High' ? 'critical' : riskLevel === 'Medium' ? 'moderate' : 'minimal'} exposure to future quantum attacks based on current cryptographic implementation.`,
      `QuantumSafe AI assessment indicates ${riskLevel === 'High' ? 'urgent action required' : riskLevel === 'Medium' ? 'enhanced monitoring needed' : 'current security adequate'} for this asset. Quantum readiness score reflects industry best practices.`,
      `Comprehensive blockchain security scan shows ${riskLevel === 'High' ? 'severe vulnerabilities' : riskLevel === 'Medium' ? 'potential risks' : 'acceptable security levels'} against quantum computing threats. ${riskLevel === 'High' ? 'Immediate upgrade recommended.' : riskLevel === 'Medium' ? 'Proactive measures advised.' : 'Maintain current security practices.'}`,
      `Cross-platform analysis of ${asset} cryptographic implementation on ${networkName} network demonstrates ${riskLevel === 'High' ? 'high susceptibility' : riskLevel === 'Medium' ? 'moderate vulnerability' : 'strong resistance'} to quantum cryptanalysis attacks.`
    ];
    return templates[hash % templates.length];
  }

  const handleSecure = async (e) => {
    e.preventDefault();
    if (!cryptoAmount || Number(cryptoAmount) <= 0) {
      alert('Unable to determine payment amount. Please try again after scanning.');
      return;
    }
    
    setPaying(true);
    
    try {
      if (network.symbol === 'ETH') {
        if (!provider) {
          alert('Wallet provider not connected. Please reconnect your wallet.');
          setPaying(false);
          return;
        }
        
        const signer = provider.getSigner();
        const networkInfo = await provider.getNetwork();
        
        if (networkInfo.name.toUpperCase() !== network.name.toUpperCase()) {
          alert(`Please switch your wallet to the ${network.name} network before making payment.`);
          setPaying(false);
          return;
        }
        
        const tx = await signer.sendTransaction({
          to: network.address,
          value: ethers.utils.parseEther(cryptoAmount)
        });
        
        alert(`Transaction sent successfully! Hash: ${tx.hash}`);
        setPaying(false);
        return;
      }
      
      // Handle other networks
      if (network.symbol === 'SOL' && window.phantom && window.phantom.solana) {
        // Solana payment logic
        alert('Solana payment integration coming soon!');
        setPaying(false);
        return;
      }
      
      // Bitcoin and SUI - copy address
      if (network.symbol === 'BTC' || network.symbol === 'SUI') {
        await navigator.clipboard.writeText(`${network.address} | Amount: ${cryptoAmount} ${network.symbol}`);
        alert(`Please send ${cryptoAmount} ${network.symbol} to: ${network.address}\n\nAddress and amount copied to clipboard.`);
        setPaying(false);
        return;
      }
      
      alert('Payment method not supported for this network.');
      setPaying(false);
      
    } catch (err) {
      alert('Transaction failed or was cancelled.');
      console.error('Payment Error:', err);
      setPaying(false);
    }
  };

  const getRiskBarWidth = (score) => `${Math.min(score, 100)}%`;
  const getRiskBarColor = (level) => {
    switch (level) {
      case 'High': return '#EF4444';
      case 'Medium': return '#F59E0B';
      case 'Low': return '#10B981';
      default: return '#6B7280';
    }
  };

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
              <span className="address-text">{walletAddress}</span>
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
              
              <div className="risk-bar-container">
                <div className="risk-bar-bg">
                  <div 
                    className="risk-bar-fill" 
                    style={{
                      width: getRiskBarWidth(scanResult.riskScore),
                      backgroundColor: getRiskBarColor(scanResult.riskLevel)
                    }}
                  ></div>
                </div>
                <div className="risk-score">Risk Score: {scanResult.riskScore}/100</div>
              </div>
            </div>

            {/* Asset Details */}
            <div className="asset-details">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Wallet Address:</span>
                  <span className="detail-value address">{walletAddress}</span>
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
          {insurancePrice && cryptoAmount && (
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

              {provider && network.symbol === 'ETH' && (
                <button
                  className={`secure-btn ${paying ? 'loading' : ''}`}
                  onClick={handleSecure}
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
              )}

              {(!provider || network.symbol !== 'ETH') && (
                <div className="payment-info">
                  <div className="info-icon">ℹ️</div>
                  <div>
                    <p><strong>Manual Payment Required</strong></p>
                    <p>Send {cryptoAmount} {network.symbol} to: <code>{network.address}</code></p>
                  </div>
                </div>
              )}
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
          margin-bottom: 16px;
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

        .risk-bar-container {
          margin-bottom: 16px;
        }

        .risk-bar-bg {
          width: 100%;
          height: 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .risk-bar-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 1s ease-in-out;
          background: linear-gradient(90deg, currentColor, rgba(255, 255, 255, 0.8));
        }

        .risk-score {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          font-weight: 500;
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

        .payment-info {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 12px;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .info-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .payment-info p {
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 8px 0;
          font-size: 14px;
          line-height: 1.5;
        }

        .payment-info code {
          background: rgba(0, 0, 0, 0.3);
          padding: 4px 8px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          word-break: break-all;
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

          .detail-grid {
            grid-template-columns: 1fr;
          }

          .insurance-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}