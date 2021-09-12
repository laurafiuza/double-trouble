const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Greeter", () => {
  let greeter;

  before(async () => {
    const Greeter = await ethers.getContractFactory("Greeter");
    greeter = await Greeter.deploy("Hello world!");
    await greeter.deployed();
  });

  it("Should return the new greeting", async () => {
    expect(await greeter.greet()).to.equal("Hello world!");

    await greeter.setGreeting("Hola, mundo!");
    expect(await greeter.greet()).to.equal("Hola, mundo!");
  });

  it("Should set the number", async () => {
    expect(await greeter.number()).to.equal("0");

    await greeter.setNumber(123);
    expect(await greeter.number()).to.equal("123");
  });
});
