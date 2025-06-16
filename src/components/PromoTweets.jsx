import React, { useState } from 'react';

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
https://quantumsafe.ai
#Bitcoin #Altcoins #Security #QuantumComputing`
  },
  {
    text: `🚀 Tired of projects collapsing due to small vulnerabilities?
With #QuantumSafe you'll analyze your contracts and wallets against future threats 👾
Try it now for free 👇
https://quantumsafe.ai
#DeFi #CryptoSecurity`
  },
  {
    text: `👨‍💻 The project I was looking for has finally arrived:
🔐 QuantumSafe = Security beyond ordinary encryption
Test your smart contract now:
https://quantumsafe.ai
#zk #SmartContracts #CryptoSecurity`
  },
  {
    text: `📉 Don't wait until your wallet gets hacked!
Know your weaknesses before hackers do!
🔎 Complete quantum analysis with QuantumSafe
https://quantumsafe.ai
#Blockchain #QuantumHack`
  },
  {
    text: `✨ Protecting your wallet? Or waiting for surprises?
QuantumSafe performs complete scans of your contracts or NFTs before any transaction 💥
Start earning points and secure your assets 👇
https://quantumsafe.ai
#NFTs #ETH #SecurityAudit`
  },
  {
    text: `🔥 Take this advice today:
"Your digital security is more important than your profits"
Try #QuantumSafe and get a free report just by sharing a tweet!
Start here 👇
https://quantumsafe.ai
#DYOR #CryptoSafety`
  },
  {
    text: `📊 Want to check if your contract has vulnerabilities?
QuantumSafe gives you a comprehensive report on quantum risks ⚛️
#Web3 #CryptoAudit
https://quantumsafe.ai`
  },
  {
    text: `💸 Not every meme token is safe, many are vulnerable to hacking!
Quick scan from QuantumSafe solves the problem
Enter your token name and get results in minutes 👇
https://quantumsafe.ai
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
https://quantumsafe.ai
#FutureProof #ZeroTrust`
  },
  {
    text: `🧠 The only project that scans for *unknown* risks
AI + Quantum Analysis = QuantumSafe
Share to earn free analysis 👇
https://quantumsafe.ai
#AI #Quantum #Audit`
  },
  {
    text: `🎯 Simple question: Is your wallet ready for the future?
If you're not sure, try QuantumSafe now
and request comprehensive scan for any asset or contract 👇
https://quantumsafe.ai
#Wallets #DeFiSecurity`
  }
];

export default function PromoTweets() {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyTweet = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const copyAddress = (address, network) => {
    navigator.clipboard.writeText(address);
    // You could add a toast notification here
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.08)',
      borderRadius: '25px',
      padding: '35px',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      marginBottom: '30px'
    }}>
      {/* Payment Networks Section */}
      <div style={{ marginBottom: '40px' }}>
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
          Payment Networks & Insurance Costs
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
      </div>

      {/* Promotional Tweets Section */}
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
              How to Use These Tweets:
            </strong>
          </div>
          <ul style={{
            margin: 0,
            paddingLeft: '20px',
            color: 'rgba(255, 255, 255, 0.9)',
            lineHeight: '1.6'
          }}>
            <li>Copy any tweet below and share it on your Twitter account</li>
            <li>Earn +1 point for each tweet shared</li>
            <li>Get +0.5 points for every 7 likes/retweets</li>
            <li>Earn +0.5 points for every 3 comments</li>
            <li>Use your referral link to invite friends and earn 7% of their points</li>
          </ul>
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
                <strong>Character count:</strong> {tweet.text.length}/280
              </div>
            </div>
          ))}
        </div>

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
              Boost Your Earnings
            </strong>
          </div>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '16px',
            lineHeight: '1.6',
            margin: 0
          }}>
            Share these tweets regularly to maximize your points and help spread awareness about quantum security. 
            The more engagement your tweets get, the more points you earn!
          </p>
        </div>
      </div>
    </div>
  );
}