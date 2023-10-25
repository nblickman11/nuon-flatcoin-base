import {
    time,
    loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
const { network } = require("hardhat");
const { ethers: ethH } = require("hardhat");
const { ethers: myEthers } = require('ethers');


describe("CollateralHubV3", function () {

    let collateralHubV3Instance: ethH.Contract;
    let nuonControllerV3Instance: ethH.Contract;
    let nlpEthInstance: ethH.Contract;
    let nuonInstance: ethH.Contract;
    let testTokenInstance: ethH.Contract;

    this.timeout(60000);

    before(async function () {
        // Imports
        const bytecode = require('../artifacts/contracts/Nuon/Pools/CollateralHubV3.sol/CollateralHubV3.json').bytecode;
        const abi = require('../artifacts/contracts/Nuon/Pools/CollateralHubV3.sol/CollateralHubV3.json').abi;
        const bytecode1 = require('../artifacts/contracts/Nuon/NUONControllerV3.sol/NUONControllerV3.json').bytecode;
        const abi1 = require('../artifacts/contracts/Nuon/NUONControllerV3.sol/NUONControllerV3.json').abi;
        const bytecode2 = require('../artifacts/contracts/Nuon/NLP-ETH.sol/NuonLiquidPositionsETH.json').bytecode;
        const abi2 = require('../artifacts/contracts/Nuon/NLP-ETH.sol/NuonLiquidPositionsETH.json').abi;
        const bytecode3 = require('../artifacts/contracts/Nuon/NUON.sol/NUON.json').bytecode;
        const abi3 = require('../artifacts/contracts/Nuon/NUON.sol/NUON.json').abi;
        const bytecode4 = require('../artifacts/contracts/Nuon/TestToken.sol/TestToken.json').bytecode;
        const abi4 = require('../artifacts/contracts/Nuon/TestToken.sol/TestToken.json').abi;

        // Provider
        const providerA = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);
        const ownerPK = network.config.accounts[0];
        console.log(ownerPK);
        const wallet = new ethers.Wallet(ownerPK, providerA);

        // Deployments
        const collateralHubV3 = await new ethers.ContractFactory(abi, bytecode, wallet);
        collateralHubV3Instance = await collateralHubV3.deploy();
        await collateralHubV3Instance.waitForDeployment()
        console.log("collateralHubV3 deployed.");

        const nuonControllerV3 = await new ethers.ContractFactory(abi1, bytecode1, wallet);
        nuonControllerV3Instance = await nuonControllerV3.deploy();
        await nuonControllerV3Instance.waitForDeployment()
        console.log("controller deployed.");

        const nlpEth = await new ethers.ContractFactory(abi2, bytecode2, wallet);
        nlpEthInstance = await nlpEth.deploy();
        await nlpEthInstance.waitForDeployment()
        console.log("nlp_eth deployed.");

        const nuon = await new ethers.ContractFactory(abi3, bytecode3, wallet);
        nuonInstance = await nuon.deploy();
        await nuonInstance.waitForDeployment()
        console.log("nuon deployed.");

        const testToken = await new ethers.ContractFactory(abi4, bytecode4, wallet);
        testTokenInstance = await testToken.deploy();
        await testTokenInstance.waitForDeployment()
        console.log("testToken deployed.");

        // Call setCoreAddresses on CollateralHubV3 and initializer()
        const setCoreAddressesTx = await collateralHubV3Instance.setCoreAddresses(
            nuonControllerV3Instance.target, nlpEthInstance.target, nuonInstance.target, testTokenInstance.target);
        await setCoreAddressesTx.wait(); // Wait for the transaction to be mined
        const initializerTx = await collateralHubV3Instance.initialize(100);
        await initializerTx.wait();
        console.log("Addresses set.");

        // Call nuonControllerV3's setEcosystemParametersForCHUBS()
        const parsedValue = myEthers.parseUnits("500000000000000000", 18);
        const parsedValue2 = myEthers.parseUnits("111111111100000000", 18);
        const mintFee = myEthers.parseUnits("000000000000000001", 18);
        const setEcosystemParametersForCHUBSTx = await nuonControllerV3Instance.setEcosystemParametersForCHUBS(
            collateralHubV3Instance.target, parsedValue, 0, parsedValue, parsedValue2, 1, -900, 900, mintFee, 1);
        await setEcosystemParametersForCHUBSTx.wait();

        // Call NLP-ETH's setCHUBForNLP()
        const setCHUBForNLPTx = await nlpEthInstance.setCHUBForNLP(collateralHubV3Instance.target);
        await setCHUBForNLPTx.wait();
        console.log("Params set.");

        //return { collateralHubV3Instance, nuonControllerV3Instance, nlpEthInstance, nuonInstance, testTokenInstance };

    });

    //describe("Deployment", function () {
    it("Confirm correct Controller address is set", async function () {
        //const { collateralHubV3Instance, nuonControllerV3Instance, nlpEthInstance, nuonInstance, testTokenInstance } = await deployFixture(); //= await loadFixture(deployFixture);
        expect(collateralHubV3Instance).to.equal(collateralHubV3Instance);

        expect(await collateralHubV3Instance.NUONController()).to.equal(nuonControllerV3Instance.target);

    });
    //});

    // describe("Mint", function () {
    it("Minting Peg Below Price", async function () {
        //const { collateralHubV3Instance, nuonControllerV3Instance } = await loadFixture(deployFixture);
        // MINT(),  300 CR, .015 WETH-fee
        const parsedValue = myEthers.parseUnits("333333333333333300", 18);
        const parsedValue2 = myEthers.parseUnits("13514852823252754", 17);
        const mintTx = await collateralHubV3Instance.mint(parsedValue, parsedValue2);
        const receipt = await mintTx.wait();

        const loga = receipt.logs[6];
        const mintedEvent = loga["args"];
        const sender = mintedEvent[0];
        const mintedNuon = mintedEvent[1];
        const peg = mintedEvent[2];
        const collateral = mintedEvent[3];

        console.log("\nSender:\n", sender, "\n");
        // Correctly looks to be about 7.5 Nuon, HIGHER because peg price is below.
        console.log("Minted Nuon Amount:\n", mintedNuon.toString(), "\n"); // Convert to string to handle BigInt
        console.log("Peg:", peg.toString(), "\n");
        console.log("Collateral Amount\n:", collateral.toString(), "\n");

        expect(mintTx).to.emit(collateralHubV3Instance, "First3RequiresPassed");

        const maValue = await collateralHubV3Instance.mintedAmount("0x209740dDC77fC1FD983a53354A7710eC0a34f055");
        console.log("Minted Amount for deployer:", maValue);

    });


    it("Minting Peg Above Price", async function () {

        // Now, 7.6 nuon minted and weth reduced cause staked in contract

        // More Nuon increases supply, drops Nuon price relative to peg.
        const parsedPeg = myEthers.parseUnits("12", 16);
        const parsedNuon = myEthers.parseUnits("10", 16);
        const tx1 = await nuonControllerV3Instance.setTruflationPegPrice(parsedPeg);
        await tx1.wait();
        const tx2 = await nuonControllerV3Instance.setNuonTokenPrice(parsedNuon);
        await tx2.wait();

        // Mint after price Change
        const parsedValueX = myEthers.parseUnits("333333333333333300", 18);
        const parsedValueY = myEthers.parseUnits("13514852823252754", 17);
        const mintTx2 = await collateralHubV3Instance.mint(parsedValueX, parsedValueY);
        const receipt = await mintTx2.wait();

        const mCValue = await collateralHubV3Instance.mintedAmount("0x209740dDC77fC1FD983a53354A7710eC0a34f055");
        console.log("Minted Amount After Peg Change and another Mint:", mCValue);

        const loga = receipt.logs[6];
        const mintedEvent = loga["args"];
        const sender = mintedEvent[0];
        const mintedNuon = mintedEvent[1];
        const peg = mintedEvent[2];
        const collateral = mintedEvent[3];

        console.log("\nSender:\n", sender, "\n");
        // Correctly looks to be about 7.5 Nuon, HIGHER because peg price is below.
        console.log("Minted Nuon Amount:\n", mintedNuon.toString(), "\n"); // Convert to string to handle BigInt
        console.log("Peg:", peg.toString(), "\n");
        console.log("Collateral Amount\n:", collateral.toString(), "\n");

    });

    //describe("Redeem", function () {
    it("Redeem Test",
        async function () {

            // Now, 13.6 cumulative nuon minted and weth reduced cause staked in contract

            // Redeem/Burn 3 Nuon and get back $9.21 (.00589 WETH)  
            const redeemAmount = myEthers.parseUnits("30000000000000000", 17);

            const redeemTx = await collateralHubV3Instance.redeem(redeemAmount);
            const receipt = await redeemTx.wait();

            const mCValue = await collateralHubV3Instance.mintedAmount("0x209740dDC77fC1FD983a53354A7710eC0a34f055");
            console.log("Minted Amount After Redeem:", mCValue);

            const log = receipt.logs[5];
            const redeemedEvent = log["args"];

            const sender = redeemedEvent[0];
            const fullAmount = redeemedEvent[1];
            const NUONAmount = redeemedEvent[2];

            console.log("\nSender:\n", sender, "\n");
            console.log("Earned Collateral Amount:\n", fullAmount.toString(), "\n"); // Convert to string to handle BigInt
            console.log("Burned Nuon Amount:\n", NUONAmount.toString(), "\n");
        });
    //});
});


