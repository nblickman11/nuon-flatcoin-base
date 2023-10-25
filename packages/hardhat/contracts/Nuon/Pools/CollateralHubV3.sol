// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

// import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

import "../interfaces/INUONController.sol";
import "../interfaces/INLP.sol";
import "../interfaces/INUON.sol";

import "../TestToken.sol";

/**
 * @notice The Collateral Hub (CHub) is receiving collaterals from users, and mint them back NUON according to the collateral ratio defined in the NUON Controller
 * @dev (Driiip) TheHashM
 * @author This Chub is designed by Gniar & TheHashM
 */

// NELSON NOTE: we don't include a reentrancy security library.
// contract CollateralHubV3 is OwnableUpgradeable {
//     using Math for uint256;

contract CollateralHubV3 {
    using SafeMath for uint256;
    /**
     * @dev Contract instances.
     */
    address public NUONController;
    address public Treasury;
    address public NUON;
    address public testToken;
    address public NuonOracleAddress;
    address public ChainlinkOracle;
    address public TruflationOracle;
    address public unirouter;
    address public lpPair;
    address public NLP;
    address public Relayer;
    address public USDT;

    /**
     * @notice Contract Data : mapping and infos
     */
    mapping(uint256 => bool) public vaultsRedeemPaused;
    mapping(address => uint256) public usersIndex;
    mapping(address => uint256) public usersAmounts;
    mapping(address => uint256) public mintedAmount;
    mapping(address => uint256) public userLPs;
    mapping(address => bool) public nlpCheck;
    mapping(address => uint256) public nlpPerUser;

    address[] public users;
    address[] public collateralToNuonRoute;
    address[] public collateralToPairRoute;
    uint256 public liquidationFee;
    uint256 public minimumDepositAmount;
    uint256 public liquidityBuffer;
    uint256 public liquidityCheck;
    uint256 public maxNuonBurnPercent;
    uint256 public constant MAX_INT = 2 ** 256 - 1;
    uint256 public assetMultiplier;
    uint256 public decimalDivisor;
    uint256 public count;

    /**
     * @notice Events.
     */
    event First3RequiresPassed(string);

    event MintedNUON(
        address indexed user,
        uint256 NUONAmountD18,
        uint256 NuonPrice,
        uint256 collateralAmount
    );
    event Redeemed(
        address indexed user,
        uint256 fullAmount,
        uint256 NuonAmount
    );
    event depositedWithoutMint(
        address indexed user,
        uint256 fees,
        uint256 depositedAmount
    );
    event mintedWithoutDeposit(
        address indexed user,
        uint256 mintedAmount,
        uint256 collateralRequired
    );
    event redeemedWithoutNuon(
        address indexed user,
        uint256 fees,
        uint256 amountSentToUser
    );
    event burnedNuon(address indexed user, uint256 burnedAmount);

    function initialize(uint256 _assetMultiplier) public {
        assetMultiplier = _assetMultiplier;
    }

    // /**
    //  * @notice Sets the core addresses used by the contract
    //  * @param _treasury Treasury contract
    //  * @param _controller NUON controller
    //  */
    function setCoreAddresses(
        address _controller,
        address _NLP,
        address _NUON,
        address _testToken
    ) public {
        NUONController = _controller;
        NLP = _NLP;
        NUON = _NUON;
        testToken = _testToken;
    }

    /**
     * @notice Used to mint NUON as a user deposit collaterals
     * return The minted NUON amount
     * @dev collateralAmount is in USDT
     */

    // think _amount is just AMOUNT,since multiply this by PRICE later to get total value
    // think cratio IS INVERSE of what think! if specify 700%,
    // then cratio is (1/7) * 10*18 AND _amount is (.019weth-fee)* 10**18
    // CR = 142857142857142860
    // I'll make baseCR, the max, 1/2 (200% coll), so 500000000000000000
    // I'll make saftetyNetCR, min, 1/2, so 500000000000000000
    // I'll make _maxCRATIO, min, 1/9, so 111111111100000000
    function mint(
        uint256 _collateralRatio,
        uint256 _amount
    ) external returns (uint256) {
        require(
            INUONController(NUONController).isMintPaused() == false,
            "CHUB: Minting paused!"
        );

        //cratio has to be bigger than the minimum required in the controller, otherwise user can get liquidated instantly
        //It has to be lower because lower means higher % cratio
        // smaller means bigger! so want to make sure it's bigger than LR!
        require(
            _collateralRatio <=
                INUONController(NUONController).getGlobalCollateralRatio(
                    address(this)
                ),
            "Collateral Ratio out of bounds"
        );
        require(
            _collateralRatio >=
                INUONController(NUONController).getMaxCratio(address(this)),
            "Collateral Ratio too low"
        );
        emit First3RequiresPassed("First3RequiresPassed");

        // If user is new, add them.
        if (usersAmounts[msg.sender] == 0) {
            usersIndex[msg.sender] = users.length;
            users.push(msg.sender);
            // Make sure the owner of contract can't create positions I think.
            //if (msg.sender != owner()) {
            // require(
            //     nlpCheck[msg.sender] == false,
            //     "You already have a position"
            // );
            //just used to increment new NFT IDs
            //uint256 newItemId = count;
            //count++;
            //INLP(NLP).mintNLP(msg.sender, newItemId);
            //INLP(NLP)._createPosition(msg.sender, newItemId);
            //nlpCheck[msg.sender] = true;
            //nlpPerUser[msg.sender] = newItemId;
            //}
        }
        //In case the above if statement isnt executed we need to instantiate the
        //storage element here to update the position status
        uint256 collateralAmount = _amount;
        require(
            collateralAmount > minimumDepositAmount,
            "Please deposit more than the min required amount"
        );
        (
            uint256 NUONAmountD18,
            ,
            uint256 collateralAmountAfterFees,
            uint256 collateralRequired
        ) = estimateMintedNUONAmount(collateralAmount, _collateralRatio);
        uint256 userAmount = usersAmounts[msg.sender];
        usersAmounts[msg.sender] = userAmount.add(collateralAmountAfterFees);
        mintedAmount[msg.sender] = mintedAmount[msg.sender].add(NUONAmountD18);
        //if (msg.sender != owner()) {
        // function sends WETH tokens from user to this contract. Say 30$ WETH worth
        // collateralUsed is address of WETH ERC-20 contract.
        // // I need to add approve, not sure where they don't do it.

        // Give user fake WETH to test.
        // Also for mint, approve, transferfromm, need call my funcs to call real ones.
        TestToken(testToken).mint(msg.sender, _amount.add(collateralRequired));

        TestToken(testToken).myApprove(
            msg.sender,
            address(this),
            _amount.add(collateralRequired)
        );

        TestToken(testToken).transferFrom(
            msg.sender,
            address(this),
            _amount.add(collateralRequired)
        );

        //_addLiquidity: sends some of the WETH to pool for USDT and NUON.  This pair
        // gets staked in a pool, earns interest in Vault, and is returned to the usersLP.
        //_addLiquidity(collateralRequired);

        // INLP(NLP)._addAmountToPosition(
        //     mintedAmount[msg.sender],
        //     usersAmounts[msg.sender],
        //     userLPs[msg.sender],
        //     nlpPerUser[msg.sender]
        // );
        // } else {
        //     IERC20Burnable(collateralUsed).transferFrom(
        //         msg.sender,
        //         address(this),
        //         _amount
        //     );
        // }

        // Transfer a little WETH to treasury contract.
        // IERC20Burnable(collateralUsed).transfer(
        //     Treasury,
        //     collateralAmount.sub(collateralAmountAfterFees)
        // );

        // Mint Nuon, belongs to user.
        INUON(NUON).mint(msg.sender, NUONAmountD18);
        emit MintedNUON(
            msg.sender,
            NUONAmountD18,
            getTargetPeg(),
            collateralAmount
        );
        return NUONAmountD18;
    }

    /**
     * @notice A view function to estimate the amount of NUON out. For front end people.
     * @param collateralAmount The amount of collateral that the user wants to use
     * return The NUON amount to be minted, the minting fee in d18 format, and the collateral to be deposited after the fees have been taken
     */
    function estimateMintedNUONAmount(
        uint256 collateralAmount,
        uint256 _collateralRatio
    ) public returns (uint256, uint256, uint256, uint256) {
        require(
            _collateralRatio <=
                INUONController(NUONController).getGlobalCollateralRatio(
                    address(this)
                ),
            "Collateral Ratio out of bounds"
        );
        require(
            _collateralRatio >=
                INUONController(NUONController).getMaxCratio(address(this)),
            "Collateral Ratio too low"
        );
        require(
            collateralAmount > minimumDepositAmount,
            "Please deposit more than the min required amount"
        );

        // BUT THE MINTING FEE IS NOT .001 THATS A DECIMALL!!!!! Is 1 for now.
        // 10686511125330335 - ((10686511125330335)*1/100/1000000000000000000) = 1.0686511e+16
        // So multiply 1.0686511e+16 by assetMultiplier of 100 to get 18 dec number.
        uint256 collateralAmountAfterFees = collateralAmount.sub(
            collateralAmount
                .mul(
                    INUONController(NUONController).getMintingFee(address(this))
                )
                .div(100)
                .div(1e18)
        );

        uint256 collateralAmountAfterFeesD18 = collateralAmountAfterFees *
            assetMultiplier;

        uint256 NUONAmountD18;

        NUONAmountD18 = calcOverCollateralizedMintAmounts(
            _collateralRatio,
            getCollateralPrice(),
            collateralAmountAfterFeesD18
        );

        // LINE below streams off into many more calculations. So for now do:
        uint256 collateralRequired = 10;
        //(uint256 collateralRequired, ) = mintLiquidityHelper(NUONAmountD18);

        return (
            NUONAmountD18,
            INUONController(NUONController).getMintingFee(address(this)),
            collateralAmountAfterFees,
            collateralRequired
        );
    }

    /**
     * @notice A view function to get the collateral price of an asset directly on chain
     * return The asset price
     */
    function getCollateralPrice() public view returns (uint256) {
        return 1700;
        //uint256 assetPrice = IChainlinkOracle(ChainlinkOracle).latestAnswer().mul(1e10);
        //return assetPrice;
    }

    /**
     * @notice View function used to compute the amount of NUON to be minted
     * @param collateralRatio Determined by the controller contract
     * @param collateralPrice Determined by the assigned oracle
     * @param collateralAmountD18 Collateral amount in d18 format
     * return The NUON amount to be minted
     */
    function calcOverCollateralizedMintAmounts(
        uint256 collateralRatio,
        uint256 collateralPrice,
        uint256 collateralAmountD18
    ) internal returns (uint256) {
        uint256 collateralValue = (collateralAmountD18.mul(collateralPrice))
            .div(1e18);
        uint256 NUONValueToMint = collateralValue.mul(collateralRatio).div(
            INUONController(NUONController).getTruflationPeg()
        );
        return NUONValueToMint;
        //1000000000000000000 //ITruflation(TruflationOracle).getNuonTargetPeg()
    }

    function getTargetPeg() public returns (uint256) {
        //return 1000000000000000000;
        return INUONController(NUONController).getTruflationPeg();
        //uint256 peg = ITruflation(TruflationOracle).getNuonTargetPeg();
        //return peg;
    }

    /**
     * @notice Used to redeem a collateral amount as a user gives back NUON
     * @param NUONAmount NUON amount to give back
     * @dev NUONAmount is always in d18, use estimateCollateralsOut() to estimate the amount of collaterals returned
     * Users from the market cannot redeem collaterals. Only minters.
     */
    function redeem(uint256 NUONAmount) external {
        require(
            INUONController(NUONController).isRedeemPaused() == false,
            "CHUB: Minting paused!"
        );
        // Check is user should be liquidated.
        // IF EXECUTED this, like the else statement, will delete the
        // users position and burn, BUT, think does lot else, completely
        // remove user position and more.
        // if (getUserLiquidationStatus(msg.sender)) {
        //     liquidateUserAssets(msg.sender);
        // } else {

        uint256 userAmount = usersAmounts[msg.sender];
        // estimateCollaterals branches off to lots of math. same we've seen.
        (
            uint256 fullAmount,
            uint256 fullAmountSubFees,
            uint256 fees
        ) = estimateCollateralsOut(msg.sender, NUONAmount);
        // THINK this if is if your redeeming your entire minted amount.
        if (
            NUONAmount == mintedAmount[msg.sender] || fullAmount >= userAmount
        ) {
            fullAmount = userAmount;

            //if (msg.sender != owner()) {
            //uint256 usernlp = nlpPerUser[msg.sender];
            //uint256 sharesAmount = userLPs[msg.sender];
            // Burn NFT Position since redeeming entire amount for entire collateral.
            //INLP(NLP).burnNLP(usernlp);
            //INLP(NLP)._deletePositionInfo(msg.sender);
            _deleteUsersData(msg.sender);
            //removeUserLPs() calls withdrawFromVault in Vault
            //uint256 lpToSend = _removeUserLPs(sharesAmount);
            // Looks like returning the LP shares to the user too! NOTE: user
            // still holds Nuon plus this new lpPair nuon.
            //IERC20Burnable(lpPair).transfer(msg.sender, lpToSend);
            //}

            mintedAmount[msg.sender] = 0;
            usersAmounts[msg.sender] = 0;
            delete users[usersIndex[msg.sender]];
            usersIndex[msg.sender] = 0;
        } else {
            // THINK this else statement is when redeem only part of your Nuon minted amount.
            require(fullAmount <= userAmount, "Not enough balance");
            mintedAmount[msg.sender] = mintedAmount[msg.sender].sub(NUONAmount);
            usersAmounts[msg.sender] = userAmount.sub(fullAmount);
            // if (msg.sender != owner()) {
            //     INLP(NLP)._addAmountToPosition(
            //         mintedAmount[msg.sender],
            //         usersAmounts[msg.sender],
            //         userLPs[msg.sender],
            //         nlpPerUser[msg.sender]
            //     );
            // }
        }
        INUON(NUON).myApprove(msg.sender, address(this), NUONAmount);
        // Send amount user wants to redeem of their Nuon, to this contract.
        INUON(NUON).transferFrom(msg.sender, address(this), NUONAmount);
        // This contract burns that Nuon.
        INUON(NUON).myBurn(NUONAmount);
        // Send user the corresponding amount of collateral back.
        TestToken(testToken).transfer(msg.sender, fullAmountSubFees);
        //IERC20Burnable(TestToken).transfer(Treasury, fees);

        emit Redeemed(msg.sender, fullAmount, NUONAmount);
        //}
    }

    // /**
    //  * @notice A view function to estimate the collaterals out after NUON redeem. For end end peeps.
    //  * @param _user A specific user
    //  * @param NUONAmount The NUON amount to give back to the collateral hub.
    //  * return The collateral amount out, the NUON burned in the process, and the fees taken by the ecosystem
    //  */
    function estimateCollateralsOut(
        address _user,
        uint256 NUONAmount
    ) public returns (uint256, uint256, uint256) {
        uint256 userAmount = usersAmounts[_user];
        uint256 userMintedAmount = mintedAmount[_user];

        require(userAmount > 0, "You do not have any balance in that CHUB");

        uint256 fullAmount = calcOverCollateralizedRedeemAmounts(
            collateralPercentToRatio(_user),
            getCollateralPrice(),
            NUONAmount,
            assetMultiplier
        );

        require(NUONAmount <= userMintedAmount, "Not enough NUON to burn");
        if (NUONAmount == mintedAmount[_user] || fullAmount >= userAmount) {
            fullAmount = userAmount;
        }

        uint256 fees = fullAmount
            .mul(INUONController(NUONController).getRedeemFee(address(this)))
            .div(100)
            .div(1e18);
        uint256 collateralFees = fullAmount.sub(fees);

        return (fullAmount, collateralFees, fees);
    }

    /**
     * @notice View function used to compute the amount of collaterals given back to the user
     * @param collateralRatio Determined by the controller contract
     * @param collateralPrice Determined by the assigned oracle
     * @param NUONAmount NUON amount in d18 format
     * @param multiplier Collateral multiplier factor
     * return The amount of collateral out
     */
    function calcOverCollateralizedRedeemAmounts(
        uint256 collateralRatio,
        uint256 collateralPrice,
        uint256 NUONAmount,
        uint256 multiplier
    ) internal returns (uint256) {
        // CAREFUL .mul(1) will be .mul(ITruflation(TruflationOracle).getNuonTargetPeg())
        uint256 NUONValueNeeded = (NUONAmount.mul(INUONController(NUONController).getTruflationPeg()).div(collateralRatio)).mul(
            1e18
        );
        uint256 NUONAmountToBurn = (
            NUONValueNeeded.mul(multiplier).div(collateralPrice)
        );
        return (NUONAmountToBurn);
    }

    function viewUserCollateralAmount(
        address _user
    ) public view returns (uint256) {
        return (usersAmounts[_user]);
    }

    function viewUserMintedAmount(address _user) public view returns (uint256) {
        return (mintedAmount[_user]);
    }

    function collateralPercentToRatio(
        address _user
    ) public returns (uint256) {
        uint256 rat = ((1e18 * 1e18) / getUserCollateralRatioInPercent(_user)) *
            100;
        return rat;
    }

    function getUserCollateralRatioInPercent(
        address _user
    ) public returns (uint256) {
        if (viewUserCollateralAmount(_user) > 0) {
            uint256 userTVL = ((viewUserCollateralAmount(_user) *
                assetMultiplier) * getCollateralPrice()) / 1e18;
            uint256 mintedValue = (viewUserMintedAmount(_user) *
                getTargetPeg()) / 1e18;
            return ((userTVL * 1e18) / mintedValue) * 100;
        } else {
            return 0;
        }
    }

    function _deleteUsersData(address _user) internal {
        mintedAmount[_user] = 0;
        usersAmounts[_user] = 0;
        //userLPs[_user] = 0;
        delete users[usersIndex[_user]];
        usersIndex[_user] = 0;
        //nlpCheck[_user] = false;
        //delete nlpPerUser[_user];
    }
}
