// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor() ERC20("TestToken", "TEST") {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function myApprove(address owner, address spender, uint256 amount) public {
        _approve(owner, spender, amount);
    }

    function myTransferFrom(address from, address to, uint256 amount) public {
        transferFrom(from, to, amount);
    }
}
