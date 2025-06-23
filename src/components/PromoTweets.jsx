import React, { useState } from 'react';
import PaymentModal from './PaymentModal';
import PaymentHistory from './PaymentHistory';
import PointsSystem from './PointsSystem';

// Supported networks and payment addresses
const NETWORKS = {
  Solana: {
    name: "Solana",
    address: "24YRQbK4A6TrcBSmvm92iZK6KJ8X3qiEoSoYEwHp8EL2",
    pointsRequired: 10,
    securityCost: 500,
    symbol: "SOL"
  },
  Ethereum: {
    name: "Ethereum",
    address: "0xE4A671f105E9e54eC45Bf9217a9e8050cBD92108",
    pointsRequired: 10,
    securityCost: 2000,
    symbol: "ETH"
  },
  SUI: {
    name: "SUI",
    address: "0xaa5402dbb7bb02986fce47dcce033a3eb8047db97b0107dc21bdb10358a5b92e",
    pointsRequired: 10,
    securityCost: 500,
    symbol: "SUI"
  },
  Bitcoin: {
    name: "Bitcoin",
    address: "bc1qe552eydkjy0vz0ln068mkmg9uhmwn3g9p0p875",
    pointsRequired: 10,
    securityCost: 500,
    symbol: "BTC"
  }
};

const promoTweets = [
  {
    text: `🚨 Most smart contracts are vulnerable to quantum attacks!
But now... QuantumSafe 🔐 analyzes and protects your assets with one click.
Start now 👇
https://quantumsafeio.github.io/QuantumSafe/
#Bitcoin #Altcoins #Security #QuantumComputing`
  },
  {
    text: `🚀 Tired of projects collapsing due to small vulnerabilities?
With #QuantumSafe you'll analyze your contracts and wallets against future threats 👾
Try it now for free 👇
https://quantumsafeio.github.io/QuantumSafe/
#DeFi #CryptoSecurity`
  },
  {
    text: `👨‍💻 The project I was looking for has finally arrived:
🔐 QuantumSafe = Security beyond ordinary encryption
Test your smart contract now:
https://quantumsafeio.github.io/QuantumSafe/
#zk #SmartContracts #CryptoSecurity`
  },
  {
    text: `📉 Don't wait until your wallet gets hacked!
Know your weaknesses before hackers do!
🔎 Complete quantum analysis with QuantumSafe
https://quantumsafeio.github.io/QuantumSafe/
#Blockchain #QuantumHack`
  },
  {
    text: `✨ Protecting your wallet? Or waiting for surprises?
QuantumSafe performs complete scans of your contracts or NFTs before any transaction 💥
Start earning points and secure your assets 👇
https://quantumsafeio.github.io/QuantumSafe/
#NFTs #ETH #SecurityAudit`
  },
  {
    text: `🔥 Take this advice today:
"Your digital security is more important than your profits"
Try #QuantumSafe and get a free report just by sharing a tweet!
Start here 👇
https://quantumsafeio.github.io/QuantumSafe/
#DYOR #CryptoSafety`
  },
  {
    text: `📊 Want to check if your contract has vulnerabilities?
QuantumSafe gives you a comprehensive report on quantum risks ⚛️
#Web3 #CryptoAudit
https://quantumsafeio.github.io/QuantumSafe/`
  },
  {
    text: `💸 Not every meme token is safe, many are vulnerable to hacking!
Quick scan from QuantumSafe solves the problem
Enter your token name and get results in minutes 👇
https://quantumsafeio.github.io/QuantumSafe/
#Memecoins #TokenSecurity`
  },
  {
    text: `🚧 Building a Web3 project?
Start by analyzing contracts against quantum attacks before launch 👇
QuantumSafe.ai = Future of security
#Developers #CryptoProjects #SecurityFirst`
  },
  {
    text: `⚡️ Quantum threats are no longer fiction,
and hackers are closer than you think!
Protect yourself now with QuantumSafe
https://quantumsafeio.github.io/QuantumSafe/
#FutureProof #ZeroTrust`
  },
  {
    text: `🧠 The only project that scans for *unknown* risks
AI + Quantum Analysis = QuantumSafe
Share to earn free analysis 👇
https://quantumsafeio.github.io/QuantumSafe/
#AI #Quantum #Audit`
  },
  {
    text: `🎯 Simple question: Is your wallet ready for the future?
If you're not sure, try QuantumSafe now
and request comprehensive scan for any asset or contract 👇
https://quantumsafeio.github.io/QuantumSafe/
#Wallets #DeFiSecurity`
  }
];

