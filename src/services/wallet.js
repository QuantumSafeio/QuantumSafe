import { ethers } from 'ethers';

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }

  try {
    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Create provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    // Create a signature for authentication
    const message = `Welcome to QuantumSafe!\n\nSign this message to authenticate your wallet.\n\nWallet: ${address}\nTimestamp: ${Date.now()}\n\nThis signature is used for secure authentication and does not authorize any transactions.`;
    const signature = await signer.signMessage(message);
    
    return {
      address,
      signature,
      provider
    };
  } catch (error) {
    console.error('Wallet connection error:', error);
    
    if (error.code === 4001) {
      throw new Error('User rejected the connection request. Please try again.');
    } else if (error.code === -32002) {
      throw new Error('MetaMask is already processing a request. Please check MetaMask.');
    } else {
      throw new Error('Failed to connect wallet. Please make sure MetaMask is unlocked and try again.');
    }
  }
}

export async function getWalletBalance(address) {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed.');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    return '0';
  }
}

export async function switchNetwork(chainId) {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed.');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (error) {
    console.error('Error switching network:', error);
    throw new Error('Failed to switch network.');
  }
}

export async function getNetworkInfo() {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed.');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    return {
      chainId: Number(network.chainId),
      name: network.name
    };
  } catch (error) {
    console.error('Error getting network info:', error);
    return null;
  }
}