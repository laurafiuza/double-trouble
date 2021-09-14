const assert = require('assert');
const { time } = require("@openzeppelin/test-helpers");
const { ethers } = require("hardhat");
const { expect } = require("chai");

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';
const NON_PRESENT_ID = 79;
const PATRON = 7;
const FEE_WALLET = 9;

const registeredTokens = async (dt) => {
  return (await dt.allKnownTokens()).filter(({tokenId, lastPurchasePrice}) => {
    return lastPurchasePrice > 0;
  }).map((t) => {
    // FIXME: Simulates old dt.registeredTokens legacy behavior to make old tests pass
    return {words: [t.tokenId]}
  });
}

describe("DoubleTrouble", () => {
  // TODO: make tokenId the return value of the createNft function
  // currently, the return value is a transaction object for some reason,
  // how do we retrieve the return value?
  let cp, dt, pt, nft, tokenId, accounts, signers;

  before(async () => {
    // Deploy contracts
    const cpFactory = await ethers.getContractFactory('CryptoPunks');
    cp = await cpFactory.deploy();
    assert.notEqual(cp, undefined, "CryptoPunks contract instance is undefined.");

    const ptdFactory = await ethers.getContractFactory('PatronTokensDeployer');
    const ptd = await ptdFactory.deploy();

    signers = await ethers.getSigners();
    accounts = signers.map(s => s.address);

    const dtFactory = await ethers.getContractFactory('DoubleTrouble');
    dt = await dtFactory.deploy(ptd.address, 30, 2, 1, 130, accounts[FEE_WALLET]);

    const ptAddr = await dt.patronTokensCollection();
    pt = await ethers.getContractAt('PatronTokens', ptAddr);
    assert.equal(pt.address, ptAddr, 'Patron Tokens address must match');

    // create simulated NFTs
    await cp.createNft(accounts[0]); // 0, 1, 2
    await cp.createNft(accounts[PATRON]); // 3, 4, 5

    // Done deploying. Test initial stuff
    assert.deepEqual(await registeredTokens(dt), [], "Must return empty registered tokens");

    // Ensure Patron is the patron
    const initialPrice = 1;
    await cp.connect(signers[PATRON]).approve(dt.address, 3);
    await dt.connect(signers[PATRON]).setPrice(cp.address, 3, initialPrice);
    await dt.connect(signers[PATRON + 1]).buy(cp.address, 3, {value: initialPrice})

    assert.equal(accounts[PATRON], await pt.patronOf(cp.address), 'Patron must have been created for CP');

    tokenId = 0;

    const approval = await cp.approve(dt.address, tokenId);
    assert.notEqual(approval, undefined, "approval failed (undefined return value).");

    ret = await dt.setPrice(cp.address, tokenId, initialPrice);
    assert.notEqual(ret, undefined, "setPrice failed (undefined return value).");
/*
    truffleAssert.eventEmitted(ret, 'SetPrice', (ev) => {
      return ev.msgSender == accounts[0] && ev.tokenId == tokenId && ev.price == initialPrice;
    });
    */

    const forSalePrice = await dt.forSalePrice(cp.address, tokenId);
    assert.equal(forSalePrice, initialPrice, "Initial for sale price should be > 0");

    const lastPurchasePrice = await dt.lastPurchasePrice(cp.address, tokenId);
    assert.equal(lastPurchasePrice, 0, "Initial last purchase should be 0");

    let tx = await dt.connect(signers[1]).buy(cp.address, tokenId, {value: initialPrice});
    /*
    truffleAssert.eventEmitted(tx, 'Buy', (ev) => {
      return ev.oldOwner == accounts[0] && ev.newOwner == accounts[1] && ev.tokenId == tokenId &&
        ev.valueSent == initialPrice && ev.amountPaid == initialPrice;
    });
    */

    assert.equal(await dt.ownerOf(cp.address, tokenId), accounts[1], "owner must be accounts[1].");

    assert.equal(await dt.forSalePrice(cp.address, tokenId), 0, "For sale price should now be 0");
    assert.equal(await dt.lastPurchasePrice(cp.address, tokenId), initialPrice, "Last purchase price should now be > 0");

    tx = await dt.forceBuy(cp.address, tokenId, {value: initialPrice * 2});
    /*
    truffleAssert.eventEmitted(tx, 'ForceBuy', (ev) => {
      return ev.oldOwner == accounts[1] && ev.newOwner == accounts[0] && ev.tokenId == tokenId &&
        ev.valueSent == initialPrice * 2 && ev.lastPurchasePrice == initialPrice;
    });
    */

    assert.equal(await dt.ownerOf(cp.address, tokenId), accounts[0], "owner must be accounts[0].");
    assert.equal(await dt.forSalePrice(cp.address, tokenId), 0, "For sale price should now be 0");
    assert.equal(await dt.lastPurchasePrice(cp.address, tokenId), initialPrice * 2, "Last purchase price should now be > 0");
  });

  it("setPrice should fail for tokenID that doesn't exist", async () => {
    const nonExistentTokenId = 555;
    await assert.rejects(dt.setPrice(cp.address, nonExistentTokenId, 1234), /nonexistent token/);
  });

  it("buy should fail without approval", async () => {
    assert.notEqual(await dt.setPrice(cp.address, 1, 1234), undefined, "setPrice failed (undefined return value).");
    await assert.rejects(dt.connect(signers[4]).buy(cp.address, 1, {value: 1234}), /must be approved/);
  });

  it("setPrice should fail if msg.sender doesnt own NFT", async () => {
    assert.notEqual(await cp.approve(dt.address, 1), undefined, "approval failed (undefined return value).");
    await assert.rejects(dt.connect(signers[4]).setPrice(cp.address, 1, 1), /approved or owner/);
    await assert.rejects(dt.connect(signers[4]).buy(cp.address, 1, {value: 1}), /at least the for sale price/);
  });

  it("DT should own the NFT after makeTroublesome", async () => {
    const cpOwnerAfter = await cp.ownerOf(tokenId);
    assert.equal(cpOwnerAfter, dt.address, "DT contract must be the owner of the Crypto Punk");
  });

  it("accounts[0] should own the NFT within DT", async () => {
    assert.equal(await dt.ownerOf(cp.address, tokenId), accounts[0], "ownerAfter making DTable does not equal accounts[0].");
  });

  it("lastPurchasePrice should return 0 if we pass in a non present NFT", async () => {
    assert.equal(await dt.lastPurchasePrice(cp.address, NON_PRESENT_ID), 0, "Last purchase price must be 0");
  });

  it("should put NFT up for sale", async () => {
    const forSalePrice = await dt.forSalePrice(cp.address, tokenId);
    assert.equal(forSalePrice, 0, "Initial for sale price should be 0");

    await dt.setPrice(cp.address, tokenId, 3456);

    const newForSalePrice = await dt.forSalePrice(cp.address, tokenId);
    assert.equal(newForSalePrice, 3456, "New for sale price should be 3456");
  });

  it("should proxy originalTokenURI to original NFT", async () => {
    let tokenURI = await dt.originalTokenURI(cp.address, tokenId);
    let originalURI = await cp.tokenURI(tokenId);
    assert.equal(tokenURI, originalURI);
    assert.equal(tokenURI, "https://api.artblocks.io/token/0");
  });

  it("should not buy NFT if forSalePrice is 0", async () => {
    const ret = await dt.setPrice(cp.address, tokenId, 0);
    assert.equal(await dt.forSalePrice(cp.address, tokenId), 0, "Initial for sale price should be  0");

    await assert.rejects(dt.connect(signers[1]).buy(cp.address, tokenId, {value: 2000}), /NFT is not for sale/);
    assert(await dt.ownerOf(cp.address, tokenId), accounts[0], "Ownership should still be accounts[0]");
  });

  it("should not buy NFT if paying less than the forSalePrice", async () => {
    await dt.setPrice(cp.address, tokenId, 3456);
    await assert.rejects(dt.connect(signers[1]).buy(cp.address, tokenId, {value: 2000}), /must be at least/);
    assert(await dt.ownerOf(cp.address, tokenId), accounts[0], "Ownership should still be accounts[0]");
  });

  it("should not force buy NFT if lastPurchasePrice is 0", async () => {
    assert.equal(await dt.lastPurchasePrice(cp.address, 1), 0, "Initial last purchase price should be  0");

    await assert.rejects(dt.connect(signers[2]).forceBuy(cp.address, 1, {value: 2000}), /NFT was not yet purchased/);
    assert(await dt.ownerOf(cp.address, tokenId), accounts[0], "Ownership should still be accounts[0]");
  });

  it("should buy and force buy NFTs, and distribute balances correctly", async () => {
    const price = ethers.utils.parseEther('2');
    const doublePrice = ethers.utils.parseEther('4');

    await dt.setPrice(cp.address, tokenId, price);

    assert((await dt.forSalePrice(cp.address, tokenId)).eq(price), "For sale price should be > 0");

    let [sellerBalanceBefore, buyerBalanceBefore] =
      [await ethers.provider.getBalance(accounts[0]), await ethers.provider.getBalance(accounts[1])];

    let balanceTrblOwnerBefore = await ethers.provider.getBalance(accounts[PATRON]);
    let buyTx = await dt.connect(signers[1]).buy(cp.address, tokenId, {value: price});
    let buyReceipt = await buyTx.wait();
    assert(await dt.ownerOf(cp.address, tokenId), accounts[1], "Ownership should now be accounts[1]");

    let [sellerBalanceAfter, buyerBalanceAfter] =
      [await ethers.provider.getBalance(accounts[0]), await ethers.provider.getBalance(accounts[1])];
    let feePaid = price.div(ethers.BigNumber.from(65));

    // Ignores off by 1 errors in balance calculation, due to int divisions
    const assert_almost_equal = (bn1, bn2, msg) => {
      assert(bn1.sub(bn2).abs().lte(ethers.BigNumber.from(1)), msg);
    };
    let gasCost = buyReceipt.effectiveGasPrice.mul(buyReceipt.gasUsed)

    assert_almost_equal(sellerBalanceAfter, sellerBalanceBefore.add(price).sub(feePaid), "Balance of accounts[0] must be bigger after buy");
    assert_almost_equal(buyerBalanceAfter, buyerBalanceBefore.sub(price).sub(gasCost), "Balance of accounts[1] must be smaller after buy");

    let feeGotten = price.div(130);
    let balanceTrblOwnerAfter = await ethers.provider.getBalance(accounts[PATRON]);
    assert.equal(balanceTrblOwnerAfter.sub(balanceTrblOwnerBefore).toString(), feeGotten.toString(), "Patron must have gotten their fee");

    assert.equal(await dt.forSalePrice(cp.address, tokenId), 0, "For sale price should be 0 after purchase");
    assert((await dt.lastPurchasePrice(cp.address, tokenId)).eq(price), "Last purchase price should be > 0 after purchase");

    await assert.rejects(dt.connect(signers[2]).forceBuy(cp.address, tokenId, {value: price}), /last purchase price/);

    [sellerBalanceBefore, buyerBalanceBefore] =
      [await ethers.provider.getBalance(accounts[1]), await ethers.provider.getBalance(accounts[2])];

    balanceTrblOwnerBefore = await ethers.provider.getBalance(accounts[PATRON]);
    buyTx = await dt.connect(signers[2]).forceBuy(cp.address, tokenId, {value: doublePrice});
    buyReceipt = await buyTx.wait();
    assert(await dt.ownerOf(cp.address, tokenId), accounts[2], "Ownership should now be accounts[2]");

    [sellerBalanceAfter, buyerBalanceAfter] =
      [await ethers.provider.getBalance(accounts[1]), await ethers.provider.getBalance(accounts[2])];

    feePaid = doublePrice.div(ethers.BigNumber.from(65));
    gasCost = buyReceipt.effectiveGasPrice.mul(buyReceipt.gasUsed);

    assert_almost_equal(sellerBalanceAfter, sellerBalanceBefore.add(doublePrice).sub(feePaid), "Balance of accounts[1] must be bigger after buy");
    assert(buyerBalanceAfter.eq(buyerBalanceBefore.sub(doublePrice).sub(gasCost)), "Balance of accounts[2] must be smaller after buy");

    feeGotten = doublePrice.div(ethers.BigNumber.from(130));
    balanceTrblOwnerAfter = await ethers.provider.getBalance(accounts[PATRON]);
    assert.equal(balanceTrblOwnerAfter.sub(balanceTrblOwnerBefore).toString(), feeGotten.toString(), "Patron must have gotten their fee");

    assert.equal(await dt.lastPurchasePrice(cp.address, tokenId), price * 2, "Last purchase price should be twice as big");
    assert.equal(await dt.forSalePrice(cp.address, tokenId), 0, "For sale price should be 0 after purchase");
  });

  it("non owner should not withdraw NFT", async () => {
    await assert.rejects(dt.connect(signers[5]).withdraw(cp.address, 0), /should be owner/);
  });

  it("owner should not withdraw NFT before deadline", async () => {
    await ethers.provider.send("evm_increaseTime", [20 * 24 * 60 * 60])
    await ethers.provider.send("evm_mine")

    await assert.rejects(dt.connect(signers[2]).withdraw(cp.address, 0), /NFT not yet available/);
  });

  it("allKnownTokens should return correct last purchase price", async () => {
    const all = await dt.allKnownTokens();
    assert.equal(all.length, 3, "Must have three known tokens");
    assert.equal(all[1].tokenId.toString(), '0', "Token ID must match");
    assert.equal(all[1].lastPurchasePrice.toString(), '4000000000000000000', "Last purchase price must match");

    assert.equal(all[2].tokenId.toString(), '1', "Token ID must match");
    assert.equal(all[2].lastPurchasePrice.toString(), '0', "Last purchase price must match");
  });

  it("should return the correct registered tokens in a given collection", async () => {
    let registered = (await registeredTokens(dt)).map(t => { return t.words[0].toNumber() });
    assert.deepEqual(registered, [3, 0], "Number of registered tokens does not match");

    // Add token 2
    assert.notEqual(await cp.approve(dt.address, 2), undefined, "approval failed (undefined return value).");

    const initialPrice = 1234;
    assert.notEqual(await dt.setPrice(cp.address, 2, initialPrice), undefined, "setPrice failed");

    registered = (await registeredTokens(dt)).map(t => { return t.words[0].toNumber() });
    assert.deepEqual(registered, [3, 0], "Number of registered tokens does not match");

    await dt.connect(signers[1]).buy(cp.address, 2, {value: initialPrice});

    registered = (await registeredTokens(dt)).map(t => { return t.words[0].toNumber() });
    assert.deepEqual(registered, [3, 0, 2], "Number of registered tokens does not match");

    // Add token 1
    assert.notEqual(await cp.approve(dt.address, 1), undefined, "approval failed (undefined return value).");
    assert.notEqual(await dt.setPrice(cp.address, 1, initialPrice), undefined, "setPrice failed");

    registered = (await registeredTokens(dt)).map(t => { return t.words[0].toNumber() });
    assert.deepEqual(registered, [3, 0, 2], "Number of registered tokens does not match");

    await dt.connect(signers[1]).buy(cp.address, 1, {value: initialPrice});

    registered = (await registeredTokens(dt)).map(t => { return t.words[0].toNumber() });
    assert.deepEqual(registered, [3, 0, 1, 2], "Number of registered tokens does not match");

    assert(await dt.secondsToWithdraw(cp.address, 2) > 0, "Still have some time to Withdraw");

    await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60])
    await ethers.provider.send("evm_mine")

    assert(await dt.secondsToWithdraw(cp.address, 2) < 0, "Can already withdraw");

    // Withdraw token 2
    await dt.connect(signers[1]).withdraw(cp.address, 2, {value: Math.floor(initialPrice / 65)});

    registered = (await registeredTokens(dt)).map(t => { return t.words[0].toNumber() });
    assert.deepEqual(registered, [3, 0, 1], "Number of registered tokens does not match");

    // Withdraw token 1
    await dt.connect(signers[1]).withdraw(cp.address, 1, {value: Math.floor(initialPrice / 65)});

    registered = (await registeredTokens(dt)).map(t => { return t.words[0].toNumber() });
    assert.deepEqual(registered, [3, 0], "Number of registered tokens does not match");
  });

  it("owner should withdraw NFT after deadline", async () => {
    await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60])
    await ethers.provider.send("evm_mine")

    await assert.rejects(dt.connect(signers[2]).withdraw(cp.address, 0), /Must pay fee/);
    const lastPurchasePrice = await dt.lastPurchasePrice(cp.address, 0);
    await assert.notEqual(await dt.connect(signers[2]).withdraw(cp.address, 0, {value: lastPurchasePrice.div(ethers.BigNumber.from(65))}), undefined, "Must withdraw after deadline");

    assert.equal(await cp.ownerOf(0), accounts[2], "accounts 2 must be the owner of the Crypto Punk");
    assert.equal(await dt.ownerOf(cp.address, 0), ZERO_ADDR, "Owner in DT must be no-one");
    assert.equal(await dt.lastPurchasePrice(cp.address, 0), 0, "lastPurchasePrice must now be 0");
  });

  it("allKnownTokens should return info about every token we interacted with", async () => {
    assert.equal((await dt.allKnownTokens()).length, 4, "Must have 4 known tokens");
  });
});
