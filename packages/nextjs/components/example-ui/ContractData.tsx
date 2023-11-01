//import { useEffect, useRef, useState } from "react";
//import Marquee from "react-fast-marquee";
import { useAccount } from "wagmi";
import {
  //useAnimationConfig,
  //useScaffoldContract,
  useScaffoldContractRead, //useScaffoldEventHistory,
  //useScaffoldEventSubscriber,
} from "~~/hooks/scaffold-eth";

//const MARQUEE_PERIOD_IN_SEC = 5;

export const ContractData = () => {
  const { address } = useAccount();
  // const [transitionEnabled, setTransitionEnabled] = useState(true);
  // const [isRightDirection, setIsRightDirection] = useState(false);
  // const [marqueeSpeed, setMarqueeSpeed] = useState(0);

  // const containerRef = useRef<HTMLDivElement>(null);
  // const greetingRef = useRef<HTMLDivElement>(null);

  const { data: totalCounter } = useScaffoldContractRead({
    contractName: "YourContract",
    functionName: "totalCounter",
  });

  const { data: nuonPrice } = useScaffoldContractRead({
    contractName: "NUONControllerV3",
    functionName: "getNUONPrice",
  });

  const { data: pegPrice } = useScaffoldContractRead({
    contractName: "NUONControllerV3",
    functionName: "getTruflationPeg",
  });

  const { data: mintedAmount } = useScaffoldContractRead({
    contractName: "CollateralHubV3",
    functionName: "mintedAmount",
    args: [address],
  });

  const { data: testTokenAmount } = useScaffoldContractRead({
    contractName: "TestToken",
    functionName: "balanceOf",
    args: [address],
  });

  const { data: ethPrice } = useScaffoldContractRead({
    contractName: "CollateralHubV3",
    functionName: "assetPrice",
  });

  const { data: collateralAmount } = useScaffoldContractRead({
    contractName: "CollateralHubV3",
    functionName: "usersAmounts",
    args: [address],
  });

  // const { data: currentGreeting, isLoading: isGreetingLoading } = useScaffoldContractRead({
  //   contractName: "YourContract",
  //   functionName: "greeting",
  // });

  // useScaffoldEventSubscriber({
  //   contractName: "YourContract",
  //   eventName: "GreetingChange",
  //   listener: logs => {
  //     logs.map(log => {
  //       const { greetingSetter, value, premium, newGreeting } = log.args;
  //       console.log("📡 GreetingChange event", greetingSetter, value, premium, newGreeting);
  //     });
  //   },
  // });

  // const {
  //   data: myGreetingChangeEvents,
  //   isLoading: isLoadingEvents,
  //   error: errorReadingEvents,
  // } = useScaffoldEventHistory({
  //   contractName: "YourContract",
  //   eventName: "GreetingChange",
  //   fromBlock: process.env.NEXT_PUBLIC_DEPLOY_BLOCK ? BigInt(process.env.NEXT_PUBLIC_DEPLOY_BLOCK) : 0n,
  //   filters: { greetingSetter: address },
  //   blockData: true,
  // });

  // console.log("Events:", isLoadingEvents, errorReadingEvents, myGreetingChangeEvents);

  // const { data: yourContract } = useScaffoldContract({ contractName: "YourContract" });
  // console.log("yourContract: ", yourContract);

  // const { showAnimation } = useAnimationConfig(totalCounter);

  // const showTransition = transitionEnabled && !!currentGreeting && !isGreetingLoading;

  // useEffect(() => {
  //   if (transitionEnabled && containerRef.current && greetingRef.current) {
  //     setMarqueeSpeed(
  //       Math.max(greetingRef.current.clientWidth, containerRef.current.clientWidth) / MARQUEE_PERIOD_IN_SEC,
  //     );
  //   }
  // }, [transitionEnabled, containerRef, greetingRef]);

  return (

    <div className="flex flex-col justify-center items-center bg-[url('/assets/gradient-bg.png')] bg-[length:100%_100%] py-10 px-5 sm:px-0 lg:py-auto max-w-[100vw] ">
      {/* <div
        className={`flex flex-col max-w-md bg-base-200 bg-opacity-70 rounded-2xl shadow-lg px-5 py-4 w-full ${showAnimation ? "animate-zoom" : ""
          }`}
      > */}
      {/* <div className="flex justify-between w-full"> */}
      {/* <button
        className="btn btn-circle btn-ghost relative bg-center bg-[url('/assets/switch-button-on.png')] bg-no-repeat"
        onClick={() => {
          setTransitionEnabled(!transitionEnabled);
        }}
      >
        <div
          className={`absolute inset-0 bg-center bg-no-repeat bg-[url('/assets/switch-button-off.png')] transition-opacity ${transitionEnabled ? "opacity-0" : "opacity-100"
            }`}
        />
      </button> */}
      {/* <div className="bg-secondary border border-primary rounded-xl flex">
        <div className="p-2 py-1 border-r border-primary flex items-end">Total count</div>
        <div className="text-4xl text-right min-w-[3rem] px-2 py-1 flex justify-end font-bai-jamjuree">
          {totalCounter?.toString() || "0"}
        </div>
      </div> */}


      <div className="bg-primary border border-primary rounded-xl flex">
        <div className="p-2 py-1 border-r border-primary flex items-end text-white">WETH Balance:</div>
        {testTokenAmount !== undefined && ethPrice !== undefined ? (
          <div className="text-2xl text-right min-w-[3rem] px-2 py-1 flex justify-end font-bai-jamjuree text-white">
            {((Number(testTokenAmount.toString()) / 10 ** 18)).toFixed(4)}<span className="text-base mt-2">&nbsp;&nbsp;(${(((Number(testTokenAmount.toString()) / 10 ** 18) * (Number(ethPrice.toString())) / 10 ** 18)).toFixed(0)})</span>
          </div>
        ) : (
          <div className="text-4xl text-right min-w-[3rem] px-2 py-1 flex justify-end font-bai-jamjuree text-white">0</div>
        )}
      </div>
      <br />
      <div className="bg-primary border border-primary rounded-xl flex">
        <div className="p-2 py-1 border-r border-primary flex items-end text-white">Real Time WETH Price:</div>
        {ethPrice !== undefined ? (
          <div className="text-2xl text-right min-w-[3rem] px-2 py-1 flex justify-end font-bai-jamjuree text-white">
            ${((Number(ethPrice.toString()) / 10 ** 18)).toFixed(2)}<span className="text-sm mt-2.5">&nbsp;</span>
          </div>
        ) : (
          <div className="text-4xl text-right min-w-[3rem] px-2 py-1 flex justify-end font-bai-jamjuree text-white">0</div>
        )}
      </div>
      <br />
      <br />
      <br />

      <div className="bg-secondary border border-primary rounded-xl flex">
        <div className="p-2 py-1 border-r border-primary flex items-end bg-green-200">Nuon Price</div>
        <div className={`text-4xl text-right min-w-[3rem] px-2 py-1 flex justify-end font-bai-jamjuree ${pegPrice !== undefined ? 'bg-green-200' : 'bg-green-200'
          }`}>
          ${nuonPrice !== undefined ? (Number(nuonPrice.toString()) / 10 ** 18).toFixed(2) : 'N/A'}
        </div>
      </div>
      <br />

      <div className="bg-secondary border border-primary rounded-xl flex">
        <div className="p-2 py-1 border-r border-primary flex items-end bg-green-200">Truflation Peg Price</div>
        <div className={`text-4xl text-right min-w-[3rem] px-2 py-1 flex justify-end font-bai-jamjuree ${pegPrice !== undefined ? 'bg-green-200' : 'bg-green-200'
          }`}>
          ${pegPrice !== undefined ? (Number(pegPrice.toString()) / 10 ** 18).toFixed(2) : 'N/A'}
        </div>
      </div>

      <br />
      <br />
      <br /> {/* Add this line break element to create a new line */}
      <div className="bg-secondary border border-primary rounded-xl flex">
        <div className="p-2 py-1 border-r border-primary flex items-end">Minted Nuon Amount</div>
        {mintedAmount !== undefined ? (
          <div className="text-4xl text-right min-w-[3rem] px-2 py-1 flex justify-end font-bai-jamjuree">
            {(Number(mintedAmount.toString()) / 10 ** 18).toFixed(2)}
          </div>
        ) : (
          <div className="text-4xl text-right min-w-[3rem] px-2 py-1 flex justify-end font-bai-jamjuree">0</div>
        )}
      </div>
      <br /> {/* Add this line break element to create a new line */}

      <div className="bg-secondary border border-primary rounded-xl flex">
        <div className="p-2 py-1 border-r border-primary flex items-end">Collateral WETH Amount</div>
        {collateralAmount !== undefined && ethPrice !== undefined ? (
          <div className="text-4xl text-right min-w-[3rem] px-2 py-1 flex justify-end font-bai-jamjuree">
            {((Number(collateralAmount.toString()) / 10 ** 18)).toFixed(4)}<span className="text-2xl mt-2.5">&nbsp;&nbsp;(${(((Number(collateralAmount.toString()) / 10 ** 18) * (Number(ethPrice.toString())) / 10 ** 18)).toFixed(0)})</span>
          </div>
        ) : (
          <div className="text-4xl text-right min-w-[3rem] px-2 py-1 flex justify-end font-bai-jamjuree">0</div>
        )}
      </div>

      {/* <div className="bg-secondary border border-primary rounded-xl flex">
        <div className="p-2 py-1 border-r border-primary flex items-end">Your Minted Amount</div>
        <div className="text-4xl text-right min-w-[3rem] px-2 py-1 flex justify-end font-bai-jamjuree">
          {mintedAmount?.toString() || "0"}
        </div>
      </div> */}
      {/* </div> */}
      {/* <div className="mt-3 border border-primary bg-neutral rounded-3xl text-secondary  overflow-hidden text-[116px] whitespace-nowrap w-full uppercase tracking-tighter font-bai-jamjuree leading-tight"> */}
      {/* <div className="relative overflow-x-hidden" ref={containerRef}> */}
      {/* for speed calculating purposes */}
      {/* <div className="absolute -left-[9999rem]" ref={greetingRef}>
              <div className="px-4">{currentGreeting}</div>
            </div> */}
      {/* {new Array(3).fill("").map((_, i) => {
              const isLineRightDirection = i % 2 ? isRightDirection : !isRightDirection;
              return (
                <Marquee
                  key={i}
                  direction={isLineRightDirection ? "right" : "left"}
                  gradient={false}
                  play={showTransition}
                  speed={marqueeSpeed}
                  className={i % 2 ? "-my-10" : ""}
                >
                  <div className="px-4">{currentGreeting || " "}</div>
                </Marquee>
              );
            })} */}
      {/* </div> */}
      {/* </div> */}
      {/* <div className="mt-3 flex items-end justify-between"> */}
      {/* <button
            className={`btn btn-circle btn-ghost border border-primary hover:border-primary w-12 h-12 p-1 bg-neutral flex items-center ${isRightDirection ? "justify-start" : "justify-end"
              }`}
            onClick={() => {
              if (transitionEnabled) {
                setIsRightDirection(!isRightDirection);
              }
            }}
          >
            <div className="border border-primary rounded-full bg-secondary w-2 h-2" />
          </button> */}
      {/* <div className="w-44 p-0.5 flex items-center bg-neutral border border-primary rounded-full">
            <div
              className="h-1.5 border border-primary rounded-full bg-secondary animate-grow"
              style={{ animationPlayState: showTransition ? "running" : "paused" }}
            />
          </div> */}
      {/* </div> */}
      {/* </div> */}
    </div>
  );
};