// import {
//     time,
//     loadFixture,
// } from "@nomicfoundation/hardhat-toolbox/network-helpers";
// import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
// import { expect } from "chai";
// const { network } = require("hardhat");
// const { ethers: ethH } = require("hardhat");
// const { ethers: myEthers } = require('ethers');


// describe("CollateralHubV3", function () {
//     // We define a fixture to reuse the same setup in every test.
//     // We use loadFixture to run this setup once, snapshot that state,
//     // and reset Hardhat Network to that snapshot in every test.


//     let collateralHubV3Instance: ethH.Contract;
//     let nuonControllerV3Instance: ethH.Contract;
//     let nlpEthInstance: ethH.Contract;
//     let nuonInstance: ethH.Contract;
//     let testTokenInstance: ethH.Contract;

//     this.timeout(60000);

//     before(async function () {
//         // Imports
//         const bytecode = require('../artifacts/contracts/Nuon/Pools/CollateralHubV3.sol/CollateralHubV3.json').bytecode;
//         const abi = require('../artifacts/contracts/Nuon/Pools/CollateralHubV3.sol/CollateralHubV3.json').abi;
//         const bytecode1 = require('../artifacts/contracts/Nuon/NUONControllerV3.sol/NUONControllerV3.json').bytecode;
//         const abi1 = require('../artifacts/contracts/Nuon/NUONControllerV3.sol/NUONControllerV3.json').abi;
//         const bytecode2 = require('../artifacts/contracts/Nuon/NLP-ETH.sol/NuonLiquidPositionsETH.json').bytecode;
//         const abi2 = require('../artifacts/contracts/Nuon/NLP-ETH.sol/NuonLiquidPositionsETH.json').abi;
//         const bytecode3 = require('../artifacts/contracts/Nuon/NUON.sol/NUON.json').bytecode;
//         const abi3 = require('../artifacts/contracts/Nuon/NUON.sol/NUON.json').abi;
//         const bytecode4 = require('../artifacts/contracts/Nuon/TestToken.sol/TestToken.json').bytecode;
//         const abi4 = require('../artifacts/contracts/Nuon/TestToken.sol/TestToken.json').abi;

