import DoubleTroubleOrchestratorContract from "./contracts/DoubleTroubleOrchestrator.json";

const doubleTroubleOrchestrator = async (web3) => {
  // FIXME: I don't think we need this file/function anymore
  return new web3.eth.Contract(
    DoubleTroubleOrchestratorContract.abi,
    web3.chain.orchestratorAddr,
  );
}

export default doubleTroubleOrchestrator;
