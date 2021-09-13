// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.
async function main() {
  // This is just a convenience check
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to deploy a contract to the Hardhat Network, which" +
        "gets automatically created and destroyed every time. Use the Hardhat" +
        " option '--network localhost'"
    );
  }

  // ethers is avaialble in the global scope
  const signers = await ethers.getSigners();
  const accounts = signers.map(s => s.address);
  const deployer = signers[0];
  console.log("Deploying the contracts with the account:", await deployer.getAddress());

  const FEE_WALLET = 5;
  console.log("Fee account:", accounts[FEE_WALLET]);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const cpFactory = await ethers.getContractFactory('CryptoPunks');
  const cp = await cpFactory.deploy();
  await cp.createNft(accounts[0]);

  console.log("CryptoPunks address:", cp.address);

  const ptdFactory = await ethers.getContractFactory('PatronTokensDeployer');
  const ptd = await ptdFactory.deploy();
  console.log("PatronTokens Factory address:", cp.address);

  const dtFactory = await ethers.getContractFactory('DoubleTrouble');
  const dt = await dtFactory.deploy(ptd.address, 30, 2, 1, 130, accounts[FEE_WALLET]);
  console.log("DoubleTrouble address:", dt.address);
  console.log("Patron Tokens address:", await dt.patronTokensCollection());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
