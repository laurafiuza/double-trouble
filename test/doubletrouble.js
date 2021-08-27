const DoubleTrouble = artifacts.require("./DoubleTrouble.sol");
const CryptoPunks = artifacts.require("./CryptoPunks.sol");

const CP_TOKEN_ID = 42;
const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

contract("DoubleTrouble", accounts => {
  it("should make an NFT DTable", async () => {
    const cp = await CryptoPunks.deployed();
    assert.notEqual(cp, undefined, "CryptoPunks contract instance is undefined.");
    const dt = await DoubleTrouble.deployed();
    assert.notEqual(dt, undefined, "DoubleTrouble contract instance is undefined.");

    const nft = await cp.createNft(accounts[0]);
    assert.notEqual(nft, undefined, "createNft failed (undefined return value).");

    const ownerBefore = await dt.ownerOf(cp.address, CP_TOKEN_ID);
    assert.equal(ownerBefore, ZERO_ADDR, "There should be no owner of this NFT soon after the blockchain is created.");

    const approval = await cp.approve(dt.address, CP_TOKEN_ID);
    assert.notEqual(approval, undefined, "approval failed (undefined return value).");

    const retMakeDTable = await dt.makeDTable(cp.address, CP_TOKEN_ID);
    assert.notEqual(retMakeDTable, undefined, "makeDTable failed (undefined return value).");

    const ownerAfter = await dt.ownerOf(cp.address, CP_TOKEN_ID);
    assert.equal(ownerAfter, accounts[0], "ownerAfter making DTable does not equal accounts[0].");

    const cpOwnerAfter = await cp.ownerOf(CP_TOKEN_ID);
    assert.equal(cpOwnerAfter, dt.address, "DT contract must be the owner of the Crypto Punk");
  });
});
