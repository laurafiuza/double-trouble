let CryptoPunks = artifacts.require("./CryptoPunks");
let DoubleTrouble = artifacts.require("./DoubleTrouble");

module.exports = async (deployer, network, accounts) => {
  await deployer.deploy(CryptoPunks);
  await deployer.deploy(DoubleTrouble, 30, 2, 1, 130, "0xB5646985e2b562349D308090adb66Bb302a71634");
  const cp = await CryptoPunks.deployed();
  await cp.createNft(accounts[0]);
};
