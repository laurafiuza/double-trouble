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
  var dto, cp;

  before(async () => {
    cp = await CryptoPunks.deployed();
    assert.notEqual(cp, undefined, "CryptoPunks contract instance is undefined.");
    dto = await DoubleTroubleOrchestrator.deployed();
    assert.notEqual(dto, undefined, "DoubleTroubleOrchestrator contract instance is undefined.");
    tokenId = 0;

    web3.eth.defaultAccount = accounts[0];
  });

  it("makeTroublesomeCollection should not work for non ERC721 address", async () => {
    await assert.rejects(dto.makeTroublesomeCollection(NON_NFT_CONTRACT_ADDRESS, NAME, SYMBOL), /revert/);
  });

  it("makeTroublesomeCollection should work for NFT contracts", async () => {
    assert.equal(await dto.troublesomeCollection(cp.address), ZERO_ADDR, "Initially cp must not have a troublesome collection");

    const ret = await dto.makeTroublesomeCollection(cp.address, NAME, SYMBOL);
    assert(ret.receipt.status, true, "Transaction processing failed");

    const dt_address = await dto.troublesomeCollection(cp.address);
    assert.notEqual(dt_address, undefined, "dt_address is undefined.");

    dt = await DoubleTrouble.at(dt_address);
    assert.equal(dt_address, dt.address, "Address returned by orchestrator must match dt.deployed().");

    const allTroublesome = await dto.allTroublesomeCollections();
    assert.equal(allTroublesome[cp.address], dt.address, "allTroublesome must return entry for cp");
  });

  it("makeTroublesomeCollection should fail if called on same NFT collection twice", async () => {
    assert.equal(await dto.troublesomeCollection(cp.address), dt.address, "cp must already have a troublesome collection");

    await assert.rejects(dto.makeTroublesomeCollection(cp.address, NAME, SYMBOL), /already Troublesome/);
  });
});
