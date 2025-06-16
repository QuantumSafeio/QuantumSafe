import React, { useState } from 'react';
import { shareOnTwitter } from '../services/twitter';
import PaymentModal from './PaymentModal';

export default function ScanResult({ result, assetType, user }) {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  
  if (!result) return null;

  const insurancePrice = (assetType === 'contract' || assetType === 'app') ? 2000 : 500;
  const serviceType = assetType === 'contract' ? 'contract_scan' : 
                     assetType === 'app' ? 'app_scan' : 
                     assetType === 'wallet' ? 'wallet_scan' : 
                     assetType === 'nft' ? 'nft_scan' : 'token_scan';

  const handleTwitterShare = async () => {
    try {
      await shareOnTwitter(result, assetType, user);
    } catch (error) {
      console.error('Error sharing on Twitter:', error);
      const text = `🛡️ QuantumSafe scan completed for ${assetType}:
    
🎯 Quantum Threat Level: ${result.quantumRisk}
🔍 Asset: ${result.asset.slice(0, 20)}...
⚡ Vulnerabilities Found: ${result.details.length}

Protect your digital assets with QuantumSafe 🚀
${window.location.origin}/login?ref=${user?.id}

#QuantumSafe #BlockchainSecurity #QuantumThreat #CryptoSecurity`;
      
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const handleInsuranceClick = () => {
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (paymentResult) => {
    console.log('Insurance payment successful:', paymentResult);
    // You could show a success message or update the UI
  };

  const getRiskColor = (risk) => {
    switch (risk.toLowerCase()) {
      case 'high': return '#ff4757';
      case 'medium': return '#ffa502';
      case 'low': return '#2ed573';
      default: return '#747d8c';
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
      case 'high': return 'linear-gradient(45deg, #ff4757, #ff3742)';
      case 'medium': return 'linear-gradient(45deg, #ffa502, #ff9500)';
      case 'low': return 'linear-gradient(45deg, #2ed573, #17c0eb)';
      default: return 'linear-gradient(45deg, #747d8c, #57606f)';
    }
  };

  return (
    <div style={{
      marginTop: '35px',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '25px',
      padding: '30px',
      backdropFilter: 'blur(15px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '25px'
      }}>
        <h3 style={{
          color: '#00f5ff',
          fontSize: '1.6rem',
          fontWeight: 'bold',
          margin: 0
        }}>
          📊 Scan Results
        </h3>
        <div style={{
          background: 'rgba(0, 245, 255, 0.1)',
          padding: '8px 15px',
          borderRadius: '20px',
          fontSize: '14px',
          color: '#00f5ff',
          border: '1px solid rgba(0, 245, 255, 0.3)'
        }}>
          {assetType.charAt(0).toUpperCase() + assetType.slice(1)} Scan
        </div>
      </div>

      {/* Asset Information */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.4)',
        borderRadius: '15px',
        padding: '25px',
        marginBottom: '25px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px'
          }}>
            <strong style={{ color: '#ffffff', fontSize: '16px' }}>🎯 Asset Address:</strong>
            {result.confidence && (
              <span style={{
                background: 'rgba(0, 255, 136, 0.2)',
                color: '#00ff88',
                padding: '4px 12px',
                borderRadius: '15px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {result.confidence}% Confidence
              </span>
            )}
          </div>
          <div style={{
            padding: '15px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            fontFamily: 'monospace',
            fontSize: '14px',
            wordBreak: 'break-all',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {result.asset}
          </div>
        </div>

        {/* Threat Level Display */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <strong style={{ color: '#ffffff', fontSize: '16px' }}>⚡ Quantum Threat Level:</strong>
          <div style={{
            background: getRiskGradient(result.quantumRisk),
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.3rem',
            padding: '10px 25px',
            borderRadius: '25px',
            boxShadow: `0 4px 15px ${getRiskColor(result.quantumRisk)}40`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {getRiskEmoji(result.quantumRisk)} {result.quantumRisk.toUpperCase()}
          </div>
        </div>

        {/* Scan Metadata */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          fontSize: '14px'
        }}>
          <div>
            <strong style={{ color: '#00f5ff' }}>Scan ID:</strong>
            <div style={{ opacity: 0.8, fontFamily: 'monospace' }}>
              {result.scanId}
            </div>
          </div>
          <div>
            <strong style={{ color: '#00f5ff' }}>Scanned At:</strong>
            <div style={{ opacity: 0.8 }}>
              {new Date(result.scannedAt).toLocaleString()}
            </div>
          </div>
          <div>
            <strong style={{ color: '#00f5ff' }}>Vulnerabilities:</strong>
            <div style={{ opacity: 0.8 }}>
              {result.details.length} issues found
            </div>
          </div>
        </div>
      </div>

      {/* Vulnerabilities Section */}
      <div style={{
        background: 'rgba(255, 0, 0, 0.1)',
        borderRadius: '15px',
        padding: '25px',
        marginBottom: '30px',
        border: '1px solid rgba(255, 0, 0, 0.3)'
      }}>
        <h4 style={{
          color: '#ff4757',
          marginBottom: '20px',
          fontSize: '1.3rem',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          🔍 Detected Vulnerabilities
          <span style={{
            background: 'rgba(255, 71, 87, 0.2)',
            color: '#ff4757',
            padding: '4px 12px',
            borderRadius: '15px',
            fontSize: '12px'
          }}>
            {result.details.length} Found
          </span>
        </h4>
        
        <div style={{ display: 'grid', gap: '15px' }}>
          {result.details.map((detail, index) => (
            <div
              key={index}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '20px',
                borderLeft: `4px solid ${getRiskColor(detail.risk)}`,
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                e.target.style.transform = 'translateX(5px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.transform = 'translateX(0)';
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <strong style={{ 
                  color: '#ffffff',
                  fontSize: '16px'
                }}>
                  {detail.vuln}
                </strong>
                <span style={{
                  background: `${getRiskColor(detail.risk)}20`,
                  color: getRiskColor(detail.risk),
                  fontWeight: 'bold',
                  fontSize: '14px',
                  padding: '6px 15px',
                  borderRadius: '20px',
                  border: `1px solid ${getRiskColor(detail.risk)}`
                }}>
                  {getRiskEmoji(detail.risk)} {detail.risk.toUpperCase()}
                </span>
              </div>
              <p style={{
                margin: 0,
                opacity: 0.9,
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                {detail.description || 'Security vulnerability detected that requires immediate attention'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations Section */}
      {result.recommendations && result.recommendations.length > 0 && (
        <div style={{
          background: 'rgba(0, 255, 136, 0.1)',
          borderRadius: '15px',
          padding: '25px',
          marginBottom: '30px',
          border: '1px solid rgba(0, 255, 136, 0.3)'
        }}>
          <h4 style={{
            color: '#00ff88',
            marginBottom: '20px',
            fontSize: '1.3rem',
            fontWeight: 'bold'
          }}>
            💡 Security Recommendations
          </h4>
          <ul style={{
            margin: 0,
            paddingLeft: '20px',
            lineHeight: '1.6'
          }}>
            {result.recommendations.map((rec, index) => (
              <li key={index} style={{
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px'
      }}>
        <button
          onClick={handleTwitterShare}
          style={{
            padding: '18px 25px',
            borderRadius: '15px',
            border: 'none',
            background: 'linear-gradient(45deg, #1da1f2, #0d8bd9)',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 4px 15px rgba(29, 161, 242, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(29, 161, 242, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(29, 161, 242, 0.3)';
          }}
        >
          🐦 Share on Twitter (+1 Point)
        </button>

        <button
          onClick={handleInsuranceClick}
          style={{
            padding: '18px 25px',
            borderRadius: '15px',
            border: 'none',
            background: 'linear-gradient(45deg, #2ed573, #1dd1a1)',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 4px 15px rgba(46, 213, 115, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(46, 213, 115, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(46, 213, 115, 0.3)';
          }}
        >
          🛡️ Get Insurance (${insurancePrice})
        </button>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        serviceType={serviceType}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Points Info */}
      <div style={{
        marginTop: '25px',
        padding: '20px',
        background: 'rgba(0, 255, 255, 0.1)',
        borderRadius: '12px',
        fontSize: '14px',
        color: 'rgba(255, 255, 255, 0.9)',
        border: '1px solid rgba(0, 255, 255, 0.3)',
        lineHeight: '1.6'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '10px'
        }}>
          <span style={{ fontSize: '18px' }}>💡</span>
          <strong style={{ color: '#00f5ff' }}>Earn More Points & Get Protection:</strong>
        </div>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Share this scan on Twitter to earn 1 point instantly</li>
          <li>Get 0.5 points for every 7 likes/retweets on your tweet</li>
          <li>Earn 0.5 points for every 3 comments on your tweet</li>
          <li>Invite friends and earn 7% of their points forever</li>
          <li><strong>NEW:</strong> Pay with crypto for instant premium protection and insurance coverage</li>
        </ul>
      </div>
    </div>
  );
}