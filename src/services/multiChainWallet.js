// خدمة المحافظ متعددة الشبكات
import { ethers } from 'ethers';

// تكوين الشبكات المدعومة
export const SUPPORTED_NETWORKS = {
  ethereum: {
    name: "Ethereum",
    symbol: "ETH",
    chainId: 1,
    rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
    explorerUrl: "https://etherscan.io",
    address: "0xE4A671f105E9e54eC45Bf9217a9e8050cBD92108",
    icon: "⟠",
    walletType: "metamask"
  },
  polygon: {
    name: "Polygon",
    symbol: "MATIC",
    chainId: 137,
    rpcUrl: "https://polygon-rpc.com",
    explorerUrl: "https://polygonscan.com",
    address: "0xE4A671f105E9e54eC45Bf9217a9e8050cBD92108",
    icon: "⬟",
    walletType: "metamask"
  },
  bsc: {
    name: "Binance Smart Chain",
    symbol: "BNB",
    chainId: 56,
    rpcUrl: "https://bsc-dataseed.binance.org",
    explorerUrl: "https://bscscan.com",
    address: "0xE4A671f105E9e54eC45Bf9217a9e8050cBD92108",
    icon: "🟡",
    walletType: "metamask"
  },
  solana: {
    name: "Solana",
    symbol: "SOL",
    rpcUrl: "https://api.mainnet-beta.solana.com",
    explorerUrl: "https://explorer.solana.com",
    address: "24YRQbK4A6TrcBSmvm92iZK6KJ8X3qiEoSoYEwHp8EL2",
    icon: "◎",
    walletType: "phantom"
  },
  bitcoin: {
    name: "Bitcoin",
    symbol: "BTC",
    explorerUrl: "https://blockstream.info",
    address: "bc1qe552eydkjy0vz0ln068mkmg9uhmwn3g9p0p875",
    icon: "₿",
    walletType: "unisat"
  },
  sui: {
    name: "SUI",
    symbol: "SUI",
    rpcUrl: "https://fullnode.mainnet.sui.io:443",
    explorerUrl: "https://explorer.sui.io",
    address: "0xaa5402dbb7bb02986fce47dcce033a3eb8047db97b0107dc21bdb10358a5b92e",
    icon: "🔷",
    walletType: "sui"
  }
};

class MultiChainWalletService {
  constructor() {
    this.connectedWallets = {};
    this.currentNetwork = null;
  }

  // فحص المحافظ المتاحة
  async checkAvailableWallets() {
    const available = {
      metamask: typeof window.ethereum !== 'undefined',
      phantom: typeof window.solana !== 'undefined',
      unisat: typeof window.unisat !== 'undefined',
      sui: typeof window.suiWallet !== 'undefined'
    };

    return available;
  }

  // الاتصال بمحفظة MetaMask (Ethereum, Polygon, BSC)
  async connectMetaMask(networkKey) {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    try {
      const network = SUPPORTED_NETWORKS[networkKey];
      if (!network || network.walletType !== 'metamask') {
        throw new Error('Invalid network for MetaMask');
      }

      // طلب الاتصال
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // تبديل الشبكة إذا لزم الأمر
      await this.switchMetaMaskNetwork(network);
      
      // إنشاء المزود والموقع
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      this.connectedWallets[networkKey] = {
        address,
        provider,
        signer,
        network: networkKey
      };

      return {
        address,
        network: networkKey,
        walletType: 'metamask'
      };
    } catch (error) {
      console.error('MetaMask connection error:', error);
      throw new Error(`Failed to connect MetaMask: ${error.message}`);
    }
  }

