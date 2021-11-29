import hre from "hardhat";

export async function advanceBlockHeight(numBlocks: number) {
  const txns = [];
  for (let i = 0; i < numBlocks; i++) {
    txns.push(hre.network.provider.send("evm_mine"));
  }
  await Promise.all(txns);
}

export const proposalStates = [
  "Pending",
  "Active",
  "Canceled",
  "Defeated",
  "Succeeded",
  "Queued",
  "Expired",
  "Executed",
];
