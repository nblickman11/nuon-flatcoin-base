import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

//const { ethers: myEthers } = require('hardhat');
import { ethers as myEthers } from "hardhat";

/**
 * Deploys a contract using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployYourContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Get the balance of the deployer's address
  const { ethers } = hre;
  const deployerBalance = await ethers.provider.getBalance(deployer);
  console.log(`Deployer's balance: ${ethers.utils.formatEther(deployerBalance)} ETH`);

  // Deploy Contracts

  // Controller
  await deploy("NUONControllerV3", {
    from: deployer,
  });
  const nuonControllerV3 = await hre.ethers.getContract("NUONControllerV3", deployer);
  console.log(`NUONControllerV3 deployed to ${nuonControllerV3.address}`);

  // Hub
  await deploy("CollateralHubV3", {
    from: deployer,
  });
  const collateralHubV3 = await hre.ethers.getContract("CollateralHubV3", deployer);
  console.log(`CollateralHubV3 deployed to ${collateralHubV3.address}`);

  // NuonLiquidPositionsETH
  await deploy("NuonLiquidPositionsETH", {
    from: deployer,
  });
  const nlpETH = await hre.ethers.getContract("NuonLiquidPositionsETH", deployer);
  console.log(`NuonLiquidPositionsETH deployed to ${nlpETH.address}`);

  // NUON
  await deploy("NUON", {
    from: deployer,
  });
  const nuon = await hre.ethers.getContract("NUON", deployer);
  console.log(`NUON deployed to ${nuon.address}`);

  // TestToken
  await deploy("TestToken", {
    from: deployer,
  });
  const testToken = await hre.ethers.getContract("TestToken", deployer);
  console.log(`TestToken deployed to ${testToken.address}`);

  // Call CollateralHubV3's setCoreAddresses() and initializer()
  const setCoreAddressesTx = await collateralHubV3.setCoreAddresses(
    nuonControllerV3.address,
    nlpETH.address,
    nuon.address,
    testToken.address,
  );
  await setCoreAddressesTx.wait();
  console.log(
    `CollateralHubV3 setCoreAddress: ${nuonControllerV3.address}, ${nlpETH.address}, ${nuon.address}, ${testToken.address}`,
  );
  const initializerTx = await collateralHubV3.initialize(1);
  await initializerTx.wait();
  console.log(`CollateralHubV3 Initializer params are set`);

  // Call nuonControllerV3's setEcosystemParametersForCHUBS()
  const parsedValue = myEthers.utils.parseUnits("500000000000000000", 0);
  const parsedValue2 = myEthers.utils.parseUnits("111111111100000000", 0);
  const mintFee = myEthers.utils.parseUnits("000100000000000000", 0);
  const redeemFee = myEthers.utils.parseUnits("000100000000000000", 0);

  const setEcosystemParametersForCHUBSTx = await nuonControllerV3.setEcosystemParametersForCHUBS(
    collateralHubV3.address,
    parsedValue,
    0,
    parsedValue,
    parsedValue2,
    1,
    -9000,
    9000,
    mintFee,
    redeemFee,
  );
  await setEcosystemParametersForCHUBSTx.wait();
  console.log(`NuonControllerV3's ecosystem params have been set`);

  // Call NLP-ETH's setCHUBForNLP()
  const setCHUBForNLPTx = await nlpETH.setCHUBForNLP(collateralHubV3.address);
  await setCHUBForNLPTx.wait();
  console.log(`NLP-ETH's setCHUBForNLP(CHUB address) has been set to ${collateralHubV3.address}`);

  await deploy("YourContract", {
    from: deployer,
    args: [deployer],
    autoMine: true,
  });
};

export default deployYourContract;

/*
  On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

  When deploying to live networks (e.g `yarn deploy --network goerli`), the deployer account
  should have sufficient balance to pay for the gas fees for contract creation.

  You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
  with a random private key in the .env file (then used on hardhat.config.ts)
  You can run the `yarn account` command to check your balance in every network.
*/

// await deploy("YourContract", {
//   from: deployer,
//   // Contract constructor arguments
//   args: [deployer],
//   //log: true,
//   // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
//   // automatically mining the contract deployment transaction. There is no effect on live networks.
//   autoMine: true,
// });

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
//deployYourContract.tags = ["YourContract"];
