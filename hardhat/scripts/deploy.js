const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });

async function main() {
  /*
    A ContractFactory in ethers.js is an abstraction used to deploy new smart contracts,
    so cryptoDevsTokenContract here is a factory for instances of our CryptoDevToken contract.
    */
  const LauCoinContract = await ethers.getContractFactory("LauCoin");

  // deploy the contract
  const deployedLauCoinContract = await LauCoinContract.deploy();

  // print the address of the deployed contract
  console.log("Lauren Coin Contract Address:", deployedLauCoinContract.address);
}

// Call the main function and catch if there is any error
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
