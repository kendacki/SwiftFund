# Security Audit Report: SwiftFundTreasury.sol

**Scope:** Full contract line-by-line review for production readiness (hackathon submission).  
**Findings and fixes applied below.**

---

## 1. Reentrancy

- **Finding:** `claimYield` and `distributeYield` perform external calls (`.call{ value }`) and could be re-entered if the recipient is a contract with a fallback/receive that calls back into the treasury.
- **Fix:** Implemented a reentrancy guard (`_reentrancyStatus` + `nonReentrant` modifier) and applied it to `claimYield` and `distributeYield`. State updates in `claimYield` already followed CEI (claimable balance zeroed before the transfer); the guard adds defense-in-depth.
- **Note:** `depositYield` and `fundCreator` do not perform external calls to the sender, so reentrancy risk there is negligible; no modifier added to avoid unnecessary gas.

---

## 2. Access Control

- **Finding:** Access control was already correct: `onlyOwner` on `distributeYield` and `creditClaimable`; `claimYield` only uses `claimableByCreatorByFunder[creator][msg.sender]`, so users can only claim their own yield.
- **Fix:** No change required.

---

## 3. Input Validation

- **Finding:** `distributeYield` did not reject `address(0)` in the `fans` array; sending to zero would burn HBAR.
- **Fix:** Added a zero-address check for each `fans[i]` and a new custom error `InvalidRecipient()`.
- **Finding:** `claimYield(creator)` did not reject `creator == address(0)` (reading from a valid but meaningless storage slot).
- **Fix:** Added `if (creator == address(0)) revert ZeroAddress();` at the start of `claimYield`.
- **Existing:** `fundCreator` and `creditClaimable` already validate zero address where needed.

---

## 4. Math & Logic

- **Finding:** No division or rounding in the contract; `totalRequired = fans.length * amountPerFan` is protected by Solidity 0.8.x overflow checks.
- **Fix:** No change required.

---

## 5. Denial of Service (DoS) / Gas

- **Finding:** Unbounded loops in `distributeYield` (over `fans`) and `creditClaimable` (over `funders`) could hit block gas limits and cause a single tx to fail or be unpractical.
- **Fix:** Enforced a maximum batch size of 200 for both functions and introduced the custom error `BatchTooLarge()`.

---

## 6. Code Cleanup & Gas

- **Finding:** No emojis or `console.log` in the contract; custom errors were already used.
- **Fix:** Grouped events at the top; added `nonReentrant` and new errors; kept NatSpec (`@notice`/`@param`) professional and concise; removed redundant inline comments.

---

## Summary of Changes

| Area           | Change                                                                 |
|----------------|-----------------------------------------------------------------------|
| Reentrancy     | Added `nonReentrant` and guard state; applied to `claimYield`, `distributeYield`. |
| Input          | Zero-address checks in `distributeYield` (fans) and `claimYield` (creator).       |
| DoS / Gas      | Max batch size 200 for `distributeYield` and `creditClaimable`.                  |
| Errors         | New: `ReentrancyGuard()`, `BatchTooLarge()`, `InvalidRecipient()`.              |
| Style           | Events grouped; NatSpec kept; no bloat.                                          |

---

**Recommendation:** Redeploy the treasury after this audit and update the frontend with the new contract address and ABI (sync-abi has been run).
