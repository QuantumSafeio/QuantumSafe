// Enhanced multi-chain Web3 payment service
import { multiChainWallet, SUPPORTED_NETWORKS } from './multiChainWallet';
import axios from 'axios';

// Cryptocurrency prices (should be fetched from real API)
const CRYPTO_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,polygon,binancecoin,solana,bitcoin,sui&vs_currencies=usd';

async function fetchCryptoPrices() {
  try {
    const response = await axios.get(CRYPTO_API_URL);
    const prices = response.data;
    return {
      ETH: prices.ethereum.usd,
      MATIC: prices.polygon.usd,
      BNB: prices.binancecoin.usd,
      SOL: prices.solana.usd,
      BTC: prices.bitcoin.usd,
      SUI: prices.sui.usd
    };
  } catch (error) {
    console.error('Failed to fetch crypto prices:', error);
    // fallback to static prices if API fails
    return {
      ETH: 2000,
      MATIC: 0.8,
      BNB: 300,
      SOL: 20,
      BTC: 43000,
      SUI: 1.5
    };
  }
}

// Service types and their costs
export const ENHANCED_SERVICE_TYPES = {
  contract_scan: { 
    name: "Smart Contract Security Scan", 
    cost: 2000,
    description: "Advanced quantum vulnerability analysis for smart contracts",
    features: ["Quantum threat detection", "Security recommendations", "Compliance report"]
  },
  wallet_scan: { 
    name: "Wallet Security Analysis", 
    cost: 500,
    description: "Comprehensive wallet security assessment",
    features: ["Private key analysis", "Transaction security", "Quantum readiness"]
  },
  nft_scan: { 
    name: "NFT Collection Security", 
    cost: 500,
    description: "NFT authenticity and security verification",
    features: ["Metadata verification", "Ownership validation", "Quantum protection"]
  },
  token_scan: { 
    name: "Token Security Audit", 
    cost: 500,
    description: "Token contract and economics analysis",
    features: ["Contract audit", "Tokenomics review", "Security assessment"]
  },
  app_scan: { 
    name: "DApp Security Assessment", 
    cost: 2000,
    description: "Complete decentralized application security review",
    features: ["Frontend security", "Backend analysis", "API security"]
  },
  premium_insurance: { 
    name: "Quantum Security Insurance", 
    cost: 5000,
    description: "Complete quantum protection coverage",
    features: ["24/7 monitoring", "Instant alerts", "Recovery assistance"]
  }
};

class EnhancedWeb3PaymentService {
  constructor() {
    this.supportedNetworks = SUPPORTED_NETWORKS;
  }

  // Calculate payment amount in cryptocurrency
  async calculateCryptoAmount(serviceType, networkKey) {
    const service = ENHANCED_SERVICE_TYPES[serviceType];
    const network = SUPPORTED_NETWORKS[networkKey];
    if (!service || !network) {
      throw new Error('Invalid service type or network');
    }
    const cryptoPrices = await fetchCryptoPrices();
    const cryptoPrice = cryptoPrices[network.symbol];
    if (!cryptoPrice) {
      throw new Error('Price not available for this cryptocurrency');
    }
    const amountInCrypto = service.cost / cryptoPrice;
    return {
      amountUSD: service.cost,
      amountCrypto: amountInCrypto,
      currency: network.symbol,
      serviceName: service.name,
      networkName: network.name,
      pricePerUnit: cryptoPrice
    };
  }

