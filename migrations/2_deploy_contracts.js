module.exports = function(deployer) {
  deployer.deploy(artifacts.require("./DoubleTrouble.sol"));
  deployer.deploy(artifacts.require("./CryptoPunks.sol"));
};
