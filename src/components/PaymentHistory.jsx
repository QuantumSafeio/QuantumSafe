import React, { useState, useEffect } from 'react';
import { web3PaymentService, PAYMENT_NETWORKS, SERVICE_TYPES, getNetworkIcon, getStatusColor, getStatusIcon } from '../services/web3Payment';
import { useAuth } from '../hooks/useAuth';

export default function PaymentHistory() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const userPayments = await web3PaymentService.getUserPayments(user.id);
      setPayments(userPayments);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const openTransactionInExplorer = (payment) => {
    const network = PAYMENT_NETWORKS[payment.network];
    if (network && payment.transaction_hash) {
      window.open(`${network.explorerUrl}/tx/${payment.transaction_hash}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 20px',
        color: 'rgba(255, 255, 255, 0.7)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(0, 245, 255, 0.3)',
          borderTop: '3px solid #00f5ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginRight: '15px'
        }} />
        Loading payment history...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: 'rgba(255, 71, 87, 0.1)',
        border: '1px solid rgba(255, 71, 87, 0.3)',
        borderRadius: '15px',
        padding: '20px',
        textAlign: 'center',
        color: '#ff4757'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>❌</div>
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        color: 'rgba(255, 255, 255, 0.6)'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>💳</div>
        <h3 style={{ fontSize: '24px', margin: '0 0 15px 0', color: '#ffffff' }}>
          No Payments Yet
        </h3>
        <p style={{ fontSize: '16px', margin: 0, lineHeight: '1.6' }}>
          Your payment history will appear here once you make your first purchase.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.08)',
      borderRadius: '25px',
      padding: '35px',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.15)'
    }}>
      <h3 style={{
        color: '#00f5ff',
        fontSize: '1.8rem',
        marginBottom: '25px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
      }}>
        <span style={{ fontSize: '2rem' }}>💳</span>
        Payment History
      </h3>

      <div style={{ display: 'grid', gap: '20px' }}>
        {payments.map((payment) => {
          const network = PAYMENT_NETWORKS[payment.network];
          const service = SERVICE_TYPES[payment.service_type];
          const statusColor = getStatusColor(payment.status);
          const statusIcon = getStatusIcon(payment.status);

          return (
            <div
              key={payment.id}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '18px',
                padding: '25px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              {/* Status indicator */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(90deg, ${statusColor}, ${statusColor}80)`
              }} />

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '20px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    marginBottom: '10px'
                  }}>
                    <div style={{
                      background: 'rgba(0, 245, 255, 0.2)',
                      borderRadius: '10px',
                      padding: '8px 15px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#00f5ff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {getNetworkIcon(payment.network)} {network?.name}
                    </div>
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '14px'
                    }}>
                      {new Date(payment.created_at).toLocaleDateString()} • {new Date(payment.created_at).toLocaleTimeString()}
                    </div>
                  </div>

                  <h4 style={{
                    color: '#ffffff',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    margin: '0 0 10px 0'
                  }}>
                    {service?.name}
                  </h4>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '15px',
                    fontSize: '14px'
                  }}>
                    <div>
                      <strong style={{ color: '#00f5ff' }}>Amount:</strong>
                      <div style={{ opacity: 0.8 }}>
                        {payment.amount} {payment.currency}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: '#00f5ff' }}>USD Value:</strong>
                      <div style={{ opacity: 0.8 }}>
                        ${service?.cost}
                      </div>
                    </div>
                    {payment.transaction_hash && (
                      <div>
                        <strong style={{ color: '#00f5ff' }}>Transaction:</strong>
                        <div 
                          style={{ 
                            opacity: 0.8, 
                            fontFamily: 'monospace',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                          onClick={() => openTransactionInExplorer(payment)}
                        >
                          {payment.transaction_hash.slice(0, 10)}...{payment.transaction_hash.slice(-8)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{
                  padding: '12px 20px',
                  borderRadius: '25px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  background: `${statusColor}20`,
                  color: statusColor,
                  border: `1px solid ${statusColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: '120px',
                  justifyContent: 'center'
                }}>
                  {statusIcon} {payment.status.replace('_', ' ').toUpperCase()}
                </div>
              </div>

              {/* Additional details for confirmed payments */}
              {payment.status === 'confirmed' && payment.verified_at && (
                <div style={{
                  background: 'rgba(46, 213, 115, 0.1)',
                  borderRadius: '10px',
                  padding: '15px',
                  border: '1px solid rgba(46, 213, 115, 0.3)',
                  fontSize: '14px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#2ed573',
                    fontWeight: 'bold',
                    marginBottom: '5px'
                  }}>
                    ✅ Payment Verified
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Confirmed on {new Date(payment.verified_at).toLocaleString()}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '20px'
              }}>
                {payment.transaction_hash && (
                  <button
                    onClick={() => openTransactionInExplorer(payment)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 245, 255, 0.5)',
                      background: 'rgba(0, 245, 255, 0.1)',
                      color: '#00f5ff',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(0, 245, 255, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(0, 245, 255, 0.1)';
                    }}
                  >
                    🔗 View on Explorer
                  </button>
                )}
              </div>
            </div>
          );
        })}
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