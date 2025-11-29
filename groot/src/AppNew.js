import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import Dashboard from './components/Dashboard';
import ActorRegistration from './components/ActorRegistration';
import ProductCreation from './components/ProductCreation';
import ProductManagement from './components/ProductManagement';
import ProductHistory from './components/ProductHistory';
import Navbar from './components/Navbar';
import './App.css';

// Contract configuration
const CONTRACT_ADDRESS = "0x50f003f7681bBd65E37e79661f90BB8748f511F7";
const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "actorAddress", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "name", "type": "string"},
      {"indexed": false, "internalType": "string", "name": "actorType", "type": "string"}
    ],
    "name": "ActorRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "productId", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "name", "type": "string"},
      {"indexed": true, "internalType": "address", "name": "farmer", "type": "address"}
    ],
    "name": "ProductCreated",
    "type": "event"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_name", "type": "string"},
      {"internalType": "string", "name": "_location", "type": "string"},
      {"internalType": "string", "name": "_actorType", "type": "string"}
    ],
    "name": "registerActor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_name", "type": "string"},
      {"internalType": "string", "name": "_description", "type": "string"},
      {"internalType": "enum SupplyChain.ProduceType", "name": "_produceType", "type": "uint8"},
      {"internalType": "uint256", "name": "_quantity", "type": "uint256"},
      {"internalType": "uint256", "name": "_price", "type": "uint256"},
      {"internalType": "uint256", "name": "_expiryDate", "type": "uint256"},
      {"internalType": "string", "name": "_originFarm", "type": "string"}
    ],
    "name": "createProduct",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_productId", "type": "uint256"},
      {"internalType": "enum SupplyChain.State", "name": "_newState", "type": "uint8"},
      {"internalType": "string", "name": "_notes", "type": "string"}
    ],
    "name": "changeProductState",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_productId", "type": "uint256"},
      {"internalType": "address", "name": "_newOwner", "type": "address"}
    ],
    "name": "transferProduct",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_productId", "type": "uint256"}
    ],
    "name": "purchaseProduct",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_productId", "type": "uint256"}
    ],
    "name": "getProduct",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "productId", "type": "uint256"},
          {"internalType": "string", "name": "name", "type": "string"},
          {"internalType": "string", "name": "description", "type": "string"},
          {"internalType": "enum SupplyChain.ProduceType", "name": "produceType", "type": "uint8"},
          {"internalType": "uint256", "name": "quantity", "type": "uint256"},
          {"internalType": "uint256", "name": "price", "type": "uint256"},
          {"internalType": "uint256", "name": "harvestDate", "type": "uint256"},
          {"internalType": "uint256", "name": "expiryDate", "type": "uint256"},
          {"internalType": "string", "name": "originFarm", "type": "string"},
          {"internalType": "string", "name": "qualityCertificates", "type": "string"},
          {"internalType": "address", "name": "currentOwner", "type": "address"},
          {"internalType": "enum SupplyChain.State", "name": "currentState", "type": "uint8"},
          {"internalType": "bool", "name": "exists", "type": "bool"}
        ],
        "internalType": "struct SupplyChain.Product",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_actor", "type": "address"}
    ],
    "name": "getActor",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "actorAddress", "type": "address"},
          {"internalType": "string", "name": "name", "type": "string"},
          {"internalType": "string", "name": "location", "type": "string"},
          {"internalType": "string", "name": "actorType", "type": "string"},
          {"internalType": "bool", "name": "isActive", "type": "bool"},
          {"internalType": "uint256", "name": "registrationDate", "type": "uint256"}
        ],
        "internalType": "struct SupplyChain.Actor",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllProducts",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_productId", "type": "uint256"}
    ],
    "name": "getProductHistory",
    "outputs": [
      {
        "components": [
          {"internalType": "enum SupplyChain.State", "name": "newState", "type": "uint8"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
          {"internalType": "address", "name": "actor", "type": "address"},
          {"internalType": "string", "name": "location", "type": "string"},
          {"internalType": "string", "name": "notes", "type": "string"}
        ],
        "internalType": "struct SupplyChain.StateChange[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const STATES = ['Harvested', 'Processed', 'Shipped', 'Received', 'Sold'];
const PRODUCE_TYPES = ['Fruits', 'Vegetables', 'Grains', 'Dairy', 'Meat', 'Other'];
const ACTOR_TYPES = ['Farmer', 'Processor', 'Distributor', 'Retailer'];

function App() {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  
  // State for data
  const [products, setProducts] = useState([]);
  const [currentActor, setCurrentActor] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productHistory, setProductHistory] = useState([]);

  // Initialize Web3 and connect to MetaMask
  const initializeWeb3 = async () => {
    try {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const accounts = await web3Instance.eth.getAccounts();
        const contractInstance = new web3Instance.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        
        setWeb3(web3Instance);
        setContract(contractInstance);
        setAccount(accounts[0]);
        setIsConnected(true);
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
          setAccount(accounts[0]);
        });
        
        setStatus('Connected to Web3');
      } else {
        setStatus('Please install MetaMask');
      }
    } catch (error) {
      console.error('Error connecting to Web3:', error);
      setStatus('Error connecting to Web3');
    }
  };

  // Load current actor data
  const loadActorData = async () => {
    if (!contract || !account) return;
    
    try {
      const actor = await contract.methods.getActor(account).call();
      if (actor.isActive) {
        setCurrentActor(actor);
      }
    } catch (error) {
      console.error('Error loading actor data:', error);
    }
  };

  // Load all products
  const loadProducts = async () => {
    if (!contract) return;
    
    try {
      setLoading(true);
      const productIds = await contract.methods.getAllProducts().call();
      const productsData = [];

      for (const id of productIds) {
        try {
          const product = await contract.methods.getProduct(id).call();
          productsData.push(product);
        } catch (error) {
          console.error(`Error loading product ${id}:`, error);
        }
      }

      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
      setStatus('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  // Load product history
  const loadProductHistory = async (productId) => {
    if (!contract) return;
    
    try {
      const history = await contract.methods.getProductHistory(productId).call();
      setProductHistory(history);
      setSelectedProduct(productId);
    } catch (error) {
      console.error('Error loading product history:', error);
    }
  };

  // Refresh data
  const refreshData = () => {
    loadActorData();
    loadProducts();
  };

  useEffect(() => {
    initializeWeb3();
  }, []);

  useEffect(() => {
    if (isConnected && contract && account) {
      loadActorData();
      loadProducts();
    }
  }, [isConnected, contract, account]);

  // Connection status display
  if (!isConnected) {
    return (
      <div className="app">
        <div className="connection-screen">
          <div className="connection-card">
            <h1>🌱 Farm Supply Chain</h1>
            <p>Connect your wallet to get started</p>
            <button onClick={initializeWeb3} className="connect-button">
              Connect MetaMask
            </button>
            <div className="connection-info">
              <p><strong>Status:</strong> {status}</p>
              <p><strong>Network:</strong> Ganache (Port 7545)</p>
              <p><strong>Contract:</strong> {CONTRACT_ADDRESS}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🌱 Farm Supply Chain</h1>
          <div className="header-info">
            <div className="account-info">
              <span>Connected: {account.slice(0,6)}...{account.slice(-4)}</span>
              {currentActor && <span>| {currentActor.name} ({currentActor.actorType})</span>}
            </div>
            <button onClick={refreshData} className="refresh-button">🔄 Refresh</button>
          </div>
        </div>
      </header>

      <nav className="navigation">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''} 
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={activeTab === 'register' ? 'active' : ''} 
          onClick={() => setActiveTab('register')}
        >
          👤 Register Actor
        </button>
        <button 
          className={activeTab === 'create' ? 'active' : ''} 
          onClick={() => setActiveTab('create')}
        >
          ➕ Create Product
        </button>
        <button 
          className={activeTab === 'manage' ? 'active' : ''} 
          onClick={() => setActiveTab('manage')}
        >
          🔄 Manage Products
        </button>
      </nav>
      
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <DashboardComponent 
            products={products}
            loading={loading}
            onViewHistory={loadProductHistory}
            contract={contract}
            account={account}
            web3={web3}
            refreshData={refreshData}
            currentActor={currentActor}
            setActiveTab={setActiveTab}
            selectedProduct={selectedProduct}
            productHistory={productHistory}
          />
        )}
        
        {activeTab === 'register' && (
          <ActorRegistrationComponent 
            contract={contract}
            account={account}
            currentActor={currentActor}
            refreshData={refreshData}
            setStatus={setStatus}
          />
        )}
        
        {activeTab === 'create' && (
          <ProductCreationComponent 
            contract={contract}
            account={account}
            currentActor={currentActor}
            web3={web3}
            refreshData={refreshData}
            setStatus={setStatus}
          />
        )}
        
        {activeTab === 'manage' && (
          <ProductManagementComponent 
            contract={contract}
            account={account}
            products={products}
            currentActor={currentActor}
            refreshData={refreshData}
            setStatus={setStatus}
          />
        )}
      </main>
      
      {status && (
        <div className="status-bar">
          {status}
        </div>
      )}
    </div>
  );
}

