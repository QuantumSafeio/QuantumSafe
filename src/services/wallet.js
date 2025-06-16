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
    const message = `Sign this message to authenticate with QuantumSafe.\nTimestamp: ${Date.now()}`;
    const signature = await signer.signMessage(message);
    
    return {
      address,
      signature,
      provider
    };
  } catch (error) {
    console.error('Wallet connection error:', error);
    throw new Error('Failed to connect wallet. Please try again.');
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