//         // Provider
//         const providerA = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);
//         const ownerPK = network.config.accounts[0];
//         console.log(ownerPK);
//         const wallet = new ethers.Wallet(ownerPK, providerA);

//         // Deployments
//         const collateralHubV3 = await new ethers.ContractFactory(abi, bytecode, wallet);
//         collateralHubV3Instance = await collateralHubV3.deploy();
//         await collateralHubV3Instance.waitForDeployment()
//         console.log("collateralHubV3 deployed.");

//         const nuonControllerV3 = await new ethers.ContractFactory(abi1, bytecode1, wallet);
//         nuonControllerV3Instance = await nuonControllerV3.deploy();
//         await nuonControllerV3Instance.waitForDeployment()
//         console.log("controller deployed.");

//         const nlpEth = await new ethers.ContractFactory(abi2, bytecode2, wallet);
//         nlpEthInstance = await nlpEth.deploy();
//         await nlpEthInstance.waitForDeployment()
//         console.log("nlp_eth deployed.");

//         const nuon = await new ethers.ContractFactory(abi3, bytecode3, wallet);
//         nuonInstance = await nuon.deploy();
//         await nuonInstance.waitForDeployment()
//         console.log("nuon deployed.");

//         const testToken = await new ethers.ContractFactory(abi4, bytecode4, wallet);
//         testTokenInstance = await testToken.deploy();
//         await testTokenInstance.waitForDeployment()
//         console.log("testToken deployed.");

