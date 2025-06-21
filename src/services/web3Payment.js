import { ethers } from 'ethers';
import { nhost } from '../lib/nhost';

// Network configurations
export const PAYMENT_NETWORKS = {
  ethereum: {
    name: "Ethereum",
    symbol: "ETH",
    chainId: 1,
    rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
    explorerUrl: "https://etherscan.io",
    address: "0xE4A671f105E9e54eC45Bf9217a9e8050cBD92108",
    securityCost: 2000,
    pointsRequired: 10
  },
  polygon: {
    name: "Polygon",
    symbol: "MATIC",
    chainId: 137,
    rpcUrl: "https://polygon-rpc.com",
    explorerUrl: "https://polygonscan.com",
    address: "0xE4A671f105E9e54eC45Bf9217a9e8050cBD92108",
    securityCost: 500,
    pointsRequired: 10
  },
  bsc: {
    name: "Binance Smart Chain",
    symbol: "BNB",
    chainId: 56,
    rpcUrl: "https://bsc-dataseed.binance.org",
    explorerUrl: "https://bscscan.com",
    address: "0xE4A671f105E9e54eC45Bf9217a9e8050cBD92108",
    securityCost: 500,
    pointsRequired: 10
  }
};

// Service types and their costs
export const SERVICE_TYPES = {
  contract_scan: { name: "Smart Contract Scan", cost: 2000 },
  wallet_scan: { name: "Wallet Security Scan", cost: 500 },
  nft_scan: { name: "NFT Collection Scan", cost: 500 },
  token_scan: { name: "Token Security Scan", cost: 500 },
  app_scan: { name: "DApp Security Scan", cost: 2000 },
  premium_insurance: { name: "Premium Security Insurance", cost: 5000 }
};

class Web3PaymentService {
  constructor() {
    this.provider = null;
    this.signer = null;
  }

