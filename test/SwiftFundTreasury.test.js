import { expect } from "chai";
import { ethers } from "hardhat";

describe("SwiftFundTreasury", function () {
  let treasury;
  let owner;
  let fan1;
  let fan2;
  let fan3;
  let other;

  const DEPOSIT_AMOUNT = ethers.parseEther("10");
  const AMOUNT_PER_FAN = ethers.parseEther("1");

  beforeEach(async function () {
    [owner, fan1, fan2, fan3, other] = await ethers.getSigners();
    const SwiftFundTreasury = await ethers.getContractFactory("SwiftFundTreasury");
    treasury = await SwiftFundTreasury.deploy();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await treasury.owner()).to.equal(owner.address);
    });

    it("Should start with zero balance", async function () {
      expect(await treasury.treasuryBalance()).to.equal(0n);
    });
  });

  describe("depositYield", function () {
    it("Should accept and store deposited yield", async function () {
      await treasury.connect(owner).depositYield({ value: DEPOSIT_AMOUNT });
      expect(await treasury.treasuryBalance()).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should allow multiple deposits to accumulate", async function () {
      await treasury.connect(owner).depositYield({ value: ethers.parseEther("3") });
      await treasury.connect(other).depositYield({ value: ethers.parseEther("7") });
      expect(await treasury.treasuryBalance()).to.equal(ethers.parseEther("10"));
    });
  });

  describe("distributeYield", function () {
    beforeEach(async function () {
      await treasury.connect(owner).depositYield({ value: DEPOSIT_AMOUNT });
    });

    it("Should distribute correct amount to each fan", async function () {
      const fans = [fan1.address, fan2.address, fan3.address];
      const balanceBefore1 = await ethers.provider.getBalance(fan1.address);
      const balanceBefore2 = await ethers.provider.getBalance(fan2.address);
      const balanceBefore3 = await ethers.provider.getBalance(fan3.address);

      await treasury.connect(owner).distributeYield(fans, AMOUNT_PER_FAN);

      expect(await ethers.provider.getBalance(fan1.address)).to.equal(balanceBefore1 + AMOUNT_PER_FAN);
      expect(await ethers.provider.getBalance(fan2.address)).to.equal(balanceBefore2 + AMOUNT_PER_FAN);
      expect(await ethers.provider.getBalance(fan3.address)).to.equal(balanceBefore3 + AMOUNT_PER_FAN);
    });

    it("Should decrease treasury balance by total distributed", async function () {
      const fans = [fan1.address, fan2.address];
      const totalDistributed = 2n * AMOUNT_PER_FAN;

      await treasury.connect(owner).distributeYield(fans, AMOUNT_PER_FAN);

      expect(await treasury.treasuryBalance()).to.equal(DEPOSIT_AMOUNT - totalDistributed);
    });

    it("Should handle single fan", async function () {
      const fans = [fan1.address];
      await treasury.connect(owner).distributeYield(fans, AMOUNT_PER_FAN);
      expect(await treasury.treasuryBalance()).to.equal(DEPOSIT_AMOUNT - AMOUNT_PER_FAN);
    });

    it("Should revert when called by non-owner", async function () {
      const fans = [fan1.address];
      await expect(
        treasury.connect(other).distributeYield(fans, AMOUNT_PER_FAN)
      ).to.be.revertedWithCustomError(treasury, "OnlyOwner");
    });

    it("Should revert when fans array is empty", async function () {
      const fans = [];
      await expect(
        treasury.connect(owner).distributeYield(fans, AMOUNT_PER_FAN)
      ).to.be.revertedWithCustomError(treasury, "ZeroFans");
    });

    it("Should revert when amountPerFan is zero", async function () {
      const fans = [fan1.address];
      await expect(
        treasury.connect(owner).distributeYield(fans, 0)
      ).to.be.revertedWithCustomError(treasury, "ZeroAmountPerFan");
    });

    it("Should revert when balance is insufficient", async function () {
      const fans = [fan1.address, fan2.address];
      const tooMuch = ethers.parseEther("100");
      await expect(
        treasury.connect(owner).distributeYield(fans, tooMuch)
      ).to.be.revertedWithCustomError(treasury, "InsufficientBalance");
    });
  });

  describe("Math and edge cases", function () {
    it("Total required = fans.length * amountPerFan", async function () {
      await treasury.connect(owner).depositYield({ value: ethers.parseEther("5") });
      const fourFans = [fan1.address, fan2.address, fan3.address, other.address];
      const perFan = ethers.parseEther("1");
      await treasury.connect(owner).distributeYield(fourFans, perFan);
      expect(await treasury.treasuryBalance()).to.equal(ethers.parseEther("1"));
    });
  });
});