//         // // Contracts are deployed using the first signer/account by default
//         // const [owner, otherAccount] = await ethers.getSigners();
//         // const NUONControllerV3 = await ethers.getContractFactory("NUONControllerV3");
//         // const nuonControllerV3Instance = await NUONControllerV3.deploy();
//         // const NLP_ETH = await ethers.getContractFactory("NuonLiquidPositionsETH");
//         // const nlpEthInstance = await NLP_ETH.deploy();
//         // const NUON = await ethers.getContractFactory("NUON");
//         // const nuonInstance = await NUON.deploy();
//         // const TestToken = await ethers.getContractFactory("TestToken");
//         // const testTokenInstance = await TestToken.deploy();

//         // Call setCoreAddresses on CollateralHubV3 and initializer()
//         const setCoreAddressesTx = await collateralHubV3Instance.setCoreAddresses(
//             nuonControllerV3Instance.target, nlpEthInstance.target, nuonInstance.target, testTokenInstance.target);
//         await setCoreAddressesTx.wait(); // Wait for the transaction to be mined
//         const initializerTx = await collateralHubV3Instance.initialize(100);
//         await initializerTx.wait();
//         console.log("Addresses set.");

//         // Call nuonControllerV3's setEcosystemParametersForCHUBS()
//         const parsedValue = myEthers.parseUnits("500000000000000000", 18);
//         const parsedValue2 = myEthers.parseUnits("111111111100000000", 18);
//         const mintFee = myEthers.parseUnits("000000000000000001", 18);
//         const setEcosystemParametersForCHUBSTx = await nuonControllerV3Instance.setEcosystemParametersForCHUBS(
//             collateralHubV3Instance.target, parsedValue, 0, parsedValue, parsedValue2, 1, -900, 900, mintFee, 1);
//         await setEcosystemParametersForCHUBSTx.wait();

//         // Call NLP-ETH's setCHUBForNLP()
//         const setCHUBForNLPTx = await nlpEthInstance.setCHUBForNLP(collateralHubV3Instance.target);
//         await setCHUBForNLPTx.wait();
//         console.log("Params set.");

//         //return { collateralHubV3Instance, nuonControllerV3Instance, nlpEthInstance, nuonInstance, testTokenInstance };

//     });

//     //describe("Deployment", function () {
//     it("Confirm correct Controller address is set", async function () {
//         //const { collateralHubV3Instance, nuonControllerV3Instance, nlpEthInstance, nuonInstance, testTokenInstance } = await deployFixture(); //= await loadFixture(deployFixture);
//         expect(collateralHubV3Instance).to.equal(collateralHubV3Instance);

//         expect(await collateralHubV3Instance.NUONController()).to.equal(nuonControllerV3Instance.target);

//     });
//     //});

//     // describe("Mint", function () {
//     it("Minting Peg Below Price", async function () {
//         //const { collateralHubV3Instance, nuonControllerV3Instance } = await loadFixture(deployFixture);
//         // MINT(),  300 CR, .015 WETH-fee
//         const parsedValue = myEthers.parseUnits("333333333333333300", 18);
//         const parsedValue2 = myEthers.parseUnits("13514852823252754", 17);
//         console.log(parsedValue);
//         const mintTx = await collateralHubV3Instance.mint(parsedValue, parsedValue2);
//         const receipt = await mintTx.wait();

//         const loga = receipt.logs[6];
//         //console.log("Logs of Mint():", loga);

//         const mintedEvent = loga["args"];

//         const sender = mintedEvent[0];
//         const mintedNuon = mintedEvent[1];
//         const peg = mintedEvent[2];
//         const collateral = mintedEvent[3];

//         console.log("\nSender:\n", sender, "\n");
//         // Correctly looks to be about 7.5 Nuon, HIGHER because peg price is below.
//         console.log("Minted Nuon Amount:\n", mintedNuon.toString(), "\n"); // Convert to string to handle BigInt
//         console.log("Peg:", peg.toString(), "\n");
//         console.log("Collateral Amount\n:", collateral.toString(), "\n");

//         expect(mintTx).to.emit(collateralHubV3Instance, "First3RequiresPassed");


