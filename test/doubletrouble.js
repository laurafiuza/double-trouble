const DoubleTrouble = artifacts.require("./DoubleTrouble.sol");
const CryptoPunks = artifacts.require("./CryptoPunks.sol");

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

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

  it("should not allow to return owner of a zero address collection", async () => {
    let owner = undefined;
    try {
      owner = await dt.ownerOf(ZERO_ADDR, 0);
    } catch (err) {
      assert(err, "Expected ownerOf to revert transaction due to an error, but it did not.");
      assert(err.message.includes("revert collection address cannot be zero"), "expected different error message.");
    }
    assert.equal(owner, undefined, "Expected owner to be undefined");
  });

  it("DT should own the NFT after makeDTable", async () => {
    const cpOwnerAfter = await cp.ownerOf(tokenId);
    assert.equal(cpOwnerAfter, dt.address, "DT contract must be the owner of the Crypto Punk");
  });

  it("accounts[0] should own the NFT within DT", async () => {
    const ownerAfter = await dt.ownerOf(tokenId);
    assert.equal(ownerAfter, accounts[0], "ownerAfter making DTable does not equal accounts[0].");
  });

  it("should not allow a non-NFT to be DTable", async () => {
    let ret;
    try {
      ret = await dt.makeDTable(accounts[0], 0);
    } catch (err) {
      assert(err, "Expected ownerOf to revert transaction due to an error, but it did not.");
      assert(err.data.name == 'RuntimeError', "Expected different error name");
    }
    assert.equal(ret, undefined, "expected it to be undefined");
  });

  it("should transfer NFTs within DT", async () => {
    const ownerBefore = await dt.ownerOf(tokenId);
    assert.equal(ownerBefore, accounts[0], "Initial owner must be accounts[0].");

    const ret = await dt.transferFrom(accounts[0], accounts[1], tokenId);
    assert.notEqual(ret, undefined, "dt.transferFrom cannot be undefined");

    const ownerAfter = await dt.ownerOf(tokenId);
    assert.equal(ownerAfter, accounts[1], "owner after transfer must be accounts[1]");
  });

  it("should not transfer NFTs that someone doesn't own", async () => {
    let ret;
    try {
      ret = await dt.transferFrom(accounts[2], accounts[1], tokenId);
    } catch (err) {
      assert(err, "Expected transferFrom to revert transaction due to an error, but it did not.");
      assert(err.message.includes("from address should be current owner of NFT"), "expected different error message.");
    }
    assert.equal(ret, undefined, "expected return value to be undefined");
  });

  it("should not transfer if the NFT is not DTable", async () => {
    let ret;
    try {
      ret = await dt.transferFrom(accounts[0], accounts[1], accounts[2], 0);
    } catch (err) {
      assert(err, "Expected transferFrom to revert transaction due to an error, but it did not.");
      assert(err.message.includes("collection and tokenId combination is not present in DT"), "expected different error message.");
    } 
    assert.equal(ret, undefined, "expected return value to be undefined");
  });

  it("should not transfer if the to address is the zero address", async () => {
    let ret;
    try {
      ret = await dt.transferFrom(accounts[0], ZERO_ADDR, tokenId);
    } catch (err) {
      assert(err, "Expected transferFrom to revert transaction due to an error, but it did not.");
      assert(err.message.includes("to address cannot be zero"), "expected different error message.");
    }
    assert.equal(ret, undefined, "expected return value to be undefined");
    return true;
  });

  it("forSalePrice should revert if we pass in a non present NFT", async () => {
    let ret;
    try {
      ret = await dt.forSalePrice(accounts[0], 0);
    } catch (err) {
      assert(err, "Expected forSalePrice to revert transaction due to an error, but it did not.");
      assert(err.message.includes("collection and tokenId combination is not present in DT"), "expected different error message.");
    }
    assert.equal(ret, undefined, "expected return value to be undefined");
    return true;
  });

  it("forPurchasePrice should revert if we pass in a non present NFT", async () => {
    let ret;
    try {
      ret = await dt.lastPurchasePrice(accounts[0], 0);
    } catch (err) {
      assert(err, "Expected lastPurchasePrice to revert transaction due to an error, but it did not.");
      assert(err.message.includes("collection and tokenId combination is not present in DT"), "expected different error message.");
    }
    assert.equal(ret, undefined, "expected return value to be undefined");
    return true;
  });

  it("should put NFT up for sale", async () => {
    const forSalePrice = await dt.forSalePrice(tokenId);
    assert.equal(forSalePrice, 0, "Initial for sale price should be  0");

    const ret = await dt.putUpForSale(tokenId, 3456);
    assert(ret.receipt.status, true, "Transaction processing failed");

    const newForSalePrice = await dt.forSalePrice(tokenId);
    assert.equal(newForSalePrice, 3456, "New for sale price should be 3456");
  });

  it("should not buy NFT if forSalePrice == 0", async () => {
    const forSalePrice = await dt.forSalePrice(tokenId);
    assert.equal(forSalePrice, 0, "Initial for sale price should be  0");

    const ret = await dt.buy(accounts[1], tokenId, 50);
    assert(ret.receipt.status, false, "Transaction should have failed");
    assert(await dt.ownerOf(tokenId), accounts[0], "Ownership should still be accounts[0]");
  });
});
