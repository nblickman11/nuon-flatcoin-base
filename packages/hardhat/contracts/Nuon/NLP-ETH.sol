// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @notice Nuon Liquid Positions
 * @dev Designed by Gniar & TheHashM
 * @author (Driiip) TheHashM
 */
contract NuonLiquidPositionsETH {
    /**
     * @dev Contract instances.
     */
    address public CHUB;
    address public NUON;
    string public baseURI;

    struct NLPRecord {
        uint256 id;
        address owner;
        uint256 collateralAmount;
        uint256 NUONAmount;
        uint256 LPAmount;
    }

    struct NLPCount {
        uint256 count;
    }
    NLPCount[] public nlpcount;

    /**
     * @notice Contract Data : mapping and infos
     */
    mapping(uint256 => NLPRecord) public nlprecord;
    mapping(address => uint256) public userLPs;
    mapping(address => bool) public nlpCheck;
    mapping(address => uint256) public nlpPerUser;
    mapping(uint256 => string) public _tokenURIs;

    function setCHUBForNLP(address _CHUB) public {
        CHUB = _CHUB;
    }

    function mintNLP(address _sender, uint256 _tokenId) public {
        require(msg.sender == address(CHUB), "NLP mint : Not the CHUB");
        string memory uri = Strings.toString(_tokenId);

        // THIS PROCESS BELOW involves calling a ERC721 contract.  It associates the user with a
        // nft they get.  This nft seems to be located at the location of baseURI+uri off chain.
        //_safeMint(_sender, _tokenId);
        //_setTokenURI(_tokenId, concatenate(baseURI, uri));
    }

    function _createPosition(address _owner, uint256 _id) public {
        require(msg.sender == address(CHUB), "NLP pos : Not the CHUB");
        NLPRecord storage nlp = nlprecord[_id];
        nlp.id = _id;
        nlp.owner = _owner;
    }

    function _addAmountToPosition(
        uint256 _mintedAmount,
        uint256 _collateralAmount,
        uint256 _LPAmount,
        uint256 _position
    ) public {
        require(msg.sender == address(CHUB), "NLP adder: Not the CHUB");
        NLPRecord storage nlp = nlprecord[_position];
        nlp.collateralAmount = _collateralAmount;
        nlp.NUONAmount = _mintedAmount;
        nlp.LPAmount = _LPAmount;
    }
}
