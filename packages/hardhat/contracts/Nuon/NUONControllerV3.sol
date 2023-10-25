// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

// import "@openzeppelin/contracts/utils/math/Math.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title  NUON Controller.
 * @author Hash
 */
// contract NUONControllerV3 is Ownable {
//     using Math for uint256;

contract NUONControllerV3 {
    mapping(address => int256) public baseCollateralRatio;
    mapping(address => int256) public collateralVolatilityBuffer;
    mapping(address => int256) public safetyNet;
    mapping(address => uint256) public maxCRATIO;
    mapping(address => int256) public flatInterestRate;
    mapping(address => int256) public maxOffPegPercentDownside;
    mapping(address => int256) public maxOffPegPercentUpside;
    mapping(address => uint256) public mintingFee;
    mapping(address => uint256) public redeemFees;

    bool public mintPaused = false;
    bool public redeemPaused = false;
    uint256 public truflationPegPrice = 100000000000000000;
    uint256 public nuonTokenPrice = 120000000000000000;

    /**
     * Constructor.
     */

    // NELSON NOTE: The Ownable we inherit from is different than Nuon's, Requires param in Constructor
    // constructor(IERC20 _NUON, address initialOwner) Ownable(initialOwner) {
    //     NUON = _NUON;
    // }

    constructor() {}

    function setEcosystemParametersForCHUBS(
        address _CHUB,
        int256 _baseCollateralRatio,
        int256 _collateralVolatilityBuffer,
        int256 _safetyNet,
        uint256 _maxCRATIO,
        int256 _flatInterestRate,
        int256 _maxOffPegPercentUpside,
        int256 _maxOffPegPercentDownside,
        uint256 _mintingFee,
        uint256 _redeemFees
    ) public {
        require(_CHUB != address(0), "Please provide a valid CHUB address");
        baseCollateralRatio[_CHUB] = _baseCollateralRatio;
        collateralVolatilityBuffer[_CHUB] = _collateralVolatilityBuffer;
        safetyNet[_CHUB] = _safetyNet;
        maxCRATIO[_CHUB] = _maxCRATIO;
        flatInterestRate[_CHUB] = _flatInterestRate;
        maxOffPegPercentUpside[_CHUB] = _maxOffPegPercentUpside;
        maxOffPegPercentDownside[_CHUB] = _maxOffPegPercentDownside;
        mintingFee[_CHUB] = _mintingFee;
        redeemFees[_CHUB] = _redeemFees;
    }

    function isMintPaused() public view returns (bool) {
        return mintPaused;
    }

    function toggleMinting() public {
        mintPaused = !mintPaused;
    }

    // LR = target peg + CVB + DPR
    // BUT THINK we are subtracting the CVB and the DPR cause doing reciprocals in the Hub.
    function getGlobalCollateralRatio(address _CHUB) public view returns (int) {
        int256 collateralRatio = baseCollateralRatio[_CHUB] -
            collateralVolatilityBuffer[_CHUB];
        int currentDPR = computeInterestRates(_CHUB);
        if (currentDPR > 0) {
            // we are over peg, so interest rate are lower (currentDPR will be positive)
            int totalCollateralRatio = collateralRatio + currentDPR;
            // max discount until 100% collateral ratio
            if (totalCollateralRatio > baseCollateralRatio[_CHUB]) {
                totalCollateralRatio = baseCollateralRatio[_CHUB];
            }
            return totalCollateralRatio;
        } else {
            // we are under peg, so interest rate rise (currentDPR will be negative but +- is a sub)
            int totalCollateralRatio = collateralRatio + currentDPR;
            if (totalCollateralRatio < safetyNet[_CHUB]) {
                totalCollateralRatio = safetyNet[_CHUB];
            }
            return totalCollateralRatio;
        }
    }

    function computeInterestRates(address _CHUB) public view returns (int) {
        int offPegVar = calculatePercentOffPeg();
        int DPR = offPegVar * flatInterestRate[_CHUB];
        if (DPR > maxOffPegPercentUpside[_CHUB]) {
            DPR = maxOffPegPercentUpside[_CHUB];
        } else if (DPR < maxOffPegPercentDownside[_CHUB]) {
            DPR = maxOffPegPercentDownside[_CHUB];
        }
        return (DPR);
    }

    function calculatePercentOffPeg() public view returns (int) {
        int256 NuonPrice = int(getNUONPrice());
        int256 targetPeg = int(getTruflationPeg());
        // 100000000000000000 - 120000000000000000 = -20000000000000000
        int v1minv2 = NuonPrice - targetPeg;
        // -20000000000000000 * 100000000000000000 / 100000000000000000 = -20000000000000000
        int v1v2var = (v1minv2 * 1e18) / NuonPrice;
        //-20000000000000000 / 1e14 = -200
        int variance = v1v2var / 1e14;
        return (variance);
    }
    
    function setTruflationPegPrice(uint256 _truflationPegPrice) public {
        truflationPegPrice = _truflationPegPrice;
    }
    function setNuonTokenPrice(uint256 _nuonTokenPrice) public {
        nuonTokenPrice = _nuonTokenPrice;
    }

    function getTruflationPeg() public view returns (uint256) {
        return truflationPegPrice;
        //return ITruflation(TruflationOracle).getNuonTargetPeg();
    }

    function getNUONPrice() public view returns (uint256) {
        return nuonTokenPrice; //in USDT
        // uint256 assetPrice;
        // if (NuonOracleAddress == address(0)) {
        //     assetPrice = 1e18;
        // } else {
        //     assetPrice = IUniswapPairOracle(NuonOracleAddress).consult(
        //         address(NUON),
        //         1e18
        //     );
        //     uint256 usdtPrice = IChainlinkOracle(chainlinkUSDTFeed)
        //         .latestAnswer()
        //         .mul(1e10);
        //     assetPrice = assetPrice.mul(usdtPrice).div(1e18);
        // }
        // return assetPrice;
    }

    function getMaxCratio(address _CHUB) public view returns (uint256) {
        return maxCRATIO[_CHUB];
    }

    function getMintingFee(address _CHUB) public view returns (uint256) {
        return mintingFee[_CHUB];
    }

    function isRedeemPaused() public view returns (bool) {
        return redeemPaused;
    }

    function getRedeemFee(address _CHUB) public view returns (uint256) {
        return redeemFees[_CHUB];
    }
}
