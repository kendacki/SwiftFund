// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SwiftFundTreasury
 * @notice Receives yield/revenue and distributes to fan wallets.
 *         On Hedera Testnet, SWIND token distribution can be added via HTS precompile.
 */
contract SwiftFundTreasury {
    address public owner;

    event YieldDeposited(address indexed from, uint256 amount);
    event YieldDistributed(address indexed to, uint256 amount);
    event DistributionBatch(address indexed caller, uint256 fanCount, uint256 amountPerFan);

    error OnlyOwner();
    error InsufficientBalance();
    error ZeroFans();
    error ZeroAmountPerFan();
    error ZeroAddress();
    error TransferFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Receive yield/revenue (native currency: HBAR on Hedera, ETH locally).
    function depositYield() external payable {
        if (msg.value == 0) return;
        emit YieldDeposited(msg.sender, msg.value);
    }

    /// @notice Distribute yield to a list of fan addresses. Callable by owner or future oracle.
    /// @param fans Array of fan wallet addresses.
    /// @param amountPerFan Amount (in wei) to send to each fan.
    function distributeYield(address[] memory fans, uint256 amountPerFan) external onlyOwner {
        if (fans.length == 0) revert ZeroFans();
        if (amountPerFan == 0) revert ZeroAmountPerFan();

        uint256 totalRequired = fans.length * amountPerFan;
        if (address(this).balance < totalRequired) revert InsufficientBalance();

        for (uint256 i = 0; i < fans.length; i++) {
            (bool ok, ) = fans[i].call{ value: amountPerFan }("");
            if (!ok) revert TransferFailed();
            emit YieldDistributed(fans[i], amountPerFan);
        }

        emit DistributionBatch(msg.sender, fans.length, amountPerFan);
    }

    /// @notice Returns the contract's balance (available for distribution).
    function treasuryBalance() external view returns (uint256) {
        return address(this).balance;
    }

    event CreatorFunded(address indexed funder, address indexed creator, uint256 amount);

    /// @notice Fund a creator: send HBAR to the treasury and record the creator for attribution.
    /// @param creator Creator's EVM address (for attribution / future payouts).
    function fundCreator(address creator) external payable {
        if (msg.value == 0) return;
        if (creator == address(0)) revert ZeroAddress();
        emit CreatorFunded(msg.sender, creator, msg.value);
    }
}
