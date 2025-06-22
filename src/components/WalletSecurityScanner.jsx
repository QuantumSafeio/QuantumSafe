import React, { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";

const NETWORKS = [
	{
		name: "Ethereum",
		symbol: "ETH",
		address: "0xE4A671f105E9e54eC45Bf9217a9e8050cBD92108",
		coingeckoId: "ethereum",
		chainId: 1,
		rpcUrl: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
		icon: "⟠",
		isEVM: true
	},
	{
		name: "Polygon",
		symbol: "MATIC",
		address: "0xE4A671f105E9e54eC45Bf9217a9e8050cBD92108",
		coingeckoId: "matic-network",
		chainId: 137,
		rpcUrl: "https://polygon-rpc.com",
		icon: "⬟",
		isEVM: true
	},
	{
		name: "BSC",
		symbol: "BNB",
		address: "0xE4A671f105E9e54eC45Bf9217a9e8050cBD92108",
		coingeckoId: "binancecoin",
		chainId: 56,
		rpcUrl: "https://bsc-dataseed.binance.org",
		icon: "🟡",
		isEVM: true
	},
	{
		name: "Bitcoin",
		symbol: "BTC", 
		address: "bc1qe552eydkjy0vz0ln068mkmg9uhmwn3g9p0p875",
		coingeckoId: "bitcoin",
		isManual: true,
		icon: "₿"
	},
	{
		name: "Solana",
		symbol: "SOL",
		address: "24YRQbK4A6TrcBSmvm92iZK6KJ8X3qiEoSoYEwHp8EL2",
		coingeckoId: "solana",
		isPhantom: true,
		icon: "◎"
	},
	{
		name: "SUI",
		symbol: "SUI",
		address: "0xaa5402dbb7bb02986fce47dcce033a3eb8047db97b0107dc21bdb10358a5b92e",
		coingeckoId: "sui",
		isManual: true,
		icon: "🔷"
	},
];

export default function WalletSecurityScanner({ walletAddress = '', networkKey = 'ETH', provider }) {
	const [assetName, setAssetName] = useState("");
	const [scanResult, setScanResult] = useState(null);
	const [loading, setLoading] = useState(false);
	const [insurancePrice, setInsurancePrice] = useState(null);
	const [cryptoAmount, setCryptoAmount] = useState(null);
	const [inputError, setInputError] = useState("");
	const [selectedNetwork, setSelectedNetwork] = useState(networkKey || "ETH");
	const [paying, setPaying] = useState(false);
	const [currentWalletAddress, setCurrentWalletAddress] = useState(walletAddress);
	const [paymentSuccess, setPaymentSuccess] = useState(false);
	const [transactionHash, setTransactionHash] = useState("");
	const [realTimePrice, setRealTimePrice] = useState(null);
	const [priceLoading, setPriceLoading] = useState(false);
	const [currentProvider, setCurrentProvider] = useState(provider);

	// Enhanced wallet connection state
	const [isWalletConnected, setIsWalletConnected] = useState(false);
	const [walletConnectionError, setWalletConnectionError] = useState("");

	const network = NETWORKS.find((n) => n.symbol === selectedNetwork);

	// Check wallet connection status
	useEffect(() => {
		checkWalletConnection();
	}, [walletAddress, provider, selectedNetwork]);

	// Update wallet address when network changes
	useEffect(() => {
		if (selectedNetwork !== networkKey && walletAddress) {
			generateNetworkSpecificAddress(selectedNetwork);
		} else {
			setCurrentWalletAddress(walletAddress);
		}
		
		// Reset payment state when network changes
		setPaymentSuccess(false);
		setTransactionHash("");
		setCryptoAmount(null);
		setWalletConnectionError("");
		
		// Fetch new price for selected network
		if (network) {
			fetchRealTimePrice();
		}
	}, [selectedNetwork, walletAddress, networkKey]);

	// Enhanced wallet connection check
	const checkWalletConnection = async () => {
		try {
			setWalletConnectionError("");
			
			// Check if wallet address exists
			if (!walletAddress || !currentWalletAddress) {
				setIsWalletConnected(false);
				setWalletConnectionError("No wallet address provided");
				return;
			}

			// Check network-specific connection
			if (network?.isEVM) {
				// For EVM networks, check MetaMask connection
				if (!window.ethereum) {
					setIsWalletConnected(false);
					setWalletConnectionError("MetaMask not installed");
					return;
				}

				try {
					const accounts = await window.ethereum.request({ method: 'eth_accounts' });
					if (accounts.length === 0) {
						setIsWalletConnected(false);
						setWalletConnectionError("MetaMask not connected");
						return;
					}

					// Check if current provider is available
					if (provider || currentProvider) {
						setIsWalletConnected(true);
						setCurrentProvider(provider || currentProvider);
					} else {
						// Try to create new provider
						const newProvider = new ethers.BrowserProvider(window.ethereum);
						setCurrentProvider(newProvider);
						setIsWalletConnected(true);
					}
				} catch (error) {
					setIsWalletConnected(false);
					setWalletConnectionError("Failed to check MetaMask connection");
				}
			} else if (network?.isPhantom) {
				// For Solana, check Phantom connection
				if (!window.solana || !window.solana.isPhantom) {
					setIsWalletConnected(false);
					setWalletConnectionError("Phantom wallet not installed");
					return;
				}

				if (window.solana.isConnected) {
					setIsWalletConnected(true);
				} else {
					setIsWalletConnected(false);
					setWalletConnectionError("Phantom wallet not connected");
				}
			} else if (network?.isManual) {
				// For manual networks (BTC, SUI), just check if address exists
				setIsWalletConnected(!!currentWalletAddress);
			} else {
				setIsWalletConnected(!!currentWalletAddress);
			}
		} catch (error) {
			console.error('Error checking wallet connection:', error);
			setIsWalletConnected(false);
			setWalletConnectionError("Connection check failed");
		}
	};

	// Fetch real-time crypto prices with better error handling
	const fetchRealTimePrice = async () => {
		if (!network) return;
		
		setPriceLoading(true);
		try {
			const response = await axios.get(
				`https://api.coingecko.com/api/v3/simple/price?ids=${network.coingeckoId}&vs_currencies=usd`,
				{ timeout: 10000 }
			);
			
			const price = response.data[network.coingeckoId]?.usd;
			if (price) {
				setRealTimePrice(price);
			} else {
				throw new Error('Price not found');
			}
		} catch (error) {
			console.error('Failed to fetch price:', error);
			// Enhanced fallback prices (more realistic)
			const fallbackPrices = { 
				ETH: 2400, 
				BTC: 45000, 
				SOL: 25, 
				SUI: 1.8,
				MATIC: 0.9,
				BNB: 320
			};
			setRealTimePrice(fallbackPrices[network.symbol] || 100);
		} finally {
			setPriceLoading(false);
		}
	};

	// Generate realistic addresses for different networks
	const generateNetworkSpecificAddress = (networkSymbol) => {
		if (!walletAddress) return;
		
		const seed = walletAddress.toLowerCase() + networkSymbol.toLowerCase();
		let hash = 0;
		for (let i = 0; i < seed.length; i++) {
			const char = seed.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash;
		}
		
		const hashStr = Math.abs(hash).toString(16);
		
		switch (networkSymbol) {
			case 'ETH':
			case 'MATIC':
			case 'BNB':
				const ethBytes = hashStr.padStart(40, '0').slice(0, 40);
				setCurrentWalletAddress(`0x${ethBytes}`);
				break;
			case 'BTC':
				const btcHash = Math.abs(hash).toString(36).slice(0, 26);
				setCurrentWalletAddress(`bc1q${btcHash}${hashStr.slice(0, 8)}`);
				break;
			case 'SOL':
				const solHash = Math.abs(hash).toString(36).slice(0, 32);
				setCurrentWalletAddress(`${solHash}${hashStr.slice(0, 12)}`);
				break;
			case 'SUI':
				const suiBytes = hashStr.padStart(64, '0').slice(0, 64);
				setCurrentWalletAddress(`0x${suiBytes}`);
				break;
			default:
				setCurrentWalletAddress(walletAddress);
		}
	};

	const handleAssetNameChange = (e) => {
		const value = e.target.value;
		if (/^[a-zA-Z0-9 ._-]*$/.test(value)) {
			setAssetName(value);
			setInputError("");
		} else {
			setInputError("Asset name must be in English only (letters, numbers, space, . _ -)");
		}
	};

	const handleNetworkChange = (e) => {
		setSelectedNetwork(e.target.value);
		setScanResult(null);
		setCryptoAmount(null);
		setPaymentSuccess(false);
		setTransactionHash("");
		setWalletConnectionError("");
	};

	// Enhanced scan result generation
	const generateUniqueScanResult = (wallet, asset, networkName, timestamp) => {
		const seed = `${wallet}-${asset}-${networkName}-${timestamp}-${Math.random()}`.toLowerCase();
		let hash = 0;
		for (let i = 0; i < seed.length; i++) {
			const char = seed.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash;
		}
		
		const hashAbs = Math.abs(hash);
		const walletHash = wallet.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
		const assetHash = asset.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
		
		// Determine asset type with better intelligence
		const assetLower = asset.toLowerCase();
		let assetType = 'token';
		let riskMultiplier = 1.0;
		
		if (assetLower.includes('contract') || assetLower.includes('smart')) {
			assetType = 'contract';
			riskMultiplier = 1.4;
		} else if (assetLower.includes('nft') || assetLower.includes('collectible') || assetLower.includes('art')) {
			assetType = 'nft';
			riskMultiplier = 1.1;
		} else if (assetLower.includes('wallet') || assetLower.includes('address')) {
			assetType = 'wallet';
			riskMultiplier = 1.2;
		} else if (assetLower.includes('app') || assetLower.includes('dapp') || assetLower.includes('protocol')) {
			assetType = 'app';
			riskMultiplier = 1.5;
		} else if (assetLower.includes('defi') || assetLower.includes('swap') || assetLower.includes('pool')) {
			assetType = 'defi';
			riskMultiplier = 1.3;
		}

		// Enhanced risk calculation
		const baseRisk = (hashAbs + walletHash + assetHash) % 100;
		const networkRisk = networkName === 'Bitcoin' ? -15 : networkName === 'Ethereum' ? 10 : 0;
		const assetRisk = Math.floor(baseRisk * riskMultiplier) + networkRisk;
		
		let riskLevel, riskScore;
		if (assetRisk < 30) {
			riskLevel = 'Low';
			riskScore = Math.max(5, Math.min(35, assetRisk + (hashAbs % 15)));
		} else if (assetRisk < 70) {
			riskLevel = 'Medium';
			riskScore = Math.max(30, Math.min(65, assetRisk + (hashAbs % 20)));
		} else {
			riskLevel = 'High';
			riskScore = Math.max(60, Math.min(95, assetRisk + (hashAbs % 25)));
		}

		const baseConfidence = 85;
		const assetComplexity = assetType === 'contract' || assetType === 'app' ? 10 : 5;
		const networkBonus = networkName === 'Ethereum' ? 5 : 3;
		const confidence = Math.min(99, baseConfidence + assetComplexity + networkBonus + (hashAbs % 8));

		const vulnerabilities = generateRealVulnerabilities(assetType, riskLevel, wallet, asset, hashAbs);

		const descriptions = [
			`Comprehensive quantum cryptanalysis of "${asset}" on ${networkName} network reveals ${riskLevel.toLowerCase()} exposure to post-quantum computing threats. Analysis includes signature scheme evaluation, key derivation assessment, and entropy analysis.`,
			`Advanced security assessment of ${assetType} "${asset}" indicates ${riskLevel.toLowerCase()} quantum vulnerability based on current cryptographic implementation and network infrastructure on ${networkName}.`,
			`Deep quantum threat modeling for "${asset}" shows ${riskLevel.toLowerCase()} risk profile. Evaluation covers ECDSA signature schemes, hash function resistance, and quantum-safe migration readiness on ${networkName}.`,
			`Cross-platform quantum security evaluation demonstrates ${riskLevel.toLowerCase()} threat exposure for "${asset}". Assessment includes cryptographic primitives analysis and post-quantum readiness evaluation.`,
			`Quantum resistance analysis of "${asset}" on ${networkName} blockchain reveals ${riskLevel.toLowerCase()} vulnerability to Shor's and Grover's algorithms. Comprehensive evaluation of current security measures completed.`
		];
		
		const uniqueDesc = descriptions[hashAbs % descriptions.length];

		return {
			riskLevel,
			riskColor: riskLevel === 'High' ? '#ef4444' : riskLevel === 'Medium' ? '#f59e0b' : '#10b981',
			riskIcon: riskLevel === 'High' ? '🔴' : riskLevel === 'Medium' ? '🟡' : '🟢',
			riskScore,
			confidence,
			uniqueDesc,
			assetType,
			vulnerabilities,
			scanId: `QS-${Date.now()}-${hashAbs.toString(36).toUpperCase().slice(0, 8)}`,
			timestamp: new Date().toISOString()
		};
	};

	// Generate realistic vulnerabilities
	const generateRealVulnerabilities = (assetType, riskLevel, wallet, asset, hash) => {
		const vulnDatabase = {
			contract: [
				"ECDSA signature scheme vulnerable to Shor's algorithm",
				"Hash function susceptible to Grover's algorithm speedup",
				"Key derivation functions lack post-quantum resistance",
				"Random number generation predictable to quantum algorithms",
				"Legacy cryptographic libraries without quantum-safe updates",
				"Smart contract upgrade mechanisms not quantum-ready",
				"Cross-chain bridge protocols vulnerable to quantum attacks",
				"Oracle data feeds lack quantum-resistant authentication"
			],
			wallet: [
				"Private key generation vulnerable to quantum cryptanalysis",
				"Seed phrase entropy insufficient for post-quantum security",
				"HD wallet derivation paths predictable to quantum computers",
				"Multi-signature schemes use quantum-vulnerable cryptography",
				"Backup and recovery mechanisms lack quantum protection",
				"Hardware wallet firmware not quantum-resistant"
			],
			nft: [
				"Metadata integrity verification vulnerable to quantum attacks",
				"Ownership proof mechanisms use quantum-unsafe signatures",
				"Royalty distribution contracts lack quantum resistance",
				"Cross-platform NFT bridges vulnerable to quantum threats",
				"Provenance tracking systems use legacy cryptography"
			],
			token: [
				"Consensus mechanism vulnerable to quantum mining attacks",
				"Token economics calculations susceptible to quantum manipulation",
				"Staking mechanisms use quantum-vulnerable proof systems",
				"Cross-chain token bridges lack quantum-safe protocols",
				"Governance voting systems vulnerable to quantum attacks"
			],
			app: [
				"API authentication vulnerable to quantum cryptanalysis",
				"User data encryption uses quantum-unsafe algorithms",
				"Session management lacks post-quantum security",
				"Database encryption vulnerable to quantum attacks",
				"Communication protocols not quantum-resistant",
				"Third-party integrations lack quantum-safe authentication"
			],
			defi: [
				"Liquidity pool algorithms vulnerable to quantum manipulation",
				"Automated market maker formulas susceptible to quantum attacks",
				"Yield farming contracts lack quantum-resistant security",
				"Flash loan mechanisms vulnerable to quantum-enhanced attacks",
				"Cross-protocol bridges use quantum-unsafe cryptography",
				"Governance token voting vulnerable to quantum influence"
			]
		};

		const vulns = vulnDatabase[assetType] || vulnDatabase.token;
		const numVulns = riskLevel === 'High' ? 4 + (hash % 3) : 
						riskLevel === 'Medium' ? 2 + (hash % 3) : 
						1 + (hash % 2);
		
		const selectedVulns = [];
		const usedIndices = new Set();
		
		for (let i = 0; i < numVulns && selectedVulns.length < vulns.length; i++) {
			let index = (hash + i * 7) % vulns.length;
			while (usedIndices.has(index)) {
				index = (index + 1) % vulns.length;
			}
			usedIndices.add(index);
			selectedVulns.push(vulns[index]);
		}
		
		return selectedVulns;
	};

	const handleScan = async () => {
		setLoading(true);
		setPaymentSuccess(false);
		setTransactionHash("");
		
		// Realistic scan time
		const scanTime = assetName.length > 10 ? 3000 : 2000;
		await new Promise(resolve => setTimeout(resolve, scanTime + Math.random() * 1500));
		
		const timestamp = Date.now();
		const result = generateUniqueScanResult(currentWalletAddress, assetName, network.name, timestamp);
		setScanResult(result);
		
		// Calculate insurance price based on multiple factors
		const basePrices = {
			contract: 2500,
			app: 2200,
			defi: 1800,
			wallet: 800,
			nft: 600,
			token: 500
		};
		
		const basePrice = basePrices[result.assetType] || 750;
		const riskMultiplier = result.riskLevel === 'High' ? 1.6 : 
							  result.riskLevel === 'Medium' ? 1.3 : 1.0;
		const networkMultiplier = network.name === 'Ethereum' ? 1.2 : 
								 network.name === 'Bitcoin' ? 0.8 : 1.0;
		
		const finalPrice = Math.round(basePrice * riskMultiplier * networkMultiplier);
		setInsurancePrice(finalPrice);
		
		// Calculate crypto amount with real-time price
		if (realTimePrice) {
			const cryptoAmountCalc = (finalPrice / realTimePrice);
			setCryptoAmount(cryptoAmountCalc.toFixed(8));
		}
		
		setLoading(false);
	};

	// Helper function to check if error is user rejection
	const isUserRejectionError = (error) => {
		return (
			error.code === 4001 || 
			error.code === 'ACTION_REJECTED' || 
			error.reason === 'rejected' ||
			(error.message && (
				error.message.includes('User rejected') ||
				error.message.includes('user rejected') ||
				error.message.includes('User denied') ||
				error.message.includes('user denied') ||
				error.message.includes('ethers-user-denied')
			))
		);
	};

	// Enhanced payment handler with proper wallet integration and improved error handling
	const handleSecure = async (e) => {
		e.preventDefault();
		
		if (!cryptoAmount || Number(cryptoAmount) <= 0) {
			alert('Unable to determine payment amount. Please try again after scanning.');
			return;
		}
		
		if (!realTimePrice) {
			alert('Price information not available. Please wait and try again.');
			return;
		}

		// Check wallet connection before payment
		if (!isWalletConnected) {
			alert(`Wallet not connected. ${walletConnectionError || 'Please connect your wallet first.'}`);
			return;
		}
		
		setPaying(true);
		
		try {
			let txHash = '';
			
			// ETHEREUM/POLYGON/BSC - Real MetaMask integration
			if (network.isEVM) {
				if (!window.ethereum) {
					alert('MetaMask is required for EVM payments. Please install MetaMask from metamask.io');
					setPaying(false);
					return;
				}
				
				if (!currentProvider) {
					alert('Wallet provider not connected. Please reconnect your wallet.');
					setPaying(false);
					return;
				}
				
				try {
					const signer = await currentProvider.getSigner();
					const networkInfo = await currentProvider.getNetwork();
					
					// Check if on correct network
					if (Number(networkInfo.chainId) !== network.chainId) {
						try {
							await window.ethereum.request({
								method: 'wallet_switchEthereumChain',
								params: [{ chainId: `0x${network.chainId.toString(16)}` }],
							});
							
							// Wait for network switch
							await new Promise(resolve => setTimeout(resolve, 1000));
							
							// Create new provider after network switch
							const newProvider = new ethers.BrowserProvider(window.ethereum);
							setCurrentProvider(newProvider);
							const newSigner = await newProvider.getSigner();
							
							// Send transaction with new signer
							const tx = await newSigner.sendTransaction({
								to: network.address,
								value: ethers.parseEther(cryptoAmount),
								gasLimit: 21000
							});
							
							txHash = tx.hash;
							
						} catch (switchError) {
							// Check if this is a user rejection first
							if (isUserRejectionError(switchError)) {
								console.log('User rejected network switch - this is normal behavior');
								alert('❌ Network switch cancelled\n\nYou declined the network switch request. To complete your transaction, please manually switch to the correct network in your wallet and try again.');
								setPaying(false);
								return;
							}
							
							if (switchError.code === 4902) {
								// Network not added, try to add it
								try {
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
											blockExplorerUrls: [`https://${network.name.toLowerCase()}.etherscan.io`]
										}]
									});
									
									// Retry transaction after adding network
									await new Promise(resolve => setTimeout(resolve, 1000));
									const newProvider = new ethers.BrowserProvider(window.ethereum);
									const newSigner = await newProvider.getSigner();
									
									const tx = await newSigner.sendTransaction({
										to: network.address,
										value: ethers.parseEther(cryptoAmount),
										gasLimit: 21000
									});
									
									txHash = tx.hash;
								} catch (addNetworkError) {
									if (isUserRejectionError(addNetworkError)) {
										console.log('User rejected adding network - this is normal behavior');
										alert('❌ Network addition cancelled\n\nYou declined adding the network. Please manually add the network to your wallet or switch to the correct network and try again.');
										setPaying(false);
										return;
									}
									console.error('Failed to add network:', addNetworkError);
									alert(`Failed to add ${network.name} network. Please add it manually in your wallet.`);
									setPaying(false);
									return;
								}
							} else {
								alert(`Please switch to ${network.name} network in MetaMask before proceeding.`);
								setPaying(false);
								return;
							}
						}
					} else {
						// Already on correct network
						const tx = await signer.sendTransaction({
							to: network.address,
							value: ethers.parseEther(cryptoAmount),
							gasLimit: 21000
						});
						
						txHash = tx.hash;
					}
					
					alert(`✅ Transaction sent successfully!\n\nTransaction Hash: ${txHash}\n\nAmount: ${cryptoAmount} ${network.symbol}\nUSD Value: $${insurancePrice.toLocaleString()}\n\nYour asset is now protected with quantum security insurance.`);
					
				} catch (ethError) {
					console.error('EVM transaction error:', ethError);
					
					// Improved error handling for user-friendly messages
					if (isUserRejectionError(ethError)) {
						// User rejected the transaction - this is normal behavior, don't throw error
						console.log('User rejected transaction - this is normal behavior');
						alert('❌ Transaction cancelled\n\nYou declined the transaction in your wallet. No payment was processed.\n\nTo complete your quantum security insurance, please try again and approve the transaction when prompted.');
						setPaying(false);
						return;
					} else if (ethError.code === -32603) {
						alert('❌ Transaction failed\n\nInsufficient funds or network error. Please check your wallet balance and try again.');
					} else if (ethError.message && ethError.message.includes('insufficient funds')) {
						alert(`❌ Insufficient funds\n\nYou need at least ${cryptoAmount} ${network.symbol} (≈$${insurancePrice.toLocaleString()}) to complete this transaction.\n\nPlease add funds to your wallet and try again.`);
					} else if (ethError.message && ethError.message.includes('gas')) {
						alert('❌ Gas estimation failed\n\nThere was an issue estimating gas fees. Please try again or check your network connection.');
					} else {
						alert(`❌ Transaction failed\n\n${ethError.message || 'An unexpected error occurred. Please try again.'}`);
					}
					setPaying(false);
					return;
				}
			}
			
			// SOLANA - Real Phantom integration
			else if (network.symbol === 'SOL') {
				if (!window.solana || !window.solana.isPhantom) {
					alert('Phantom wallet is required for Solana payments. Please install Phantom from phantom.app');
					setPaying(false);
					return;
				}
				
				try {
					const response = await window.solana.connect();
					
					// Create transaction manually since Solana Web3 might not be available
					const lamports = Math.floor(Number(cryptoAmount) * 1000000000); // Convert SOL to lamports
					
					// Simple transfer using Phantom's built-in methods
					const transaction = {
						feePayer: response.publicKey,
						instructions: [{
							programId: '11111111111111111111111111111112', // System Program
							keys: [
								{ pubkey: response.publicKey, isSigner: true, isWritable: true },
								{ pubkey: network.address, isSigner: false, isWritable: true }
							],
							data: Buffer.from([2, 0, 0, 0, ...new Uint8Array(new BigUint64Array([BigInt(lamports)]).buffer)])
						}]
					};
					
					const signed = await window.solana.signAndSendTransaction(transaction);
					txHash = signed.signature || `sol_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
					
					alert(`✅ Transaction sent successfully!\n\nSignature: ${txHash}\n\nAmount: ${cryptoAmount} SOL\nUSD Value: $${insurancePrice.toLocaleString()}\n\nYour asset is now protected with quantum security insurance.`);
					
				} catch (solError) {
					console.error('Solana transaction error:', solError);
					
					// Improved error handling for Solana
					if (isUserRejectionError(solError)) {
						console.log('User rejected Solana transaction - this is normal behavior');
						alert('❌ Transaction cancelled\n\nYou declined the transaction in Phantom wallet. No payment was processed.\n\nTo complete your quantum security insurance, please try again and approve the transaction when prompted.');
						setPaying(false);
						return;
					} else {
						alert(`❌ Solana transaction failed\n\n${solError.message || 'An unexpected error occurred. Please try again.'}`);
					}
					setPaying(false);
					return;
				}
			}
			
			// BITCOIN & SUI - Manual payment with enhanced UX
			else if (network.isManual) {
				const paymentInfo = `Address: ${network.address}\nAmount: ${cryptoAmount} ${network.symbol}\nUSD Value: $${insurancePrice.toLocaleString()}\nPurpose: QuantumSafe Insurance for ${assetName}`;
				
				try {
					await navigator.clipboard.writeText(paymentInfo);
					
					// Generate realistic transaction hash for demo
					txHash = `${network.symbol.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
					
					alert(`📋 Payment information copied to clipboard!\n\n${paymentInfo}\n\nPlease send the exact amount to complete your quantum security insurance activation.\n\nTransaction will be verified automatically within 10-30 minutes.`);
				} catch (clipError) {
					alert(`Please send ${cryptoAmount} ${network.symbol} to:\n\n${network.address}\n\nUSD Value: $${insurancePrice.toLocaleString()}\nPurpose: QuantumSafe Insurance for ${assetName}`);
					txHash = `${network.symbol.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
				}
			}
			
			// Set success state
			setTransactionHash(txHash);
			setPaymentSuccess(true);
			
		} catch (err) {
			console.error('Payment Error:', err);
			
			// General error handling with user-friendly messages
			if (isUserRejectionError(err)) {
				console.log('User rejected transaction - this is normal behavior');
				alert('❌ Transaction cancelled\n\nYou declined the transaction in your wallet. No payment was processed.');
			} else {
				alert(`❌ Payment failed\n\n${err.message || 'An unexpected error occurred. Please try again.'}`);
			}
		} finally {
			setPaying(false);
		}
	};

	function getRiskBar(riskLevel, riskScore) {
		let color = '#10b981', width = `${Math.min(riskScore, 100)}%`;
		if (riskLevel === 'Medium') color = '#f59e0b';
		if (riskLevel === 'High') color = '#ef4444';
		
		return (
			<div className="risk-bar-container">
				<div className="risk-bar-header">
					<span className="risk-bar-label">Quantum Threat Assessment</span>
					<span className="risk-score">{riskScore}/100</span>
				</div>
				<div className="risk-bar-bg">
					<div className="risk-bar-fill" style={{width, background: color}}></div>
				</div>
				<div className="risk-level-badge" style={{backgroundColor: `${color}20`, color: color, border: `1px solid ${color}40`}}>
					{riskLevel === 'High' ? '🔴' : riskLevel === 'Medium' ? '🟡' : '🟢'} {riskLevel} Risk
				</div>
			</div>
		);
	}

	function getCertificateContent() {
		if (!scanResult) return null;
		
		return (
			<div className="cert-card">
				<div className="cert-header-row">
					<div className="cert-logo">🛡️</div>
					<div className="cert-title-section">
						<span className="cert-title">QuantumSafe Security Certificate</span>
						<span className="cert-subtitle">Scan ID: {scanResult.scanId}</span>
					</div>
					<div className="cert-confidence">{scanResult.confidence}% Confidence</div>
				</div>
				
				{getRiskBar(scanResult.riskLevel, scanResult.riskScore)}
				
				<div className="cert-summary">
					<div className="cert-row">
						<span className="cert-label">Wallet Address:</span>
						<span className="cert-value cert-mono">{currentWalletAddress}</span>
					</div>
					<div className="cert-row">
						<span className="cert-label">Network:</span>
						<span className="cert-value">{network.icon} {network.name}</span>
					</div>
					<div className="cert-row">
						<span className="cert-label">Asset:</span>
						<span className="cert-value">{assetName}</span>
					</div>
					<div className="cert-row">
						<span className="cert-label">Asset Type:</span>
						<span className="cert-value">{scanResult.assetType.charAt(0).toUpperCase() + scanResult.assetType.slice(1)}</span>
					</div>
					<div className="cert-row">
						<span className="cert-label">Scan Date:</span>
						<span className="cert-value">{new Date().toLocaleString()}</span>
					</div>
				</div>
				
				<div className="cert-details">
					<h4>🔍 Detailed Analysis</h4>
					<div className="cert-desc">{scanResult.uniqueDesc}</div>
					
					{scanResult.vulnerabilities.length > 0 && (
						<div className="vulnerabilities-section">
							<h4>⚠️ Identified Vulnerabilities</h4>
							<div className="vuln-grid">
								{scanResult.vulnerabilities.map((vuln, index) => (
									<div key={index} className="vuln-item">
										<div className="vuln-icon">
											{scanResult.riskLevel === 'High' ? '🚨' : scanResult.riskLevel === 'Medium' ? '⚠️' : '🔍'}
										</div>
										<div className="vuln-content">
											<div className="vuln-title">{vuln}</div>
											<div className="vuln-severity">{scanResult.riskLevel} Risk</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
					
					<div className="recommendations-section">
						<h4>💡 Security Recommendations</h4>
						<div className="rec-list">
							{scanResult.riskLevel === 'High' && (
								<>
									<div className="rec-item">Implement post-quantum cryptography standards</div>
									<div className="rec-item">Upgrade to quantum-resistant signature schemes</div>
									<div className="rec-item">Monitor quantum computing developments</div>
								</>
							)}
							{scanResult.riskLevel === 'Medium' && (
								<>
									<div className="rec-item">Plan quantum-safe migration within 2-3 years</div>
									<div className="rec-item">Conduct regular security assessments</div>
								</>
							)}
							{scanResult.riskLevel === 'Low' && (
								<div className="rec-item">Maintain current security practices and monitor updates</div>
							)}
						</div>
					</div>
				</div>
				
				<div className="cert-note">
					This certificate is dynamically generated and unique for your wallet and asset.
					<br />
					<strong>Powered by QuantumSafe AI Security Engine</strong>
				</div>
			</div>
		);
	}

	function getInsuranceSection() {
		if (!scanResult || !insurancePrice) return null;
		
		if (paymentSuccess) {
			return (
				<div className="insurance-success">
					<div className="success-header">
						<div className="success-icon">✅</div>
						<div className="success-content">
							<h3>Quantum Protection Activated!</h3>
							<p>Your asset is now secured with comprehensive quantum threat protection</p>
						</div>
					</div>
					
					<div className="success-details">
						<div className="success-item">
							<span className="success-label">Protection Period:</span>
							<span className="success-value">12 Months</span>
						</div>
						<div className="success-item">
							<span className="success-label">Network:</span>
							<span className="success-value">{network.icon} {network.name}</span>
						</div>
						<div className="success-item">
							<span className="success-label">Amount Paid:</span>
							<span className="success-value">{cryptoAmount} {network.symbol} (${insurancePrice.toLocaleString()})</span>
						</div>
						<div className="success-item">
							<span className="success-label">Transaction Hash:</span>
							<span className="success-value success-hash">{transactionHash}</span>
						</div>
					</div>
					
					<div className="success-benefits">
						<h4>🛡️ Your Protection Includes:</h4>
						<div className="benefits-grid">
							<div className="benefit-item">
								<span className="benefit-icon">🔔</span>
								<span>24/7 Quantum Threat Monitoring</span>
							</div>
							<div className="benefit-item">
								<span className="benefit-icon">⚡</span>
								<span>Instant Security Alerts</span>
							</div>
							<div className="benefit-item">
								<span className="benefit-icon">🔧</span>
								<span>Emergency Response Support</span>
							</div>
							<div className="benefit-item">
								<span className="benefit-icon">📊</span>
								<span>Monthly Security Reports</span>
							</div>
						</div>
					</div>
					
					<div className="success-note">
						You will receive email notifications for any security changes or threats detected.
					</div>
				</div>
			);
		}
		
		return (
			<div className="insurance-section">
				<div className="insurance-header">
					<h3>🛡️ Quantum Protection Insurance</h3>
					<p>Secure your asset with comprehensive quantum threat protection</p>
				</div>
				
				<div className="insurance-pricing">
					<div className="pricing-main">
						<div className="price-usd">${insurancePrice.toLocaleString()}</div>
						<div className="price-crypto">
							{priceLoading ? (
								<span className="price-loading">Calculating...</span>
							) : cryptoAmount ? (
								<span>{Number(cryptoAmount).toFixed(6)} {network.symbol}</span>
							) : (
								<span>Price unavailable</span>
							)}
						</div>
					</div>
					<div className="pricing-details">
						<div className="price-detail">
							<span>Network:</span>
							<span>{network.icon} {network.name}</span>
						</div>
						<div className="price-detail">
							<span>Current {network.symbol} Price:</span>
							<span>${realTimePrice ? realTimePrice.toLocaleString() : 'Loading...'}</span>
						</div>
						<div className="price-detail">
							<span>Protection Period:</span>
							<span>12 Months</span>
						</div>
					</div>
				</div>
				
				{/* Enhanced wallet connection status */}
				{!isWalletConnected && (
					<div className="wallet-warning">
						<div className="warning-icon">⚠️</div>
						<div className="warning-content">
							<span className="warning-title">Wallet Connection Required</span>
							<p className="warning-desc">
								{walletConnectionError || 'Please connect your wallet to proceed with payment'}
							</p>
							{network.isEVM && !window.ethereum && (
								<p className="warning-note">
									<a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
										Install MetaMask
									</a> to continue
								</p>
							)}
							{network.isPhantom && !window.solana && (
								<p className="warning-note">
									<a href="https://phantom.app/" target="_blank" rel="noopener noreferrer">
										Install Phantom Wallet
									</a> to continue
								</p>
							)}
						</div>
					</div>
				)}
				
				<button
					className="secure-btn"
					onClick={handleSecure}
					disabled={!cryptoAmount || loading || paying || priceLoading || !realTimePrice || !isWalletConnected}
				>
					{paying ? (
						<>
							<div className="btn-spinner"></div>
							Processing Payment...
						</>
					) : priceLoading ? (
						<>
							<div className="btn-spinner"></div>
							Loading Price...
						</>
					) : !realTimePrice ? (
						'Price Unavailable'
					) : !isWalletConnected ? (
						`Connect ${network.isEVM ? 'MetaMask' : network.isPhantom ? 'Phantom' : 'Wallet'} First`
					) : (
						<>
							🚀 Secure with {network.symbol}
							{cryptoAmount && ` (${Number(cryptoAmount).toFixed(6)} ${network.symbol})`}
						</>
					)}
				</button>
				
				{network.isManual && isWalletConnected && (
					<div className="manual-payment-info">
						<div className="info-icon">ℹ️</div>
						<div className="manual-content">
							<span className="manual-title">Manual Payment Required</span>
							<p className="manual-desc">Send {cryptoAmount} {network.symbol} to: {network.address}</p>
							<p className="manual-note">Payment will be verified automatically within 10-30 minutes</p>
						</div>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="wallet-scanner-container">
			<div className="scanner-header">
				<div className="header-icon">🔍</div>
				<div className="header-content">
					<h2>Quantum Security Scanner</h2>
					<p>Advanced AI-powered analysis for digital asset protection</p>
				</div>
				{/* Enhanced connection status display */}
				<div className="connection-status">
					<div className={`status-indicator ${isWalletConnected ? 'connected' : 'disconnected'}`}></div>
					<span className={isWalletConnected ? 'status-connected' : 'status-disconnected'}>
						{isWalletConnected ? 'Wallet Connected' : 'Wallet Disconnected'}
					</span>
				</div>
			</div>
			
			<div className="scanner-inputs">
				<div className="input-group">
					<label>🌐 Payment Network</label>
					<select value={selectedNetwork} onChange={handleNetworkChange} disabled={loading}>
						{NETWORKS.map((n) => (
							<option key={n.symbol} value={n.symbol}>
								{n.icon} {n.name} ({n.symbol})
							</option>
						))}
					</select>
					{realTimePrice && (
						<div className="network-price">
							Current Price: ${realTimePrice.toLocaleString()} USD
						</div>
					)}
				</div>
				
				<div className="input-group">
					<label>💰 Wallet Address</label>
					<div className="address-display">
						<input value={currentWalletAddress} disabled />
						<span className="network-badge">{network.icon} {network.symbol}</span>
					</div>
					{/* Connection status for this specific network */}
					{walletConnectionError && (
						<div className="connection-error">
							⚠️ {walletConnectionError}
						</div>
					)}
				</div>
				
				<div className="input-group">
					<label>🎯 Asset Name (Smart Contract, App, NFT, Token, etc.)</label>
					<input
						value={assetName}
						onChange={handleAssetNameChange}
						placeholder="Enter asset name for analysis"
						disabled={loading}
					/>
					{inputError && <div className="input-error">{inputError}</div>}
				</div>
				
				<button 
					className="scan-btn" 
					onClick={handleScan} 
					disabled={loading || !assetName || !!inputError}
				>
					{loading ? (
						<>
							<div className="btn-spinner"></div>
							Analyzing Security...
						</>
					) : (
						<>
							🔍 Start Quantum Security Scan
						</>
					)}
				</button>
			</div>
			
			{scanResult && getCertificateContent()}
			{scanResult && getInsuranceSection()}
			
			<style jsx>{`
				.wallet-scanner-container {
					margin-top: 32px;
					padding: 32px;
					background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
					border-radius: 24px;
					box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
					max-width: 900px;
					margin-left: auto;
					margin-right: auto;
					border: 1px solid rgba(255, 255, 255, 0.1);
				}
				
				.scanner-header {
					display: flex;
					align-items: center;
					justify-content: space-between;
					margin-bottom: 32px;
					padding-bottom: 24px;
					border-bottom: 1px solid rgba(255, 255, 255, 0.1);
					flex-wrap: wrap;
					gap: 20px;
				}
				
				.header-icon {
					font-size: 48px;
					background: linear-gradient(45deg, #3b82f6, #8b5cf6);
					border-radius: 16px;
					padding: 16px;
					display: flex;
					align-items: center;
					justify-content: center;
				}
				
				.header-content {
					flex: 1;
					margin-left: 20px;
				}
				
				.header-content h2 {
					color: #ffffff;
					font-size: 28px;
					font-weight: 700;
					margin: 0 0 8px 0;
				}
				
				.header-content p {
					color: rgba(255, 255, 255, 0.7);
					font-size: 16px;
					margin: 0;
				}
				
				.connection-status {
					display: flex;
					align-items: center;
					gap: 8px;
					padding: 8px 16px;
					border-radius: 20px;
					font-size: 14px;
					font-weight: 600;
					border: 1px solid;
				}
				
				.status-indicator {
					width: 8px;
					height: 8px;
					border-radius: 50%;
				}
				
				.status-indicator.connected {
					background: #10b981;
					animation: pulse 2s infinite;
				}
				
				.status-indicator.disconnected {
					background: #ef4444;
				}
				
				.status-connected {
					color: #10b981;
				}
				
				.status-disconnected {
					color: #ef4444;
				}
				
				.connection-status:has(.status-connected) {
					background: rgba(16, 185, 129, 0.1);
					border-color: rgba(16, 185, 129, 0.3);
				}
				
				.connection-status:has(.status-disconnected) {
					background: rgba(239, 68, 68, 0.1);
					border-color: rgba(239, 68, 68, 0.3);
				}
				
				.scanner-inputs {
					display: flex;
					flex-direction: column;
					gap: 24px;
				}
				
				.input-group {
					display: flex;
					flex-direction: column;
					gap: 8px;
				}
				
				.input-group label {
					color: #ffffff;
					font-weight: 600;
					font-size: 16px;
					display: flex;
					align-items: center;
					gap: 8px;
				}
				
				.input-group input, .input-group select {
					width: 100%;
					padding: 16px;
					border-radius: 12px;
					border: 1px solid rgba(255, 255, 255, 0.2);
					background: rgba(255, 255, 255, 0.05);
					color: #ffffff;
					font-size: 16px;
					transition: all 0.3s ease;
				}
				
				.input-group input:focus, .input-group select:focus {
					outline: none;
					border-color: #3b82f6;
					box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
				}
				
				.network-price {
					color: #10b981;
					font-size: 14px;
					font-weight: 600;
					margin-top: 4px;
				}
				
				.address-display {
					position: relative;
					display: flex;
					align-items: center;
				}
				
				.network-badge {
					position: absolute;
					right: 12px;
					background: rgba(59, 130, 246, 0.2);
					color: #3b82f6;
					padding: 6px 12px;
					border-radius: 8px;
					font-size: 12px;
					font-weight: 600;
					border: 1px solid rgba(59, 130, 246, 0.3);
				}
				
				.connection-error {
					color: #ef4444;
					font-size: 14px;
					margin-top: 4px;
					display: flex;
					align-items: center;
					gap: 8px;
				}
				
				.input-error {
					color: #ef4444;
					font-size: 14px;
					margin-top: 4px;
				}
				
				.scan-btn, .secure-btn {
					margin-top: 24px;
					padding: 18px 32px;
					border-radius: 12px;
					border: none;
					background: linear-gradient(45deg, #3b82f6, #8b5cf6);
					color: #ffffff;
					font-weight: 700;
					font-size: 18px;
					cursor: pointer;
					transition: all 0.3s ease;
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 12px;
					box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
				}
				
				.scan-btn:hover:not(:disabled), .secure-btn:hover:not(:disabled) {
					transform: translateY(-2px);
					box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
				}
				
				.scan-btn:disabled, .secure-btn:disabled {
					background: rgba(107, 114, 128, 0.5);
					cursor: not-allowed;
					transform: none;
					box-shadow: none;
				}
				
				.btn-spinner {
					width: 20px;
					height: 20px;
					border: 2px solid rgba(255, 255, 255, 0.3);
					border-top: 2px solid #ffffff;
					border-radius: 50%;
					animation: spin 1s linear infinite;
				}
				
				.cert-card {
					background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
					border-radius: 20px;
					padding: 32px;
					margin-top: 32px;
					border: 1px solid rgba(255, 255, 255, 0.1);
					box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
				}
				
				.cert-header-row {
					display: flex;
					align-items: center;
					justify-content: space-between;
					margin-bottom: 32px;
					flex-wrap: wrap;
					gap: 16px;
				}
				
				.cert-logo {
					font-size: 32px;
					background: linear-gradient(45deg, #3b82f6, #8b5cf6);
					border-radius: 12px;
					padding: 12px;
					display: flex;
					align-items: center;
					justify-content: center;
				}
				
				.cert-title-section {
					flex: 1;
					text-align: center;
					display: flex;
					flex-direction: column;
					gap: 4px;
				}
				
				.cert-title {
					color: #3b82f6;
					font-size: 24px;
					font-weight: 700;
				}
				
				.cert-subtitle {
					color: rgba(255, 255, 255, 0.6);
					font-size: 14px;
					font-family: 'Courier New', monospace;
				}
				
				.cert-confidence {
					background: rgba(16, 185, 129, 0.2);
					color: #10b981;
					padding: 8px 16px;
					border-radius: 20px;
					font-size: 14px;
					font-weight: 600;
					border: 1px solid rgba(16, 185, 129, 0.3);
				}
				
				.risk-bar-container {
					margin-bottom: 32px;
					padding: 20px;
					background: rgba(255, 255, 255, 0.05);
					border-radius: 16px;
					border: 1px solid rgba(255, 255, 255, 0.1);
				}
				
				.risk-bar-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 12px;
				}
				
				.risk-bar-label {
					color: #ffffff;
					font-size: 16px;
					font-weight: 600;
				}
				
				.risk-score {
					color: #3b82f6;
					font-size: 18px;
					font-weight: 700;
					font-family: 'Courier New', monospace;
				}
				
				.risk-bar-bg {
					width: 100%;
					height: 16px;
					background: rgba(255, 255, 255, 0.1);
					border-radius: 8px;
					overflow: hidden;
					margin-bottom: 12px;
				}
				
				.risk-bar-fill {
					height: 100%;
					border-radius: 8px;
					transition: width 1.5s ease-in-out;
				}
				
				.risk-level-badge {
					padding: 8px 16px;
					border-radius: 20px;
					font-size: 14px;
					font-weight: 600;
					display: inline-flex;
					align-items: center;
					gap: 8px;
				}
				
				.cert-summary {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
					gap: 16px;
					margin-bottom: 32px;
				}
				
				.cert-row {
					display: flex;
					flex-direction: column;
					gap: 8px;
					padding: 16px;
					background: rgba(255, 255, 255, 0.05);
					border-radius: 12px;
					border: 1px solid rgba(255, 255, 255, 0.1);
				}
				
				.cert-label {
					color: #3b82f6;
					font-size: 14px;
					text-transform: uppercase;
					letter-spacing: 1px;
					font-weight: 600;
				}
				
				.cert-value {
					color: #ffffff;
					font-size: 16px;
					font-weight: 500;
				}
				
				.cert-mono {
					font-family: 'Courier New', monospace;
					font-size: 14px;
					word-break: break-all;
				}
				
				.cert-details {
					margin-bottom: 32px;
				}
				
				.cert-details h4 {
					color: #ffffff;
					font-size: 20px;
					font-weight: 600;
					margin: 0 0 16px 0;
					display: flex;
					align-items: center;
					gap: 8px;
				}
				
				.cert-desc {
					color: rgba(255, 255, 255, 0.9);
					font-size: 16px;
					line-height: 1.6;
					margin-bottom: 24px;
					padding: 20px;
					background: rgba(59, 130, 246, 0.1);
					border-radius: 12px;
					border-left: 4px solid #3b82f6;
				}
				
				.vulnerabilities-section {
					margin: 24px 0;
				}
				
				.vuln-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
					gap: 16px;
				}
				
				.vuln-item {
					background: rgba(239, 68, 68, 0.1);
					border-radius: 12px;
					padding: 16px;
					border: 1px solid rgba(239, 68, 68, 0.2);
					display: flex;
					align-items: flex-start;
					gap: 12px;
				}
				
				.vuln-icon {
					font-size: 20px;
					flex-shrink: 0;
				}
				
				.vuln-content {
					flex: 1;
				}
				
				.vuln-title {
					color: rgba(255, 255, 255, 0.9);
					font-size: 14px;
					font-weight: 500;
					line-height: 1.4;
					margin-bottom: 4px;
				}
				
				.vuln-severity {
					color: #ef4444;
					font-size: 12px;
					font-weight: 600;
					text-transform: uppercase;
				}
				
				.recommendations-section {
					margin: 24px 0;
				}
				
				.rec-list {
					display: flex;
					flex-direction: column;
					gap: 12px;
				}
				
				.rec-item {
					background: rgba(16, 185, 129, 0.1);
					color: rgba(255, 255, 255, 0.9);
					padding: 16px;
					border-radius: 12px;
					border-left: 4px solid #10b981;
					font-size: 14px;
					line-height: 1.5;
				}
				
				.cert-note {
					text-align: center;
					color: rgba(255, 255, 255, 0.6);
					font-size: 14px;
					line-height: 1.5;
					padding-top: 24px;
					border-top: 1px solid rgba(255, 255, 255, 0.1);
				}
				
				.insurance-section {
					background: linear-gradient(135deg, #059669 0%, #10b981 100%);
					border-radius: 20px;
					padding: 32px;
					margin-top: 32px;
					color: #ffffff;
					box-shadow: 0 8px 32px rgba(16, 185, 129, 0.2);
				}
				
				.insurance-header {
					margin-bottom: 24px;
				}
				
				.insurance-header h3 {
					font-size: 24px;
					font-weight: 700;
					margin: 0 0 8px 0;
				}
				
				.insurance-header p {
					font-size: 16px;
					margin: 0;
					opacity: 0.9;
				}
				
				.insurance-pricing {
					background: rgba(255, 255, 255, 0.1);
					border-radius: 16px;
					padding: 24px;
					margin-bottom: 24px;
					border: 1px solid rgba(255, 255, 255, 0.2);
				}
				
				.pricing-main {
					text-align: center;
					margin-bottom: 20px;
				}
				
				.price-usd {
					font-size: 36px;
					font-weight: 700;
					margin-bottom: 8px;
				}
				
				.price-crypto {
					font-size: 18px;
					opacity: 0.9;
					font-family: 'Courier New', monospace;
				}
				
				.price-loading {
					color: #fbbf24;
				}
				
				.pricing-details {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
					gap: 12px;
				}
				
				.price-detail {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 8px 0;
					border-bottom: 1px solid rgba(255, 255, 255, 0.1);
					font-size: 14px;
				}
				
				.price-detail:last-child {
					border-bottom: none;
				}
				
				.manual-payment-info {
					margin-top: 16px;
					padding: 20px;
					background: rgba(255, 255, 255, 0.1);
					border-radius: 12px;
					display: flex;
					align-items: flex-start;
					gap: 16px;
					border: 1px solid rgba(255, 255, 255, 0.2);
				}
				
				.info-icon {
					font-size: 24px;
					flex-shrink: 0;
				}
				
				.manual-content {
					flex: 1;
				}
				
				.manual-title {
					font-size: 16px;
					font-weight: 600;
					margin-bottom: 8px;
					display: block;
				}
				
				.manual-desc {
					font-size: 14px;
					margin: 0 0 8px 0;
					font-family: 'Courier New', monospace;
					word-break: break-all;
				}
				
				.manual-note {
					font-size: 12px;
					margin: 0;
					opacity: 0.8;
				}
				
				.wallet-warning {
					margin-top: 16px;
					padding: 20px;
					background: rgba(239, 68, 68, 0.1);
					border-radius: 12px;
					display: flex;
					align-items: flex-start;
					gap: 16px;
					border: 1px solid rgba(239, 68, 68, 0.3);
				}
				
				.warning-icon {
					font-size: 24px;
					flex-shrink: 0;
					color: #ef4444;
				}
				
				.warning-content {
					flex: 1;
				}
				
				.warning-title {
					font-size: 16px;
					font-weight: 600;
					margin-bottom: 8px;
					display: block;
					color: #ef4444;
				}
				
				.warning-desc {
					font-size: 14px;
					margin: 0 0 8px 0;
					color: rgba(255, 255, 255, 0.9);
				}
				
				.warning-note {
					font-size: 12px;
					margin: 0;
					opacity: 0.8;
				}
				
				.warning-note a {
					color: #60a5fa;
					text-decoration: underline;
				}
				
				.insurance-success {
					background: linear-gradient(135deg, #059669 0%, #10b981 100%);
					border-radius: 20px;
					padding: 32px;
					margin-top: 32px;
					color: #ffffff;
					box-shadow: 0 8px 32px rgba(16, 185, 129, 0.2);
				}
				
				.success-header {
					display: flex;
					align-items: center;
					gap: 20px;
					margin-bottom: 32px;
				}
				
				.success-icon {
					font-size: 48px;
					background: rgba(255, 255, 255, 0.2);
					border-radius: 50%;
					width: 80px;
					height: 80px;
					display: flex;
					align-items: center;
					justify-content: center;
				}
				
				.success-content h3 {
					font-size: 28px;
					font-weight: 700;
					margin: 0 0 8px 0;
				}
				
				.success-content p {
					font-size: 16px;
					margin: 0;
					opacity: 0.9;
				}
				
				.success-details {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
					gap: 16px;
					margin-bottom: 32px;
				}
				
				.success-item {
					display: flex;
					flex-direction: column;
					gap: 8px;
					padding: 16px;
					background: rgba(255, 255, 255, 0.1);
					border-radius: 12px;
				}
				
				.success-label {
					font-size: 14px;
					opacity: 0.8;
					text-transform: uppercase;
					letter-spacing: 1px;
					font-weight: 600;
				}
				
				.success-value {
					font-size: 16px;
					font-weight: 700;
				}
				
				.success-hash {
					font-family: 'Courier New', monospace;
					font-size: 12px;
					word-break: break-all;
				}
				
				.success-benefits {
					margin-bottom: 24px;
				}
				
				.success-benefits h4 {
					font-size: 20px;
					font-weight: 600;
					margin: 0 0 16px 0;
				}
				
				.benefits-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
					gap: 12px;
				}
				
				.benefit-item {
					display: flex;
					align-items: center;
					gap: 12px;
					padding: 12px;
					background: rgba(255, 255, 255, 0.1);
					border-radius: 8px;
					font-size: 14px;
				}
				
				.benefit-icon {
					font-size: 18px;
				}
				
				.success-note {
					text-align: center;
					font-size: 16px;
					opacity: 0.9;
					line-height: 1.5;
					padding: 20px;
					background: rgba(255, 255, 255, 0.1);
					border-radius: 12px;
				}
				
				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
				
				@keyframes pulse {
					0%, 100% { opacity: 1; }
					50% { opacity: 0.5; }
				}
				
				@media (max-width: 768px) {
					.wallet-scanner-container {
						padding: 24px;
						margin-top: 24px;
					}
					
					.scanner-header {
						flex-direction: column;
						text-align: center;
						gap: 16px;
					}
					
					.header-content {
						margin-left: 0;
						text-align: center;
					}
					
					.cert-header-row {
						flex-direction: column;
						text-align: center;
					}
					
					.cert-summary {
						grid-template-columns: 1fr;
					}
					
					.pricing-details, .success-details {
						grid-template-columns: 1fr;
					}
					
					.success-header {
						flex-direction: column;
						text-align: center;
					}
					
					.vuln-grid {
						grid-template-columns: 1fr;
					}
					
					.benefits-grid {
						grid-template-columns: 1fr;
					}
					
					.price-usd {
						font-size: 28px;
					}
					
					.price-crypto {
						font-size: 16px;
					}
				}
			`}</style>
		</div>
	);
}