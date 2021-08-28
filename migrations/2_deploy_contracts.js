let CryptoPunks = artifacts.require("./CryptoPunks.sol")
let DoubleTrouble = artifacts.require("./DoubleTrouble.sol")

module.exports = async (deployer) => {
  await deployer.deploy(CryptoPunks);
  let cp = await CryptoPunks.deployed();
  await deployer.deploy(DoubleTrouble, (await cp.name()), (await cp.symbol()), cp.address);
};
