const assert = require('assert');
const DoubleTroubleOrchestrator = artifacts.require("./DoubleTroubleOrchestrator.sol");
const CryptoPunks = artifacts.require("./CryptoPunks.sol");

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';
const NON_PRESENT_ID = 79;

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

  it("should work", async () => {
    assert.equal(await dto.troublesomeCollection(cp.address), ZERO_ADDR, "Initially cp must not have a troublesome collection");
  });
});
