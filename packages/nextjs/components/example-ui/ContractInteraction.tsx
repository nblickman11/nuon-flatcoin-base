import { useState } from "react";
import { CopyIcon } from "./assets/CopyIcon";
import { DiamondIcon } from "./assets/DiamondIcon";
import { HareIcon } from "./assets/HareIcon";
import { parseEther } from "viem";
import { ArrowSmallRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

export const ContractInteraction = () => {
  const [visible, setVisible] = useState(true);
  //const [newGreeting, setNewGreeting] = useState("");
  const [uintValues, setUintValues] = useState([BigInt(0), BigInt(0)]); // Initialize with default values

  const args = [uintValues[0], uintValues[1]];

  //const parsedValue = myEthers.parseUnits("333333333333333300", 18);

  // const { writeAsync, isLoading } = useScaffoldContractWrite({
  //   contractName: "YourContract",
  //   functionName: "setGreeting",
  //   args: [newGreeting],
  //   value: parseEther("0.01"),
  //   onBlockConfirmation: txnReceipt => {
  //     console.log("📦 Transaction blockHash", txnReceipt.blockHash);
  //   },
  // });

  const bigIntValues = uintValues.map(value => BigInt(value)); // Map to bigint

  const { writeAsync, isLoading } = useScaffoldContractWrite({
    contractName: "CollateralHubV3",
    functionName: "mint",
    args: args as [bigint | undefined, bigint | undefined], // Cast it to the expected type
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
          <div className="flex gap-5 bg-base-200 bg-opacity-80 z-0 p-7 rounded-2xl shadow-lg">
            <span className="text-3xl">👋🏻</span>
            <div>
              <div>
                In this page you can see how some of our <strong>hooks & components</strong> work, and how you can bring
                them to life with your own design! Have fun and try it out!
              </div>
              <div className="mt-2">
                Check out{" "}
                <code className="italic bg-base-300 text-base font-bold [word-spacing:-0.5rem]">
                  packages / nextjs/pages / example-ui.tsx
                </code>{" "}
                and its underlying components.
              </div>
            </div>
          </div>
          <button
            className="btn btn-circle btn-ghost h-6 w-6 bg-base-200 bg-opacity-80 z-0 min-h-0 drop-shadow-md"
            onClick={() => setVisible(false)}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col mt-6 px-7 py-8 bg-base-200 opacity-80 rounded-2xl shadow-lg border-2 border-primary">
          <span className="text-4xl sm:text-6xl text-black">Mint Nuon Now!</span>

          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-5">
            <input
              type="text"
              placeholder="Ratio"
              className="input font-bai-jamjuree w-full px-5 bg-[url('/assets/gradient-bg.png')] bg-[length:100%_100%] border border-primary text-lg sm:text-2xl placeholder-white uppercase"
              onChange={e => {
                const newValue = BigInt(e.target.value) * BigInt(10 ** 18);
                // Parse the input value to an integer
                //if (!isNaN(newValue)) {
                setUintValues([newValue, uintValues[1]]); // Set the first value to its current value, and the second value to the parsed input
                //}
              }}
            />
            <input
              type="text"
              placeholder="Deposit"
              className="input font-bai-jamjuree w-full px-5 bg-[url('/assets/gradient-bg.png')] bg-[length:100%_100%] border border-primary text-lg sm:text-2xl placeholder-white uppercase"
              //onChange={e => setNewGreeting(e.target.value)}
              //onChange={e => setUintValues(e.target.value)}
              onChange={e => {
                const newValue = BigInt(e.target.value) * BigInt(10 ** 17);
                // Parse the input value to an integer
                //if (!isNaN(newValue)) {
                setUintValues([uintValues[0], newValue]); // Set the first value to its current value, and the second value to the parsed input
                //}
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

          <div className="mt-4 flex gap-2 items-start">
            <span className="text-sm leading-tight">Truflation Peg Price:</span>
            <div className="badge badge-warning">0.01 ETH + Gas</div>
          </div>
        </div>
      </div>
    </div>
  );
};
