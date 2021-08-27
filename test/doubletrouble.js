const DoubleTrouble = artifacts.require("./DoubleTrouble.sol");
const CryptoPunks = artifacts.require("./CryptoPunks.sol");

const CP_TOKEN_ID = 42;
const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

contract("DoubleTrouble", accounts => {
  var cp, dt, nft;

  before(async () => {
    cp = await CryptoPunks.deployed();
    assert.notEqual(cp, undefined, "CryptoPunks contract instance is undefined.");
    dt = await DoubleTrouble.deployed();
    assert.notEqual(dt, undefined, "DoubleTrouble contract instance is undefined.");

    nft = await cp.createNft(accounts[0]);
    assert.notEqual(nft, undefined, "createNft failed (undefined return value).");

    const ownerBefore = await dt.ownerOf(cp.address, CP_TOKEN_ID);
    assert.equal(ownerBefore, ZERO_ADDR, "There should be no owner of this NFT soon after the blockchain is created.");

    const approval = await cp.approve(dt.address, CP_TOKEN_ID);
    assert.notEqual(approval, undefined, "approval failed (undefined return value).");

    const retMakeDTable = await dt.makeDTable(cp.address, CP_TOKEN_ID);
    assert.notEqual(retMakeDTable, undefined, "makeDTable failed (undefined return value).");

    const forSalePrice = await dt.forSalePrice(cp.address, CP_TOKEN_ID);
    assert.equal(forSalePrice, 0, "Initial for sale price should be  0");

    const lastPurchasePrice = await dt.lastPurchasePrice(cp.address, CP_TOKEN_ID);
    assert.equal(lastPurchasePrice, 0, "Initial last purchase should be 0");
  });

  it("DT should own the NFT after makeDTable", async () => {
    const cpOwnerAfter = await cp.ownerOf(CP_TOKEN_ID);
    assert.equal(cpOwnerAfter, dt.address, "DT contract must be the owner of the Crypto Punk");
  });

  it("accounts[0] should own the NFT within DT", async () => {
    const ownerAfter = await dt.ownerOf(cp.address, CP_TOKEN_ID);
    assert.equal(ownerAfter, accounts[0], "ownerAfter making DTable does not equal accounts[0].");
  });

  it("should transfer NFTs within DT", async () => {
    const ownerBefore = await dt.ownerOf(cp.address, CP_TOKEN_ID);
    assert.equal(ownerBefore, accounts[0], "Initial owner must be accounts[0].");

    const ret = await dt.transferFrom(accounts[0], accounts[1], cp.address, CP_TOKEN_ID);
    assert.notEqual(ret, undefined, "dt.transferFrom cannot be undefined");

    const ownerAfter = await dt.ownerOf(cp.address, CP_TOKEN_ID);
    assert.equal(ownerAfter, accounts[1], "owner after transfer must be accounts[1]");

  });

  it("should put NFT up for sale", async () => {
    const forSalePrice = await dt.forSalePrice(cp.address, CP_TOKEN_ID);
    assert.equal(forSalePrice, 0, "Initial for sale price should be  0");

    const ret = await dt.putUpForSale(cp.address, CP_TOKEN_ID, 3456);
    assert(ret.receipt.status, true, "Transaction processing failed");

    const newForSalePrice = await dt.forSalePrice(cp.address, CP_TOKEN_ID);
    assert.equal(newForSalePrice, 3456, "New for sale price should be 3456");
  });

  // TODO: Test the non-happy paths. I.e. that someone else cannot transfer NFTs unless they own it
});
