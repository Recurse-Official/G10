// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title KMIT Token
 * @dev An implementation of the ERC-20 standard token.
 *
 * This contract defines a simple ERC-20 token named "KMIT" with the symbol "KMIT".
 * It uses OpenZeppelin's ERC20 implementation, allowing for basic token functionality
 * such as transferring tokens, approving spending, and checking balances and allowances.
 * 
 * The contract is initialized with an initial supply of tokens, which is minted to the deployer's address.
 */



contract KMIT_Token is ERC20 {
    /**
     * @dev Constructor that sets the initial supply of tokens.
     * @param initialSupply The amount of tokens to mint at the time of deployment.
     */

*/    KMIT_Token token = new KMIT_Token(1000000 * 10**18); // 1 million tokens, with 18 decimals  */

    constructor(uint256 initialSupply) ERC20("KMIT", "KMIT") {
        // Mint the initial supply of tokens to the contract deployer's address
        _mint(msg.sender, initialSupply);
    }
}
