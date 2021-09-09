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

    const ret = await dto.makeTroublesomeCollection(cp.address, NAME, SYMBOL, {from: accounts[6]});
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
    assert.equal(await dto.ownerOf(0), accounts[6], "Must have minted tokenId 0 for account 6");
    assert.equal(await dto.ownerOf(1), accounts[2], "Must have minted tokenId 1 for account 2");

    assert.equal(await dto.trblOwnerOfTokenId(0), accounts[6], "TRBL owner must be account 6");
    assert.equal(await dto.trblOwnerOfTokenId(1), accounts[2], "TRBL owner must be account 2");

    await assert.rejects(dto.ownerOf(2), /nonexistent token/);
  });

  it("should parse tokenURI and get TRBL NFTs", async () => {
    let [nix, b64] = (await dto.tokenURI(0)).split(',');
    let metadata = JSON.parse(Buffer.from(b64, 'base64').toString());
    assert.equal(metadata.name, 'TRBL #0', "Name must be TRBL #0");
    assert.equal(metadata.originalCollection, cp.address.toLowerCase(), "original collection in metadata must match");
    assert.equal(metadata.troublesomeCollection, dt.address.toLowerCase(), "troublesome collection in metadata must match");

    [nix, b64] = (await dto.tokenURI(1)).split(',');
    metadata = JSON.parse(Buffer.from(b64, 'base64').toString());
    assert.equal(metadata.name, 'TRBL #1', "Name must be TRBL #1");
    assert.equal(metadata.originalCollection, NON_NFT_CONTRACT_ADDRESS.toLowerCase(), "original collection in metadata must match");
    const troublesomeAddr = await dto.troublesomeCollection(NON_NFT_CONTRACT_ADDRESS)
    assert.equal(metadata.troublesomeCollection, troublesomeAddr.toLowerCase(), "troublesome collection in metadata must match");
  });

  it("trblOwnerOf should work when TRBL tokens also become troublesome", async () => {
    const ret = await dto.makeTroublesomeCollection(dto.address, "Double Trouble", "TRBL");
    assert.equal(ret.receipt.status, true, "Transaction processing failed");

    const metaDtAddr = await dto.troublesomeCollection(dto.address);
    const metaDt = await DoubleTrouble.at(metaDtAddr);

    assert.equal(await dto.trblOwnerOfTokenId(0), accounts[6], "TRBL owner must be account 6");
    assert.equal(await dto.trblOwnerOfTokenId(1), accounts[2], "TRBL owner must be account 2");

    assert.notEqual(await dto.approve(metaDt.address, 0, {from: accounts[6]}), undefined, "approval failed (undefined return value).");
    assert.notEqual(await metaDt.setPrice(0, 1234), undefined, "setPrice failed (undefined return value).");
    assert.equal(await dto.trblOwnerOfTokenId(0), accounts[6], "TRBL owner must still be account 6");

    assert.notEqual(await metaDt.buy(0, {from: accounts[5], value: 1234}), undefined, "buy failed (undefined return value).");
    assert.equal(await dto.trblOwnerOfTokenId(0), accounts[5], "TRBL owner must now be account 5");

    assert.notEqual(await dto.approve(metaDt.address, 1, {from: accounts[2]}), undefined, "approval failed (undefined return value).");
    assert.notEqual(await metaDt.setPrice(1, 4567), undefined, "setPrice failed (undefined return value).");
    assert.equal(await dto.trblOwnerOfTokenId(1), accounts[2], "TRBL owner must still be account 2");

    assert.notEqual(await metaDt.buy(1, {from: accounts[6], value: 4567}), undefined, "buy failed (undefined return value).");
    assert.equal(await dto.trblOwnerOfTokenId(1), accounts[6], "TRBL owner must now be account 6");
  });
});
