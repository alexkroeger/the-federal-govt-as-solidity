import hre from "hardhat";
import { deploy } from "./deploy_util";

async function main() {
  const {
    congressToken,
    federalGovernment,
    federalGovernmentTimelock,
    uSDollar,
    federalGovernmentTimelockConstructorArgs,
    federalGovernmentConstructorArgs,
    uSDollarConstructorArgs,
  } = await deploy();

  await hre.run("verify:verify", {
    address: congressToken.address,
  });

  await hre.run("verify:verify", {
    address: federalGovernmentTimelock.address,
    constructorArguments: federalGovernmentTimelockConstructorArgs,
    contract:
      "contracts/FederalGovernmentTimelock.sol:FederalGovernmentTimelock",
  });

  await hre.run("verify:verify", {
    address: federalGovernment.address,
    constructorArguments: federalGovernmentConstructorArgs,
  });

  await hre.run("verify:verify", {
    address: uSDollar.address,
    constructorArguments: uSDollarConstructorArgs,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
