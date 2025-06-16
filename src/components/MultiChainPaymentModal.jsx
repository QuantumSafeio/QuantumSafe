import React, { useState, useEffect } from 'react';
import { enhancedWeb3Payment, ENHANCED_SERVICE_TYPES, formatCryptoAmount, getNetworkIcon, getWalletInstallUrl } from '../services/enhancedWeb3Payment';
import { SUPPORTED_NETWORKS } from '../services/multiChainWallet';
import { useAuth } from '../hooks/useAuth';

export default function MultiChainPaymentModal({ isOpen, onClose, serviceType, onPaymentSuccess }) {
  const { user } = useAuth();
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum');
  const [paymentStep, setPaymentStep] = useState('select'); // select, connect, confirm, processing, success, error
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [availableWallets, setAvailableWallets] = useState({});
  const [transactionHash, setTransactionHash] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkWallets();
      if (serviceType) {
        calculatePayment();
      }
    }
  }, [isOpen, serviceType, selectedNetwork]);

  const checkWallets = async () => {
    try {
      const wallets = await enhancedWeb3Payment.getAvailableWallets();
      setAvailableWallets(wallets);
    } catch (err) {
      console.error('Error checking wallets:', err);
    }
  };

  const calculatePayment = () => {
    try {
      const details = enhancedWeb3Payment.calculateCryptoAmount(serviceType, selectedNetwork);
      setPaymentDetails(details);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleNetworkChange = (networkKey) => {
    setSelectedNetwork(networkKey);
    setPaymentStep('select');
    setError('');
  };

  const handlePayment = async () => {
    if (!user || !serviceType || !selectedNetwork) return;

    setLoading(true);
    setPaymentStep('processing');
    setError('');

    try {
      const result = await enhancedWeb3Payment.initiatePayment(
        serviceType,
        selectedNetwork,
        user.id
      );

      setTransactionHash(result.transactionHash);
      setPaymentStep('success');
      
      if (onPaymentSuccess) {
        onPaymentSuccess(result);
      }

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      setPaymentStep('error');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setPaymentStep('select');
    setError('');
    setTransactionHash('');
    setPaymentDetails(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const getWalletStatus = (networkKey) => {
    const network = SUPPORTED_NETWORKS[networkKey];
    const isAvailable = availableWallets[network.walletType];
    return { isAvailable, walletType: network.walletType };
  };

  if (!isOpen) return null;

  const service = ENHANCED_SERVICE_TYPES[serviceType];
  const network = SUPPORTED_NETWORKS[selectedNetwork];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderRadius: '25px',
        padding: '30px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '25px'
        }}>
          <h2 style={{
            color: '#00f5ff',
            fontSize: '1.8rem',
            fontWeight: 'bold',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            💳 Multi-Chain Payment
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '5px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Service Information */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          padding: '20px',
          marginBottom: '25px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3 style={{
            color: '#ffffff',
            fontSize: '18px',
            marginBottom: '10px'
          }}>
            🛡️ {service?.name}
          </h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '14px',
            marginBottom: '15px'
          }}>
            {service?.description}
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '15px'
          }}>
            {service?.features.map((feature, index) => (
              <span
                key={index}
                style={{
                  background: 'rgba(0, 245, 255, 0.2)',
                  color: '#00f5ff',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                {feature}
              </span>
            ))}
          </div>
          <div style={{
            color: '#00f5ff',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            ${service?.cost}
          </div>
        </div>

        {paymentStep === 'select' && (
          <>
            {/* Network Selection */}
            <div style={{ marginBottom: '25px' }}>
              <h4 style={{
                color: '#ffffff',
                fontSize: '16px',
                marginBottom: '15px'
              }}>
                Choose Payment Network:
              </h4>
              <div style={{
                display: 'grid',
                gap: '12px'
              }}>
                {Object.entries(SUPPORTED_NETWORKS).map(([key, net]) => {
                  const walletStatus = getWalletStatus(key);
                  return (
                    <div
                      key={key}
                      onClick={() => walletStatus.isAvailable && handleNetworkChange(key)}
                      style={{
                        padding: '15px',
                        borderRadius: '12px',
                        border: selectedNetwork === key ? 
                          '2px solid #00f5ff' : '1px solid rgba(255, 255, 255, 0.2)',
                        background: selectedNetwork === key ? 
                          'rgba(0, 245, 255, 0.1)' : 
                          walletStatus.isAvailable ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                        cursor: walletStatus.isAvailable ? 'pointer' : 'not-allowed',
                        opacity: walletStatus.isAvailable ? 1 : 0.5,
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px'
                      }}
                    >
                      <div style={{ fontSize: '28px' }}>
                        {net.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          color: '#ffffff',
                          fontWeight: 'bold',
                          fontSize: '16px',
                          marginBottom: '5px'
                        }}>
                          {net.name}
                        </div>
                        <div style={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: '14px',
                          marginBottom: '5px'
                        }}>
                          {net.symbol} Network • {net.walletType.charAt(0).toUpperCase() + net.walletType.slice(1)} Wallet
                        </div>
                        {paymentDetails && selectedNetwork === key && (
                          <div style={{
                            color: '#00f5ff',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}>
                            {formatCryptoAmount(paymentDetails.amountCrypto, net.symbol)} {net.symbol}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                        {walletStatus.isAvailable ? (
                          <>
                            {selectedNetwork === key && (
                              <div style={{
                                color: '#00f5ff',
                                fontSize: '20px'
                              }}>
                                ✓
                              </div>
                            )}
                            <div style={{
                              background: 'rgba(46, 213, 115, 0.2)',
                              color: '#2ed573',
                              padding: '4px 8px',
                              borderRadius: '8px',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}>
                              AVAILABLE
                            </div>
                          </>
                        ) : (
                          <>
                            <a
                              href={getWalletInstallUrl(walletStatus.walletType)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                background: 'rgba(255, 165, 0, 0.2)',
                                color: '#ffa502',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                textDecoration: 'none',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(255, 165, 0, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = 'rgba(255, 165, 0, 0.2)';
                              }}
                            >
                              INSTALL
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Summary */}
            {paymentDetails && getWalletStatus(selectedNetwork).isAvailable && (
              <div style={{
                background: 'rgba(0, 245, 255, 0.1)',
                borderRadius: '15px',
                padding: '20px',
                marginBottom: '25px',
                border: '1px solid rgba(0, 245, 255, 0.3)'
              }}>
                <h4 style={{
                  color: '#00f5ff',
                  fontSize: '16px',
                  marginBottom: '15px'
                }}>
                  Payment Summary:
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '15px',
                  fontSize: '14px'
                }}>
                  <div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px' }}>
                      Service Cost:
                    </div>
                    <div style={{ color: '#ffffff', fontWeight: 'bold' }}>
                      ${paymentDetails.amountUSD}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px' }}>
                      Amount in {network.symbol}:
                    </div>
                    <div style={{ color: '#ffffff', fontWeight: 'bold' }}>
                      {formatCryptoAmount(paymentDetails.amountCrypto, network.symbol)} {network.symbol}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px' }}>
                      Network:
                    </div>
                    <div style={{ color: '#ffffff', fontWeight: 'bold' }}>
                      {network.name}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px' }}>
                      Rate:
                    </div>
                    <div style={{ color: '#ffffff', fontWeight: 'bold' }}>
                      ${paymentDetails.pricePerUnit} / {network.symbol}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Button */}
            {getWalletStatus(selectedNetwork).isAvailable ? (
              <button
                onClick={handlePayment}
                disabled={loading || !paymentDetails}
                style={{
                  width: '100%',
                  padding: '18px',
                  borderRadius: '15px',
                  border: 'none',
                  background: loading ? 
                    'rgba(0, 245, 255, 0.5)' : 
                    'linear-gradient(45deg, #00f5ff, #0099cc)',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.3s ease'
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Connecting Wallet...
                  </>
                ) : (
                  <>🚀 Pay with {network.symbol}</>
                )}
              </button>
            ) : (
              <div style={{
                background: 'rgba(255, 165, 0, 0.1)',
                border: '1px solid rgba(255, 165, 0, 0.3)',
                borderRadius: '15px',
                padding: '20px',
                textAlign: 'center',
                color: '#ffa502'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>
                  {network.walletType === 'metamask' ? '🦊' : 
                   network.walletType === 'phantom' ? '👻' : 
                   network.walletType === 'unisat' ? '🟠' : '🔷'}
                </div>
                <p style={{ marginBottom: '15px', fontSize: '16px', fontWeight: 'bold' }}>
                  {network.walletType.charAt(0).toUpperCase() + network.walletType.slice(1)} Wallet Required
                </p>
                <p style={{ marginBottom: '20px', fontSize: '14px' }}>
                  Please install {network.walletType.charAt(0).toUpperCase() + network.walletType.slice(1)} wallet to pay with {network.name}
                </p>
                <a
                  href={getWalletInstallUrl(network.walletType)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '12px 25px',
                    background: 'linear-gradient(45deg, #ffa502, #ff9500)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Install {network.walletType.charAt(0).toUpperCase() + network.walletType.slice(1)}
                </a>
              </div>
            )}
          </>
        )}

        {paymentStep === 'processing' && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              border: '4px solid rgba(0, 245, 255, 0.3)',
              borderTop: '4px solid #00f5ff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }} />
            <h3 style={{
              color: '#00f5ff',
              fontSize: '20px',
              marginBottom: '15px'
            }}>
              Processing Payment...
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '16px',
              lineHeight: '1.6'
            }}>
              Please confirm the transaction in your {network.walletType.charAt(0).toUpperCase() + network.walletType.slice(1)} wallet and wait for blockchain confirmation.
            </p>
          </div>
        )}

        {paymentStep === 'success' && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '20px'
            }}>
              ✅
            </div>
            <h3 style={{
              color: '#2ed573',
              fontSize: '20px',
              marginBottom: '15px'
            }}>
              Payment Successful!
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '16px',
              marginBottom: '20px',
              lineHeight: '1.6'
            }}>
              Your payment has been submitted to the {network.name} network. You now have access to {service?.name}.
            </p>
            {transactionHash && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '15px',
                marginBottom: '20px'
              }}>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  marginBottom: '5px'
                }}>
                  Transaction Hash:
                </div>
                <div style={{
                  color: '#00f5ff',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all'
                }}>
                  {transactionHash}
                </div>
              </div>
            )}
            <button
              onClick={handleClose}
              style={{
                padding: '12px 30px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(45deg, #2ed573, #1dd1a1)',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Continue
            </button>
          </div>
        )}

        {paymentStep === 'error' && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '20px'
            }}>
              ❌
            </div>
            <h3 style={{
              color: '#ff4757',
              fontSize: '20px',
              marginBottom: '15px'
            }}>
              Payment Failed
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '16px',
              marginBottom: '20px',
              lineHeight: '1.6'
            }}>
              {error || 'An error occurred while processing your payment. Please try again.'}
            </p>
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setPaymentStep('select')}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: '1px solid #00f5ff',
                  background: 'transparent',
                  color: '#00f5ff',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
              <button
                onClick={handleClose}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {error && paymentStep === 'select' && (
          <div style={{
            background: 'rgba(255, 71, 87, 0.1)',
            border: '1px solid rgba(255, 71, 87, 0.3)',
            borderRadius: '12px',
            padding: '15px',
            marginTop: '20px',
            color: '#ff4757',
            fontSize: '14px'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}