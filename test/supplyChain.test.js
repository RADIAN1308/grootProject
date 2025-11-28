const SupplyChain = artifacts.require("SupplyChain");

contract("SupplyChain", accounts => {
    let supplyChain;
    const [owner, farmer, processor, distributor, retailer, consumer] = accounts;
    
    // Product details for testing
    const productData = {
        name: "Organic Apples",
        description: "Fresh organic apples from local farm",
        produceType: 0, // Fruits
        quantity: 1000, // 1000 grams
        price: web3.utils.toWei("0.1", "ether"), // 0.1 ETH per unit
        expiryDate: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days from now
        originFarm: "Green Valley Farm"
    };

    beforeEach(async () => {
        supplyChain = await SupplyChain.new();
        
        // Register all actors
        await supplyChain.registerActor("John Farmer", "Green Valley, CA", "Farmer", { from: farmer });
        await supplyChain.registerActor("ABC Processing", "Industrial Park, CA", "Processor", { from: processor });
        await supplyChain.registerActor("Fast Logistics", "Distribution Center, CA", "Distributor", { from: distributor });
        await supplyChain.registerActor("Fresh Market", "Downtown, CA", "Retailer", { from: retailer });
    });

    describe("Actor Registration", () => {
        it("should register a new actor successfully", async () => {
            const actor = await supplyChain.getActor(farmer);
            assert.equal(actor.name, "John Farmer");
            assert.equal(actor.location, "Green Valley, CA");
            assert.equal(actor.actorType, "Farmer");
            assert.equal(actor.isActive, true);
        });

        it("should not allow duplicate registration", async () => {
            try {
                await supplyChain.registerActor("Duplicate Farmer", "Same Location", "Farmer", { from: farmer });
                assert.fail("Should have thrown an error");
            } catch (error) {
                assert(error.message.includes("Actor already registered"));
            }
        });

        it("should not allow empty name", async () => {
            try {
                await supplyChain.registerActor("", "Location", "Farmer", { from: accounts[5] });
                assert.fail("Should have thrown an error");
            } catch (error) {
                assert(error.message.includes("Name cannot be empty"));
            }
        });

        it("should track total number of actors", async () => {
            const totalActors = await supplyChain.getTotalActors();
            assert.equal(totalActors.toNumber(), 4); // 4 actors registered in beforeEach
        });
    });

    describe("Product Creation", () => {
        it("should create a new product successfully", async () => {
            const result = await supplyChain.createProduct(
                productData.name,
                productData.description,
                productData.produceType,
                productData.quantity,
                productData.price,
                productData.expiryDate,
                productData.originFarm,
                { from: farmer }
            );

            const productId = result.logs[0].args.productId.toNumber();
            const product = await supplyChain.getProduct(productId);

            assert.equal(product.name, productData.name);
            assert.equal(product.description, productData.description);
            assert.equal(product.produceType, productData.produceType);
            assert.equal(product.quantity, productData.quantity);
            assert.equal(product.price, productData.price);
            assert.equal(product.originFarm, productData.originFarm);
            assert.equal(product.currentOwner, farmer);
            assert.equal(product.currentState, 0); // Harvested state
            assert.equal(product.exists, true);
        });

        it("should only allow farmers to create products", async () => {
            try {
                await supplyChain.createProduct(
                    productData.name,
                    productData.description,
                    productData.produceType,
                    productData.quantity,
                    productData.price,
                    productData.expiryDate,
                    productData.originFarm,
                    { from: processor }
                );
                assert.fail("Should have thrown an error");
            } catch (error) {
                assert(error.message.includes("Only farmers can create products"));
            }
        });

        it("should not allow creation with zero quantity", async () => {
            try {
                await supplyChain.createProduct(
                    productData.name,
                    productData.description,
                    productData.produceType,
                    0, // Zero quantity
                    productData.price,
                    productData.expiryDate,
                    productData.originFarm,
                    { from: farmer }
                );
                assert.fail("Should have thrown an error");
            } catch (error) {
                assert(error.message.includes("Quantity must be greater than 0"));
            }
        });

        it("should not allow creation with past expiry date", async () => {
            try {
                await supplyChain.createProduct(
                    productData.name,
                    productData.description,
                    productData.produceType,
                    productData.quantity,
                    productData.price,
                    Math.floor(Date.now() / 1000) - 1000, // Past date
                    productData.originFarm,
                    { from: farmer }
                );
                assert.fail("Should have thrown an error");
            } catch (error) {
                assert(error.message.includes("Expiry date must be in the future"));
            }
        });

        it("should track product creation in history", async () => {
            const result = await supplyChain.createProduct(
                productData.name,
                productData.description,
                productData.produceType,
                productData.quantity,
                productData.price,
                productData.expiryDate,
                productData.originFarm,
                { from: farmer }
            );

            const productId = result.logs[0].args.productId.toNumber();
            const history = await supplyChain.getProductHistory(productId);

            assert.equal(history.length, 1);
            assert.equal(history[0].newState, 0); // Harvested
            assert.equal(history[0].actor, farmer);
        });
    });

    describe("State Management", () => {
        let productId;

        beforeEach(async () => {
            const result = await supplyChain.createProduct(
                productData.name,
                productData.description,
                productData.produceType,
                productData.quantity,
                productData.price,
                productData.expiryDate,
                productData.originFarm,
                { from: farmer }
            );
            productId = result.logs[0].args.productId.toNumber();
        });

        it("should change product state sequentially", async () => {
            // Transfer to processor
            await supplyChain.transferProduct(productId, processor, { from: farmer });
            
            // Change to Processed state
            await supplyChain.changeProductState(productId, 1, "Product processed and packaged", { from: processor });
            
            const product = await supplyChain.getProduct(productId);
            assert.equal(product.currentState, 1); // Processed
            
            const history = await supplyChain.getProductHistory(productId);
            assert.equal(history.length, 2);
            assert.equal(history[1].newState, 1);
            assert.equal(history[1].actor, processor);
        });

        it("should not allow skipping states", async () => {
            try {
                await supplyChain.changeProductState(productId, 2, "Skipping processed state", { from: farmer });
                assert.fail("Should have thrown an error");
            } catch (error) {
                assert(error.message.includes("Invalid state transition"));
            }
        });

        it("should only allow product owner to change state", async () => {
            try {
                await supplyChain.changeProductState(productId, 1, "Unauthorized state change", { from: processor });
                assert.fail("Should have thrown an error");
            } catch (error) {
                assert(error.message.includes("Only product owner can perform this action"));
            }
        });
    });

    describe("Product Transfer", () => {
        let productId;

        beforeEach(async () => {
            const result = await supplyChain.createProduct(
                productData.name,
                productData.description,
                productData.produceType,
                productData.quantity,
                productData.price,
                productData.expiryDate,
                productData.originFarm,
                { from: farmer }
            );
            productId = result.logs[0].args.productId.toNumber();
        });

        it("should transfer product ownership", async () => {
            await supplyChain.transferProduct(productId, processor, { from: farmer });
            
            const product = await supplyChain.getProduct(productId);
            assert.equal(product.currentOwner, processor);
            
            const ownershipHistory = await supplyChain.getProductOwnershipHistory(productId);
            assert.equal(ownershipHistory.length, 2);
            assert.equal(ownershipHistory[0], farmer);
            assert.equal(ownershipHistory[1], processor);
        });

        it("should not allow transfer to unregistered actor", async () => {
            try {
                await supplyChain.transferProduct(productId, accounts[9], { from: farmer });
                assert.fail("Should have thrown an error");
            } catch (error) {
                assert(error.message.includes("New owner must be a registered actor"));
            }
        });

        it("should not allow transfer to self", async () => {
            try {
                await supplyChain.transferProduct(productId, farmer, { from: farmer });
                assert.fail("Should have thrown an error");
            } catch (error) {
                assert(error.message.includes("Cannot transfer to yourself"));
            }
        });

        it("should only allow owner to transfer", async () => {
            try {
                await supplyChain.transferProduct(productId, processor, { from: processor });
                assert.fail("Should have thrown an error");
            } catch (error) {
                assert(error.message.includes("Only product owner can perform this action"));
            }
        });
    });

    describe("Quality Certificates", () => {
        let productId;

        beforeEach(async () => {
            const result = await supplyChain.createProduct(
                productData.name,
                productData.description,
                productData.produceType,
                productData.quantity,
                productData.price,
                productData.expiryDate,
                productData.originFarm,
                { from: farmer }
            );
            productId = result.logs[0].args.productId.toNumber();
        });

        it("should add quality certificate", async () => {
            const certificate = "Organic Certification - Valid until 2025";
            await supplyChain.addQualityCertificate(productId, certificate, { from: farmer });
            
            const product = await supplyChain.getProduct(productId);
            assert.equal(product.qualityCertificates, certificate);
        });

        it("should append multiple certificates", async () => {
            const cert1 = "Organic Certification";
            const cert2 = "Fair Trade Certification";
            
            await supplyChain.addQualityCertificate(productId, cert1, { from: farmer });
            await supplyChain.addQualityCertificate(productId, cert2, { from: farmer });
            
            const product = await supplyChain.getProduct(productId);
            assert.equal(product.qualityCertificates, `${cert1}; ${cert2}`);
        });

        it("should only allow owner to add certificates", async () => {
            try {
                await supplyChain.addQualityCertificate(productId, "Unauthorized cert", { from: processor });
                assert.fail("Should have thrown an error");
            } catch (error) {
                assert(error.message.includes("Only product owner can perform this action"));
            }
        });
    });

    describe("Product Purchase", () => {
        let productId;

        beforeEach(async () => {
            const result = await supplyChain.createProduct(
                productData.name,
                productData.description,
                productData.produceType,
                productData.quantity,
                productData.price,
                productData.expiryDate,
                productData.originFarm,
                { from: farmer }
            );
            productId = result.logs[0].args.productId.toNumber();

            // Move product through supply chain to retailer
            await supplyChain.transferProduct(productId, processor, { from: farmer });
            await supplyChain.changeProductState(productId, 1, "Processed", { from: processor });
            
            await supplyChain.transferProduct(productId, distributor, { from: processor });
            await supplyChain.changeProductState(productId, 2, "Shipped", { from: distributor });
            
            await supplyChain.transferProduct(productId, retailer, { from: distributor });
            await supplyChain.changeProductState(productId, 3, "Received at store", { from: retailer });
        });

        it("should allow consumer to purchase product", async () => {
            const initialRetailerBalance = await web3.eth.getBalance(retailer);
            
            await supplyChain.purchaseProduct(productId, { 
                from: consumer, 
                value: productData.price 
            });
            
            const product = await supplyChain.getProduct(productId);
            assert.equal(product.currentState, 4); // Sold
            assert.equal(product.currentOwner, consumer);
            
            const finalRetailerBalance = await web3.eth.getBalance(retailer);
            assert(web3.utils.toBN(finalRetailerBalance).gt(web3.utils.toBN(initialRetailerBalance)));
        });

        it("should return excess payment", async () => {
            const excessPayment = web3.utils.toWei("0.2", "ether"); // Pay 0.2 ETH for 0.1 ETH product
            const initialConsumerBalance = await web3.eth.getBalance(consumer);
            
            const tx = await supplyChain.purchaseProduct(productId, { 
                from: consumer, 
                value: excessPayment 
            });
            
            const gasUsed = tx.receipt.gasUsed;
            const txCost = web3.utils.toBN(gasUsed).mul(web3.utils.toBN(web3.eth.gasPrice || 20000000000));
            const finalConsumerBalance = await web3.eth.getBalance(consumer);
            
            // Consumer should have spent only the product price + gas
            const expectedBalance = web3.utils.toBN(initialConsumerBalance)
                .sub(web3.utils.toBN(productData.price))
                .sub(txCost);
            
            // Allow for small gas price variations
            const balanceDiff = web3.utils.toBN(finalConsumerBalance).sub(expectedBalance);
            assert(balanceDiff.abs().lt(web3.utils.toBN(web3.utils.toWei("0.01", "ether"))));
        });

        it("should not allow purchase with insufficient payment", async () => {
            try {
                await supplyChain.purchaseProduct(productId, { 
                    from: consumer, 
                    value: web3.utils.toWei("0.05", "ether") // Less than required
                });
                assert.fail("Should have thrown an error");
            } catch (error) {
                assert(error.message.includes("Insufficient payment"));
            }
        });

        it("should not allow purchase before received state", async () => {
            // Create new product in harvested state
            const result = await supplyChain.createProduct(
                "New Product",
                "Description",
                0, // Fruits
                1000,
                productData.price,
                productData.expiryDate,
                "Farm",
                { from: farmer }
            );
            const newProductId = result.logs[0].args.productId.toNumber();
            
            try {
                await supplyChain.purchaseProduct(newProductId, { 
                    from: consumer, 
                    value: productData.price 
                });
                assert.fail("Should have thrown an error");
            } catch (error) {
                assert(error.message.includes("Product must be received by retailer before purchase"));
            }
        });
    });

    describe("View Functions", () => {
        let productId1, productId2;

        beforeEach(async () => {
            const result1 = await supplyChain.createProduct(
                "Product 1", "Description 1", 0, 1000, productData.price, 
                productData.expiryDate, "Farm 1", { from: farmer }
            );
            productId1 = result1.logs[0].args.productId.toNumber();

            const result2 = await supplyChain.createProduct(
                "Product 2", "Description 2", 1, 2000, productData.price, 
                productData.expiryDate, "Farm 2", { from: farmer }
            );
            productId2 = result2.logs[0].args.productId.toNumber();
        });

        it("should get all products", async () => {
            const allProducts = await supplyChain.getAllProducts();
            assert.equal(allProducts.length, 2);
            assert.equal(allProducts[0].toNumber(), productId1);
            assert.equal(allProducts[1].toNumber(), productId2);
        });

        it("should get actor products", async () => {
            const farmerProducts = await supplyChain.getActorProducts(farmer);
            assert.equal(farmerProducts.length, 2);
            assert.equal(farmerProducts[0].toNumber(), productId1);
            assert.equal(farmerProducts[1].toNumber(), productId2);
        });

        it("should get all actors", async () => {
            const allActors = await supplyChain.getAllActors();
            assert.equal(allActors.length, 4);
            assert.equal(allActors[0], farmer);
            assert.equal(allActors[1], processor);
            assert.equal(allActors[2], distributor);
            assert.equal(allActors[3], retailer);
        });

        it("should check product expiry", async () => {
            const isExpired = await supplyChain.isProductExpired(productId1);
            assert.equal(isExpired, false);
        });

        it("should get total counts", async () => {
            const totalProducts = await supplyChain.getTotalProducts();
            const totalActors = await supplyChain.getTotalActors();
            
            assert.equal(totalProducts.toNumber(), 2);
            assert.equal(totalActors.toNumber(), 4);
        });
    });

    describe("Edge Cases", () => {
        it("should handle non-existent product gracefully", async () => {
            try {
                await supplyChain.getProduct(999);
                assert.fail("Should have thrown an error");
            } catch (error) {
                assert(error.message.includes("Product does not exist"));
            }
        });

        it("should not allow unregistered actors to perform actions", async () => {
            try {
                await supplyChain.createProduct(
                    productData.name, productData.description, productData.produceType,
                    productData.quantity, productData.price, productData.expiryDate,
                    productData.originFarm, { from: accounts[9] }
                );
                assert.fail("Should have thrown an error");
            } catch (error) {
                assert(error.message.includes("Only registered and active actors"));
            }
        });
    });
});