export default function PromoTweets() {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [activeSection, setActiveSection] = useState('points'); // points, networks, tweets, payments
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');

  const copyTweet = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const copyAddress = (address, network) => {
    navigator.clipboard.writeText(address);
    // You could add a toast notification here
  };

  const handlePaymentClick = (serviceType) => {
    setSelectedService(serviceType);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (paymentResult) => {
    console.log('Payment successful:', paymentResult);
    // Refresh user data or show success message
  };

  const sections = [
    { id: 'points', label: 'Points & Referrals', icon: '💎' },
    { id: 'networks', label: 'Payment Networks', icon: '💳' },
    { id: 'tweets', label: 'Marketing Content', icon: '🐦' },
    { id: 'payments', label: 'Payment History', icon: '📊' }
  ];

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.08)',
      borderRadius: '25px',
      padding: '35px',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      marginBottom: '30px'
    }}>
      {/* Section Navigation */}
      <div style={{
        display: 'flex',
        gap: '5px',
        marginBottom: '30px',
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '8px',
        borderRadius: '16px',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            style={{
              flex: 1,
              padding: '15px 20px',
              borderRadius: '12px',
              border: 'none',
              background: activeSection === section.id ? 
                'rgba(0, 245, 255, 0.2)' : 'transparent',
              color: activeSection === section.id ? '#00f5ff' : 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
            onMouseEnter={(e) => {
              if (activeSection !== section.id) {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSection !== section.id) {
                e.target.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '18px' }}>{section.icon}</span>
            {section.label}
          </button>
        ))}
      </div>

      {/* Points & Referrals Section */}
      {activeSection === 'points' && <PointsSystem />}

      {/* Payment Networks Section */}
      {activeSection === 'networks' && (
        <div>
          <h2 style={{
            color: '#00f5ff',
            fontSize: '1.8rem',
            marginBottom: '25px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <span style={{ fontSize: '2rem' }}>💳</span>
            Payment Networks & Security Services
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {Object.entries(NETWORKS).map(([key, network]) => (
              <div
                key={key}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '15px',
                  padding: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <h3 style={{
                    color: '#ffffff',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    margin: 0
                  }}>
                    {network.name} ({network.symbol})
                  </h3>
                  <div style={{
                    background: 'rgba(0, 245, 255, 0.2)',
                    color: '#00f5ff',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    ${network.securityCost}
                  </div>
                </div>
                
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '15px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  wordBreak: 'break-all',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}>
                  {network.address}
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '14px'
                  }}>
                    {network.pointsRequired} points required
                  </span>
                  <button
                    onClick={() => copyAddress(network.address, network.name)}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(0, 245, 255, 0.2)',
                      border: '1px solid rgba(0, 245, 255, 0.5)',
                      borderRadius: '8px',
                      color: '#00f5ff',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(0, 245, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(0, 245, 255, 0.2)';
                    }}
                  >
                    📋 Copy Address
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Web3 Payment Services */}
          <div style={{
            background: 'rgba(0, 245, 255, 0.1)',
            borderRadius: '15px',
            padding: '25px',
            border: '1px solid rgba(0, 245, 255, 0.3)',
            marginBottom: '30px'
          }}>
            <h3 style={{
              color: '#00f5ff',
              fontSize: '1.5rem',
              marginBottom: '20px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🚀 Premium Security Services
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '15px'
            }}>
              <button
                onClick={() => handlePaymentClick('contract_scan')}
                style={{
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔐</div>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  Smart Contract Scan
                </div>
                <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '10px' }}>
                  Advanced quantum vulnerability analysis
                </div>
                <div style={{ color: '#00f5ff', fontWeight: 'bold' }}>
                  $2000 - Pay with Crypto
                </div>
              </button>

              <button
                onClick={() => handlePaymentClick('wallet_scan')}
                style={{
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>💰</div>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  Wallet Security Scan
                </div>
                <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '10px' }}>
                  Comprehensive wallet protection analysis
                </div>
                <div style={{ color: '#00f5ff', fontWeight: 'bold' }}>
                  $500 - Pay with Crypto
                </div>
              </button>

              <button
                onClick={() => handlePaymentClick('premium_insurance')}
                style={{
                  padding: '20px',
                  background: 'rgba(255, 215, 0, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 215, 0, 0.15)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 215, 0, 0.1)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>👑</div>
                <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#ffd700' }}>
                  Premium Insurance
                </div>
                <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '10px' }}>
                  Complete quantum protection coverage
                </div>
                <div style={{ color: '#ffd700', fontWeight: 'bold' }}>
                  $5000 - Pay with Crypto
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Marketing Tweets Section */}
      {activeSection === 'tweets' && (
        <div>
          <h2 style={{
            color: '#00f5ff',
            fontSize: '1.8rem',
            marginBottom: '25px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <span style={{ fontSize: '2rem' }}>🐦</span>
            Promotional Tweets & Marketing Content
          </h2>
          
          <div style={{
            background: 'rgba(29, 161, 242, 0.1)',
            borderRadius: '15px',
            padding: '20px',
            marginBottom: '25px',
            border: '1px solid rgba(29, 161, 242, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '15px'
            }}>
              <span style={{ fontSize: '24px' }}>💡</span>
              <strong style={{ color: '#1da1f2', fontSize: '16px' }}>
                Enhanced Points System - How to Earn:
              </strong>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px',
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: '1.6'
            }}>
              <div>🐦 <strong>Twitter:</strong> 3 points per tweet + 0.05 per engagement</div>
              <div>📱 <strong>Telegram:</strong> 5 points per post + 0.01 per interaction</div>
              <div>📺 <strong>YouTube:</strong> 17 points per video + 0.3 per engagement</div>
              <div>💼 <strong>LinkedIn:</strong> 22 points per article + 0.7 per engagement</div>
              <div>🔗 <strong>Referrals:</strong> 7% of all referred user points forever</div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gap: '20px'
          }}>
            {promoTweets.map((tweet, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '15px',
                  padding: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '15px'
                }}>
                  <div style={{
                    flex: 1,
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-line'
                  }}>
                    {tweet.text}
                  </div>
                  <button
                    onClick={() => copyTweet(tweet.text, index)}
                    style={{
                      padding: '10px 20px',
                      background: copiedIndex === index ? 
                        'rgba(46, 213, 115, 0.2)' : 'rgba(29, 161, 242, 0.2)',
                      border: copiedIndex === index ? 
                        '1px solid #2ed573' : '1px solid #1da1f2',
                      borderRadius: '10px',
                      color: copiedIndex === index ? '#2ed573' : '#1da1f2',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      minWidth: '100px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      if (copiedIndex !== index) {
                        e.target.style.background = 'rgba(29, 161, 242, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (copiedIndex !== index) {
                        e.target.style.background = 'rgba(29, 161, 242, 0.2)';
                      }
                    }}
                  >
                    {copiedIndex === index ? (
                      <>✅ Copied!</>
                    ) : (
                      <>📋 Copy Tweet</>
                    )}
                  </button>
                </div>
                
                <div style={{
                  marginTop: '15px',
                  padding: '10px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>
                  <strong>Character count:</strong> {tweet.text.length}/280 • <strong>Potential points:</strong> 3 + engagement bonus
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History Section */}
      {activeSection === 'payments' && <PaymentHistory />}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        serviceType={selectedService}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <div style={{
        marginTop: '30px',
        padding: '20px',
        background: 'rgba(255, 165, 0, 0.1)',
        borderRadius: '15px',
        border: '1px solid rgba(255, 165, 0, 0.3)',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '15px'
        }}>
          <span style={{ fontSize: '24px' }}>🚀</span>
          <strong style={{ color: '#ffa502', fontSize: '18px' }}>
            Maximize Your Earnings
          </strong>
        </div>
        <p style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '16px',
          lineHeight: '1.6',
          margin: 0
        }}>
          Use our enhanced points system to earn more through social media engagement, referrals, and premium services. 
          Connect your wallet to access exclusive features and start building your quantum security empire!
        </p>
      </div>
    </div>
  );
}