  // تبديل شبكة MetaMask
  async switchMetaMaskNetwork(network) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${network.chainId.toString(16)}` }],
      });
    } catch (switchError) {
      // إذا لم تكن الشبكة موجودة، أضفها
      if (switchError.code === 4902) {
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
      } else {
        throw switchError;
      }
    }
  }

  // الاتصال بمحفظة Phantom (Solana)
  async connectPhantom() {
    if (!window.solana || !window.solana.isPhantom) {
      throw new Error('Phantom wallet is not installed. Please install Phantom wallet.');
    }

    try {
      const response = await window.solana.connect();
      const address = response.publicKey.toString();
      
      this.connectedWallets.solana = {
        address,
        publicKey: response.publicKey,
        network: 'solana'
      };

      return {
        address,
        network: 'solana',
        walletType: 'phantom'
      };
    } catch (error) {
      console.error('Phantom connection error:', error);
      throw new Error(`Failed to connect Phantom: ${error.message}`);
    }
  }

  // الاتصال بمحفظة UniSat (Bitcoin)
  async connectUniSat() {
    if (!window.unisat) {
      throw new Error('UniSat wallet is not installed. Please install UniSat wallet.');
    }

    try {
      const accounts = await window.unisat.requestAccounts();
      const address = accounts[0];
      
      this.connectedWallets.bitcoin = {
        address,
        network: 'bitcoin'
      };

      return {
        address,
        network: 'bitcoin',
        walletType: 'unisat'
      };
    } catch (error) {
      console.error('UniSat connection error:', error);
      throw new Error(`Failed to connect UniSat: ${error.message}`);
    }
  }

  // الاتصال بمحفظة SUI
  async connectSuiWallet() {
    if (!window.suiWallet) {
      throw new Error('SUI wallet is not installed. Please install SUI wallet.');
    }

    try {
      const response = await window.suiWallet.connect();
      const address = response.accounts[0];
      
      this.connectedWallets.sui = {
        address,
        network: 'sui'
      };

      return {
        address,
        network: 'sui',
        walletType: 'sui'
      };
    } catch (error) {
      console.error('SUI wallet connection error:', error);
      throw new Error(`Failed to connect SUI wallet: ${error.message}`);
    }
  }

  // الاتصال التلقائي بالمحفظة المناسبة
  async connectWallet(networkKey) {
    const network = SUPPORTED_NETWORKS[networkKey];
    if (!network) {
      throw new Error('Unsupported network');
    }

    switch (network.walletType) {
      case 'metamask':
        return await this.connectMetaMask(networkKey);
      case 'phantom':
        return await this.connectPhantom();
      case 'unisat':
        return await this.connectUniSat();
      case 'sui':
        return await this.connectSuiWallet();
      default:
        throw new Error('Unsupported wallet type');
    }
  }

  // إرسال دفعة Ethereum/Polygon/BSC
  async sendEthereumPayment(networkKey, amount, toAddress) {
    const wallet = this.connectedWallets[networkKey];
    if (!wallet || !wallet.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await wallet.signer.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amount.toString()),
        gasLimit: 21000
      });

      return {
        hash: tx.hash,
        network: networkKey,
        explorerUrl: `${SUPPORTED_NETWORKS[networkKey].explorerUrl}/tx/${tx.hash}`
      };
    } catch (error) {
      console.error('Ethereum payment error:', error);
      throw new Error(`Payment failed: ${error.message}`);
    }
  }

  // إرسال دفعة Solana
  async sendSolanaPayment(amount, toAddress) {
    if (!window.solana || !this.connectedWallets.solana) {
      throw new Error('Phantom wallet not connected');
    }

    try {
      // تحويل SOL إلى lamports (1 SOL = 1,000,000,000 lamports)
      const lamports = Math.floor(amount * 1000000000);
      
      const transaction = new window.solanaWeb3.Transaction().add(
        window.solanaWeb3.SystemProgram.transfer({
          fromPubkey: this.connectedWallets.solana.publicKey,
          toPubkey: new window.solanaWeb3.PublicKey(toAddress),
          lamports: lamports,
        })
      );

      const { signature } = await window.solana.signAndSendTransaction(transaction);
      
      return {
        hash: signature,
        network: 'solana',
        explorerUrl: `${SUPPORTED_NETWORKS.solana.explorerUrl}/tx/${signature}`
      };
    } catch (error) {
      console.error('Solana payment error:', error);
      throw new Error(`Solana payment failed: ${error.message}`);
    }
  }

  // إرسال دفعة Bitcoin
  async sendBitcoinPayment(amount, toAddress) {
    if (!window.unisat || !this.connectedWallets.bitcoin) {
      throw new Error('UniSat wallet not connected');
    }

    try {
      // تحويل BTC إلى satoshis (1 BTC = 100,000,000 satoshis)
      const satoshis = Math.floor(amount * 100000000);
      
      const txid = await window.unisat.sendBitcoin(toAddress, satoshis);
      
      return {
        hash: txid,
        network: 'bitcoin',
        explorerUrl: `${SUPPORTED_NETWORKS.bitcoin.explorerUrl}/tx/${txid}`
      };
    } catch (error) {
      console.error('Bitcoin payment error:', error);
      throw new Error(`Bitcoin payment failed: ${error.message}`);
    }
  }

  // إرسال دفعة SUI
  async sendSuiPayment(amount, toAddress) {
    if (!window.suiWallet || !this.connectedWallets.sui) {
      throw new Error('SUI wallet not connected');
    }

    try {
      // تحويل SUI إلى MIST (1 SUI = 1,000,000,000 MIST)
      const mist = Math.floor(amount * 1000000000);
      
      const transaction = {
        kind: 'moveCall',
        data: {
          packageObjectId: '0x2',
          module: 'coin',
          function: 'transfer',
          typeArguments: ['0x2::sui::SUI'],
          arguments: [mist, toAddress]
        }
      };

      const result = await window.suiWallet.signAndExecuteTransaction(transaction);
      
      return {
        hash: result.digest,
        network: 'sui',
        explorerUrl: `${SUPPORTED_NETWORKS.sui.explorerUrl}/txblock/${result.digest}`
      };
    } catch (error) {
      console.error('SUI payment error:', error);
      throw new Error(`SUI payment failed: ${error.message}`);
    }
  }

  // إرسال دفعة عامة
  async sendPayment(networkKey, amount, toAddress) {
    const network = SUPPORTED_NETWORKS[networkKey];
    if (!network) {
      throw new Error('Unsupported network');
    }

    switch (network.walletType) {
      case 'metamask':
        return await this.sendEthereumPayment(networkKey, amount, toAddress);
      case 'phantom':
        return await this.sendSolanaPayment(amount, toAddress);
      case 'unisat':
        return await this.sendBitcoinPayment(amount, toAddress);
      case 'sui':
        return await this.sendSuiPayment(amount, toAddress);
      default:
        throw new Error('Unsupported payment method');
    }
  }

  // الحصول على رصيد المحفظة
  async getBalance(networkKey) {
    const wallet = this.connectedWallets[networkKey];
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      switch (networkKey) {
        case 'ethereum':
        case 'polygon':
        case 'bsc':
          const balance = await wallet.provider.getBalance(wallet.address);
          return ethers.formatEther(balance);
        
        case 'solana':
          const solBalance = await window.solana.getBalance();
          return (solBalance / 1000000000).toString(); // Convert lamports to SOL
        
        case 'bitcoin':
          const btcBalance = await window.unisat.getBalance();
          return (btcBalance.total / 100000000).toString(); // Convert satoshis to BTC
        
        case 'sui':
          const suiBalance = await window.suiWallet.getBalance();
          return (suiBalance / 1000000000).toString(); // Convert MIST to SUI
        
        default:
          return '0';
      }
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }

  // قطع الاتصال
  async disconnect(networkKey) {
    if (this.connectedWallets[networkKey]) {
      delete this.connectedWallets[networkKey];
    }
  }

  // قطع الاتصال من جميع المحافظ
  async disconnectAll() {
    this.connectedWallets = {};
    this.currentNetwork = null;
  }
}

export const multiChainWallet = new MultiChainWalletService();