  // Initialize Web3 connection
  async initialize() {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed. Please install MetaMask to make payments.');
    }

    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
    return true;
  }

  // Switch to the correct network
  async switchNetwork(networkKey) {
    const network = PAYMENT_NETWORKS[networkKey];
    if (!network) {
      throw new Error('Unsupported network');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${network.chainId.toString(16)}` }],
      });
    } catch (switchError) {
      // Network doesn't exist, add it
      if (switchError.code === 4902) {
        await this.addNetwork(network);
      } else {
        throw switchError;
      }
    }
  }

  // Add network to MetaMask
  async addNetwork(network) {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${network.chainId.toString(16)}`,
        chainName: network.name,
        nativeCurrency: {
          name: network.symbol,
          symbol: network.symbol,
          decimals: 18
        },
        rpcUrls: [network.rpcUrl],
        blockExplorerUrls: [network.explorerUrl]
      }]
    });
  }

  // Get current network
  async getCurrentNetwork() {
    const network = await this.provider.getNetwork();
    return network.chainId;
  }

  // Calculate payment amount in ETH/native currency
  calculatePaymentAmount(serviceType, networkKey) {
    const service = SERVICE_TYPES[serviceType];
    const network = PAYMENT_NETWORKS[networkKey];
    
    if (!service || !network) {
      throw new Error('Invalid service type or network');
    }

    // Convert USD to ETH (simplified - in production, use real-time rates)
    const ethPrice = 2000; // $2000 per ETH (should be fetched from API)
    const amountInEth = service.cost / ethPrice;
    
    return {
      amountUSD: service.cost,
      amountCrypto: amountInEth,
      currency: network.symbol,
      serviceName: service.name
    };
  }

  // Initiate payment transaction
  async initiatePayment(serviceType, networkKey, userId) {
    await this.initialize();
    await this.switchNetwork(networkKey);

    const network = PAYMENT_NETWORKS[networkKey];
    const paymentDetails = this.calculatePaymentAmount(serviceType, networkKey);
    
    const userAddress = await this.signer.getAddress();
    
    // Create payment record in database
    const payment = await this.insertPayment({
      user_id: userId,
      network: networkKey,
      from_address: userAddress,
      to_address: network.address,
      amount: paymentDetails.amountCrypto,
      currency: network.symbol,
      status: 'pending',
      service_type: serviceType
    });

    try {
      // Send transaction
      const tx = await this.signer.sendTransaction({
        to: network.address,
        value: ethers.parseEther(paymentDetails.amountCrypto.toString()),
        gasLimit: 21000
      });

      // Update payment with transaction hash
      await nhost.graphql.request(
        `mutation UpdatePayment($id: uuid!, $transactionHash: String!) {
          update_payments_by_pk(pk_columns: {id: $id}, _set: {transaction_hash: $transactionHash, status: "submitted"}) {
            id
          }
        }`,
        { id: payment.id, transactionHash: tx.hash }
      );

      // Start verification process
      this.verifyTransaction(tx.hash, payment.id, networkKey);

      return {
        paymentId: payment.id,
        transactionHash: tx.hash,
        explorerUrl: `${network.explorerUrl}/tx/${tx.hash}`,
        paymentDetails
      };

    } catch (txError) {
      // Update payment status to failed
      await nhost.graphql.request(
        `mutation UpdatePaymentStatus($id: uuid!) {
          update_payments_by_pk(pk_columns: {id: $id}, _set: {status: "failed"}) {
            id
          }
        }`,
        { id: payment.id }
      );
      
      throw txError;
    }
  }

  // Verify transaction on blockchain
  async verifyTransaction(txHash, paymentId, networkKey) {
    const network = PAYMENT_NETWORKS[networkKey];
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);

    try {
      // Wait for transaction confirmation
      const receipt = await provider.waitForTransaction(txHash, 1);
      
      if (receipt && receipt.status === 1) {
        // Transaction successful
        await nhost.graphql.request(
          `mutation UpdatePaymentStatus($id: uuid!) {
            update_payments_by_pk(pk_columns: {id: $id}, _set: {status: "confirmed", verified_at: "now()"}) {
              id
            }
          }`,
          { id: paymentId }
        );

        // Award service access or points
        await this.processSuccessfulPayment(paymentId);
        
        return true;
      } else {
        // Transaction failed
        await nhost.graphql.request(
          `mutation UpdatePaymentStatus($id: uuid!) {
            update_payments_by_pk(pk_columns: {id: $id}, _set: {status: "failed"}) {
              id
            }
          }`,
          { id: paymentId }
        );
        
        return false;
      }
    } catch (error) {
      console.error('Transaction verification error:', error);
      await nhost.graphql.request(
        `mutation UpdatePaymentStatus($id: uuid!) {
          update_payments_by_pk(pk_columns: {id: $id}, _set: {status: "verification_failed"}) {
            id
          }
        }`,
        { id: paymentId }
      );
      
      return false;
    }
  }

  // Process successful payment
  async processSuccessfulPayment(paymentId) {
    try {
      // Get payment details
      const { data: payment } = await nhost.graphql.request(
        `query GetPayment($id: uuid!) {
          payments_by_pk(id: $id) {
            id
            user_id
            service_type
            transaction_hash
          }
        }`,
        { id: paymentId }
      );

      if (!payment) return;

      const service = SERVICE_TYPES[payment.service_type];
      
      // Award points or service access based on service type
      if (payment.service_type.includes('scan')) {
        // Award scan credits
        const scanCredits = Math.floor(service.cost / 100); // 1 credit per $100
        
        await nhost.graphql.request(
          `mutation UpdateUserPoints($userId: uuid!, $credits: Int!) {
            update_user_points(where: {user_id: {_eq: $userId}}, _inc: {points: $credits}) {
              affected_rows
            }
          }`,
          { userId: payment.user_id, credits: scanCredits }
        );

        // Record transaction
        await nhost.graphql.request(
          `mutation InsertPointsTransaction($userId: uuid!, $credits: Int!, $paymentId: uuid!, $transactionHash: String!) {
            insert_points_transactions_one(object: {
              user_id: $userId,
              points_change: $credits,
              source: "payment",
              metadata: {
                payment_id: $paymentId,
                service_type: payment.service_type,
                transaction_hash: $transactionHash
              }
            }) {
              id
            }
          }`,
          { 
            userId: payment.user_id, 
            credits: scanCredits, 
            paymentId: paymentId, 
            transactionHash: payment.transaction_hash 
          }
        );
      }

      // Send notification (implement notification service)
      await this.sendPaymentNotification(payment);

    } catch (error) {
      console.error('Error processing successful payment:', error);
    }
  }

  // Send payment notification
  async sendPaymentNotification(payment) {
    // Implement notification logic (email, in-app, etc.)
    console.log('Payment confirmed:', payment);
  }

  // Get user payment history
  async getUserPayments(userId) {
    const { data: payments, error } = await nhost.graphql.request(
      `query GetUserPayments($userId: uuid!) {
        payments(where: {user_id: {_eq: $userId}}, order_by: {created_at: desc}) {
          id
          amount
          currency
          status
          service_type
          created_at
        }
      }`,
      { userId }
    );

    if (error) throw error;
    return payments;
  }

  // Check payment status
  async checkPaymentStatus(paymentId) {
    const { data: payment, error } = await nhost.graphql.request(
      `query GetPayment($id: uuid!) {
        payments_by_pk(id: $id) {
          id
          status
        }
      }`,
      { id: paymentId }
    );

    if (error) throw error;
    return payment;
  }

  // GraphQL helper
  async gqlRequest(query, variables) {
    return nhost.graphql.request(query, variables);
  }

  // Example: Insert payment
  async insertPayment(data) {
    const query = `mutation InsertPayment($object: payments_insert_input!) {
      insert_payments_one(object: $object) {
        id
        user_id
        amount
        currency
        status
        service_type
      }
    }`;
    return this.gqlRequest(query, { object: data });
  }
}

export const web3PaymentService = new Web3PaymentService();

// Utility functions
export function formatCurrency(amount, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'ETH' ? 'USD' : 'USD',
    minimumFractionDigits: currency === 'ETH' ? 6 : 2,
    maximumFractionDigits: currency === 'ETH' ? 6 : 2
  }).format(amount);
}

export function getNetworkIcon(networkKey) {
  const icons = {
    ethereum: '⟠',
    polygon: '⬟',
    bsc: '🟡',
    bitcoin: '₿',
    solana: '◎'
  };
  return icons[networkKey] || '🔗';
}

export function getStatusColor(status) {
  const colors = {
    pending: '#ffa502',
    submitted: '#3742fa',
    confirmed: '#2ed573',
    failed: '#ff4757',
    verification_failed: '#ff6b6b'
  };
  return colors[status] || '#747d8c';
}

export function getStatusIcon(status) {
  const icons = {
    pending: '⏳',
    submitted: '📤',
    confirmed: '✅',
    failed: '❌',
    verification_failed: '⚠️'
  };
  return icons[status] || '❓';
}