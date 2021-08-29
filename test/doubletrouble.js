const assert = require('assert');
const DoubleTrouble = artifacts.require("./DoubleTrouble.sol");
const CryptoPunks = artifacts.require("./CryptoPunks.sol");

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';
const NON_PRESENT_ID = 79;

contract("DoubleTrouble", accounts => {
  // TODO: make tokenId the return value of the createNft function
  // currently, the return value is a transaction object for some reason,
  // how do we retrieve the return value?
  var cp, dt, nft, tokenId;

  before(async () => {
    cp = await CryptoPunks.deployed();
    assert.notEqual(cp, undefined, "CryptoPunks contract instance is undefined.");
    dt = await DoubleTrouble.deployed();
    assert.notEqual(dt, undefined, "DoubleTrouble contract instance is undefined.");
    tokenId = 0;

    web3.eth.defaultAccount = accounts[0];
  });

  beforeEach(async() => {
    nft = await cp.createNft(accounts[0]);
    assert.notEqual(nft, undefined, "createNft failed (undefined return value).");

    const approval = await cp.approve(dt.address, tokenId);
    assert.notEqual(approval, undefined, "approval failed (undefined return value).");

    const retMakeDTable = await dt.makeDTable(tokenId);
    assert.notEqual(retMakeDTable, undefined, "makeDTable failed (undefined return value).");

    const forSalePrice = await dt.forSalePrice(tokenId);
    assert.equal(forSalePrice, 0, "Initial for sale price should be 0");

    const lastPurchasePrice = await dt.lastPurchasePrice(tokenId);
    assert.equal(lastPurchasePrice, 0, "Initial last purchase should be 0");
  });

  afterEach(async() => {
    tokenId++;
  });

  it("DT should own the NFT after makeDTable", async () => {
    const cpOwnerAfter = await cp.ownerOf(tokenId);
    assert.equal(cpOwnerAfter, dt.address, "DT contract must be the owner of the Crypto Punk");
  });

  it("accounts[0] should own the NFT within DT", async () => {
    const ownerAfter = await dt.ownerOf(tokenId);
    assert.equal(ownerAfter, accounts[0], "ownerAfter making DTable does not equal accounts[0].");
  });

  it("should transfer NFTs within DT", async () => {
    /*
    const ownerBefore = await dt.ownerOf(tokenId);
    assert.equal(ownerBefore, accounts[0], "Initial owner must be accounts[0].");

    const ret = await dt.transferFrom(accounts[0], accounts[1], tokenId);
    assert.notEqual(ret, undefined, "dt.transferFrom cannot be undefined");

    const ownerAfter = await dt.ownerOf(tokenId);
    assert.equal(ownerAfter, accounts[1], "owner after transfer must be accounts[1]");
    */
    await assert.rejects(dt.transferFrom(accounts[0], accounts[1], tokenId), /revert/);
  });

  it("ownerOf should revert if we pass in a non present NFT", async () => {
    await assert.rejects(dt.ownerOf(NON_PRESENT_ID), /revert ERC721/);
  });

  it("should not transfer NFTs that someone doesn't own", async () => {
    await assert.rejects(dt.transferFrom(accounts[2], accounts[1], tokenId), /revert/);
  });

  it("should not transfer if the NFT is not DTable", async () => {
    await assert.rejects(dt.transferFrom(accounts[0], accounts[1], NON_PRESENT_ID), /revert/);
  });

  it("should not transfer if the to address is the zero address", async () => {
    await assert.rejects(dt.transferFrom(accounts[0], ZERO_ADDR, tokenId), /revert/);
  });

  it("lastPurchasePrice should revert if we pass in a non present NFT", async () => {
    await assert.rejects(dt.lastPurchasePrice(NON_PRESENT_ID), /revert ERC721/);
  });

  it("should put NFT up for sale", async () => {
    const forSalePrice = await dt.forSalePrice(tokenId);
    assert.equal(forSalePrice, 0, "Initial for sale price should be  0");

    const ret = await dt.putUpForSale(tokenId, 3456);
    assert(ret.receipt.status, true, "Transaction processing failed");

    const newForSalePrice = await dt.forSalePrice(tokenId);
    assert.equal(newForSalePrice, 3456, "New for sale price should be 3456");
  });

  it("should proxy tokenURI to original NFT", async () => {
    let tokenURI = await dt.tokenURI(tokenId);
    let originalURI = await cp.tokenURI(tokenId);
    assert.equal(tokenURI, originalURI);
    assert.equal(tokenURI, "https://foo.bar");
  });

  it("should not buy NFT if forSalePrice is 0", async () => {
    assert.equal(await dt.forSalePrice(tokenId), 0, "Initial for sale price should be  0");

    await assert.rejects(dt.buy(tokenId, {from: accounts[1], value: 2000}), /for sale price/);
    assert(await dt.ownerOf(tokenId), accounts[0], "Ownership should still be accounts[0]");
  });

  it("should not buy NFT if paying less than the forSalePrice", async () => {
    const ret = await dt.putUpForSale(tokenId, 3456);
    assert(ret.receipt.status, true, "Transaction processing failed");

    await assert.rejects(dt.buy(tokenId, {from: accounts[1], value: 2000}), /for sale price/);
    assert(await dt.ownerOf(tokenId), accounts[0], "Ownership should still be accounts[0]");
  });

  it("should not force buy NFT if lastPurchasePrice is 0", async () => {
    assert.equal(await dt.lastPurchasePrice(tokenId), 0, "Initial last purchase price should be  0");

    await assert.rejects(dt.forceBuy(tokenId, {from: accounts[1], value: 2000}), /last purchase price/);
    assert(await dt.ownerOf(tokenId), accounts[0], "Ownership should still be accounts[0]");
  });

  it("should buy and force buy NFTs", async () => {
    assert.equal(await dt.forSalePrice(tokenId), 0, "Initial for sale price should be 0");
    assert.equal(await dt.lastPurchasePrice(tokenId), 0, "Initial last purchase price should be  0");

    const ret = await dt.putUpForSale(tokenId, 3456);
    assert(ret.receipt.status, true, "Transaction processing failed");

    assert.equal(await dt.forSalePrice(tokenId), 3456, "For sale price should be > 0");
    assert.equal(await dt.lastPurchasePrice(tokenId), 0, "Last purchase price should be 0");

    await dt.buy(tokenId, {from: accounts[1], value: 3456});
    assert(await dt.ownerOf(tokenId), accounts[1], "Ownership should now be accounts[1]");

    assert.equal(await dt.forSalePrice(tokenId), 0, "For sale price should be 0 after purchase");
    assert.equal(await dt.lastPurchasePrice(tokenId), 3456, "Last purchase price should be > 0 after purchase");

    await assert.rejects(dt.forceBuy(tokenId, {from: accounts[2], value: 3456}), /last purchase price/);

    await dt.forceBuy(tokenId, {from: accounts[2], value: 3456 * 2});
    assert(await dt.ownerOf(tokenId), accounts[2], "Ownership should now be accounts[2]");

    assert.equal(await dt.lastPurchasePrice(tokenId), 3456 * 2, "Last purchase price should be twice as big");
    assert.equal(await dt.forSalePrice(tokenId), 0, "For sale price should be 0 after purchase");
  });
});
