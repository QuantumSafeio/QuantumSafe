// خدمة الدفع المحسنة متعددة الشبكات
import { multiChainWallet, SUPPORTED_NETWORKS } from './multiChainWallet';
import { supabase } from '../lib/supabase';

// أسعار العملات المشفرة (يجب جلبها من API حقيقي)
const CRYPTO_PRICES = {
  ETH: 2000,
  MATIC: 0.8,
  BNB: 300,
  SOL: 20,
  BTC: 43000,
  SUI: 1.5
};

// أنواع الخدمات وتكاليفها
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

  // حساب مبلغ الدفع بالعملة المشفرة
  calculateCryptoAmount(serviceType, networkKey) {
    const service = ENHANCED_SERVICE_TYPES[serviceType];
    const network = SUPPORTED_NETWORKS[networkKey];
    
    if (!service || !network) {
      throw new Error('Invalid service type or network');
    }

    const cryptoPrice = CRYPTO_PRICES[network.symbol];
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

  // بدء عملية الدفع
  async initiatePayment(serviceType, networkKey, userId) {
    try {
      // التحقق من صحة البيانات
      const service = ENHANCED_SERVICE_TYPES[serviceType];
      const network = SUPPORTED_NETWORKS[networkKey];
      
      if (!service || !network) {
        throw new Error('Invalid service or network selection');
      }

      // حساب المبلغ
      const paymentDetails = this.calculateCryptoAmount(serviceType, networkKey);
      
      // الاتصال بالمحفظة
      const walletConnection = await multiChainWallet.connectWallet(networkKey);
      
      // التحقق من الرصيد
      const balance = await multiChainWallet.getBalance(networkKey);
      if (parseFloat(balance) < paymentDetails.amountCrypto) {
        throw new Error(`Insufficient balance. Required: ${paymentDetails.amountCrypto} ${network.symbol}, Available: ${balance} ${network.symbol}`);
      }

      // إنشاء سجل الدفع في قاعدة البيانات
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          network: networkKey,
          from_address: walletConnection.address,
          to_address: network.address,
          amount: paymentDetails.amountCrypto,
          currency: network.symbol,
          status: 'pending',
          service_type: serviceType
        })
        .select()
        .single();

      if (error) throw error;

      // إرسال المعاملة
      const transactionResult = await multiChainWallet.sendPayment(
        networkKey,
        paymentDetails.amountCrypto,
        network.address
      );

      // تحديث سجل الدفع بمعرف المعاملة
      await supabase
        .from('payments')
        .update({ 
          transaction_hash: transactionResult.hash,
          status: 'submitted'
        })
        .eq('id', payment.id);

      // بدء عملية التحقق
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

  // عملية التحقق من المعاملة
  async startVerificationProcess(txHash, paymentId, networkKey) {
    // تأخير قبل بدء التحقق
    setTimeout(async () => {
      try {
        const isConfirmed = await this.verifyTransaction(txHash, networkKey);
        
        if (isConfirmed) {
          await supabase
            .from('payments')
            .update({ 
              status: 'confirmed',
              verified_at: new Date().toISOString()
            })
            .eq('id', paymentId);

          // معالجة الدفع الناجح
          await this.processSuccessfulPayment(paymentId);
        } else {
          await supabase
            .from('payments')
            .update({ status: 'failed' })
            .eq('id', paymentId);
        }
      } catch (error) {
        console.error('Verification error:', error);
        await supabase
          .from('payments')
          .update({ status: 'verification_failed' })
          .eq('id', paymentId);
      }
    }, 30000); // انتظار 30 ثانية قبل التحقق
  }

  // التحقق من المعاملة على البلوك تشين
  async verifyTransaction(txHash, networkKey) {
    try {
      const network = SUPPORTED_NETWORKS[networkKey];
      
      switch (network.walletType) {
        case 'metamask':
          // التحقق من معاملات Ethereum/Polygon/BSC
          const provider = new ethers.JsonRpcProvider(network.rpcUrl);
          const receipt = await provider.getTransactionReceipt(txHash);
          return receipt && receipt.status === 1;
        
        case 'phantom':
          // التحقق من معاملات Solana
          // في التطبيق الحقيقي، استخدم Solana Web3.js
          return true; // محاكاة النجاح
        
        case 'unisat':
          // التحقق من معاملات Bitcoin
          // في التطبيق الحقيقي، استخدم Bitcoin API
          return true; // محاكاة النجاح
        
        case 'sui':
          // التحقق من معاملات SUI
          // في التطبيق الحقيقي، استخدم SUI SDK
          return true; // محاكاة النجاح
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Transaction verification error:', error);
      return false;
    }
  }

  // معالجة الدفع الناجح
  async processSuccessfulPayment(paymentId) {
    try {
      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (!payment) return;

      const service = ENHANCED_SERVICE_TYPES[payment.service_type];
      
      // منح نقاط أو اعتمادات المسح
      const scanCredits = Math.floor(service.cost / 100); // 1 نقطة لكل $100
      
      // تحديث نقاط المستخدم
      const { data: currentPoints } = await supabase
        .from('user_points')
        .select('points')
        .eq('user_id', payment.user_id)
        .single();

      const newPoints = (currentPoints?.points || 0) + scanCredits;
      
      await supabase
        .from('user_points')
        .upsert({
          user_id: payment.user_id,
          points: newPoints,
          updated_at: new Date().toISOString()
        });

      // تسجيل معاملة النقاط
      await supabase
        .from('points_transactions')
        .insert({
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
        });

      console.log(`Payment processed successfully. Awarded ${scanCredits} points to user ${payment.user_id}`);
      
    } catch (error) {
      console.error('Error processing successful payment:', error);
    }
  }

  // الحصول على تاريخ المدفوعات
  async getUserPayments(userId) {
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return payments;
  }

  // فحص حالة الدفع
  async checkPaymentStatus(paymentId) {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) throw error;
    return payment;
  }

  // الحصول على المحافظ المتاحة
  async getAvailableWallets() {
    return await multiChainWallet.checkAvailableWallets();
  }

  // الحصول على معلومات الشبكة
  getNetworkInfo(networkKey) {
    return SUPPORTED_NETWORKS[networkKey];
  }

  // الحصول على معلومات الخدمة
  getServiceInfo(serviceType) {
    return ENHANCED_SERVICE_TYPES[serviceType];
  }
}

export const enhancedWeb3Payment = new EnhancedWeb3PaymentService();

// دوال مساعدة
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