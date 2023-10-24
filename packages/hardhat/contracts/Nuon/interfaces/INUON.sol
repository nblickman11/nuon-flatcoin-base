// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "./IAnyswapV4Token.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface INUON is IERC20, IAnyswapV4Token {
    function mint(address who, uint256 amount) external;

    function setNUONController(address _controller) external;

    function myBurn(uint256 amount) external;

    function myApprove(address owner, address spender, uint256 amount) external;
}
