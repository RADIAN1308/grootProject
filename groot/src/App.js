import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import './App.css';

// You'll need to update this with your deployed contract address after migration
const SUPPLY_CHAIN_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '0x50f003f7681bBd65E37e79661f90BB8748f511F7';

// Contract ABI - simplified version for frontend interaction
const SUPPLY_CHAIN_ABI = [
  {
    "inputs": [{"name": "_name", "type": "string"}, {"name": "_location", "type": "string"}, {"name": "_actorType", "type": "string"}],
    "name": "registerActor",
    "outputs": [],
    "type": "function"
  },
  {
    "inputs": [{"name": "_name", "type": "string"}, {"name": "_description", "type": "string"}, {"name": "_produceType", "type": "uint8"}, {"name": "_quantity", "type": "uint256"}, {"name": "_price", "type": "uint256"}, {"name": "_expiryDate", "type": "uint256"}, {"name": "_originFarm", "type": "string"}],
    "name": "createProduct",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "inputs": [{"name": "_productId", "type": "uint256"}],
    "name": "getProduct",
    "outputs": [{"name": "", "type": "tuple", "components": [{"name": "productId", "type": "uint256"}, {"name": "name", "type": "string"}, {"name": "description", "type": "string"}, {"name": "produceType", "type": "uint8"}, {"name": "quantity", "type": "uint256"}, {"name": "price", "type": "uint256"}, {"name": "harvestDate", "type": "uint256"}, {"name": "expiryDate", "type": "uint256"}, {"name": "originFarm", "type": "string"}, {"name": "qualityCertificates", "type": "string"}, {"name": "currentOwner", "type": "address"}, {"name": "currentState", "type": "uint8"}, {"name": "exists", "type": "bool"}]}],
    "type": "function"
  },
  {
    "inputs": [{"name": "_productId", "type": "uint256"}],
    "name": "getProductHistory",
    "outputs": [{"name": "", "type": "tuple[]", "components": [{"name": "newState", "type": "uint8"}, {"name": "timestamp", "type": "uint256"}, {"name": "actor", "type": "address"}, {"name": "location", "type": "string"}, {"name": "notes", "type": "string"}]}],
    "type": "function"
  },
  {
    "inputs": [{"name": "_productId", "type": "uint256"}, {"name": "_newOwner", "type": "address"}],
    "name": "transferProduct",
    "outputs": [],
    "type": "function"
  },
  {
    "inputs": [{"name": "_productId", "type": "uint256"}, {"name": "_newState", "type": "uint8"}, {"name": "_notes", "type": "string"}],
    "name": "changeProductState",
    "outputs": [],
    "type": "function"
  },
  {
    "inputs": [{"name": "_productId", "type": "uint256"}],
    "name": "purchaseProduct",
    "outputs": [],
    "type": "function",
    "payable": true
  },
  {
    "inputs": [],
    "name": "getAllProducts",
    "outputs": [{"name": "", "type": "uint256[]"}],
    "type": "function"
  },
  {
    "inputs": [{"name": "_actor", "type": "address"}],
    "name": "getActor",
    "outputs": [{"name": "", "type": "tuple", "components": [{"name": "actorAddress", "type": "address"}, {"name": "name", "type": "string"}, {"name": "location", "type": "string"}, {"name": "actorType", "type": "string"}, {"name": "isActive", "type": "bool"}, {"name": "registrationDate", "type": "uint256"}]}],
    "type": "function"
  }
];

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
  }, []);

  useEffect(() => {
    if (currentAccount && contract) {
      loadActorData();
      loadProducts();
    }
  }, [currentAccount, contract]);

  const initializeWeb3 = async () => {
    try {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const accounts = await web3Instance.eth.getAccounts();
        const contractInstance = new web3Instance.eth.Contract(SUPPLY_CHAIN_ABI, SUPPLY_CHAIN_ADDRESS);
        
        setWeb3(web3Instance);
        setAccounts(accounts);
        setContract(contractInstance);
        setCurrentAccount(accounts[0]);
      } else {
        alert('Please install MetaMask to use this application');
      }
    } catch (error) {
      console.error('Error initializing Web3:', error);
      alert('Error connecting to Web3. Make sure MetaMask is connected and Ganache is running on port 7545.');
    }
  };

  const loadActorData = async () => {
    try {
      const actor = await contract.methods.getActor(currentAccount).call();
      if (actor.isActive) {
        setCurrentActor(actor);
      }
    } catch (error) {
      console.error('Error loading actor data:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productIds = await contract.methods.getAllProducts().call();
      const productsData = [];

      for (const id of productIds) {
        const product = await contract.methods.getProduct(id).call();
        productsData.push(product);
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
      await contract.methods.transferProduct(
        transferForm.productId,
        transferForm.newOwner
      ).send({ from: currentAccount });

      alert('Product transferred successfully!');
      setTransferForm({ productId: '', newOwner: '' });
      await loadProducts();
    } catch (error) {
      console.error('Error transferring product:', error);
      alert('Error transferring product: ' + error.message);
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
          <h2>Connecting to Web3...</h2>
          <p>Please make sure MetaMask is installed and connected to Ganache on port 7545</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Farm Supply Chain Management</h1>
        <div className="account-info">
          <p>Connected Account: {currentAccount}</p>
          {currentActor && (
            <p>Registered as: {currentActor.name} ({currentActor.actorType})</p>
          )}
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
                      {product.currentState == 3 && product.currentOwner !== currentAccount && (
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
      </main>
    </div>
  );
}

export default App;