//         const maValue = await collateralHubV3Instance.mintedAmount("0x209740dDC77fC1FD983a53354A7710eC0a34f055");
//         console.log("Minted Amount for deployer:", maValue);

//     });

//     //     it("Should fail minting when minting is paused", async function () {
//     //         const { collateralHubV3Instance, nuonControllerV3Instance } = await loadFixture(deployFixture);
//     //         const toggleTx = await nuonControllerV3Instance.toggleMinting();
//     //         await toggleTx.wait();
//     //         const parsedValue = myEthers.parseUnits("142857142857142860", 18);
//     //         const parsedValue2 = myEthers.parseUnits("10686511125330335", 17);
//     //         await expect(collateralHubV3Instance.mint(parsedValue, parsedValue2)).to.be.revertedWith("CHUB: Minting paused!");
//     //     });
//     // });
//     // it("Should fail minting when collateral ratio is out of bounds", async function () {
//     //     const { collateralHubV3Instance, nuonControllerV3Instance } = await loadFixture(deployFixture);
//     //     const parsedValue = myEthers.parseUnits("600000000000000000", 18);
//     //     const parsedValue2 = myEthers.parseUnits("10686511125330335", 17);
//     //     await expect(collateralHubV3Instance.mint(parsedValue, parsedValue2)).to.be.revertedWith("Collateral Ratio out of bounds");
//     // });

//     // it("Should fail minting when collateral ratio is too low", async function () {
//     //     const { collateralHubV3Instance, nuonControllerV3Instance } = await loadFixture(deployFixture);
//     //     await expect(collateralHubV3Instance.mint(80, 1000)).to.be.revertedWith("Collateral Ratio too low");
//     // });

//     // it("Should fail minting when user already has a position", async function () {
//     //     const { collateralHubV3Instance, nuonControllerV3Instance } = await loadFixture(deployFixture);
//     //     const tx = await collateralHubV3Instance.mint(300, 1000);
//     //     await tx.wait();
//     //     // Try to mint again.
//     //     await expect(collateralHubV3Instance.mint(350, 2000)).to.be.revertedWith("You already have a position");
//     // });

//     // it("Should update mappings when user mints NUON", async function () {
//     //     const { collateralHubV3Instance, nuonControllerV3Instance, nlpEthInstance, owner } = await loadFixture(deployFixture);
//     //     const mintTx = await collateralHubV3Instance.mint(300, 1000);
//     //     await mintTx.wait();
//     //     // Check that the mappings are updated
//     //     const userNLPId = await collateralHubV3Instance.nlpPerUser(owner);
//     //     const userCheck = await collateralHubV3Instance.nlpCheck(owner);
//     //     const mintedAmount = await collateralHubV3Instance.mintedAmount(owner);
//     //     const usersAmounts = await collateralHubV3Instance.usersAmounts(owner);
//     //     expect(userNLPId).to.equal(0);
//     //     expect(userCheck).to.equal(true);
//     //     //expect(Number(mintedAmount)).to.be.gt(0);
//     //     expect(Number(usersAmounts)).to.be.gt(0);
//     //     console.log(`usersAmounts!: ${usersAmounts}`);
//     // });

//     it("Minting Peg Above Price", async function () {

//         const mAValue = await collateralHubV3Instance.mintedAmount("0x209740dDC77fC1FD983a53354A7710eC0a34f055");
//         console.log("Minted Amount for deployer:", mAValue);

//         const parsedValue = myEthers.parseUnits("333333333333333300", 18);
//         const parsedValue2 = myEthers.parseUnits("13514852823252754", 17);
//         console.log(parsedValue);
//         const mintTx = await collateralHubV3Instance.mint(parsedValue, parsedValue2);
//         const receipt1 = await mintTx.wait();

//         const mBValue = await collateralHubV3Instance.mintedAmount("0x209740dDC77fC1FD983a53354A7710eC0a34f055");
//         console.log("Minted Amount for deployer:", mBValue);

//         const log1 = receipt1.logs[6];
//         const mintedEvent1 = log1["args"];
//         const sender1 = mintedEvent1[0];
//         const mintedNuon1 = mintedEvent1[1];
//         const peg1 = mintedEvent1[2];
//         const collateral1 = mintedEvent1[3];

