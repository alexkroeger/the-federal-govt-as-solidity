import hre, { ethers } from "hardhat";
import { deploy } from "./deploy_util";
import { advanceBlockHeight, proposalStates } from "./utils";

async function main() {
  const {
    congressToken,
    federalGovernment,
    federalGovernmentTimelock,
    uSDollar,
  } = await deploy();

  // transfer tokens to senators from free and fair elections
  const [deployer, redSenator, blueSenator, swingSenator] =
    await ethers.getSigners();

  for (const senator of [redSenator, blueSenator, swingSenator]) {
    const address = senator.address;
    congressToken.transfer(address, 1);
    // need to delegate the voting power from your tokens in order to vote
    // the senators will delegate to themselves
    await congressToken.connect(senator).delegate(address);
  }

  // CREATING A PROPOSAL

  // redSenator creates a proposal to mint 2M USD and give 1M each to themself and swingSenator
  // we'll encode calldata for the mint function
  // note because USDollar has 2 decimals, 1M USD is 1e8, not 1e6
  const sendUsdToRedCallData = uSDollar.interface.encodeFunctionData("mint", [
    redSenator.address,
    1e8,
  ]);
  const sendUsdToSwingCallData = uSDollar.interface.encodeFunctionData("mint", [
    swingSenator.address,
    1e8,
  ]);
  // here we're using the standard propose function from OpenZeppelin
  // because there are two `propose` functions (one standard and one GovernorBravo-compatible)
  // the contract interface is a little ugly
  await federalGovernment
    .connect(redSenator)
    ["propose(address[],uint256[],bytes[],string)"](
      // the address to call--we're making 2 calls to USDollar
      [uSDollar.address, uSDollar.address],
      // the value in ETH (0)
      [0, 0],
      // calldata
      [sendUsdToRedCallData, sendUsdToSwingCallData],
      // description
      "money printer go brrrr"
    );

  const filter = federalGovernment.filters.ProposalCreated();
  const proposalCreatedEvent = (await federalGovernment.queryFilter(filter))[0];
  const proposalId = proposalCreatedEvent.args.proposalId;
  // proposal state should now be "pending"
  console.log(
    "Proposal State:",
    proposalStates[await federalGovernment.state(proposalId)]
  );

  // VOTING

  // there is a review period before voting begins
  // we'll speed thru it
  const reviewPeriodLength = await federalGovernment.votingDelay();
  await advanceBlockHeight(reviewPeriodLength.toNumber() + 1);
  // proposal state should now be "active"
  console.log(
    "Proposal State:",
    proposalStates[await federalGovernment.state(proposalId)]
  );

  // red and swing senator vote for, support = 1
  await federalGovernment.connect(redSenator).castVote(proposalId, 1);
  await federalGovernment.connect(swingSenator).castVote(proposalId, 1);
  // blue senator votes against, support = 0
  await federalGovernment.connect(blueSenator).castVote(proposalId, 0);

  const proposalInfoVoting = await federalGovernment.proposals(proposalId);
  console.log("For votes:", proposalInfoVoting.forVotes.toString());
  console.log("Against votes:", proposalInfoVoting.againstVotes.toString());

  // QUEUING THE PROPOSAL

  // Voting is now complete, we'll speed through the voting period
  const votingPeriodLength = await federalGovernment.votingPeriod();
  await advanceBlockHeight(votingPeriodLength.toNumber() + 1);
  // proposal state should now be "succeeded"
  console.log(
    "Proposal State:",
    proposalStates[await federalGovernment.state(proposalId)]
  );

  // redSenator would now want to queue the proposal (tho anyone can do so)
  // let's have swingSenator do it
  await federalGovernment.connect(swingSenator)["queue(uint256)"](proposalId);
  // proposal state should now be "queued"
  console.log(
    "Proposal State:",
    proposalStates[await federalGovernment.state(proposalId)]
  );

  // EXECUTING THE PROPOSAL

  // the proposal is now queued with the timelock contract
  // we have to wait until the timelock delay has passed
  // we'll speed through it
  const timelockDelay = await federalGovernmentTimelock.getMinDelay();
  await hre.network.provider.request({
    method: "evm_increaseTime",
    params: [timelockDelay.toNumber() + 1],
  });

  // now we can execute the proposal
  // anyone can do this, we'll have our initial deployer do the honors
  await federalGovernment.connect(deployer)["execute(uint256)"](proposalId);
  // proposal state should now be "executed"
  console.log(
    "Proposal State:",
    proposalStates[await federalGovernment.state(proposalId)]
  );
  // USD amounts should be minted:
  console.log(
    "redSenator USD balance:",
    ethers.utils.formatUnits(await uSDollar.balanceOf(redSenator.address), 2)
  );
  console.log(
    "swingSenator USD balance:",
    ethers.utils.formatUnits(await uSDollar.balanceOf(swingSenator.address), 2)
  );
  console.log(
    "blueSenator USD balance:",
    ethers.utils.formatUnits(await uSDollar.balanceOf(blueSenator.address), 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
