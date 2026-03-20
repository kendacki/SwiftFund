// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SwiftFundTreasury
 * @notice Receives yield/revenue and distributes to fan wallets. Supports push (distributeYield)
 *         and pull (claimYield) flows. Designed for Hedera Testnet; SWIND token distribution
 *         can be added via HTS precompile off-contract.
 */
contract SwiftFundTreasury {
    uint256 public constant MAX_FUNDERS = 200;

    address public owner;

    /// @dev Reentrancy guard: 1 = locked, 2 = unlocked (OpenZeppelin-style to support nested locks if needed later)
    uint256 private _reentrancyStatus = 2;

    /// @dev Unique funder count per creator (capped at MAX_FUNDERS).
    mapping(address => uint256) public creatorFunderCount;
    /// @dev Whether a given funder has ever funded a given creator (so we count only new funders).
    mapping(address => mapping(address => bool)) private _hasFundedCreator;

    event YieldDeposited(address indexed from, uint256 amount);
    event YieldDistributed(address indexed to, uint256 amount);
    event DistributionBatch(address indexed caller, uint256 fanCount, uint256 amountPerFan);
    event CreatorFunded(address indexed funder, address indexed creator, uint256 amount);
    event YieldClaimed(address indexed funder, address indexed creator, uint256 amount);

    error OnlyOwner();
    error InsufficientBalance();
    error ZeroFans();
    error ZeroAmountPerFan();
    error ZeroAddress();
    error TransferFailed();
    error NothingToClaim();
    error LengthMismatch();
    error ReentrancyGuard();
    error BatchTooLarge();
    error InvalidRecipient();
    error MaxFundersReached();

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier nonReentrant() {
        if (_reentrancyStatus != 2) revert ReentrancyGuard();
        _reentrancyStatus = 1;
        _;
        _reentrancyStatus = 2;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Receive yield/revenue (native currency: HBAR on Hedera, ETH locally).
    function depositYield() external payable {
        if (msg.value == 0) return;
        emit YieldDeposited(msg.sender, msg.value);
    }

    /// @notice Push: distribute yield to a list of fan addresses. Callable only by owner.
    /// @param fans Array of fan wallet addresses (no zero address).
    /// @param amountPerFan Amount in wei to send to each fan.
    function distributeYield(address[] memory fans, uint256 amountPerFan) external onlyOwner nonReentrant {
        if (fans.length == 0) revert ZeroFans();
        if (amountPerFan == 0) revert ZeroAmountPerFan();
        if (fans.length > 200) revert BatchTooLarge();

        uint256 totalRequired = fans.length * amountPerFan;
        if (address(this).balance < totalRequired) revert InsufficientBalance();

        for (uint256 i = 0; i < fans.length; i++) {
            if (fans[i] == address(0)) revert InvalidRecipient();
            (bool ok, ) = fans[i].call{ value: amountPerFan }("");
            if (!ok) revert TransferFailed();
            emit YieldDistributed(fans[i], amountPerFan);
        }

        emit DistributionBatch(msg.sender, fans.length, amountPerFan);
    }

    /// @notice Returns the contract balance (available for distribution or claims).
    function treasuryBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Fund a creator: send HBAR to the treasury and record the creator for attribution.
    /// @param creator Creator EVM address (must not be zero). Reverts if this creator has reached MAX_FUNDERS unique funders.
    function fundCreator(address creator) external payable {
        if (msg.value == 0) return;
        if (creator == address(0)) revert ZeroAddress();
        if (!_hasFundedCreator[creator][msg.sender]) {
            if (creatorFunderCount[creator] >= MAX_FUNDERS) revert MaxFundersReached();
            creatorFunderCount[creator] += 1;
            _hasFundedCreator[creator][msg.sender] = true;
        }
        emit CreatorFunded(msg.sender, creator, msg.value);
    }

    mapping(address => mapping(address => uint256)) public claimableByCreatorByFunder;

    /// @notice Pull: claim your share of yield from a creator. Callable by any funder with claimable balance.
    /// @param creator The creator address you are claiming yield from (must not be zero).
    function claimYield(address creator) external nonReentrant {
        if (creator == address(0)) revert ZeroAddress();

        // Cache `msg.sender` so we always use the same address for both effects and interaction.
        // Effects are applied before the external call (CEI), and `nonReentrant` further blocks re-entry.
        address payable claimant = payable(msg.sender);

        uint256 amount = claimableByCreatorByFunder[creator][claimant];
        if (amount == 0) revert NothingToClaim();
        if (address(this).balance < amount) revert InsufficientBalance();

        // Effects: clear claimable balance before interacting with `claimant`.
        claimableByCreatorByFunder[creator][claimant] = 0;

        // Interaction: external transfer.
        (bool ok, ) = claimant.call{ value: amount }("");
        if (!ok) revert TransferFailed();

        emit YieldClaimed(claimant, creator, amount);
    }

    /// @notice Owner credits claimable yield for funders (e.g. after calculating allocations off-chain).
    /// @param creator Creator address for attribution (must not be zero).
    /// @param funders List of funder addresses to credit.
    /// @param amounts Amount in wei to credit for each funder.
    function creditClaimable(
        address creator,
        address[] calldata funders,
        uint256[] calldata amounts
    ) external onlyOwner {
        if (creator == address(0)) revert ZeroAddress();
        if (funders.length != amounts.length) revert LengthMismatch();
        if (funders.length > 200) revert BatchTooLarge();

        for (uint256 i = 0; i < funders.length; i++) {
            if (funders[i] != address(0) && amounts[i] > 0) {
                claimableByCreatorByFunder[creator][funders[i]] += amounts[i];
            }
        }
    }
}
