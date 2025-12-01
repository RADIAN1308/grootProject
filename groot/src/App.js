import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import './AppNew.css';
import SupplyChainContract from './contracts/SupplyChain.json';
import EnvironmentalMonitor from './components/EnvironmentalMonitor';

// You'll need to update this with your deployed contract address after migration
const SUPPLY_CHAIN_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '0x2A12257439e660910d5faaEeEA191bE6DcBd3201';

// Use the ABI from the deployed contract
const CONTRACT_ABI = SupplyChainContract.abi;

const PRODUCE_TYPES = ['Fruits', 'Vegetables', 'Grains', 'Dairy', 'Meat', 'Other'];
const STATE_NAMES = ['Harvested', 'Processed', 'Shipped', 'Received', 'Sold'];

function App() {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [contract, setContract] = useState(null);
  const [currentAccount, setCurrentAccount] = useState('');
  const [currentActor, setCurrentActor] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productHistory, setProductHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [retryCount, setRetryCount] = useState(0);

  // Form states
  const [actorForm, setActorForm] = useState({ name: '', location: '', actorType: 'Farmer' });
  const [productForm, setProductForm] = useState({
    name: '', description: '', produceType: 0, quantity: '', 
    price: '', expiryDays: 30, originFarm: ''
  });
  const [transferForm, setTransferForm] = useState({ productId: '', newOwner: '' });
  const [stateForm, setStateForm] = useState({ productId: '', newState: 1, notes: '' });

  useEffect(() => {
    initializeWeb3();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (currentAccount && contract) {
      loadActorData();
      loadProducts();
    }
  }, [currentAccount, contract]); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeWeb3 = async (retryAttempt = 0) => {
    try {
      console.log(`Initializing Web3... (attempt ${retryAttempt + 1})`);
      setConnectionStatus('connecting');
      
      if (window.ethereum) {
        console.log('MetaMask detected');
        const web3Instance = new Web3(window.ethereum);
        
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log('Accounts requested');
        
        // Check network (accept both 1337 and 5777 for Ganache)
        const networkId = await web3Instance.eth.net.getId();
        console.log('Network ID:', networkId);
        
        if (networkId !== 1337 && networkId !== 5777) {
          console.log('Wrong network detected, attempting to switch...');
          try {
            // Try to switch to the correct network (prefer 5777 for Ganache)
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x1695' }], // 5777 in hex
            });
            console.log('Network switched successfully');
          } catch (switchError) {
            // If network doesn't exist, add it
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0x1695', // 5777 in hex
                    chainName: 'Ganache Local',
                    rpcUrls: ['http://127.0.0.1:7545'],
                    nativeCurrency: {
                      name: 'ETH',
                      symbol: 'ETH',
                      decimals: 18
                    }
                  }]
                });
                console.log('Network added and switched');
              } catch (addError) {
                alert('Please manually add Ganache network to MetaMask');
                return;
              }
            } else {
              alert(`Please switch to Ganache network (Chain ID: 5777 or 1337). Current network: ${networkId}`);
              return;
            }
          }
        }
        
        const accounts = await web3Instance.eth.getAccounts();
        console.log('Accounts:', accounts);
        
        if (accounts.length === 0) {
          alert('No accounts found. Please unlock MetaMask.');
          return;
        }
        
        // Test connection to Ganache
        const blockNumber = await web3Instance.eth.getBlockNumber();
        console.log('Current block number:', blockNumber);
        
        const contractInstance = new web3Instance.eth.Contract(CONTRACT_ABI, SUPPLY_CHAIN_ADDRESS);
        console.log('Contract instance created at:', SUPPLY_CHAIN_ADDRESS);
        
        // Test contract connection
        try {
          const totalProducts = await contractInstance.methods.getTotalProducts().call();
          console.log('Contract connected successfully. Total products:', totalProducts);
          console.log('✅ Using contract address:', SUPPLY_CHAIN_ADDRESS);
          console.log('✅ Network ID:', networkId);
        } catch (contractError) {
          console.error('Contract connection failed:', contractError);
          console.log('❌ Contract address:', SUPPLY_CHAIN_ADDRESS);
          console.log('❌ Network ID:', networkId);
          alert('Failed to connect to smart contract. Please check if contracts are deployed to the correct network.');
          return;
        }
        
        setWeb3(web3Instance);
        setAccounts(accounts);
        setContract(contractInstance);
        setCurrentAccount(accounts[0]);
        setConnectionStatus('connected');
        setRetryCount(0);
        
        console.log('Web3 initialization complete');
      } else {
        alert('Please install MetaMask to use this application');
      }
    } catch (error) {
      console.error('Error initializing Web3:', error);
      setConnectionStatus('error');
      
      // Automatic retry for network-related issues
      if (retryAttempt < 3 && (
        error.message.includes('network') ||
        error.message.includes('connection') ||
        error.message.includes('timeout') ||
        error.code === 'NETWORK_ERROR'
      )) {
        console.log(`Retrying connection in 3 seconds... (attempt ${retryAttempt + 1}/3)`);
        setRetryCount(retryAttempt + 1);
        setTimeout(() => {
          initializeWeb3(retryAttempt + 1);
        }, 3000);
      } else {
        console.error('Max retries reached or non-network error');
        // Show user-friendly error message based on error type
        let errorMessage = 'Error connecting to Web3.';
        
        if (error.message.includes('User rejected')) {
          errorMessage = 'MetaMask connection was rejected. Please try again and approve the connection.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check that Ganache is running on port 7545 and MetaMask is connected to the correct network.';
        } else if (error.message.includes('contract')) {
          errorMessage = 'Smart contract connection failed. Please ensure contracts are deployed correctly.';
        } else {
          errorMessage = `Connection error: ${error.message}. Make sure MetaMask is connected and Ganache is running on port 7545.`;
        }
        
        alert(errorMessage);
      }
    }
  };

  const loadActorData = async () => {
    try {
      const actor = await contract.methods.getActor(currentAccount).call();
      if (actor.isActive) {
        setCurrentActor(actor);
      } else {
        setCurrentActor(null);
      }
    } catch (error) {
      console.error('Error loading actor data:', error);
      setCurrentActor(null);
    }
  };

  const switchAccount = async () => {
    try {
      const newAccounts = await web3.eth.getAccounts();
      if (newAccounts.length > 0) {
        // Find next account or first if at end
        const currentIndex = accounts.indexOf(currentAccount);
        const nextIndex = (currentIndex + 1) % newAccounts.length;
        const newAccount = newAccounts[nextIndex];
        
        setCurrentAccount(newAccount);
        setAccounts(newAccounts);
        
        // Load actor data for new account
        const actor = await contract.methods.getActor(newAccount).call();
        if (actor.isActive) {
          setCurrentActor(actor);
        } else {
          setCurrentActor(null);
        }
        
        console.log('Switched to account:', newAccount);
      }
    } catch (error) {
      console.error('Error switching accounts:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const totalProducts = await contract.methods.getTotalProducts().call();
      console.log('Total products:', totalProducts);
      const productsData = [];

      for (let i = 1; i <= totalProducts; i++) {
        try {
          const product = await contract.methods.getProduct(i).call();
          if (product.exists) {
            productsData.push({id: i, ...product});
          }
        } catch (err) {
          console.log('Product', i, 'not found or error:', err.message);
        }
      }

      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const registerActor = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await contract.methods.registerActor(
        actorForm.name,
        actorForm.location,
        actorForm.actorType
      ).send({ from: currentAccount });
      
      alert('Actor registered successfully!');
      setActorForm({ name: '', location: '', actorType: 'Farmer' });
      await loadActorData();
    } catch (error) {
      console.error('Error registering actor:', error);
      alert('Error registering actor: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (e) => {
    e.preventDefault();
    if (!currentActor || currentActor.actorType !== 'Farmer') {
      alert('Only registered farmers can create products');
      return;
    }

    try {
      setLoading(true);
      const expiryDate = Math.floor(Date.now() / 1000) + (productForm.expiryDays * 24 * 60 * 60);
      const priceInWei = web3.utils.toWei(productForm.price, 'ether');

      await contract.methods.createProduct(
        productForm.name,
        productForm.description,
        productForm.produceType,
        productForm.quantity,
        priceInWei,
        expiryDate,
        productForm.originFarm
      ).send({ from: currentAccount });

      alert('Product created successfully!');
      setProductForm({
        name: '', description: '', produceType: 0, quantity: '', 
        price: '', expiryDays: 30, originFarm: ''
      });
      await loadProducts();
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Error creating product: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const transferProduct = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      console.log('Transfer attempt:', {
        productId: transferForm.productId,
        newOwner: transferForm.newOwner,
        currentAccount: currentAccount
      });
      
      // Validate inputs
      if (!transferForm.productId || !transferForm.newOwner) {
        throw new Error('Product ID and new owner address are required');
      }
      
      // Check if product exists
      const product = await contract.methods.getProduct(transferForm.productId).call();
      if (!product.exists) {
        throw new Error(`Product ${transferForm.productId} does not exist`);
      }
      
      console.log('Product details:', product);
      
      // Check ownership
      if (product.currentOwner.toLowerCase() !== currentAccount.toLowerCase()) {
        throw new Error(`You don't own this product. Owner: ${product.currentOwner}, You: ${currentAccount}`);
      }
      
      // Check if new owner is registered
      const newOwnerActor = await contract.methods.getActor(transferForm.newOwner).call();
      if (!newOwnerActor.isActive) {
        throw new Error(`New owner ${transferForm.newOwner} is not a registered actor`);
      }
      
      // Check if transferring to self
      if (transferForm.newOwner.toLowerCase() === currentAccount.toLowerCase()) {
        throw new Error('Cannot transfer product to yourself');
      }
      
      console.log('All validations passed, executing transfer...');
      
      const result = await contract.methods.transferProduct(
        transferForm.productId,
        transferForm.newOwner
      ).send({ 
        from: currentAccount,
        gas: 300000 // Specify gas limit
      });
      
      console.log('Transfer successful:', result);
      alert('Product transferred successfully!');
      setTransferForm({ productId: '', newOwner: '' });
      await loadProducts();
    } catch (error) {
      console.error('Error transferring product:', error);
      
      // Provide specific error messages
      let errorMessage = 'Error transferring product: ';
      if (error.message.includes('Only product owner')) {
        errorMessage += 'You are not the owner of this product.';
      } else if (error.message.includes('New owner must be a registered actor')) {
        errorMessage += 'The recipient address is not a registered actor in the system.';
      } else if (error.message.includes('Cannot transfer to yourself')) {
        errorMessage += 'You cannot transfer a product to yourself.';
      } else if (error.message.includes('Product does not exist')) {
        errorMessage += 'The specified product does not exist.';
      } else if (error.message.includes('User denied transaction')) {
        errorMessage += 'Transaction was cancelled by user.';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage += 'Insufficient funds for gas fees.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const changeProductState = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await contract.methods.changeProductState(
        stateForm.productId,
        stateForm.newState,
        stateForm.notes
      ).send({ from: currentAccount });

      alert('Product state changed successfully!');
      setStateForm({ productId: '', newState: 1, notes: '' });
      await loadProducts();
    } catch (error) {
      console.error('Error changing product state:', error);
      alert('Error changing product state: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const viewProductHistory = async (productId) => {
    try {
      const history = await contract.methods.getProductHistory(productId).call();
      setProductHistory(history);
      setSelectedProduct(productId);
    } catch (error) {
      console.error('Error loading product history:', error);
    }
  };

  const purchaseProduct = async (product) => {
    try {
      setLoading(true);
      await contract.methods.purchaseProduct(product.productId).send({
        from: currentAccount,
        value: product.price
      });

      alert('Product purchased successfully!');
      await loadProducts();
    } catch (error) {
      console.error('Error purchasing product:', error);
      alert('Error purchasing product: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatPrice = (priceInWei) => {
    return web3.utils.fromWei(priceInWei, 'ether') + ' ETH';
  };

  if (!web3) {
    return (
      <div className="App">
        <div className="loading">
          {connectionStatus === 'connecting' && (
            <>
              <h2>🔗 Connecting to Web3...</h2>
              <p>Please make sure MetaMask is installed and connected to Ganache on port 7545</p>
              {retryCount > 0 && (
                <p>Retrying connection... (attempt {retryCount}/3)</p>
              )}
            </>
          )}
          {connectionStatus === 'error' && (
            <>
              <h2>❌ Connection Failed</h2>
              <p>Unable to connect to the blockchain network</p>
              <div className="retry-actions">
                <button onClick={() => initializeWeb3(0)} className="retry-btn">
                  🔄 Retry Connection
                </button>
                <details style={{marginTop: '20px'}}>
                  <summary>Troubleshooting Tips</summary>
                  <ul style={{textAlign: 'left', marginTop: '10px'}}>
                    <li>✅ Ensure Ganache is running on port 7545</li>
                    <li>✅ MetaMask is installed and unlocked</li>
                    <li>✅ MetaMask is connected to Ganache network</li>
                    <li>✅ Smart contracts are deployed</li>
                    <li>🔧 Try running: <code>truffle migrate --reset</code></li>
                  </ul>
                </details>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Farm Supply Chain Management</h1>
        <div className="account-info">
          <div>
            <p>Connected Account: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)}</p>
            {currentActor && (
              <p>Registered as: {currentActor.name} ({currentActor.actorType})</p>
            )}
          </div>
          <button 
            className="switch-account-btn"
            onClick={switchAccount}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginLeft: '1rem'
            }}
          >
            Switch Account
          </button>
        </div>
      </header>

      <nav className="navigation">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''} 
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={activeTab === 'register' ? 'active' : ''} 
          onClick={() => setActiveTab('register')}
        >
          Register Actor
        </button>
        <button 
          className={activeTab === 'create' ? 'active' : ''} 
          onClick={() => setActiveTab('create')}
        >
          Create Product
        </button>
        <button 
          className={activeTab === 'manage' ? 'active' : ''} 
          onClick={() => setActiveTab('manage')}
        >
          Manage Products
        </button>
        <button 
          className={activeTab === 'environmental' ? 'active' : ''} 
          onClick={() => setActiveTab('environmental')}
        >
          🌡️ Environmental
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <h2>Products Overview</h2>
            {loading ? (
              <div className="loading">Loading products...</div>
            ) : (
              <div className="products-grid">
                {products.map((product) => (
                  <div key={product.productId} className="product-card">
                    <h3>{product.name}</h3>
                    <p><strong>Type:</strong> {PRODUCE_TYPES[product.produceType]}</p>
                    <p><strong>State:</strong> {STATE_NAMES[product.currentState]}</p>
                    <p><strong>Quantity:</strong> {product.quantity} units</p>
                    <p><strong>Price:</strong> {formatPrice(product.price)}</p>
                    <p><strong>Harvest Date:</strong> {formatDate(product.harvestDate)}</p>
                    <p><strong>Expiry Date:</strong> {formatDate(product.expiryDate)}</p>
                    <p><strong>Origin:</strong> {product.originFarm}</p>
                    
                    <div className="product-actions">
                      <button onClick={() => viewProductHistory(product.productId)}>
                        View History
                      </button>
                      {product.currentState === 3 && product.currentOwner !== currentAccount && (
                        <button 
                          onClick={() => purchaseProduct(product)}
                          className="purchase-btn"
                        >
                          Purchase
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedProduct && (
              <div className="product-history">
                <h3>Product History - ID: {selectedProduct}</h3>
                <div className="history-timeline">
                  {productHistory.map((entry, index) => (
                    <div key={index} className="history-entry">
                      <div className="history-state">{STATE_NAMES[entry.newState]}</div>
                      <div className="history-details">
                        <p><strong>Date:</strong> {formatDate(entry.timestamp)}</p>
                        <p><strong>Location:</strong> {entry.location}</p>
                        <p><strong>Notes:</strong> {entry.notes}</p>
                        <p><strong>Actor:</strong> {entry.actor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'register' && !currentActor && (
          <div className="register-form">
            <h2>Register as Supply Chain Actor</h2>
            <form onSubmit={registerActor}>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={actorForm.name}
                  onChange={(e) => setActorForm({...actorForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Location:</label>
                <input
                  type="text"
                  value={actorForm.location}
                  onChange={(e) => setActorForm({...actorForm, location: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Actor Type:</label>
                <select
                  value={actorForm.actorType}
                  onChange={(e) => setActorForm({...actorForm, actorType: e.target.value})}
                >
                  <option value="Farmer">Farmer</option>
                  <option value="Processor">Processor</option>
                  <option value="Distributor">Distributor</option>
                  <option value="Retailer">Retailer</option>
                </select>
              </div>
              <button type="submit" disabled={loading}>
                {loading ? 'Registering...' : 'Register Actor'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'register' && currentActor && (
          <div className="already-registered">
            <h2>Already Registered</h2>
            <p>You are already registered as {currentActor.name} ({currentActor.actorType})</p>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="create-product">
            <h2>Create New Product</h2>
            <form onSubmit={createProduct}>
              <div className="form-group">
                <label>Product Name:</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Produce Type:</label>
                <select
                  value={productForm.produceType}
                  onChange={(e) => setProductForm({...productForm, produceType: parseInt(e.target.value)})}
                >
                  {PRODUCE_TYPES.map((type, index) => (
                    <option key={index} value={index}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Quantity (units/grams):</label>
                <input
                  type="number"
                  value={productForm.quantity}
                  onChange={(e) => setProductForm({...productForm, quantity: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Price (ETH):</label>
                <input
                  type="number"
                  step="0.001"
                  value={productForm.price}
                  onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Expiry (days from now):</label>
                <input
                  type="number"
                  value={productForm.expiryDays}
                  onChange={(e) => setProductForm({...productForm, expiryDays: parseInt(e.target.value)})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Origin Farm:</label>
                <input
                  type="text"
                  value={productForm.originFarm}
                  onChange={(e) => setProductForm({...productForm, originFarm: e.target.value})}
                  required
                />
              </div>
              <button type="submit" disabled={loading || !currentActor || currentActor.actorType !== 'Farmer'}>
                {loading ? 'Creating...' : 'Create Product'}
              </button>
              {currentActor && currentActor.actorType !== 'Farmer' && (
                <p className="warning">Only farmers can create products</p>
              )}
            </form>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="manage-products">
            <h2>Manage Products</h2>
            
            {/* Debug Information */}
            <div className="debug-section" style={{background: '#f0f8f0', padding: '15px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px'}}>
              <h4>🔍 Current Account Info</h4>
              <p><strong>Your Address:</strong> <code>{currentAccount}</code></p>
              {currentActor && (
                <p><strong>Registered As:</strong> {currentActor.name} ({currentActor.actorType})</p>
              )}
              <h4>📦 Your Products:</h4>
              {products.length === 0 ? (
                <p><em>No products found. Create some products first!</em></p>
              ) : (
                <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                  {products
                    .filter(product => product.currentOwner.toLowerCase() === currentAccount.toLowerCase())
                    .map(product => (
                      <div key={product.id} style={{margin: '5px 0', padding: '10px', background: 'white', borderRadius: '3px'}}>
                        <strong>ID {product.id}:</strong> {product.name} 
                        <span style={{marginLeft: '10px', color: '#666'}}>
                          (State: {STATE_NAMES[product.currentState]})
                        </span>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
            
            <div className="management-section">
              <h3>Transfer Product</h3>
              <form onSubmit={transferProduct}>
                <div className="form-group">
                  <label>Product ID:</label>
                  <input
                    type="number"
                    value={transferForm.productId}
                    onChange={(e) => setTransferForm({...transferForm, productId: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Owner Address:</label>
                  <input
                    type="text"
                    value={transferForm.newOwner}
                    onChange={(e) => setTransferForm({...transferForm, newOwner: e.target.value})}
                    required
                  />
                </div>
                <button type="submit" disabled={loading}>
                  {loading ? 'Transferring...' : 'Transfer Product'}
                </button>
              </form>
            </div>

            <div className="management-section">
              <h3>Change Product State</h3>
              <form onSubmit={changeProductState}>
                <div className="form-group">
                  <label>Product ID:</label>
                  <input
                    type="number"
                    value={stateForm.productId}
                    onChange={(e) => setStateForm({...stateForm, productId: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New State:</label>
                  <select
                    value={stateForm.newState}
                    onChange={(e) => setStateForm({...stateForm, newState: parseInt(e.target.value)})}
                  >
                    <option value={1}>Processed</option>
                    <option value={2}>Shipped</option>
                    <option value={3}>Received</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Notes:</label>
                  <textarea
                    value={stateForm.notes}
                    onChange={(e) => setStateForm({...stateForm, notes: e.target.value})}
                    required
                  />
                </div>
                <button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Change State'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'environmental' && (
          <div className="tab-content">
            <div className="dashboard-header">
              <h2>🌡️ Environmental Monitoring</h2>
              <p>Real-time temperature and humidity tracking for your products using ESP32 DHT11 sensors</p>
            </div>
            <EnvironmentalMonitor />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
