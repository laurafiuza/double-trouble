const assert = require('assert');
const CryptoPunks = artifacts.require("./CryptoPunks.sol");
const DoubleTroubleOrchestrator = artifacts.require("./DoubleTroubleOrchestrator.sol");
const DoubleTrouble = artifacts.require("./DoubleTrouble.sol");

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';
const NON_PRESENT_ID = 79;

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

    const ret = await dto.makeTroublesomeCollection(cp.address, "DTCryptoPunks", "DUNK");
    assert(ret.receipt.status, true, "Transaction processing failed");

    const dt_address = await dto.troublesomeCollection(cp.address);
    assert.notEqual(dt_address, undefined, "dt_address is undefined.");

    dt = await DoubleTrouble.at(dt_address);
    assert.equal(dt_address, dt.address, "Address returned by orchestrator must match dt.deployed().");

    tokenId = 0;

    web3.eth.defaultAccount = accounts[0];
  });

  beforeEach(async() => {
    nft = await cp.createNft(accounts[0]);
    assert.notEqual(nft, undefined, "createNft failed (undefined return value).");

    const approval = await cp.approve(dt.address, tokenId);
    assert.notEqual(approval, undefined, "approval failed (undefined return value).");

    const initialPrice = 1234;
    const retMakeDTable = await dt.makeTroublesome(tokenId, initialPrice);
    console.log(retMakeDTable);
    assert.notEqual(retMakeDTable, undefined, "makeTroublesome failed (undefined return value).");

    const forSalePrice = await dt.forSalePrice(tokenId);
    assert.equal(forSalePrice, initialPrice, "Initial for sale price should be > 0");

    const lastPurchasePrice = await dt.lastPurchasePrice(tokenId);
    assert.equal(lastPurchasePrice, 0, "Initial last purchase should be 0");
    console.log(tokenId);
  });

  afterEach(async() => {
    tokenId++;
  });

  it("Can unmakeTroublesome", async () => {
    const lastPurchasePrice = await dt.lastPurchasePrice(tokenId);
    assert.equal(lastPurchasePrice, 0, "Initial last purchase should be 0");

    const cpOwnerBefore = await cp.ownerOf(tokenId);
    assert.equal(cpOwnerBefore, dt.address, "DT contract must be the owner of the Crypto Punk");

    const dtOwnerBefore = await dt.ownerOf(tokenId);
    assert.equal(dtOwnerBefore, accounts[0], "owner within DT does not equal accounts[0].");

    const ret = await dt.unmakeTroublesome(tokenId);
    assert.notEqual(ret, undefined, "unmakeTroublesome failed (undefined return value).");

    const cpOwnerAfter = await cp.ownerOf(tokenId);
    assert.equal(cpOwnerAfter, accounts[0], "accounts[0] contract must be the owner of the Crypto Punk");

    await assert.rejects(dt.ownerOf(tokenId), /revert ERC721/, "Token shouldnt be present in DT anymore");
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
    const ownerAfter = await dt.ownerOf(tokenId);
    assert.equal(ownerAfter, accounts[0], "ownerAfter making DTable does not equal accounts[0].");
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

  it("lastPurchasePrice should revert if we pass in a non present NFT", async () => {
    await assert.rejects(dt.lastPurchasePrice(NON_PRESENT_ID), /revert ERC721/);
  });

  it("should put NFT up for sale", async () => {
    const forSalePrice = await dt.forSalePrice(tokenId);
    assert.notEqual(forSalePrice, 0, "Initial for sale price should not be 3456");

    const ret = await dt.setPrice(tokenId, 3456);
    assert(ret.receipt.status, true, "Transaction processing failed");

    const newForSalePrice = await dt.forSalePrice(tokenId);
    assert.equal(newForSalePrice, 3456, "New for sale price should be 3456");
  });

  it("should proxy tokenURI to original NFT", async () => {
    let tokenURI = await dt.tokenURI(tokenId);
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
    assert.equal(await dt.lastPurchasePrice(tokenId), 0, "Initial last purchase price should be  0");

    await assert.rejects(dt.forceBuy(tokenId, {from: accounts[1], value: 2000}), /NFT was not yet purchased/);
    assert(await dt.ownerOf(tokenId), accounts[0], "Ownership should still be accounts[0]");
  });

  it("should buy and force buy NFTs", async () => {
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

    assert.equal(await dt.lastPurchasePrice(tokenId), 0, "Initial last purchase price should be  0");

    const ret = await dt.setPrice(tokenId, price);
    assert(ret.receipt.status, true, "Transaction processing failed");

    assert.equal(await dt.forSalePrice(tokenId), price, "For sale price should be > 0");
    assert.equal(await dt.lastPurchasePrice(tokenId), 0, "Last purchase price should be 0");

    let [balance0Before, balance1Before] =
      [await web3.eth.getBalance(accounts[0]), await web3.eth.getBalance(accounts[1])];

    let buyTx = await dt.buy(tokenId, {from: accounts[1], value: price});
    assert(await dt.ownerOf(tokenId), accounts[1], "Ownership should now be accounts[1]");

    let [balance0After, balance1After] =
      [await web3.eth.getBalance(accounts[0]), await web3.eth.getBalance(accounts[1])];
    let gasUsed = multWei(buyTx.receipt.gasUsed, await web3.eth.getGasPrice());
    let fee = divWei(price, 100);
    assert.equal(balance0After.toString(), subWei(addWei(balance0Before, price), fee).toString(), "Balance of accounts[0] must be bigger after buy");
    assert.equal(balance1After.toString(), subWei(subWei(balance1Before, price), gasUsed).toString(), "Balance of accounts[1] must be smaller after buy");

    assert.equal(await dt.forSalePrice(tokenId), 0, "For sale price should be 0 after purchase");
    assert.equal(await dt.lastPurchasePrice(tokenId), price, "Last purchase price should be > 0 after purchase");

    await assert.rejects(dt.forceBuy(tokenId, {from: accounts[2], value: price}), /last purchase price/);

    const balance2Before = await web3.eth.getBalance(accounts[2]);

    buyTx = await dt.forceBuy(tokenId, {from: accounts[2], value: doublePrice});
    assert(await dt.ownerOf(tokenId), accounts[2], "Ownership should now be accounts[2]");

    gasUsed = multWei(buyTx.receipt.gasUsed, await web3.eth.getGasPrice());
    let [balance1AfterAfter, balance2After] =
      [await web3.eth.getBalance(accounts[1]), await web3.eth.getBalance(accounts[2])];

    fee = divWei(doublePrice, 100);
    assert.equal(balance1AfterAfter.toString(), subWei(addWei(balance1After, doublePrice), fee).toString(), "Balance of accounts[0] must be bigger after buy");
    assert.equal(balance2After.toString(), subWei(subWei(balance2Before, doublePrice), gasUsed).toString(), "Balance of accounts[1] must be smaller after buy");

    assert.equal(await dt.lastPurchasePrice(tokenId), price * 2, "Last purchase price should be twice as big");
    assert.equal(await dt.forSalePrice(tokenId), 0, "For sale price should be 0 after purchase");

    await assert.rejects(dt.unmakeTroublesome(tokenId, {from: accounts[2]}), /Cannot remove NFT/);
  });

  it("should return the correct registered tokens in a given collection", async () => {
    registeredTokens = await dt.registeredTokens();
    trueTokens = []
    for (i = 0; i < 17; i++) {
      trueTokens = [...trueTokens, i];
    }
    givenTokens = registeredTokens.map(t => {
      return t.words[0]
    });
    assert.deepEqual(givenTokens, trueTokens, "Number of registered tokens does not match");
  });
});
