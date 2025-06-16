import { ethers } from 'ethers';
import { supabase } from '../lib/supabase';

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
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        network: networkKey,
        from_address: userAddress,
        to_address: network.address,
        amount: paymentDetails.amountCrypto,
        currency: network.symbol,
        status: 'pending',
        service_type: serviceType
      })
      .select()
      .single();

    if (error) throw error;

    try {
      // Send transaction
      const tx = await this.signer.sendTransaction({
        to: network.address,
        value: ethers.parseEther(paymentDetails.amountCrypto.toString()),
        gasLimit: 21000
      });

      // Update payment with transaction hash
      await supabase
        .from('payments')
        .update({ 
          transaction_hash: tx.hash,
          status: 'submitted'
        })
        .eq('id', payment.id);

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
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', payment.id);
      
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
        await supabase
          .from('payments')
          .update({ 
            status: 'confirmed',
            verified_at: new Date().toISOString()
          })
          .eq('id', paymentId);

        // Award service access or points
        await this.processSuccessfulPayment(paymentId);
        
        return true;
      } else {
        // Transaction failed
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('id', paymentId);
        
        return false;
      }
    } catch (error) {
      console.error('Transaction verification error:', error);
      await supabase
        .from('payments')
        .update({ status: 'verification_failed' })
        .eq('id', paymentId);
      
      return false;
    }
  }

  // Process successful payment
  async processSuccessfulPayment(paymentId) {
    try {
      // Get payment details
      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (!payment) return;

      const service = SERVICE_TYPES[payment.service_type];
      
      // Award points or service access based on service type
      if (payment.service_type.includes('scan')) {
        // Award scan credits
        const scanCredits = Math.floor(service.cost / 100); // 1 credit per $100
        
        await supabase
          .from('user_points')
          .update({ 
            points: supabase.raw('points + ?', [scanCredits])
          })
          .eq('user_id', payment.user_id);

        // Record transaction
        await supabase
          .from('points_transactions')
          .insert({
            user_id: payment.user_id,
            points_change: scanCredits,
            source: 'payment',
            metadata: {
              payment_id: paymentId,
              service_type: payment.service_type,
              transaction_hash: payment.transaction_hash
            }
          });
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
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return payments;
  }

  // Check payment status
  async checkPaymentStatus(paymentId) {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) throw error;
    return payment;
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