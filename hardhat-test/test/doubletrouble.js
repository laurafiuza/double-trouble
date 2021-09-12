const assert = require('assert');
const { time } = require("@openzeppelin/test-helpers");
const { ethers } = require("hardhat");
const { expect } = require("chai");

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';
const NON_PRESENT_ID = 79;
const PATRON = 7;

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
  let cp, dt, nft, tokenId, accounts, signers;

  before(async () => {
    // Deploy contracts
    const cpFactory = await ethers.getContractFactory('CryptoPunks');
    cp = await cpFactory.deploy();
    assert.notEqual(cp, undefined, "CryptoPunks contract instance is undefined.");

    const ptdFactory = await ethers.getContractFactory('PatronTokensDeployer');
    const ptd = await ptdFactory.deploy();

    const dtFactory = await ethers.getContractFactory('DoubleTrouble');
    dt = await dtFactory.deploy(ptd.address, 30, 2, 1, 130, "0xB5646985e2b562349D308090adb66Bb302a71634");

    signers = await ethers.getSigners();
    accounts = signers.map(s => s.address);

    // create simulated NFTs
    await cp.createNft(accounts[0]);

    // Done deploying. Test initial stuff
    assert.deepEqual(await registeredTokens(dt), [], "Must return empty registered tokens");

    tokenId = 0;

    const approval = await cp.approve(dt.address, tokenId);
    assert.notEqual(approval, undefined, "approval failed (undefined return value).");

    const initialPrice = 1;
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
    console.log(cp.address);
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

  it("DT supports 0xdeadbeef interface (DoubleTrouble)", async () => {
    assert.equal(await dt.supportsInterface("0xdeadbeef"), true);
  });

  it("DT supports 0x80ac58cd interface (ERC721)", async () => {
    assert.equal(await dt.supportsInterface("0x80ac58cd"), true);
  });

  it("DT should own the NFT after makeTroublesome", async () => {
    const cpOwnerAfter = await cp.ownerOf(cp.address, tokenId);
    assert.equal(cpOwnerAfter, dt.address, "DT contract must be the owner of the Crypto Punk");
  });

  it("accounts[0] should own the NFT within DT", async () => {
    assert.equal(await dt.ownerOf(cp.address, tokenId), accounts[0], "ownerAfter making DTable does not equal accounts[0].");
  });

  it("shouldn't allow transfering NFTs within DT", async () => {
    await assert.rejects(dt.transferFrom(accounts[0], accounts[1], tokenId), /revert/);
  });

  it("ownerOf should revert if we pass in a non present NFT", async () => {
    await assert.rejects(dt.ownerOf(cp.address, NON_PRESENT_ID), /revert ERC721/);
  });

  it("should not transfer if the NFT is not DTable", async () => {
    await assert.rejects(dt.transferFrom(accounts[0], accounts[1], NON_PRESENT_ID), /revert/);
  });

  it("lastPurchasePrice should return 0 if we pass in a non present NFT", async () => {
    assert.equal(await dt.lastPurchasePrice(cp.address, NON_PRESENT_ID), 0, "Last purchase price must be 0");
  });

  it("should put NFT up for sale", async () => {
    const forSalePrice = await dt.forSalePrice(cp.address, tokenId);
    assert.equal(forSalePrice, 0, "Initial for sale price should be 0");

    const ret = await dt.setPrice(cp.address, tokenId, 3456);
    assert(ret.receipt.status, true, "Transaction processing failed");

    const newForSalePrice = await dt.forSalePrice(cp.address, tokenId);
    assert.equal(newForSalePrice, 3456, "New for sale price should be 3456");
  });

  it("should proxy troublesomeTokenURI to original NFT", async () => {
    let tokenURI = await dt.troublesomeTokenURI(tokenId);
    let originalURI = await cp.tokenURI(tokenId);
    assert.equal(tokenURI, originalURI);
    assert.equal(tokenURI, "https://api.artblocks.io/token/0");
  });

  it("should not buy NFT if forSalePrice is 0", async () => {
    const ret = await dt.setPrice(cp.address, tokenId, 0);
    assert.equal(await dt.forSalePrice(cp.address, tokenId), 0, "Initial for sale price should be  0");

    await assert.rejects(dt.buy(cp.address, tokenId, {from: accounts[1], value: 2000}), /NFT is not for sale/);
    assert(await dt.ownerOf(cp.address, tokenId), accounts[0], "Ownership should still be accounts[0]");
  });

  it("should not buy NFT if paying less than the forSalePrice", async () => {
    const ret = await dt.setPrice(cp.address, tokenId, 3456);
    assert(ret.receipt.status, true, "Transaction processing failed");

    await assert.rejects(dt.buy(cp.address, tokenId, {from: accounts[1], value: 2000}), /must be at least/);
    assert(await dt.ownerOf(cp.address, tokenId), accounts[0], "Ownership should still be accounts[0]");
  });

  it("should not force buy NFT if lastPurchasePrice is 0", async () => {
    assert.equal(await dt.lastPurchasePrice(cp.address, 1), 0, "Initial last purchase price should be  0");

    await assert.rejects(dt.forceBuy(cp.address, 1, {from: accounts[2], value: 2000}), /NFT was not yet purchased/);
    assert(await dt.ownerOf(cp.address, tokenId), accounts[0], "Ownership should still be accounts[0]");
  });

  it("should buy and force buy NFTs, and distribute balances correctly", async () => {
    const addWei = (w1, w2) => {
      return web3.utils.toBN(w1).add(web3.utils.toBN(w2));
    };
    const subWei = (w1, w2) => {
      return web3.utils.toBN(w1).sub(web3.utils.toBN(w2));
    };
    const multWei = (w1, w2) => {
      return web3.utils.toBN(w1).mul(web3.utils.toBN(w2));
    };
    const divWei = (w1, w2) => {
      return web3.utils.toBN(w1).div(web3.utils.toBN(w2));
    };
    const price = web3.utils.toWei('2', 'ether');
    const doublePrice = web3.utils.toWei('4', 'ether');

    const ret = await dt.setPrice(cp.address, tokenId, price);
    assert(ret.receipt.status, true, "Transaction processing failed");

    assert.equal(await dt.forSalePrice(cp.address, tokenId), price, "For sale price should be > 0");

    let [sellerBalanceBefore, buyerBalanceBefore] =
      [await web3.eth.getBalance(accounts[0]), await web3.eth.getBalance(accounts[1])];

    let balanceTrblOwnerBefore = await web3.eth.getBalance(accounts[PATRON]);
    let buyTx = await dt.buy(cp.address, tokenId, {from: accounts[1], value: price});
    assert(await dt.ownerOf(cp.address, tokenId), accounts[1], "Ownership should now be accounts[1]");

    let [sellerBalanceAfter, buyerBalanceAfter] =
      [await web3.eth.getBalance(accounts[0]), await web3.eth.getBalance(accounts[1])];
    let gasUsed = multWei(buyTx.receipt.gasUsed, await web3.eth.getGasPrice());
    let feePaid = divWei(price, 65);

    // Ignores off by 1 errors in balance calculation, due to int divisions
    const assert_almost_equal = (bn1, bn2, msg) => {
      const one = web3.utils.toBN(1);
      assert(subWei(bn1, bn2).abs().lte(one), msg);
    };

    assert_almost_equal(sellerBalanceAfter, subWei(addWei(sellerBalanceBefore, price), feePaid), "Balance of accounts[0] must be bigger after buy");
    assert_almost_equal(buyerBalanceAfter, subWei(subWei(buyerBalanceBefore, price), gasUsed), "Balance of accounts[1] must be smaller after buy");

    let feeGotten = divWei(price, 130);
    let balanceTrblOwnerAfter = await web3.eth.getBalance(accounts[PATRON]);
    assert.equal(subWei(balanceTrblOwnerAfter, balanceTrblOwnerBefore).toString(), feeGotten.toString(), "Patron must have gotten their fee");

    assert.equal(await dt.forSalePrice(cp.address, tokenId), 0, "For sale price should be 0 after purchase");
    assert.equal(await dt.lastPurchasePrice(cp.address, tokenId), price, "Last purchase price should be > 0 after purchase");

    await assert.rejects(dt.forceBuy(cp.address, tokenId, {from: accounts[2], value: price}), /last purchase price/);

    [sellerBalanceBefore, buyerBalanceBefore] =
      [await web3.eth.getBalance(accounts[1]), await web3.eth.getBalance(accounts[2])];

    balanceTrblOwnerBefore = await web3.eth.getBalance(accounts[PATRON]);
    buyTx = await dt.forceBuy(cp.address, tokenId, {from: accounts[2], value: doublePrice});
    assert(await dt.ownerOf(cp.address, tokenId), accounts[2], "Ownership should now be accounts[2]");

    gasUsed = multWei(buyTx.receipt.gasUsed, await web3.eth.getGasPrice());
    [sellerBalanceAfter, buyerBalanceAfter] =
      [await web3.eth.getBalance(accounts[1]), await web3.eth.getBalance(accounts[2])];

    feePaid = divWei(doublePrice, 65);
    assert_almost_equal(sellerBalanceAfter, subWei(addWei(sellerBalanceBefore, doublePrice), feePaid), "Balance of accounts[1] must be bigger after buy");
    assert.equal(buyerBalanceAfter, subWei(subWei(buyerBalanceBefore, doublePrice), gasUsed), "Balance of accounts[2] must be smaller after buy");

    feeGotten = divWei(doublePrice, 130);
    balanceTrblOwnerAfter = await web3.eth.getBalance(accounts[PATRON]);
    assert.equal(subWei(balanceTrblOwnerAfter, balanceTrblOwnerBefore).toString(), feeGotten.toString(), "Patron must have gotten their fee");

    assert.equal(await dt.lastPurchasePrice(cp.address, tokenId), price * 2, "Last purchase price should be twice as big");
    assert.equal(await dt.forSalePrice(cp.address, tokenId), 0, "For sale price should be 0 after purchase");
  });

  it("non owner should not withdraw NFT", async () => {
    await assert.rejects(dt.withdraw(cp.address, 0, {from: accounts[5]}), /approved or owner/);
  });

  it("owner should not withdraw NFT before deadline", async () => {
    await time.increase(time.duration.days(20));
    await assert.rejects(dt.withdraw(cp.address, 0, {from: accounts[2]}), /NFT not yet available/);
  });

  it("allKnownTokens should return correct last purchase price", async () => {
    const all = await dt.allKnownTokens();
    assert.equal(all.length, 2, "Must have two known tokens");
    assert.equal(all[0].tokenId, '0', "Token ID must match");
    assert.equal(all[0].lastPurchasePrice, '4000000000000000000', "Last purchase price must match");

    assert.equal(all[1].tokenId, '1', "Token ID must match");
    assert.equal(all[1].lastPurchasePrice, '0', "Last purchase price must match");
  });

  it("should return the correct registered tokens in a given collection", async () => {
    let registered = (await registeredTokens(dt)).map(t => { return t.words[0] });
    assert.deepEqual(registered, [0], "Number of registered tokens does not match");

    // Add token 2
    assert.notEqual(await cp.approve(dt.address, 2), undefined, "approval failed (undefined return value).");

    const initialPrice = 1234;
    assert.notEqual(await dt.setPrice(cp.address, 2, initialPrice), undefined, "setPrice failed");

    registered = (await registeredTokens(dt)).map(t => { return t.words[0] });
    assert.deepEqual(registered, [0], "Number of registered tokens does not match");

    await dt.buy(cp.address, 2, {from: accounts[1], value: initialPrice});

    registered = (await registeredTokens(dt)).map(t => { return t.words[0] });
    assert.deepEqual(registered, [0, 2], "Number of registered tokens does not match");

    // Add token 1
    assert.notEqual(await cp.approve(dt.address, 1), undefined, "approval failed (undefined return value).");
    assert.notEqual(await dt.setPrice(cp.address, 1, initialPrice), undefined, "setPrice failed");

    registered = (await registeredTokens(dt)).map(t => { return t.words[0] });
    assert.deepEqual(registered, [0, 2], "Number of registered tokens does not match");

    await dt.buy(cp.address, 1, {from: accounts[1], value: initialPrice});

    registered = (await registeredTokens(dt)).map(t => { return t.words[0] });
    assert.deepEqual(registered, [0, 1, 2], "Number of registered tokens does not match");

    assert(await dt.timeTowithdraw(cp.address, 2) > 0, "Still have some time to Withdraw");
    await time.increase(time.duration.days(31));
    assert(await dt.timeTowithdraw(cp.address, 2) < 0, "Can already withdraw");

    // Withdraw token 2
    await dt.withdraw(cp.address, 2, {from: accounts[1], value: Math.floor(initialPrice / 65)});

    registered = (await registeredTokens(dt)).map(t => { return t.words[0] });
    assert.deepEqual(registered, [0, 1], "Number of registered tokens does not match");

    // Withdraw token 1
    await dt.withdraw(cp.address, 1, {from: accounts[1], value: Math.floor(initialPrice / 65)});

    registered = (await registeredTokens(dt)).map(t => { return t.words[0] });
    assert.deepEqual(registered, [0], "Number of registered tokens does not match");
  });

  it("tokenURI should output metadata pointing to double-trouble.io", async () => {
    let [nix, b64] = (await dt.tokenURI(0)).split(',');
    let metadata = JSON.parse(Buffer.from(b64, 'base64').toString());
    assert.equal(metadata.name, 'DEADBEEF', "Name must be DEADBEEF");
    assert.equal(metadata.originalCollection.toUpperCase(), cp.address.toUpperCase(), "original collection in metadata must match");
    assert.equal(metadata.troublesomeCollection.toUpperCase(), dt.address.toUpperCase(), "troublesome collection in metadata must match");

    let externalLink = `https://double-trouble.io/collections/${dt.address.toLowerCase()}/0`;
    assert.equal(metadata.external_link, externalLink, 'External link must match');

    [nix, b64] = (await dt.tokenURI(1)).split(',');
    metadata = JSON.parse(Buffer.from(b64, 'base64').toString());
    assert.equal(metadata.name, 'DEADBEEF', "Name must be DEADBEEF");
    assert.equal(metadata.originalCollection, cp.address.toLowerCase(), "original collection in metadata must match");
    assert.equal(metadata.troublesomeCollection, dt.address.toLowerCase(), "troublesome collection in metadata must match");

    externalLink = `https://double-trouble.io/collections/${dt.address.toLowerCase()}/1`;
    assert.equal(metadata.external_link, externalLink, 'External link must match');
  });

  it("owner should withdraw NFT after deadline", async () => {
    await time.increase(time.duration.days(30));
    await assert.rejects(dt.withdraw(cp.address, 0, {from: accounts[2]}), /Must pay fee/);
    const lastPurchasePrice = await dt.lastPurchasePrice(cp.address, 0);
    await assert.notEqual(await dt.withdraw(cp.address, 0, {from: accounts[2], value: lastPurchasePrice / 65}), undefined, "Must withdraw after deadline");

    assert.equal(await cp.ownerOf(cp.address, 0), accounts[2], "accounts 2 must be the owner of the Crypto Punk");
    await assert.rejects(dt.ownerOf(cp.address, 0), /nonexistent token/);
    assert.equal(await dt.lastPurchasePrice(cp.address, 0), 0, "lastPurchasePrice must now be 0");
  });

  it("allKnownTokens should return info about every token we interacted with", async () => {
    assert.equal((await dt.allKnownTokens()).length, 3, "Must have 3 known tokens");
  });
});