  // Initiate payment process
  async initiatePayment(serviceType, networkKey, userId) {
    try {
      // Validate input data
      const service = ENHANCED_SERVICE_TYPES[serviceType];
      const network = SUPPORTED_NETWORKS[networkKey];
      
      if (!service || !network) {
        throw new Error('Invalid service or network selection');
      }

      // Calculate payment amount
      const paymentDetails = this.calculateCryptoAmount(serviceType, networkKey);
      
      // Connect to wallet
      const walletConnection = await multiChainWallet.connectWallet(networkKey);
      
      // Check balance
      const balance = await multiChainWallet.getBalance(networkKey);
      if (parseFloat(balance) < paymentDetails.amountCrypto) {
        throw new Error(`Insufficient balance. Required: ${paymentDetails.amountCrypto} ${network.symbol}, Available: ${balance} ${network.symbol}`);
      }

      // Create payment record in database
      const { data: payment, error } = await nhost.graphql.request(
        `mutation ($input: payments_insert_input!) {
          insert_payments_one(object: $input) {
            id
          }
        }`,
        {
          input: {
            user_id: userId,
            network: networkKey,
            from_address: walletConnection.address,
            to_address: network.address,
            amount: paymentDetails.amountCrypto,
            currency: network.symbol,
            status: 'pending',
            service_type: serviceType
          }
        }
      );

      if (error) throw error;

      // Send transaction
      const transactionResult = await multiChainWallet.sendPayment(
        networkKey,
        paymentDetails.amountCrypto,
        network.address
      );

      // Update payment record with transaction hash
      await nhost.graphql.request(
        `mutation ($id: uuid!, $hash: String!) {
          update_payments_by_pk(pk_columns: {id: $id}, _set: {transaction_hash: $hash, status: "submitted"}) {
            id
          }
        }`,
        {
          id: payment.id,
          hash: transactionResult.hash
        }
      );

      // Start verification process
      this.startVerificationProcess(transactionResult.hash, payment.id, networkKey);

      return {
        paymentId: payment.id,
        transactionHash: transactionResult.hash,
        explorerUrl: transactionResult.explorerUrl,
        paymentDetails,
        network: networkKey
      };

    } catch (error) {
      console.error('Payment initiation error:', error);
      throw new Error(`Payment failed: ${error.message}`);
    }
  }

  // Transaction verification process
  async startVerificationProcess(txHash, paymentId, networkKey) {
    // Delay before starting verification
    setTimeout(async () => {
      try {
        const isConfirmed = await this.verifyTransaction(txHash, networkKey);
        
        if (isConfirmed) {
          await nhost.graphql.request(
            `mutation ($id: uuid!) {
              update_payments_by_pk(pk_columns: {id: $id}, _set: {status: "confirmed", verified_at: "now()"}) {
                id
              }
            }`,
            {
              id: paymentId
            }
          );

          // Process successful payment
          await this.processSuccessfulPayment(paymentId);
        } else {
          await nhost.graphql.request(
            `mutation ($id: uuid!) {
              update_payments_by_pk(pk_columns: {id: $id}, _set: {status: "failed"}) {
                id
              }
            }`,
            {
              id: paymentId
            }
          );
        }
      } catch (error) {
        console.error('Verification error:', error);
        await nhost.graphql.request(
          `mutation ($id: uuid!) {
            update_payments_by_pk(pk_columns: {id: $id}, _set: {status: "verification_failed"}) {
              id
            }
          }`,
          {
            id: paymentId
          }
        );
      }
    }, 30000); // Wait 30 seconds before verification
  }

