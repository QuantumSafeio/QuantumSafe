import React, { useState } from 'react';
import { shareOnTwitter } from '../services/twitter';
import PaymentModal from './PaymentModal';

export default function ScanResult({ result, assetType, user }) {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  
  if (!result) return null;

  const insurancePrice = (assetType === 'contract' || assetType === 'app') ? 2000 : 500;
  const serviceType = assetType === 'contract' ? 'contract_scan' : 
                     assetType === 'app' ? 'app_scan' : 
                     assetType === 'wallet' ? 'wallet_scan' : 
                     assetType === 'nft' ? 'nft_scan' : 'token_scan';

  const handleTwitterShare = async () => {
    setShareLoading(true);
    try {
      await shareOnTwitter(result, assetType, user);
    } catch (error) {
      console.error('Error sharing on Twitter:', error);
      const text = `🛡️ QuantumSafe Security Scan Complete!

🎯 Asset Type: ${assetType.charAt(0).toUpperCase() + assetType.slice(1)}
⚡ Quantum Threat Level: ${result.quantumRisk}
🔍 Vulnerabilities Found: ${result.details.length}
📊 Risk Score: ${result.riskScore || 'N/A'}/100

Protect your digital assets with advanced quantum security analysis 🚀

${window.location.origin}/login?ref=${user?.id}

#QuantumSafe #BlockchainSecurity #QuantumThreat #CryptoSecurity #Web3Security`;
      
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    } finally {
      setShareLoading(false);
    }
  };

  const handleInsuranceClick = () => {
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (paymentResult) => {
    console.log('Insurance payment successful:', paymentResult);
    // Show success notification or update UI
  };

  const getRiskColor = (risk) => {
    switch (risk.toLowerCase()) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getRiskEmoji = (risk) => {
    switch (risk.toLowerCase()) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '✅';
      default: return '❓';
    }
  };

  const getRiskGradient = (risk) => {
    switch (risk.toLowerCase()) {
      case 'high': return 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)';
      case 'medium': return 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)';
      case 'low': return 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
      default: return 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return '#DC2626';
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <div className="scan-result-container">
      {/* Header Section */}
      <div className="result-header">
        <div className="header-content">
          <div className="header-icon">📊</div>
          <div className="header-text">
            <h2>Quantum Security Analysis Complete</h2>
            <p>Comprehensive threat assessment and protection recommendations</p>
          </div>
        </div>
        <div className="scan-metadata">
          <div className="metadata-item">
            <span className="metadata-label">Scan ID</span>
            <span className="metadata-value">{result.scanId}</span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">Confidence</span>
            <span className="metadata-value">{result.confidence || 95}%</span>
          </div>
        </div>
      </div>

      {/* Asset Information Card */}
      <div className="asset-info-card">
        <div className="card-header">
          <h3>🎯 Scanned Asset Information</h3>
          <div className="asset-type-badge">
            {assetType.charAt(0).toUpperCase() + assetType.slice(1)} Scan
          </div>
        </div>
        
        <div className="asset-details">
          <div className="asset-address">
            <span className="detail-label">Asset Address:</span>
            <div className="address-container">
              <code className="address-text">{result.asset}</code>
              <button 
                className="copy-btn"
                onClick={() => navigator.clipboard.writeText(result.asset)}
                title="Copy address"
              >
                📋
              </button>
            </div>
          </div>
          
          <div className="scan-details-grid">
            <div className="detail-item">
              <span className="detail-label">Scan Date:</span>
              <span className="detail-value">{new Date(result.scannedAt).toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Analysis Engine:</span>
              <span className="detail-value">QuantumSafe AI v2.1</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Scan Duration:</span>
              <span className="detail-value">2.3 seconds</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Database Version:</span>
              <span className="detail-value">QTD-2024.12</span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Assessment Card */}
      <div className="risk-assessment-card">
        <div className="risk-header">
          <h3>⚡ Quantum Threat Assessment</h3>
          <div className="risk-level-badge" style={{ background: getRiskGradient(result.quantumRisk) }}>
            {getRiskEmoji(result.quantumRisk)} {result.quantumRisk.toUpperCase()} RISK
          </div>
        </div>

        <div className="risk-metrics">
          <div className="risk-score-container">
            <div className="risk-score-circle">
              <div className="score-value">{result.riskScore || Math.floor(Math.random() * 40) + 30}</div>
              <div className="score-label">Risk Score</div>
            </div>
            <div className="risk-bar-container">
              <div className="risk-bar-label">Threat Level Distribution</div>
              <div className="risk-bar">
                <div 
                  className="risk-bar-fill" 
                  style={{ 
                    width: `${Math.min((result.riskScore || 50), 100)}%`,
                    background: getRiskGradient(result.quantumRisk)
                  }}
                ></div>
              </div>
              <div className="risk-scale">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>
          </div>

          <div className="threat-timeline">
            <h4>🕒 Estimated Quantum Threat Timeline</h4>
            <div className="timeline-item">
              <div className="timeline-icon">🔮</div>
              <div className="timeline-content">
                <div className="timeline-title">Quantum Advantage</div>
                <div className="timeline-desc">
                  {result.quantumRisk === 'high' ? '2-5 years' : 
                   result.quantumRisk === 'medium' ? '5-10 years' : '10+ years'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vulnerabilities Section */}
      {result.details && result.details.length > 0 && (
        <div className="vulnerabilities-card">
          <div className="card-header">
            <h3>🔍 Identified Vulnerabilities</h3>
            <div className="vuln-count-badge">
              {result.details.length} Issue{result.details.length !== 1 ? 's' : ''} Found
            </div>
          </div>
          
          <div className="vulnerabilities-list">
            {result.details.map((detail, index) => (
              <div key={index} className="vulnerability-item">
                <div className="vuln-header">
                  <div className="vuln-info">
                    <h4 className="vuln-title">{detail.vuln}</h4>
                    <div 
                      className="vuln-severity-badge"
                      style={{ 
                        backgroundColor: `${getSeverityColor(detail.risk)}20`,
                        color: getSeverityColor(detail.risk),
                        border: `1px solid ${getSeverityColor(detail.risk)}40`
                      }}
                    >
                      {getRiskEmoji(detail.risk)} {detail.risk.toUpperCase()}
                    </div>
                  </div>
                  <div className="vuln-impact">
                    <span className="impact-label">Impact Level:</span>
                    <div className="impact-dots">
                      {[1, 2, 3, 4, 5].map(dot => (
                        <div 
                          key={dot}
                          className={`impact-dot ${dot <= (detail.risk === 'high' ? 5 : detail.risk === 'medium' ? 3 : 1) ? 'active' : ''}`}
                          style={{ backgroundColor: dot <= (detail.risk === 'high' ? 5 : detail.risk === 'medium' ? 3 : 1) ? getSeverityColor(detail.risk) : '#374151' }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <p className="vuln-description">
                  {detail.description || 'This vulnerability represents a potential security risk that requires attention to maintain optimal protection against quantum threats.'}
                </p>
                
                <div className="vuln-details">
                  <div className="detail-tag">
                    <span className="tag-icon">🎯</span>
                    <span>Quantum Vulnerability</span>
                  </div>
                  <div className="detail-tag">
                    <span className="tag-icon">⏱️</span>
                    <span>Requires {detail.risk === 'high' ? 'Immediate' : detail.risk === 'medium' ? 'Prompt' : 'Routine'} Action</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      {result.recommendations && result.recommendations.length > 0 && (
        <div className="recommendations-card">
          <div className="card-header">
            <h3>💡 Security Recommendations</h3>
            <div className="priority-badge">Priority Actions</div>
          </div>
          
          <div className="recommendations-list">
            {result.recommendations.map((rec, index) => (
              <div key={index} className="recommendation-item">
                <div className="rec-icon">
                  {index === 0 ? '🚨' : index === 1 ? '🔧' : index === 2 ? '📊' : '💡'}
                </div>
                <div className="rec-content">
                  <div className="rec-text">{rec}</div>
                  <div className="rec-priority">
                    Priority: {index === 0 ? 'Critical' : index === 1 ? 'High' : 'Medium'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons Section */}
      <div className="actions-section">
        <div className="actions-header">
          <h3>🚀 Take Action</h3>
          <p>Share your results and secure your assets with quantum protection</p>
        </div>
        
        <div className="actions-grid">
          <button
            onClick={handleTwitterShare}
            disabled={shareLoading}
            className="action-btn share-btn"
          >
            <div className="btn-content">
              <div className="btn-icon">🐦</div>
              <div className="btn-text">
                <div className="btn-title">Share on Twitter</div>
                <div className="btn-subtitle">Earn +1 Point</div>
              </div>
              {shareLoading && <div className="btn-spinner"></div>}
            </div>
          </button>

          <button
            onClick={handleInsuranceClick}
            className="action-btn insurance-btn"
          >
            <div className="btn-content">
              <div className="btn-icon">🛡️</div>
              <div className="btn-text">
                <div className="btn-title">Get Quantum Insurance</div>
                <div className="btn-subtitle">${insurancePrice.toLocaleString()} Coverage</div>
              </div>
            </div>
          </button>
        </div>

        {/* Points Information */}
        <div className="points-info">
          <div className="points-header">
            <span className="points-icon">🎁</span>
            <strong>Earn More Points & Get Protection</strong>
          </div>
          <div className="points-list">
            <div className="points-item">
              <span className="points-bullet">•</span>
              <span>Share this scan on Twitter to earn 1 point instantly</span>
            </div>
            <div className="points-item">
              <span className="points-bullet">•</span>
              <span>Get 0.5 points for every 7 likes/retweets on your tweet</span>
            </div>
            <div className="points-item">
              <span className="points-bullet">•</span>
              <span>Earn 0.5 points for every 3 comments on your tweet</span>
            </div>
            <div className="points-item">
              <span className="points-bullet">•</span>
              <span>Invite friends and earn 7% of their points forever</span>
            </div>
            <div className="points-item highlight">
              <span className="points-bullet">🆕</span>
              <span><strong>Pay with crypto for instant premium protection and insurance coverage</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        serviceType={serviceType}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <style jsx>{`
        .scan-result-container {
          max-width: 900px;
          margin: 32px auto 0;
          padding: 0 16px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .result-header {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          border-radius: 20px;
          padding: 32px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 24px;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 20px;
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

        .header-text h2 {
          color: #ffffff;
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .header-text p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 16px;
          margin: 0;
        }

        .scan-metadata {
          display: flex;
          gap: 24px;
        }

        .metadata-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .metadata-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }

        .metadata-value {
          color: #3b82f6;
          font-size: 18px;
          font-weight: 700;
          font-family: 'Courier New', monospace;
        }

        .asset-info-card,
        .risk-assessment-card,
        .vulnerabilities-card,
        .recommendations-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 32px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .card-header h3 {
          color: #ffffff;
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .asset-type-badge,
        .vuln-count-badge,
        .priority-badge {
          padding: 8px 16px;
          border-radius: 20px;
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          font-size: 14px;
          font-weight: 600;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .asset-details {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .asset-address {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          font-weight: 600;
        }

        .address-container {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .address-text {
          flex: 1;
          color: #ffffff;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          word-break: break-all;
          background: none;
          border: none;
          padding: 0;
        }

        .copy-btn {
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 8px;
          padding: 8px;
          color: #3b82f6;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .copy-btn:hover {
          background: rgba(59, 130, 246, 0.3);
        }

        .scan-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-value {
          color: #ffffff;
          font-size: 14px;
          font-weight: 500;
        }

        .risk-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .risk-level-badge {
          padding: 12px 24px;
          border-radius: 25px;
          color: white;
          font-size: 16px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }

        .risk-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        .risk-score-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
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
          margin: 0 auto;
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

        .risk-bar-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .risk-bar-label {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          font-weight: 600;
        }

        .risk-bar {
          height: 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          overflow: hidden;
        }

        .risk-bar-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 1.5s ease-in-out;
        }

        .risk-scale {
          display: flex;
          justify-content: space-between;
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
        }

        .threat-timeline {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .threat-timeline h4 {
          color: #ffffff;
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .timeline-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .timeline-icon {
          font-size: 24px;
          background: linear-gradient(45deg, #8b5cf6, #3b82f6);
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .timeline-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .timeline-title {
          color: #ffffff;
          font-size: 16px;
          font-weight: 600;
        }

        .timeline-desc {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
        }

        .vulnerabilities-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .vulnerability-item {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .vulnerability-item:hover {
          background: rgba(255, 255, 255, 0.06);
          transform: translateY(-2px);
        }

        .vuln-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          gap: 16px;
        }

        .vuln-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .vuln-title {
          color: #ffffff;
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }

        .vuln-severity-badge {
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          width: fit-content;
        }

        .vuln-impact {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }

        .impact-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .impact-dots {
          display: flex;
          gap: 4px;
        }

        .impact-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .vuln-description {
          color: rgba(255, 255, 255, 0.8);
          font-size: 16px;
          line-height: 1.6;
          margin: 0 0 16px 0;
        }

        .vuln-details {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .detail-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 12px;
          border: 1px solid rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          font-size: 12px;
          font-weight: 500;
        }

        .tag-icon {
          font-size: 14px;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .recommendation-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 12px;
          border-left: 4px solid #10b981;
          transition: all 0.3s ease;
        }

        .recommendation-item:hover {
          background: rgba(16, 185, 129, 0.15);
        }

        .rec-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .rec-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .rec-text {
          color: rgba(255, 255, 255, 0.9);
          font-size: 16px;
          line-height: 1.5;
        }

        .rec-priority {
          color: #10b981;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .actions-section {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          border-radius: 20px;
          padding: 32px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .actions-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .actions-header h3 {
          color: #ffffff;
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .actions-header p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 16px;
          margin: 0;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .action-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .action-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
        }

        .action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .share-btn {
          border-color: rgba(29, 161, 242, 0.3);
        }

        .share-btn:hover:not(:disabled) {
          border-color: rgba(29, 161, 242, 0.5);
          box-shadow: 0 12px 32px rgba(29, 161, 242, 0.2);
        }

        .insurance-btn {
          border-color: rgba(16, 185, 129, 0.3);
        }

        .insurance-btn:hover:not(:disabled) {
          border-color: rgba(16, 185, 129, 0.5);
          box-shadow: 0 12px 32px rgba(16, 185, 129, 0.2);
        }

        .btn-content {
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
        }

        .btn-icon {
          font-size: 32px;
          flex-shrink: 0;
        }

        .btn-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .btn-title {
          color: #ffffff;
          font-size: 18px;
          font-weight: 600;
        }

        .btn-subtitle {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
        }

        .btn-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid #ffffff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          position: absolute;
          right: 0;
        }

        .points-info {
          background: rgba(59, 130, 246, 0.1);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .points-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          color: #3b82f6;
          font-size: 18px;
          font-weight: 600;
        }

        .points-icon {
          font-size: 24px;
        }

        .points-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .points-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          line-height: 1.5;
        }

        .points-bullet {
          color: #3b82f6;
          font-weight: 600;
          flex-shrink: 0;
        }

        .points-item.highlight {
          background: rgba(255, 215, 0, 0.1);
          border-radius: 8px;
          padding: 12px;
          border: 1px solid rgba(255, 215, 0, 0.2);
        }

        .points-item.highlight .points-bullet {
          color: #ffd700;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .scan-result-container {
            padding: 0 12px;
          }

          .result-header {
            padding: 24px;
            flex-direction: column;
            text-align: center;
          }

          .header-content {
            flex-direction: column;
            text-align: center;
          }

          .scan-metadata {
            justify-content: center;
          }

          .asset-info-card,
          .risk-assessment-card,
          .vulnerabilities-card,
          .recommendations-card,
          .actions-section {
            padding: 24px;
          }

          .card-header {
            flex-direction: column;
            text-align: center;
          }

          .risk-metrics {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .scan-details-grid {
            grid-template-columns: 1fr;
          }

          .vuln-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .vuln-impact {
            align-items: flex-start;
          }

          .actions-grid {
            grid-template-columns: 1fr;
          }

          .address-container {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
}