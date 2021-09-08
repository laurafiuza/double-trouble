const assert = require('assert');
const DoubleTroubleOrchestrator = artifacts.require("./DoubleTroubleOrchestrator.sol");
const DoubleTrouble = artifacts.require("./DoubleTrouble.sol");
const CryptoPunks = artifacts.require("./CryptoPunks.sol");

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';
const NAME = "DTCryptoPunks";
const SYMBOL = "DUNK";
const NON_NFT_CONTRACT_ADDRESS = "0x52b684d7bDEeB1248b3cc4A4C130A3bED9639f46";

contract("DoubleTroubleOrchestrator", accounts => {
  // TODO: make tokenId the return value of the createNft function
  // currently, the return value is a transaction object for some reason,
  // how do we retrieve the return value?
  var dto, cp, dt;

  before(async () => {
    cp = await CryptoPunks.deployed();
    assert.notEqual(cp, undefined, "CryptoPunks contract instance is undefined.");
    dto = await DoubleTroubleOrchestrator.deployed();
    assert.notEqual(dto, undefined, "DoubleTroubleOrchestrator contract instance is undefined.");
    tokenId = 0;

    web3.eth.defaultAccount = accounts[0];
  });

  it("makeTroublesomeCollection should work for NFT contracts", async () => {
    await assert.rejects(dto.registeredCollection(0), /tokenId not present/);

    assert.equal(await dto.troublesomeCollection(cp.address), ZERO_ADDR, "Initially cp must not have a troublesome collection");

    const {'0': ret1, '1': ret2} = await dto.registeredCollections()
    assert.equal(ret1.length, 0, "Must not have any registered collections");
    assert.equal(ret2.length, 0, "Must not have any registered collections");

    const ret = await dto.makeTroublesomeCollection(cp.address, NAME, SYMBOL);
    assert.equal(ret.receipt.status, true, "Transaction processing failed");

    const dt_address = await dto.troublesomeCollection(cp.address);
    assert.notEqual(dt_address, undefined, "dt_address is undefined.");

    dt = await DoubleTrouble.at(dt_address);
    assert.equal(dt_address, dt.address, "Address returned by orchestrator must match dt.deployed().");

    const {'0': [originalAddr], '1': [mappedAddr]} = await dto.registeredCollections();
    assert.equal(originalAddr, cp.address, "Must have CryptoPunks as a registered collection");
    assert.equal(mappedAddr, dt.address, "Must map CryptoPunks to  the right troublesome collection");

    const expected = {'0': originalAddr, '1': mappedAddr};
    assert.deepEqual(await dto.registeredCollection(0), expected, "Should have registered collection at index 0");
  });

  it("makeTroublesomeCollection should fail if called on same NFT collection twice", async () => {
    // FIXME: Because of the dt object, this test depends on the one above running first
    assert.equal(await dto.troublesomeCollection(cp.address), dt.address, "cp must already have a troublesome collection");

    await assert.rejects(dto.makeTroublesomeCollection(cp.address, NAME, SYMBOL), /already Troublesome/);
  });

  it("makeTroublesomeCollection should still work for non ERC721 address", async () => {
    await assert.rejects(dto.registeredCollection(1), /tokenId not present/);
    const ret = await dto.makeTroublesomeCollection(NON_NFT_CONTRACT_ADDRESS, NAME, SYMBOL, {from: accounts[2]});
    assert.equal(ret.receipt.status, true, "Transaction processing failed");

    const expected = {'0': NON_NFT_CONTRACT_ADDRESS, '1': await dto.troublesomeCollection(NON_NFT_CONTRACT_ADDRESS)};
    assert.deepEqual(await dto.registeredCollection(1), expected, "Should have registered collection at index 1");
  });

  it("makeTroublesomeCollection should have minted TRBL NFTs", async () => {
    assert.equal(await dto.ownerOf(0), accounts[0], "Must have minted tokenId 0 for account 0");
    assert.equal(await dto.ownerOf(1), accounts[2], "Must have minted tokenId 1 for account 2");
    await assert.rejects(dto.ownerOf(2), /nonexistent token/);
  });

  it("should parse tokenURI for TRBL NFTs", async () => {
    console.log(await dto.tokenURI(0));
    let [nix, b64] = (await dto.tokenURI(0)).split(',');
    let metadata = JSON.parse(Buffer.from(b64, 'base64').toString());
    assert.equal(metadata.name, 'TRBL #0', "Name must be TRBL #0");

    [nix, b64] = (await dto.tokenURI(1)).split(',');
    metadata = JSON.parse(Buffer.from(b64, 'base64').toString());
    assert.equal(metadata.name, 'TRBL #1', "Name must be TRBL #1");
  });
});