// Dashboard Component
const DashboardComponent = ({ 
  products, loading, onViewHistory, contract, account, web3, 
  refreshData, currentActor, setActiveTab, selectedProduct, productHistory 
}) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatPrice = (priceInWei) => {
    return web3.utils.fromWei(priceInWei, 'ether') + ' ETH';
  };

  const purchaseProduct = async (product) => {
    try {
      await contract.methods.purchaseProduct(product.productId).send({
        from: account,
        value: product.price
      });
      refreshData();
    } catch (error) {
      console.error('Error purchasing product:', error);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'all') return matchesSearch;
    if (filter === 'mine') return product.currentOwner.toLowerCase() === account.toLowerCase() && matchesSearch;
    if (filter === 'available') return product.currentState == 3 && matchesSearch; // Received state
    return matchesSearch;
  });

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Supply Chain Dashboard</h2>
        <div className="dashboard-controls">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
            <option value="all">All Products</option>
            <option value="mine">My Products</option>
            <option value="available">Available for Purchase</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading products...</div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product) => (
            <div key={product.productId} className="product-card">
              <div className="product-header">
                <h3>{product.name}</h3>
                <span className={`status-badge status-${product.currentState}`}>
                  {STATES[product.currentState]}
                </span>
              </div>
              
              <div className="product-info">
                <p><strong>Type:</strong> {PRODUCE_TYPES[product.produceType]}</p>
                <p><strong>Quantity:</strong> {product.quantity} units</p>
                <p><strong>Price:</strong> {formatPrice(product.price)}</p>
                <p><strong>Harvest Date:</strong> {formatDate(product.harvestDate)}</p>
                <p><strong>Expiry Date:</strong> {formatDate(product.expiryDate)}</p>
                <p><strong>Origin:</strong> {product.originFarm}</p>
                {product.qualityCertificates && (
                  <p><strong>Certificates:</strong> {product.qualityCertificates}</p>
                )}
              </div>
              
              <div className="product-actions">
                <button onClick={() => onViewHistory(product.productId)} className="btn-secondary">
                  📋 View History
                </button>
                {product.currentState == 3 && 
                 product.currentOwner.toLowerCase() !== account.toLowerCase() && (
                  <button 
                    onClick={() => purchaseProduct(product)}
                    className="btn-primary"
                  >
                    💰 Purchase
                  </button>
                )}
                {product.currentOwner.toLowerCase() === account.toLowerCase() && (
                  <button 
                    onClick={() => setActiveTab('manage')}
                    className="btn-accent"
                  >
                    ⚙️ Manage
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProduct && productHistory.length > 0 && (
        <div className="product-history-panel">
          <h3>Product Journey - ID: {selectedProduct}</h3>
          <div className="history-timeline">
            {productHistory.map((entry, index) => (
              <div key={index} className="timeline-entry">
                <div className="timeline-marker">{index + 1}</div>
                <div className="timeline-content">
                  <div className="timeline-state">{STATES[entry.newState]}</div>
                  <div className="timeline-details">
                    <p><strong>Date:</strong> {formatDate(entry.timestamp)}</p>
                    <p><strong>Location:</strong> {entry.location}</p>
                    <p><strong>Notes:</strong> {entry.notes}</p>
                    <p><strong>Actor:</strong> {entry.actor.slice(0,6)}...{entry.actor.slice(-4)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Actor Registration Component
const ActorRegistrationComponent = ({ contract, account, currentActor, refreshData, setStatus }) => {
  const [formData, setFormData] = useState({
    name: '', location: '', actorType: 'Farmer'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.location) {
      setStatus('Please fill all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await contract.methods.registerActor(
        formData.name,
        formData.location,
        formData.actorType
      ).send({ from: account });
      
      setStatus('Actor registered successfully!');
      setFormData({ name: '', location: '', actorType: 'Farmer' });
      refreshData();
    } catch (error) {
      console.error('Error registering actor:', error);
      setStatus('Error registering actor: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentActor) {
    return (
      <div className="registration-status">
        <div className="status-card">
          <h2>✅ Already Registered</h2>
          <div className="actor-details">
            <p><strong>Name:</strong> {currentActor.name}</p>
            <p><strong>Type:</strong> {currentActor.actorType}</p>
            <p><strong>Location:</strong> {currentActor.location}</p>
            <p><strong>Registered:</strong> {new Date(currentActor.registrationDate * 1000).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-form">
      <h2>Register as Supply Chain Actor</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Actor Type:</label>
          <select 
            value={formData.actorType}
            onChange={(e) => setFormData({...formData, actorType: e.target.value})}
            className="form-control"
          >
            {ACTOR_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Organization Name:</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="e.g., Green Valley Farm"
            className="form-control"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Location:</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            placeholder="e.g., California, USA"
            className="form-control"
            required
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="btn-primary btn-full"
        >
          {isSubmitting ? 'Registering...' : 'Register Actor'}
        </button>
      </form>
    </div>
  );
};

// Product Creation Component
const ProductCreationComponent = ({ contract, account, currentActor, web3, refreshData, setStatus }) => {
  const [formData, setFormData] = useState({
    name: '', description: '', produceType: 0, quantity: '', 
    price: '', expiryDays: 30, originFarm: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentActor || currentActor.actorType !== 'Farmer') {
      setStatus('Only registered farmers can create products');
      return;
    }

    setIsSubmitting(true);
    try {
      const expiryDate = Math.floor(Date.now() / 1000) + (formData.expiryDays * 24 * 60 * 60);
      const priceInWei = web3.utils.toWei(formData.price, 'ether');

      await contract.methods.createProduct(
        formData.name,
        formData.description,
        formData.produceType,
        formData.quantity,
        priceInWei,
        expiryDate,
        formData.originFarm
      ).send({ from: account });

      setStatus('Product created successfully!');
      setFormData({
        name: '', description: '', produceType: 0, quantity: '', 
        price: '', expiryDays: 30, originFarm: ''
      });
      refreshData();
    } catch (error) {
      console.error('Error creating product:', error);
      setStatus('Error creating product: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="product-creation">
      <h2>Create New Product</h2>
      {!currentActor && (
        <div className="warning">
          Please register as an actor first.
        </div>
      )}
      {currentActor && currentActor.actorType !== 'Farmer' && (
        <div className="warning">
          Only farmers can create products.
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Product Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Organic Apples"
              className="form-control"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Produce Type:</label>
            <select
              value={formData.produceType}
              onChange={(e) => setFormData({...formData, produceType: parseInt(e.target.value)})}
              className="form-control"
            >
              {PRODUCE_TYPES.map((type, index) => (
                <option key={index} value={index}>{type}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label>Description:</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Describe your product..."
            className="form-control"
            rows="3"
            required
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Quantity (units/grams):</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              placeholder="e.g., 5000"
              className="form-control"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Price (ETH):</label>
            <input
              type="number"
              step="0.001"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              placeholder="e.g., 0.01"
              className="form-control"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Expiry (days from now):</label>
            <input
              type="number"
              value={formData.expiryDays}
              onChange={(e) => setFormData({...formData, expiryDays: parseInt(e.target.value)})}
              className="form-control"
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>Origin Farm/Section:</label>
          <input
            type="text"
            value={formData.originFarm}
            onChange={(e) => setFormData({...formData, originFarm: e.target.value})}
            placeholder="e.g., Green Valley Farm - Section A"
            className="form-control"
            required
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isSubmitting || !currentActor || currentActor.actorType !== 'Farmer'}
          className="btn-primary btn-full"
        >
          {isSubmitting ? 'Creating Product...' : 'Create Product'}
        </button>
      </form>
    </div>
  );
};

// Product Management Component
const ProductManagementComponent = ({ contract, account, products, currentActor, refreshData, setStatus }) => {
  const [transferData, setTransferData] = useState({ productId: '', newOwner: '' });
  const [stateData, setStateData] = useState({ productId: '', newState: 1, notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myProducts = products.filter(p => p.currentOwner.toLowerCase() === account.toLowerCase());

  const handleTransfer = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await contract.methods.transferProduct(
        transferData.productId,
        transferData.newOwner
      ).send({ from: account });
      
      setStatus('Product transferred successfully!');
      setTransferData({ productId: '', newOwner: '' });
      refreshData();
    } catch (error) {
      console.error('Error transferring product:', error);
      setStatus('Error transferring product: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStateChange = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await contract.methods.changeProductState(
        stateData.productId,
        stateData.newState,
        stateData.notes
      ).send({ from: account });
      
      setStatus('Product state changed successfully!');
      setStateData({ productId: '', newState: 1, notes: '' });
      refreshData();
    } catch (error) {
      console.error('Error changing product state:', error);
      setStatus('Error changing product state: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="product-management">
      <h2>Manage Your Products</h2>
      
      {myProducts.length === 0 ? (
        <div className="no-products">
          <p>You don't own any products yet.</p>
        </div>
      ) : (
        <div className="products-overview">
          <h3>Your Products</h3>
          <div className="products-list">
            {myProducts.map(product => (
              <div key={product.productId} className="product-item">
                <span>{product.name} (ID: {product.productId})</span>
                <span className={`status-badge status-${product.currentState}`}>
                  {STATES[product.currentState]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="management-sections">
        <div className="management-section">
          <h3>Transfer Product Ownership</h3>
          <form onSubmit={handleTransfer}>
            <div className="form-row">
              <div className="form-group">
                <label>Product:</label>
                <select
                  value={transferData.productId}
                  onChange={(e) => setTransferData({...transferData, productId: e.target.value})}
                  className="form-control"
                  required
                >
                  <option value="">Select Product</option>
                  {myProducts.map(product => (
                    <option key={product.productId} value={product.productId}>
                      {product.name} (ID: {product.productId})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>New Owner Address:</label>
                <input
                  type="text"
                  value={transferData.newOwner}
                  onChange={(e) => setTransferData({...transferData, newOwner: e.target.value})}
                  placeholder="0x..."
                  className="form-control"
                  required
                />
              </div>
            </div>
            
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Transferring...' : 'Transfer Product'}
            </button>
          </form>
        </div>

        <div className="management-section">
          <h3>Update Product State</h3>
          <form onSubmit={handleStateChange}>
            <div className="form-row">
              <div className="form-group">
                <label>Product:</label>
                <select
                  value={stateData.productId}
                  onChange={(e) => setStateData({...stateData, productId: e.target.value})}
                  className="form-control"
                  required
                >
                  <option value="">Select Product</option>
                  {myProducts.map(product => (
                    <option key={product.productId} value={product.productId}>
                      {product.name} (ID: {product.productId}) - Current: {STATES[product.currentState]}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>New State:</label>
                <select
                  value={stateData.newState}
                  onChange={(e) => setStateData({...stateData, newState: parseInt(e.target.value)})}
                  className="form-control"
                >
                  <option value={1}>Processed</option>
                  <option value={2}>Shipped</option>
                  <option value={3}>Received</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label>Notes:</label>
              <textarea
                value={stateData.notes}
                onChange={(e) => setStateData({...stateData, notes: e.target.value})}
                placeholder="Describe what happened to the product..."
                className="form-control"
                rows="3"
                required
              />
            </div>
            
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Updating...' : 'Update State'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export { STATES, PRODUCE_TYPES, ACTOR_TYPES };
export default App;