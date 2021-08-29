let CryptoPunks = artifacts.require("./CryptoPunks.sol")
let DoubleTroubleOrchestrator = artifacts.require("./DoubleTroubleOrchestrator.sol")

module.exports = async (deployer) => {
  await deployer.deploy(CryptoPunks);
  await deployer.deploy(DoubleTroubleOrchestrator);
};
