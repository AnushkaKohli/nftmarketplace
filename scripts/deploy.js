const { ethers } = require("hardhat");

async function main() {
  const contractFactory = await ethers.getContractFactory("NFTMarketplace");
  const contract = await contractFactory.deploy();
  await contract.getDeployedCode();
  console.log("Contract deployed to:", contract.target);
  // Save the address to use later in frontend
  // Contract deployed to: 0xc31E063F5faf9776A4351e9E8Cb8220356aC4F54
  // Remix Contract deployed to: 0xbdde5e5e3118af9192923cc0a220cbe0da0b0022
}

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

runMain();
