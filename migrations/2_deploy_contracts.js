let CryptoPunks = artifacts.require("./CryptoPunks.sol")
let DoubleTroubleOrchestrator = artifacts.require("./DoubleTroubleOrchestrator.sol")

module.exports = async (deployer) => {
  await deployer.deploy(CryptoPunks);
  await deployer.deploy(DoubleTroubleOrchestrator, "0xB5646985e2b562349D308090adb66Bb302a71634");
};
