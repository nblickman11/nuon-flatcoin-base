import { useState } from "react";
import { CopyIcon } from "./assets/CopyIcon";
import { DiamondIcon } from "./assets/DiamondIcon";
import { HareIcon } from "./assets/HareIcon";
import { useAccount } from "wagmi";
//import { parseEther } from "viem";
import { ArrowSmallRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
const ethers = require('ethers'); // Import ethers.js


export const ContractInteraction = () => {
    const [visible, setVisible] = useState(true);

    const [uintValues, setUintValues] = useState([BigInt(0), BigInt(0)]); // Initialize with default values
    const args = [uintValues[0], uintValues[1]];

    const { writeAsync, isLoading } = useScaffoldContractWrite({
        contractName: "CollateralHubV3",
        functionName: "mint",
        args: args as [bigint | undefined, bigint | undefined], // Cast it to the expected type
        onBlockConfirmation: txnReceipt => {
            console.log("📦 Transaction blockHash", txnReceipt.blockHash);
        },
    });

    const [redeemValue, setRedeemValue] = useState([BigInt(0)]); // Initialize with default values
    const args2 = [redeemValue[0]];

    const { writeAsync: writeAsync2, isLoading: isLoading2 } = useScaffoldContractWrite({
        contractName: "CollateralHubV3",
        functionName: "redeem",
        args: args2 as [bigint | undefined], // Cast it to the expected type
        onBlockConfirmation: txnReceipt => {
            console.log("📦 Transaction blockHash", txnReceipt.blockHash);
        },
    });

    const { address } = useAccount(); // Get the user's address using the useAccount hook
    const fixedAmount = 10000000000000000000; // Fixed uint value
    const args3 = [address, fixedAmount]; // Provide the user's address and the fixed uint value
    const { writeAsync: writeAsync3, isLoading: isLoading3 } = useScaffoldContractWrite({
        contractName: "TestToken",
        functionName: "mint",
        args: args3 as [string | undefined, bigint | undefined], // Ensure two elements in the array
        onBlockConfirmation: txnReceipt => {
            console.log("📦 Transaction blockHash", txnReceipt.blockHash);
        },
    });

    const [pegValue, setPegValue] = useState([BigInt(0)]); // Initialize with default values
    const args4 = [pegValue[0]];
    const { writeAsync: writeAsync4, isLoading: isLoading4 } = useScaffoldContractWrite({
        contractName: "NUONControllerV3",
        functionName: "setTruflationPegPrice",
        args: args4 as [bigint | undefined], // Cast it to the expected type
        onBlockConfirmation: txnReceipt => {
            console.log("📦 Transaction blockHash", txnReceipt.blockHash);
        },
    });

    const [nuonValue, setNuonValue] = useState([BigInt(0)]); // Initialize with default values
    const args5 = [nuonValue[0]];
    const { writeAsync: writeAsync5, isLoading: isLoading5 } = useScaffoldContractWrite({
        contractName: "NUONControllerV3",
        functionName: "setNuonTokenPrice",
        args: args5 as [bigint | undefined], // Cast it to the expected type
        onBlockConfirmation: txnReceipt => {
            console.log("📦 Transaction blockHash", txnReceipt.blockHash);
        },
    });




    return (
        <div className="flex bg-base-300 relative pb-10">
            <DiamondIcon className="absolute top-24" />
            <CopyIcon className="absolute bottom-0 left-36" />
            <HareIcon className="absolute right-0 bottom-24" />
            <div className="flex flex-col w-full mx-5 sm:mx-8 2xl:mx-20">
                <div className={`mt-10 flex gap-2 ${visible ? "" : "invisible"} max-w-2xl`}>
                    {/* <div className="flex gap-5 bg-base-200 bg-opacity-80 z-0 p-7 rounded-2xl shadow-lg">
            <span className="text-3xl">👋🏻</span>
            <div>
              <div>
                Mint and Redeem some Nuon!
              </div>
              <div className="mt-2">
                Check out{" "}
                <code className="italic bg-base-300 text-base font-bold [word-spacing:-0.5rem]">
                  packages / nextjs/pages / example-ui.tsx
                </code>{" "}
                and its underlying components.
              </div>
            </div>
          </div> */}
                    <button
                        className="btn btn-circle btn-ghost h-6 w-6 bg-base-200 bg-opacity-80 z-0 min-h-0 drop-shadow-md"
                        onClick={() => setVisible(false)}
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex flex-col mt-1 px-2 py-1 mx-2 bg-base-200 opacity-80 rounded-2xl shadow-lg border-2 border-primary">
                    <div className="flex flex-row items-center justify-between">
                        <span className="text-4xl sm:text-2xl text-black">Get Free Test Token!</span>
                        <div className="flex items-center">
                            <div className="flex rounded-full border-2 border-primary p-1">
                                <button
                                    className="btn btn-primary rounded-full capitalize font-normal font-white w-70 flex items-center gap-1 hover:gap-2 transition-all tracking-widest"
                                    onClick={() => writeAsync3()}
                                    disabled={isLoading3}
                                >
                                    {isLoading ? (
                                        <span className="loading loading-spinner loading-sm"></span>
                                    ) : (
                                        <>
                                            Get <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="flex flex-col mt-1 px-2 py-1 mx-2 bg-base-200 opacity-80 rounded-2xl shadow-lg border-2 border-primary">
                    <div className="flex flex-row items-center justify-between">
                        <span className="text-4xl sm:text-2xl text-black">Testing Only:&nbsp;&nbsp; Set Nuon.&nbsp;&nbsp;&nbsp;&nbsp;</span>
                        <input
                            type="text"
                            placeholder="Nuon"
                            className="input font-bai-jamjuree w-28 px-5 bg-[url('/assets/gradient-bg.png')] bg-[length:100%_100%] border border-primary text-lg sm:text-2xl placeholder-white uppercase"
                            onChange={e => {
                                const newValue = BigInt(e.target.value) * BigInt(10 ** 16);
                                setNuonValue([newValue]); // Set the first value to its current value, and the second value to the parsed input
                            }}
                        />
                        <div className="flex items-center">
                            <div className="flex rounded-full border-2 border-primary p-1">
                                <button
                                    className="btn btn-primary rounded-full capitalize font-normal font-white w-70 flex items-center gap-1 hover:gap-2 transition-all tracking-widest"
                                    onClick={() => writeAsync5()}
                                    disabled={isLoading5}
                                >
                                    {isLoading ? (
                                        <span className="loading loading-spinner loading-sm"></span>
                                    ) : (
                                        <>
                                            Set <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col mt-1 px-2 py-1 mx-2 bg-base-200 opacity-80 rounded-2xl shadow-lg border-2 border-primary">
                    <div className="flex flex-row items-center justify-between">
                        <span className="text-4xl sm:text-2xl text-black">Testing Only:&nbsp;&nbsp; Set the Peg.</span>
                        <input
                            type="text"
                            placeholder="Peg"
                            className="input font-bai-jamjuree w-24 px-5 bg-[url('/assets/gradient-bg.png')] bg-[length:100%_100%] border border-primary text-lg sm:text-2xl placeholder-white uppercase"
                            onChange={e => {
                                const newValue = BigInt(e.target.value) * BigInt(10 ** 16);
                                setPegValue([newValue]); // Set the first value to its current value, and the second value to the parsed input
                            }}
                        />
                        <div className="flex items-center">
                            <div className="flex rounded-full border-2 border-primary p-1">
                                <button
                                    className="btn btn-primary rounded-full capitalize font-normal font-white w-70 flex items-center gap-1 hover:gap-2 transition-all tracking-widest"
                                    onClick={() => writeAsync4()}
                                    disabled={isLoading4}
                                >
                                    {isLoading ? (
                                        <span className="loading loading-spinner loading-sm"></span>
                                    ) : (
                                        <>
                                            Set <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>



                <div className="flex flex-col mt-6 px-7 py-8 bg-base-200 opacity-80 rounded-2xl shadow-lg border-2 border-primary">
                    <span className="text-4xl sm:text-6xl text-black">Mint Nuon Now!</span>

                    <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-5">
                        <input
                            type="text"
                            placeholder="Ratio"
                            className="input font-bai-jamjuree w-full px-5 bg-[url('/assets/gradient-bg.png')] bg-[length:100%_100%] border border-primary text-lg sm:text-2xl placeholder-white uppercase"
                            onChange={e => {
                                const newValue = ethers.utils.parseUnits(e.target.value.toString(), 0);
                                setUintValues([newValue, uintValues[1]]); // Set the first value to its current value, and the second value to the parsed input
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Deposit"
                            className="input font-bai-jamjuree w-full px-5 bg-[url('/assets/gradient-bg.png')] bg-[length:100%_100%] border border-primary text-lg sm:text-2xl placeholder-white uppercase"
                            onChange={e => {
                                const newValue = BigInt(e.target.value) * BigInt(10 ** 17);
                                setUintValues([uintValues[0], newValue]); // Set the first value to its current value, and the second value to the parsed input
                            }}
                        />
                        <div className="flex rounded-full border border-primary p-1 flex-shrink-0">
                            <div className="flex rounded-full border-2 border-primary p-1">
                                <button
                                    className="btn btn-primary rounded-full capitalize font-normal font-white w-24 flex items-center gap-1 hover:gap-2 transition-all tracking-widest"
                                    onClick={() => writeAsync()}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <span className="loading loading-spinner loading-sm"></span>
                                    ) : (
                                        <>
                                            Mint <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col mt-6 px-7 py-8 bg-base-200 opacity-80 rounded-2xl shadow-lg border-2 border-primary">
                    <span className="text-4xl sm:text-6xl text-black">Redeem Your Collateral!</span>

                    <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-5">
                        <input
                            type="text"
                            placeholder="Burn Your Nuon"
                            className="input font-bai-jamjuree w-full px-5 bg-[url('/assets/gradient-bg.png')] bg-[length:100%_100%] border border-primary text-lg sm:text-2xl placeholder-white uppercase"
                            onChange={e => {
                                const newValue2 = BigInt(e.target.value) * BigInt(10 ** 17);
                                setRedeemValue([newValue2]);
                            }}
                        />

                        <div className="flex rounded-full border border-primary p-1 flex-shrink-0">
                            <div className="flex rounded-full border-2 border-primary p-1">
                                <button
                                    className="btn btn-primary rounded-full capitalize font-normal font-white w-24 flex items-center gap-1 hover:gap-2 transition-all tracking-widest"
                                    onClick={() => writeAsync2()}
                                    disabled={isLoading2}
                                >
                                    {isLoading2 ? (
                                        <span className="loading loading-spinner loading-sm"></span>
                                    ) : (
                                        <>
                                            Redeem <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* <div className="mt-4 flex gap-2 items-start">
            <span className="text-sm leading-tight">Truflation Peg Price:</span>
            <div className="badge badge-warning">0.01 ETH + Gas</div>
          </div> */}
                </div>
            </div>
        </div>
    );
};
