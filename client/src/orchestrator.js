import DoubleTroubleOrchestratorContract from "./contracts/DoubleTroubleOrchestrator.json";

const orchestratorAddr = {
  // Ethereum Mainnet
  "1": null,

  // Polygon mainnet
  "137": "0xB2Debc62E45Af60Df935A11eAcDE2D97F109110b",

  // Local Ganache dev
  "0x539": process.env.REACT_APP_DTO_ADDR,
};

const doubleTroubleOrchestrator = async (web3) => {
  const chainId = await web3.eth.getChainId();
  if (!(chainId in orchestratorAddr)) {
    return null;
  }

  return new web3.eth.Contract(
    DoubleTroubleOrchestratorContract.abi,
    orchestratorAddr[chainId],
  );
}

export default doubleTroubleOrchestrator;
