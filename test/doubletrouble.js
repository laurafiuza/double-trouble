const DoubleTrouble = artifacts.require("./DoubleTrouble.sol");
const CryptoPunks = artifacts.require("./CryptoPunks.sol");

contract("DoubleTrouble", accounts => {
  it("should make an NFT DTable", async () => {
    const cryptoPunksInstance = await CryptoPunks.deployed();
    assert.notEqual(cryptoPunksInstance, undefined, "CryptoPunks contract instance is undefined.");
    const doubleTroubleInstance = await DoubleTrouble.deployed();
    assert.notEqual(doubleTroubleInstance, undefined, "DoubleTrouble contract instance is undefined.");

    const nft = await cryptoPunksInstance.createNft(accounts[0]);
    assert.notEqual(nft, undefined, "createNft failed (undefined return value).");

    const ownerBefore = await doubleTroubleInstance.ownerOf(cryptoPunksInstance.address, 42);
    assert.equal(ownerBefore, '0x0000000000000000000000000000000000000000', "There should be no owner of this NFT soon after the blockchain is created.");

    const approval = await cryptoPunksInstance.approve(doubleTroubleInstance.address, 42);
    assert.notEqual(approval, undefined, "approval failed (undefined return value).");

    const retMakeDTable = await doubleTroubleInstance.makeDTable(cryptoPunksInstance.address, 42);
    assert.notEqual(retMakeDTable, undefined, "makeDTable failed (undefined return value).");

    const ownerAfter = await doubleTroubleInstance.ownerOf(cryptoPunksInstance.address, 42);
    assert.equal(ownerAfter, accounts[0], "ownerAfter making DTable does not equal accounts[0].");
  });
});
