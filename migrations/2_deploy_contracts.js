var SimpleStorage = artifacts.require("./SimpleStorage.sol");
var SimpleCaller = artifacts.require("./SimpleCaller.sol");

module.exports = function(deployer) {
  deployer.deploy(SimpleStorage);
  deployer.deploy(SimpleCaller);
};
