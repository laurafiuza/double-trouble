const assert = require('assert');
const CryptoPunks = artifacts.require("./CryptoPunks.sol");
const DoubleTroubleOrchestrator = artifacts.require("./DoubleTroubleOrchestrator.sol");
const DoubleTrouble = artifacts.require("./DoubleTrouble.sol");

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';
const NON_PRESENT_ID = 79;
const TRBL_OWNER = 7;

contract("DoubleTrouble", accounts => {
  // TODO: make tokenId the return value of the createNft function
  // currently, the return value is a transaction object for some reason,
  // how do we retrieve the return value?
  var cp, dto, dt, nft, tokenId;

  before(async () => {
    cp = await CryptoPunks.deployed();
    assert.notEqual(cp, undefined, "CryptoPunks contract instance is undefined.");
    dto = await DoubleTroubleOrchestrator.deployed();
    assert.notEqual(dto, undefined, "DoubleTroubleOrchestrator contract instance is undefined.");

    let ret = await dto.makeTroublesomeCollection(cp.address, "DTCryptoPunks", "DUNK", {from: accounts[TRBL_OWNER]});
    assert(ret.receipt.status, true, "Transaction processing failed");

    const dt_address = await dto.troublesomeCollection(cp.address);
    assert.notEqual(dt_address, undefined, "dt_address is undefined.");

    dt = await DoubleTrouble.at(dt_address);
    assert.equal(dt_address, dt.address, "Address returned by orchestrator must match dt.deployed().");

    tokenId = 0;
    web3.eth.defaultAccount = accounts[0];

    const approval = await cp.approve(dt.address, tokenId);
    assert.notEqual(approval, undefined, "approval failed (undefined return value).");

    const initialPrice = 1;
    ret = await dt.setPrice(tokenId, initialPrice);
    assert.notEqual(ret, undefined, "setPrice failed (undefined return value).");

    const forSalePrice = await dt.forSalePrice(tokenId);
    assert.equal(forSalePrice, initialPrice, "Initial for sale price should be > 0");

    const lastPurchasePrice = await dt.lastPurchasePrice(tokenId);
    assert.equal(lastPurchasePrice, 0, "Initial last purchase should be 0");

    await dt.buy(tokenId, {from: accounts[1], value: initialPrice});

    assert.equal(await dt.ownerOf(tokenId), accounts[1], "owner must be accounts[1].");

    assert.equal(await dt.forSalePrice(tokenId), 0, "For sale price should now be 0");
    assert.equal(await dt.lastPurchasePrice(tokenId), initialPrice, "Last purchase price should now be > 0");

    await dt.forceBuy(tokenId, {from: accounts[0], value: initialPrice * 2});

    assert.equal(await dt.ownerOf(tokenId), accounts[0], "owner must be accounts[0].");
    assert.equal(await dt.forSalePrice(tokenId), 0, "For sale price should now be 0");
    assert.equal(await dt.lastPurchasePrice(tokenId), initialPrice * 2, "Last purchase price should now be > 0");
  });


  it("setPrice should fail without approval", async () => {
    await assert.rejects(dt.setPrice(1, 1234), /must be approved/);
  });

  it("setPrice should fail for tokenID that doesn't exist", async () => {
    const nonExistentTokenId = 555;
    await assert.rejects(dt.setPrice(nonExistentTokenId, 1234), /nonexistent token/);
  });

  it("DT contract records the original Collection", async () => {
    assert.equal(await dt.originalCollection(), cp.address, "Original Collection must match CryptoPunks address");
  });

  it("DT supports 0xdeadbeef interface (DoubleTrouble)", async () => {
    assert.equal(await dt.supportsInterface("0xdeadbeef"), true);
  });

  it("DT supports 0x80ac58cd interface (ERC721)", async () => {
    assert.equal(await dt.supportsInterface("0x80ac58cd"), true);
  });

  it("DT should own the NFT after makeTroublesome", async () => {
    const cpOwnerAfter = await cp.ownerOf(tokenId);
    assert.equal(cpOwnerAfter, dt.address, "DT contract must be the owner of the Crypto Punk");
  });

  it("accounts[0] should own the NFT within DT", async () => {
    assert.equal(await dt.ownerOf(tokenId), accounts[0], "ownerAfter making DTable does not equal accounts[0].");
  });

  it("shouldn't allow transfering NFTs within DT", async () => {
    await assert.rejects(dt.transferFrom(accounts[0], accounts[1], tokenId), /revert/);
  });

  it("ownerOf should revert if we pass in a non present NFT", async () => {
    await assert.rejects(dt.ownerOf(NON_PRESENT_ID), /revert ERC721/);
  });

  it("should not transfer if the NFT is not DTable", async () => {
    await assert.rejects(dt.transferFrom(accounts[0], accounts[1], NON_PRESENT_ID), /revert/);
  });

  it("lastPurchasePrice should return 0 if we pass in a non present NFT", async () => {
    assert.equal(await dt.lastPurchasePrice(NON_PRESENT_ID), 0, "Last purchase price must be 0");
  });

  it("should put NFT up for sale", async () => {
    const forSalePrice = await dt.forSalePrice(tokenId);
    assert.equal(forSalePrice, 0, "Initial for sale price should be 0");

    const ret = await dt.setPrice(tokenId, 3456);
    assert(ret.receipt.status, true, "Transaction processing failed");

    const newForSalePrice = await dt.forSalePrice(tokenId);
    assert.equal(newForSalePrice, 3456, "New for sale price should be 3456");
  });

  it("should proxy troublesomeTokenURI to original NFT", async () => {
    let tokenURI = await dt.troublesomeTokenURI(tokenId);
    let originalURI = await cp.tokenURI(tokenId);
    assert.equal(tokenURI, originalURI);
    assert.equal(tokenURI, "https://api.artblocks.io/token/0");
  });

  it("should not buy NFT if forSalePrice is 0", async () => {
    const ret = await dt.setPrice(tokenId, 0);
    assert.equal(await dt.forSalePrice(tokenId), 0, "Initial for sale price should be  0");

    await assert.rejects(dt.buy(tokenId, {from: accounts[1], value: 2000}), /NFT is not for sale/);
    assert(await dt.ownerOf(tokenId), accounts[0], "Ownership should still be accounts[0]");
  });

  it("should not buy NFT if paying less than the forSalePrice", async () => {
    const ret = await dt.setPrice(tokenId, 3456);
    assert(ret.receipt.status, true, "Transaction processing failed");

    await assert.rejects(dt.buy(tokenId, {from: accounts[1], value: 2000}), /must be at least/);
    assert(await dt.ownerOf(tokenId), accounts[0], "Ownership should still be accounts[0]");
  });

  it("should not force buy NFT if lastPurchasePrice is 0", async () => {
    assert.equal(await dt.lastPurchasePrice(1), 0, "Initial last purchase price should be  0");

    await assert.rejects(dt.forceBuy(1, {from: accounts[2], value: 2000}), /NFT was not yet purchased/);
    assert(await dt.ownerOf(tokenId), accounts[0], "Ownership should still be accounts[0]");
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

    const ret = await dt.setPrice(tokenId, price);
    assert(ret.receipt.status, true, "Transaction processing failed");

    assert.equal(await dt.forSalePrice(tokenId), price, "For sale price should be > 0");

    let [sellerBalanceBefore, buyerBalanceBefore] =
      [await web3.eth.getBalance(accounts[0]), await web3.eth.getBalance(accounts[1])];

    let balanceTrblOwnerBefore = await web3.eth.getBalance(accounts[TRBL_OWNER]);
    let buyTx = await dt.buy(tokenId, {from: accounts[1], value: price});
    assert(await dt.ownerOf(tokenId), accounts[1], "Ownership should now be accounts[1]");

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
    let balanceTrblOwnerAfter = await web3.eth.getBalance(accounts[TRBL_OWNER]);
    assert.equal(subWei(balanceTrblOwnerAfter, balanceTrblOwnerBefore).toString(), feeGotten.toString(), "TRBL owner must have gotten their fee");

    assert.equal(await dt.forSalePrice(tokenId), 0, "For sale price should be 0 after purchase");
    assert.equal(await dt.lastPurchasePrice(tokenId), price, "Last purchase price should be > 0 after purchase");

    await assert.rejects(dt.forceBuy(tokenId, {from: accounts[2], value: price}), /last purchase price/);

    [sellerBalanceBefore, buyerBalanceBefore] =
      [await web3.eth.getBalance(accounts[1]), await web3.eth.getBalance(accounts[2])];

    balanceTrblOwnerBefore = await web3.eth.getBalance(accounts[TRBL_OWNER]);
    buyTx = await dt.forceBuy(tokenId, {from: accounts[2], value: doublePrice});
    assert(await dt.ownerOf(tokenId), accounts[2], "Ownership should now be accounts[2]");

    gasUsed = multWei(buyTx.receipt.gasUsed, await web3.eth.getGasPrice());
    [sellerBalanceAfter, buyerBalanceAfter] =
      [await web3.eth.getBalance(accounts[1]), await web3.eth.getBalance(accounts[2])];

    feePaid = divWei(doublePrice, 65);
    assert_almost_equal(sellerBalanceAfter, subWei(addWei(sellerBalanceBefore, doublePrice), feePaid), "Balance of accounts[1] must be bigger after buy");
    assert.equal(buyerBalanceAfter, subWei(subWei(buyerBalanceBefore, doublePrice), gasUsed), "Balance of accounts[2] must be smaller after buy");

    feeGotten = divWei(doublePrice, 130);
    balanceTrblOwnerAfter = await web3.eth.getBalance(accounts[TRBL_OWNER]);
    assert.equal(subWei(balanceTrblOwnerAfter, balanceTrblOwnerBefore).toString(), feeGotten.toString(), "TRBL owner must have gotten their fee");

    assert.equal(await dt.lastPurchasePrice(tokenId), price * 2, "Last purchase price should be twice as big");
    assert.equal(await dt.forSalePrice(tokenId), 0, "For sale price should be 0 after purchase");
  });

  it("should return the correct registered tokens in a given collection", async () => {
    let registeredTokens = (await dt.registeredTokens()).map(t => { return t.words[0] });
    assert.deepEqual(registeredTokens, [0], "Number of registered tokens does not match");

    // Add token 2
    assert.notEqual(await cp.approve(dt.address, 2), undefined, "approval failed (undefined return value).");

    const initialPrice = 1234;
    assert.notEqual(await dt.setPrice(2, initialPrice), undefined, "setPrice failed");

    registeredTokens = (await dt.registeredTokens()).map(t => { return t.words[0] });
    assert.deepEqual(registeredTokens, [0], "Number of registered tokens does not match");

    await dt.buy(2, {from: accounts[1], value: initialPrice});

    registeredTokens = (await dt.registeredTokens()).map(t => { return t.words[0] });
    assert.deepEqual(registeredTokens, [0, 2], "Number of registered tokens does not match");

    // Add token 1
    assert.notEqual(await cp.approve(dt.address, 1), undefined, "approval failed (undefined return value).");
    assert.notEqual(await dt.setPrice(1, initialPrice), undefined, "setPrice failed");

    registeredTokens = (await dt.registeredTokens()).map(t => { return t.words[0] });
    assert.deepEqual(registeredTokens, [0, 2], "Number of registered tokens does not match");

    await dt.buy(1, {from: accounts[1], value: initialPrice});

    registeredTokens = (await dt.registeredTokens()).map(t => { return t.words[0] });
    assert.deepEqual(registeredTokens, [0, 2, 1], "Number of registered tokens does not match");
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
});
