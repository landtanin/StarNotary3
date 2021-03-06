const StarNotary = artifacts.require("StarNotary");

var accounts;
var owner;

contract('StarNotary', (accs) => {
    accounts = accs;
    owner = accounts[0];
});

it('can Create a Star', async () => {
    let tokenId = 1;
    let instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star!', tokenId, {
        from: accounts[0]
    });
    const starObject = await instance.tokenIdToStarInfo.call(tokenId);
    assert.equal(starObject.name, 'Awesome Star!')
});

it('lets user1 put up their star for sale', async () => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 2;
    let starPrice = web3.utils.toWei(".01", "ether");
    await instance.createStar('awesome star', starId, {
        from: user1
    });
    await instance.putStarUpForSale(starId, starPrice, {
        from: user1
    });
    assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it('lets user1 get the funds after the sale', async () => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 3;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {
        from: user1
    });
    await instance.putStarUpForSale(starId, starPrice, {
        from: user1
    });
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);

    // give user2 one time approval to transfer token with ID = starId
    const receipt = await instance.allowManaging(starId, user2, {
        from: user1
    });
    // we can add `gasPrice:0` to the trailing closure and ignore the fee calculation below
    await instance.buyStar(starId, {
        from: user2,
        value: balance
    });

    let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
    let actual = Number(balanceOfUser1AfterTransaction);

    // Obtain gas used from the receipt
    const gasUsed = receipt.receipt.gasUsed;

    // Obtain gasPrice from the transaction
    const tx = await web3.eth.getTransaction(receipt.tx);
    const gasPrice = tx.gasPrice;

    let fee = Number(gasPrice) * Number(gasUsed);
    let exp = Number(balanceOfUser1BeforeTransaction) + Number(starPrice) - Number(fee);
    assert.equal(actual, exp);
});

it('lets user2 buy a star, if it is put up for sale, user2 owns the star', async () => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 4;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {
        from: user1
    });
    await instance.putStarUpForSale(starId, starPrice, {
        from: user1
    });
    await instance.allowManaging(starId, user2, {
        from: user1
    });
    await instance.buyStar(starId, {
        from: user2,
        value: balance
    });
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lets user2 buy a star and decreases its balance in ether', async () => {

    // given
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 5;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");

    await instance.createStar('awesome star', starId, {
        from: user1
    });
    await instance.putStarUpForSale(starId, starPrice, {
        from: user1
    });
    const balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.allowManaging(starId, user2, {
        from: user1
    });

    // when
    const receipt = await instance.buyStar(starId, {
        from: user2,
        value: balance,
        gasPrice: 0
    });

    // then
    const balanceAfterUser2BuysStar = await web3.eth.getBalance(user2);
    let value = Number(balanceOfUser2BeforeTransaction) - Number(balanceAfterUser2BuysStar);
    assert.equal(value, starPrice);
});

// Implement Task 2 Add supporting unit tests

it('can add the star name and star symbol properly', async () => {
    // 1. create a Star with different tokenId
    //2. Call the name and symbol properties in your Smart Contract and compare with the name and symbol provided
    
    let instance = await StarNotary.deployed();
    
    const name = await instance.name();
    const symbol = await instance.symbol();
    
    assert.equal("StarNotary", name);
    assert.equal("STN", symbol);
});

it('lets 2 users exchange stars', async () => {
    // 1. create 2 Stars with different tokenId
    // 2. Call the exchangeStars functions implemented in the Smart Contract
    // 3. Verify that the owners changed
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId1 = 100;
    await instance.createStar('Star 1', starId1, {
        from: user1
    });

    let user2 = accounts[2];
    let starId2 = 200;
    await instance.createStar('Star 2', starId2, {
        from: user2
    });

    await instance.allowManaging(starId1, user2, {
        from: user1
    });
    await instance.exchangeStars(starId1, starId2, {from: user2});

    assert.equal(await instance.ownerOf.call(starId1), user2);
    assert.equal(await instance.ownerOf.call(starId2), user1);
});

it('lets a user transfer a star', async () => {
    // 1. create a Star with different tokenId
    // 2. use the transferStar function implemented in the Smart Contract
    // 3. Verify the star owner changed.
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 9;

    await instance.createStar('Star 1', starId, {
        from: user1
    });

    await instance.transferStar(user2, starId, {from: user1});

    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lookUptokenIdToStarInfo test', async () => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 10;
    await instance.createStar('awesome star', starId, {
        from: user1
    });
    assert.equal(await instance.lookUptokenIdToStarInfo.call(starId), 'awesome star');
});