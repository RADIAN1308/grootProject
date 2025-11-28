// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SupplyChain
 * @dev A comprehensive supply chain management contract for farm produce
 * @author Your Name
 */
contract SupplyChain {
    
    // Enumerations
    enum State { 
        Harvested,      // 0 - Just harvested by farmer
        Processed,      // 1 - Processed by manufacturer
        Shipped,        // 2 - Shipped by distributor
        Received,       // 3 - Received by retailer
        Sold           // 4 - Sold to end consumer
    }
    
    enum ProduceType {
        Fruits,
        Vegetables,
        Grains,
        Dairy,
        Meat,
        Other
    }
    
    // Structures
    struct Actor {
        address actorAddress;
        string name;
        string location;
        string actorType; // "Farmer", "Processor", "Distributor", "Retailer"
        bool isActive;
        uint256 registrationDate;
    }
    
    struct Product {
        uint256 productId;
        string name;
        string description;
        ProduceType produceType;
        uint256 quantity; // in grams or units
        uint256 price; // price per unit in wei
        uint256 harvestDate;
        uint256 expiryDate;
        string originFarm;
        string qualityCertificates;
        address currentOwner;
        State currentState;
        bool exists;
    }
    
    struct StateChange {
        State newState;
        uint256 timestamp;
        address actor;
        string location;
        string notes;
    }
    
    // State variables
    address public owner;
    uint256 private nextProductId;
    uint256 private nextActorId;
    
    // Mappings
    mapping(uint256 => Product) public products;
    mapping(address => Actor) public actors;
    mapping(uint256 => StateChange[]) public productHistory;
    mapping(address => uint256[]) public actorProducts;
    mapping(uint256 => address[]) public productOwnershipHistory;
    
    // Arrays for iteration
    uint256[] public allProductIds;
    address[] public allActors;
    
    // Events
    event ActorRegistered(address indexed actorAddress, string name, string actorType);
    event ProductCreated(uint256 indexed productId, string name, address indexed farmer);
    event ProductStateChanged(uint256 indexed productId, State newState, address indexed actor);
    event ProductTransferred(uint256 indexed productId, address indexed from, address indexed to);
    event QualityCertificateAdded(uint256 indexed productId, string certificate);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can perform this action");
        _;
    }
    
    modifier onlyRegisteredActor() {
        require(actors[msg.sender].isActive, "Only registered and active actors can perform this action");
        _;
    }
    
    modifier productExists(uint256 _productId) {
        require(products[_productId].exists, "Product does not exist");
        _;
    }
    
    modifier onlyProductOwner(uint256 _productId) {
        require(products[_productId].currentOwner == msg.sender, "Only product owner can perform this action");
        _;
    }
    
    modifier validStateTransition(uint256 _productId, State _newState) {
        State currentState = products[_productId].currentState;
        require(uint8(_newState) == uint8(currentState) + 1, "Invalid state transition");
        _;
    }
    
    // Constructor
    constructor() {
        owner = msg.sender;
        nextProductId = 1;
        nextActorId = 1;
    }
    
    /**
     * @dev Register a new actor in the supply chain
     * @param _name Name of the actor
     * @param _location Location of the actor
     * @param _actorType Type of actor (Farmer, Processor, Distributor, Retailer)
     */
    function registerActor(
        string memory _name,
        string memory _location,
        string memory _actorType
    ) public {
        require(!actors[msg.sender].isActive, "Actor already registered");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_location).length > 0, "Location cannot be empty");
        require(bytes(_actorType).length > 0, "Actor type cannot be empty");
        
        actors[msg.sender] = Actor({
            actorAddress: msg.sender,
            name: _name,
            location: _location,
            actorType: _actorType,
            isActive: true,
            registrationDate: block.timestamp
        });
        
        allActors.push(msg.sender);
        
        emit ActorRegistered(msg.sender, _name, _actorType);
    }
    
    /**
     * @dev Create a new product (only farmers can create products initially)
     * @param _name Name of the product
     * @param _description Description of the product
     * @param _produceType Type of produce
     * @param _quantity Quantity in grams or units
     * @param _price Price per unit in wei
     * @param _expiryDate Expiry date timestamp
     * @param _originFarm Origin farm name
     */
    function createProduct(
        string memory _name,
        string memory _description,
        ProduceType _produceType,
        uint256 _quantity,
        uint256 _price,
        uint256 _expiryDate,
        string memory _originFarm
    ) public onlyRegisteredActor returns (uint256) {
        require(
            keccak256(abi.encodePacked(actors[msg.sender].actorType)) == keccak256(abi.encodePacked("Farmer")),
            "Only farmers can create products"
        );
        require(bytes(_name).length > 0, "Product name cannot be empty");
        require(_quantity > 0, "Quantity must be greater than 0");
        require(_price > 0, "Price must be greater than 0");
        require(_expiryDate > block.timestamp, "Expiry date must be in the future");
        
        uint256 productId = nextProductId++;
        
        products[productId] = Product({
            productId: productId,
            name: _name,
            description: _description,
            produceType: _produceType,
            quantity: _quantity,
            price: _price,
            harvestDate: block.timestamp,
            expiryDate: _expiryDate,
            originFarm: _originFarm,
            qualityCertificates: "",
            currentOwner: msg.sender,
            currentState: State.Harvested,
            exists: true
        });
        
        // Record initial state change
        productHistory[productId].push(StateChange({
            newState: State.Harvested,
            timestamp: block.timestamp,
            actor: msg.sender,
            location: actors[msg.sender].location,
            notes: "Product harvested and created"
        }));
        
        // Track ownership and products
        productOwnershipHistory[productId].push(msg.sender);
        actorProducts[msg.sender].push(productId);
        allProductIds.push(productId);
        
        emit ProductCreated(productId, _name, msg.sender);
        emit ProductStateChanged(productId, State.Harvested, msg.sender);
        
        return productId;
    }
    
    /**
     * @dev Change the state of a product
     * @param _productId ID of the product
     * @param _newState New state of the product
     * @param _notes Additional notes for the state change
     */
    function changeProductState(
        uint256 _productId,
        State _newState,
        string memory _notes
    ) public 
        productExists(_productId) 
        onlyProductOwner(_productId) 
        validStateTransition(_productId, _newState) 
    {
        products[_productId].currentState = _newState;
        
        productHistory[_productId].push(StateChange({
            newState: _newState,
            timestamp: block.timestamp,
            actor: msg.sender,
            location: actors[msg.sender].location,
            notes: _notes
        }));
        
        emit ProductStateChanged(_productId, _newState, msg.sender);
    }
    
    /**
     * @dev Transfer ownership of a product
     * @param _productId ID of the product
     * @param _newOwner Address of the new owner
     */
    function transferProduct(uint256 _productId, address _newOwner) 
        public 
        productExists(_productId) 
        onlyProductOwner(_productId) 
    {
        require(actors[_newOwner].isActive, "New owner must be a registered actor");
        require(_newOwner != msg.sender, "Cannot transfer to yourself");
        
        address previousOwner = products[_productId].currentOwner;
        products[_productId].currentOwner = _newOwner;
        
        // Update tracking arrays
        productOwnershipHistory[_productId].push(_newOwner);
        actorProducts[_newOwner].push(_productId);
        
        emit ProductTransferred(_productId, previousOwner, _newOwner);
    }
    
    /**
     * @dev Add quality certificate to a product
     * @param _productId ID of the product
     * @param _certificate Quality certificate information
     */
    function addQualityCertificate(uint256 _productId, string memory _certificate) 
        public 
        productExists(_productId) 
        onlyProductOwner(_productId) 
    {
        require(bytes(_certificate).length > 0, "Certificate cannot be empty");
        
        if (bytes(products[_productId].qualityCertificates).length > 0) {
            products[_productId].qualityCertificates = string(
                abi.encodePacked(products[_productId].qualityCertificates, "; ", _certificate)
            );
        } else {
            products[_productId].qualityCertificates = _certificate;
        }
        
        emit QualityCertificateAdded(_productId, _certificate);
    }
    
    /**
     * @dev Purchase a product (final step in supply chain)
     * @param _productId ID of the product to purchase
     */
    function purchaseProduct(uint256 _productId) 
        public 
        payable 
        productExists(_productId) 
    {
        Product storage product = products[_productId];
        require(product.currentState == State.Received, "Product must be received by retailer before purchase");
        require(msg.value >= product.price, "Insufficient payment");
        require(block.timestamp < product.expiryDate, "Product has expired");
        
        address retailer = product.currentOwner;
        
        // Transfer payment to current owner (retailer)
        payable(retailer).transfer(product.price);
        
        // Return excess payment
        if (msg.value > product.price) {
            payable(msg.sender).transfer(msg.value - product.price);
        }
        
        // Update product state
        product.currentState = State.Sold;
        product.currentOwner = msg.sender;
        
        // Record state change
        productHistory[_productId].push(StateChange({
            newState: State.Sold,
            timestamp: block.timestamp,
            actor: msg.sender,
            location: "Consumer",
            notes: "Product purchased by end consumer"
        }));
        
        productOwnershipHistory[_productId].push(msg.sender);
        
        emit ProductStateChanged(_productId, State.Sold, msg.sender);
        emit ProductTransferred(_productId, retailer, msg.sender);
    }
    
    // View functions
    
    /**
     * @dev Get product details
     * @param _productId ID of the product
     * @return Product details
     */
    function getProduct(uint256 _productId) 
        public 
        view 
        productExists(_productId) 
        returns (Product memory) 
    {
        return products[_productId];
    }
    
    /**
     * @dev Get product history
     * @param _productId ID of the product
     * @return Array of state changes
     */
    function getProductHistory(uint256 _productId) 
        public 
        view 
        productExists(_productId) 
        returns (StateChange[] memory) 
    {
        return productHistory[_productId];
    }
    
    /**
     * @dev Get products owned by an actor
     * @param _actor Address of the actor
     * @return Array of product IDs
     */
    function getActorProducts(address _actor) 
        public 
        view 
        returns (uint256[] memory) 
    {
        return actorProducts[_actor];
    }
    
    /**
     * @dev Get ownership history of a product
     * @param _productId ID of the product
     * @return Array of owner addresses
     */
    function getProductOwnershipHistory(uint256 _productId) 
        public 
        view 
        productExists(_productId) 
        returns (address[] memory) 
    {
        return productOwnershipHistory[_productId];
    }
    
    /**
     * @dev Get all product IDs
     * @return Array of all product IDs
     */
    function getAllProducts() public view returns (uint256[] memory) {
        return allProductIds;
    }
    
    /**
     * @dev Get all registered actors
     * @return Array of all actor addresses
     */
    function getAllActors() public view returns (address[] memory) {
        return allActors;
    }
    
    /**
     * @dev Get actor details
     * @param _actor Address of the actor
     * @return Actor details
     */
    function getActor(address _actor) public view returns (Actor memory) {
        return actors[_actor];
    }
    
    /**
     * @dev Check if product is expired
     * @param _productId ID of the product
     * @return true if expired, false otherwise
     */
    function isProductExpired(uint256 _productId) 
        public 
        view 
        productExists(_productId) 
        returns (bool) 
    {
        return block.timestamp >= products[_productId].expiryDate;
    }
    
    /**
     * @dev Get total number of products
     * @return Total number of products created
     */
    function getTotalProducts() public view returns (uint256) {
        return allProductIds.length;
    }
    
    /**
     * @dev Get total number of actors
     * @return Total number of registered actors
     */
    function getTotalActors() public view returns (uint256) {
        return allActors.length;
    }
}