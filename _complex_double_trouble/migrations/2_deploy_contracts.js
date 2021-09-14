let CryptoPunks = artifacts.require("./CryptoPunks");
let DoubleTroubleOrchestrator = artifacts.require("./DoubleTroubleOrchestrator");
let DoubleTroubleFactory = artifacts.require("./DoubleTroubleFactory");

module.exports = async (deployer, network, accounts) => {
  await deployer.deploy(CryptoPunks);
  await deployer.deploy(DoubleTroubleFactory);
  const dtFactory = await DoubleTroubleFactory.deployed();
  await deployer.deploy(DoubleTroubleOrchestrator, dtFactory.address, "0xB5646985e2b562349D308090adb66Bb302a71634");
  const cp = await CryptoPunks.deployed();
  await cp.createNft(accounts[0]);
};