  // Verify transaction on blockchain
  async verifyTransaction(txHash, networkKey) {
    try {
      const network = SUPPORTED_NETWORKS[networkKey];
      
      switch (network.walletType) {
        case 'metamask':
          // Verify Ethereum/Polygon/BSC transactions
          const provider = new ethers.JsonRpcProvider(network.rpcUrl);
          const receipt = await provider.getTransactionReceipt(txHash);
          return receipt && receipt.status === 1;
        
        case 'phantom':
          // Verify Solana transactions
          // In real application, use Solana Web3.js
          return true; // Simulate success
        
        case 'unisat':
          // Verify Bitcoin transactions
          // In real application, use Bitcoin API
          return true; // Simulate success
        
        case 'sui':
          // Verify SUI transactions
          // In real application, use SUI SDK
          return true; // Simulate success
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Transaction verification error:', error);
      return false;
    }
  }

  // Process successful payment
  async processSuccessfulPayment(paymentId) {
    try {
      const { data: payment } = await nhost.graphql.request(
        `query ($id: uuid!) {
          payments_by_pk(id: $id) {
            id
            user_id
            service_type
            transaction_hash
            network
            amount
            currency
          }
        }`,
        {
          id: paymentId
        }
      );

      if (!payment) return;

      const service = ENHANCED_SERVICE_TYPES[payment.service_type];
      
      // Award points or scan credits
      const scanCredits = Math.floor(service.cost / 100); // 1 point per $100
      
      // Update user points
      const { data: currentPoints } = await nhost.graphql.request(
        `query ($userId: uuid!) {
          user_points(where: {user_id: {_eq: $userId}}) {
            points
          }
        }`,
        {
          userId: payment.user_id
        }
      );

      const newPoints = (currentPoints?.[0]?.points || 0) + scanCredits;
      
      await nhost.graphql.request(
        `mutation ($userId: uuid!, $points: Int!) {
          insert_user_points_one(object: {user_id: $userId, points: $points, updated_at: "now()"} on_conflict: {constraint: user_points_pkey, update_columns: points}) {
            id
          }
        }`,
        {
          userId: payment.user_id,
          points: newPoints
        }
      );

      // Record points transaction
      await nhost.graphql.request(
        `mutation ($input: points_transactions_insert_input!) {
          insert_points_transactions_one(object: $input) {
            id
          }
        }`,
        {
          input: {
            user_id: payment.user_id,
            points_change: scanCredits,
            source: 'crypto_payment',
            metadata: {
              payment_id: paymentId,
              service_type: payment.service_type,
              transaction_hash: payment.transaction_hash,
              network: payment.network,
              amount: payment.amount,
              currency: payment.currency
            }
          }
        }
      );

      console.log(`Payment processed successfully. Awarded ${scanCredits} points to user ${payment.user_id}`);
      
    } catch (error) {
      console.error('Error processing successful payment:', error);
    }
  }

  // Get payment history
  async getUserPayments(userId) {
    const { data: payments, error } = await nhost.graphql.request(
      `query ($userId: uuid!) {
        payments(where: {user_id: {_eq: $userId}}, order_by: {created_at: desc}) {
          id
          network
          from_address
          to_address
          amount
          currency
          status
          service_type
          created_at
          transaction_hash
        }
      }`,
      {
        userId
      }
    );

    if (error) throw error;
    return payments;
  }

  // Check payment status
  async checkPaymentStatus(paymentId) {
    const { data: payment, error } = await nhost.graphql.request(
      `query ($id: uuid!) {
        payments_by_pk(id: $id) {
          id
          status
          transaction_hash
          verified_at
        }
      }`,
      {
        id: paymentId
      }
    );

    if (error) throw error;
    return payment;
  }

  // Get available wallets
  async getAvailableWallets() {
    return await multiChainWallet.checkAvailableWallets();
  }

  // Get network information
  getNetworkInfo(networkKey) {
    return SUPPORTED_NETWORKS[networkKey];
  }

  // Get service information
  getServiceInfo(serviceType) {
    return ENHANCED_SERVICE_TYPES[serviceType];
  }
}

export const enhancedWeb3Payment = new EnhancedWeb3PaymentService();

// Helper functions
export function formatCryptoAmount(amount, currency) {
  const decimals = currency === 'BTC' ? 8 : currency === 'ETH' ? 6 : 4;
  return parseFloat(amount).toFixed(decimals);
}

export function getNetworkIcon(networkKey) {
  return SUPPORTED_NETWORKS[networkKey]?.icon || '🔗';
}

export function getWalletInstallUrl(walletType) {
  const urls = {
    metamask: 'https://metamask.io/download/',
    phantom: 'https://phantom.app/',
    unisat: 'https://unisat.io/',
    sui: 'https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil'
  };
  return urls[walletType] || '#';
}

// GraphQL helper
async function gqlRequest(query, variables) {
  return nhost.graphql.request(query, variables);
}

// Example: Insert payment
async function insertPayment(data) {
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
  return gqlRequest(query, { object: data });
}