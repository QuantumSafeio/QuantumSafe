import React, { useState, useEffect } from 'react';
import { web3PaymentService, PAYMENT_NETWORKS, SERVICE_TYPES, formatCurrency, getNetworkIcon } from '../services/web3Payment';
import { useAuth } from '../hooks/useAuth';

export default function PaymentModal({ isOpen, onClose, serviceType, onPaymentSuccess }) {
  const { user } = useAuth();
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum');
  const [paymentStep, setPaymentStep] = useState('select'); // select, confirm, processing, success, error
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && serviceType) {
      calculatePayment();
    }
  }, [isOpen, serviceType, selectedNetwork]);

  const calculatePayment = () => {
    try {
      const details = web3PaymentService.calculatePaymentAmount(serviceType, selectedNetwork);
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
      const result = await web3PaymentService.initiatePayment(
        serviceType,
        selectedNetwork,
        user.id
      );

      setTransactionHash(result.transactionHash);
      setPaymentStep('success');
      
      // Call success callback
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

  if (!isOpen) return null;

  const network = PAYMENT_NETWORKS[selectedNetwork];
  const service = SERVICE_TYPES[serviceType];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
        maxWidth: '500px',
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
            margin: 0
          }}>
            💳 Secure Payment
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
          <div style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '14px'
          }}>
            Professional quantum security analysis and protection
          </div>
          <div style={{
            color: '#00f5ff',
            fontSize: '24px',
            fontWeight: 'bold',
            marginTop: '10px'
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
                gap: '10px'
              }}>
                {Object.entries(PAYMENT_NETWORKS).map(([key, net]) => (
                  <div
                    key={key}
                    onClick={() => handleNetworkChange(key)}
                    style={{
                      padding: '15px',
                      borderRadius: '12px',
                      border: selectedNetwork === key ? 
                        '2px solid #00f5ff' : '1px solid rgba(255, 255, 255, 0.2)',
                      background: selectedNetwork === key ? 
                        'rgba(0, 245, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px'
                    }}
                  >
                    <div style={{ fontSize: '24px' }}>
                      {getNetworkIcon(key)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fontSize: '16px'
                      }}>
                        {net.name}
                      </div>
                      <div style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '14px'
                      }}>
                        {net.symbol} Network
                      </div>
                    </div>
                    {selectedNetwork === key && (
                      <div style={{
                        color: '#00f5ff',
                        fontSize: '20px'
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Details */}
            {paymentDetails && (
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
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Service Cost:
                  </span>
                  <span style={{ color: '#ffffff', fontWeight: 'bold' }}>
                    ${paymentDetails.amountUSD}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Amount in {network.symbol}:
                  </span>
                  <span style={{ color: '#ffffff', fontWeight: 'bold' }}>
                    {paymentDetails.amountCrypto.toFixed(6)} {network.symbol}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Network:
                  </span>
                  <span style={{ color: '#ffffff', fontWeight: 'bold' }}>
                    {network.name}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Button */}
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
                  Processing...
                </>
              ) : (
                <>🚀 Pay with {network.symbol}</>
              )}
            </button>
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
              Please confirm the transaction in your wallet and wait for blockchain confirmation.
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
              Your payment has been confirmed on the blockchain. You now have access to {service?.name}.
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