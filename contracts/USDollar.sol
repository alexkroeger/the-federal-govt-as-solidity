//SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract USDollar is Ownable, ERC20, ERC20Permit {
    constructor(address _admin)
        ERC20("USDollar", "USD")
        ERC20Permit("USDollar")
    {
        // by default the deployer is the owner
        // we'll make the timelock the owner
        _transferOwnership(_admin);
    }

    // override to decimals = 2
    // smallest denomination = cents :)
    function decimals() public view virtual override returns (uint8) {
        return 2;
    }

    // give the contract owner (the federal gov't) the ability to mint USD
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // give the contract owner (the federal gov't) the ability to burn USD
    // this means the gov't can burn anyone's balance 😈
    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }
}