//         console.log("\nSender:\n", sender1, "\n");
//         // Correctly looks to be about 7.5 Nuon, HIGHER because peg price is below.
//         console.log("Minted Nuon Amount:\n", mintedNuon1.toString(), "\n"); // Convert to string to handle BigInt
//         console.log("Peg:", peg1.toString(), "\n");
//         console.log("Collateral Amount\n:", collateral1.toString(), "\n");


//         // Now, 7.6 nuon minted and weth reduced cause staked in contract


//         // More Nuon increases supply, drops Nuon price relative to peg.
//         const parsedPeg = myEthers.parseUnits("12", 16);
//         const parsedNuon = myEthers.parseUnits("10", 16);
//         const tx1 = await nuonControllerV3Instance.setTruflationPegPrice(parsedPeg);
//         await tx1.wait();
//         const tx2 = await nuonControllerV3Instance.setNuonTokenPrice(parsedNuon);
//         await tx2.wait();

//         // Mint after price Change
//         const parsedValueX = myEthers.parseUnits("333333333333333300", 18);
//         const parsedValueY = myEthers.parseUnits("13514852823252754", 17);
//         //console.log(parsedValue);
//         const mintTx2 = await collateralHubV3Instance.mint(parsedValueX, parsedValueY);
//         const receipt = await mintTx2.wait();

//         const mCValue = await collateralHubV3Instance.mintedAmount("0x209740dDC77fC1FD983a53354A7710eC0a34f055");
//         console.log("Minted Amount After Peg Change and another Mint:", mCValue);

//         const loga = receipt.logs[6];
//         const mintedEvent = loga["args"];
//         const sender = mintedEvent[0];
//         const mintedNuon = mintedEvent[1];
//         const peg = mintedEvent[2];
//         const collateral = mintedEvent[3];

//         console.log("\nSender:\n", sender, "\n");
//         // Correctly looks to be about 7.5 Nuon, HIGHER because peg price is below.
//         console.log("Minted Nuon Amount:\n", mintedNuon.toString(), "\n"); // Convert to string to handle BigInt
//         console.log("Peg:", peg.toString(), "\n");
//         console.log("Collateral Amount\n:", collateral.toString(), "\n");

//     });

//     //describe("Redeem", function () {
//     it("Redeem Test",
//         async function () {
//             //const { collateralHubV3Instance, nuonControllerV3Instance } = await loadFixture(deployFixture);
//             // MINT(),  300 CR, .015 WETH-fee
//             const parsedValue = myEthers.parseUnits("333333333333333300", 18);
//             const parsedValue2 = myEthers.parseUnits("13514852823252754", 17);
//             const mintTx = await collateralHubV3Instance.mint(parsedValue, parsedValue2);
//             await mintTx.wait();


//             const mBValue = await collateralHubV3Instance.mintedAmount("0x209740dDC77fC1FD983a53354A7710eC0a34f055");
//             console.log("Minted Amount After Peg change and 2 mints:", mBValue);

//             // Now, 7.6 nuon minted and weth reduced cause staked in contract

//             // Redeem/Burn 3 Nuon and get back $9.21 (.00589 WETH)  
//             const redeemAmount = myEthers.parseUnits("300000000000000000", 18);
//             // ** NOTE: a literal value of 3000000000000000000 causes overflow in javascript
//             // sometimes.  So, parseUnits turns it into a BigNumber data type to prevent this.
//             //  Also, we use 19 digits here (represents 3 Nuon).  We use 19 decimals because we
//             // .. are interating with wei values on the backend.  But doesn't have to do with 
//             // ..representing wei, our number represents in 3 Nuon.

//             const redeemTx = await collateralHubV3Instance.redeem(redeemAmount);
//             const receipt = await redeemTx.wait();

//             const mCValue = await collateralHubV3Instance.mintedAmount("0x209740dDC77fC1FD983a53354A7710eC0a34f055");
//             console.log("Minted Amount After Peg change and 2 mints and redeem:", mCValue);

//             const log = receipt.logs[5];
//             //console.log("Logs:", log);

//             const redeemedEvent = log["args"];

//             const sender = redeemedEvent[0];
//             const fullAmount = redeemedEvent[1];
//             const NUONAmount = redeemedEvent[2];

//             console.log("\nSender:\n", sender, "\n");
//             console.log("Earned Collateral Amount:\n", fullAmount.toString(), "\n"); // Convert to string to handle BigInt
//             console.log("Burned Nuon Amount:\n", NUONAmount.toString(), "\n");
//         });
//     //});
// });