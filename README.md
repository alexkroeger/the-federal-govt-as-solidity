# Deploying the United States government

This repo walks thru deploying [OpenZeppelin](https://openzeppelin.com/) governance contracts and utilizing them to create and execute an on-chain proposal.

This project uses [hardhat](https://hardhat.org/).

## Setup

1. clone the repository
2. run `npm install`
3. if you plan on deploying contracts to Ropsten (`deploy_and_verify.ts` script), you'll need to create a `.env` file with values for `ETHERSCAN_API_KEY`, `ROPSTEN_URL`, and `PRIVATE_KEY`.

## Usage

To run the proposal scenario in your local hardhat environment:

`npx hardhat run scripts/proposal_scenario.ts`

To deploy the contracts to Ropsten and verify on etherscan, run:

`npx hardhat run --network ropsten scripts/deploy_and_verify.ts`

To deploy to another network, you'll need to add another network to `hardhat.config.ts`.
