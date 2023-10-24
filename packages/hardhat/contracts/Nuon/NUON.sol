// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract NUON is ERC20 {
	constructor() ERC20("NUON", "NUON") {}

	function mint(address to, uint256 amount) public {
		_mint(to, amount);
	}

	function myApprove(address owner, address spender, uint256 amount) public {
		_approve(owner, spender, amount);
	}

	function myBurn(uint256 value) public virtual {
		_burn(_msgSender(), value);
	}
}
