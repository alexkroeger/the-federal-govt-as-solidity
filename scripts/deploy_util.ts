import { ethers } from "hardhat";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export async function deploy() {
  // deploy congress (the governance ERC20)
  const CongressToken = await ethers.getContractFactory("CongressToken");
  const congressToken = await CongressToken.deploy();

  await congressToken.deployed();

  console.log("CongressToken deployed to:", congressToken.address);

  console.log("Decimals:", await congressToken.decimals());
  console.log("Total supply:", (await congressToken.totalSupply()).toString());

  // deploy the timelock contract
  // constructor params
  const _minDelay = 15; // 15 second minDelay
  const _proposers: string[] = []; // no proposers for now
  const _executers = [ZERO_ADDRESS]; // anyone can execute
  const federalGovernmentTimelockConstructorArgs = [
    _minDelay,
    _proposers,
    _executers,
  ];
  const FederalGovernmentTimelock = await ethers.getContractFactory(
    "FederalGovernmentTimelock"
  );
  const federalGovernmentTimelock = await FederalGovernmentTimelock.deploy(
    _minDelay,
    _proposers,
    _executers
  );

  console.log(
    "FederalGovernmentTimelock deployed to:",
    federalGovernmentTimelock.address
  );

  // deploy the Federal Government
  // constructor params:
  const _token = congressToken.address;
  const _timelock = federalGovernmentTimelock.address;
  const federalGovernmentConstructorArgs = [_token, _timelock];
  const FederalGovernment = await ethers.getContractFactory(
    "FederalGovernment"
  );
  const federalGovernment = await FederalGovernment.deploy(_token, _timelock);

  console.log("FederalGovernment deployed to:", federalGovernment.address);

  // add FederalGovernment as proposer to timelock
  await federalGovernmentTimelock.grantRole(
    await federalGovernmentTimelock.PROPOSER_ROLE(),
    federalGovernment.address
  );
  // remove deployer as an admin
  console.log(
    "deployer is timelock admin?",
    await federalGovernmentTimelock.hasRole(
      await federalGovernmentTimelock.TIMELOCK_ADMIN_ROLE(),
      await federalGovernmentTimelock.signer.getAddress()
    )
  );
  await federalGovernmentTimelock.renounceRole(
    await federalGovernmentTimelock.TIMELOCK_ADMIN_ROLE(),
    await federalGovernmentTimelock.signer.getAddress()
  );
  console.log(
    "deployer is timelock admin?",
    await federalGovernmentTimelock.hasRole(
      await federalGovernmentTimelock.TIMELOCK_ADMIN_ROLE(),
      await federalGovernmentTimelock.signer.getAddress()
    )
  );

  // deploy USD contract
  // constructor params:
  const _owner = federalGovernmentTimelock.address;
  const uSDollarConstructorArgs = [_owner];
  const USDollar = await ethers.getContractFactory("USDollar");
  const uSDollar = await USDollar.deploy(_owner);

  console.log("USDollar deployed to:", uSDollar.address);
  console.log("USDollar owner:", await uSDollar.owner());

  return {
    congressToken,
    federalGovernmentTimelock,
    federalGovernment,
    uSDollar,
    federalGovernmentTimelockConstructorArgs,
    federalGovernmentConstructorArgs,
    uSDollarConstructorArgs,
  };
}
