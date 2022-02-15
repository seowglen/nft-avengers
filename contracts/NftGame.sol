// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

import "./Base64.sol";
import "hardhat/console.sol";

contract NftGame is ERC721, VRFConsumerBase {

  address constant VRFC_address = 0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B;
  address constant LINK_address = 0x01BE23585060835E02B77ef475b0Cc51aA1e0709;

  bytes32 internal keyHash;
  uint256 internal fee;  
  uint256 public randomResult;

  struct CharacterAttributes {
    uint characterIndex;
    string name;
    string imageURI;        
    uint hp;
    uint maxHp;
    uint attackDamage;
  }

  struct BigBoss {
    string name;
    string imageURI;
    uint hp;
    uint maxHp;
    uint attackDamage;
  }

  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  CharacterAttributes[] defaultCharacters;
  BigBoss public bigBoss;

  mapping(uint256 => CharacterAttributes) public nftHolderAttributes;
  mapping(address => uint256) public nftHolders;
  mapping(bytes32 => address) public vrfRequestIdToAddress;

  event CharacterNFTMinted(address sender, uint256 tokenId, uint256 characterIndex);
  event AttackComplete(uint newBossHp, uint newPlayerHp, address playerAddress, uint bossAttackDamage, uint playerAttackDamage);

  modifier onlyVRFC() {
    require(msg.sender == VRFC_address, 'only VFRC can call this function');
    _;
  }

  constructor(
    string[] memory characterNames,
    string[] memory characterImageURIs,
    uint[] memory characterHp,
    uint[] memory characterAttackDmg,
    string memory bossName, 
    string memory bossImageURI,
    uint bossHp,
    uint bossAttackDamage
  )
    ERC721("Heroes", "HERO")
    VRFConsumerBase(VRFC_address, LINK_address)
  {
    keyHash = 0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311;
    fee = 0.1 * 10 ** 18; // 0.1 LINK

    bigBoss = BigBoss({
      name: bossName,
      imageURI: bossImageURI,
      hp: bossHp,
      maxHp: bossHp,
      attackDamage: bossAttackDamage
    });

    console.log("Done initializing boss %s w/ HP %s, img %s", bigBoss.name, bigBoss.hp, bigBoss.imageURI);

    for(uint i = 0; i < characterNames.length; i += 1) {
      defaultCharacters.push(CharacterAttributes({
        characterIndex: i,
        name: characterNames[i],
        imageURI: characterImageURIs[i],
        hp: characterHp[i],
        maxHp: characterHp[i],
        attackDamage: characterAttackDmg[i]
      }));

      CharacterAttributes memory c = defaultCharacters[i];
      
      console.log("Done initializing %s w/ HP %s, img %s", c.name, c.hp, c.imageURI);
    }

    _tokenIds.increment();
  }

  function mintCharacterNFT(uint _characterIndex) external {
    uint256 newItemId = _tokenIds.current();
    _safeMint(msg.sender, newItemId);

    nftHolderAttributes[newItemId] = CharacterAttributes({
      characterIndex: _characterIndex,
      name: defaultCharacters[_characterIndex].name,
      imageURI: defaultCharacters[_characterIndex].imageURI,
      hp: defaultCharacters[_characterIndex].hp,
      maxHp: defaultCharacters[_characterIndex].maxHp,
      attackDamage: defaultCharacters[_characterIndex].attackDamage
    });

    console.log("Minted NFT w/ tokenId %s and characterIndex %s", newItemId, _characterIndex);
    nftHolders[msg.sender] = newItemId;
    _tokenIds.increment();
    emit CharacterNFTMinted(msg.sender, newItemId, _characterIndex);
  }

  function attackBoss() public {
    uint256 nftTokenIdOfPlayer = nftHolders[msg.sender];
    CharacterAttributes memory player = nftHolderAttributes[nftTokenIdOfPlayer];

    console.log("\nPlayer w/ character %s about to attack. Has %s HP and %s AD", player.name, player.hp, player.attackDamage);
    console.log("Boss %s has %s HP and %s AD", bigBoss.name, bigBoss.hp, bigBoss.attackDamage);
    
    // Make sure the player has more than 0 HP.
    require (
      player.hp > 0,
      "Error: character must have HP to attack boss."
    );

    // Make sure the boss has more than 0 HP.
    require (
      bigBoss.hp > 0,
      "Error: boss must have HP to attack boss."
    );

    getRandomNumber();
  }

  function getRandomNumber() public {
    require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK - fill contract with faucet");
    bytes32 requestId = requestRandomness(keyHash, fee);
    vrfRequestIdToAddress[requestId] = msg.sender;
  }

  function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
    randomResult = randomness;
    address playerAddr = vrfRequestIdToAddress[requestId];
    attackRNGVerdict(randomResult, playerAddr);
  }

  function parseRandomNumber(uint256 random) internal pure returns (uint256, uint256) {
    uint256 playerCritChance = random % 100;
    uint256 bossCritChance = (random / 100) % 100;
    return (playerCritChance, bossCritChance);
  }

  function attackRNGVerdict(uint256 random, address playerAddr) public onlyVRFC {
    uint256 nftTokenIdOfPlayer = nftHolders[playerAddr];
    CharacterAttributes storage player = nftHolderAttributes[nftTokenIdOfPlayer];

    (uint256 playerCritChance, uint256 bossCritChance) = parseRandomNumber(random);

    uint256 playerTotalDamage = 0;
    uint256 bossTotalDamage = 0;

    if (playerCritChance < 50) {
      playerTotalDamage = player.attackDamage * 2;
    } else {
      playerTotalDamage = player.attackDamage;
    }

    if (bossCritChance < 50) {
      bossTotalDamage = bigBoss.attackDamage * 2;
    } else {
      bossTotalDamage = bigBoss.attackDamage;
    }

    // Allow player to attack boss.
    if (bigBoss.hp < playerTotalDamage) {
      bigBoss.hp = 0;
    } else {
      bigBoss.hp = bigBoss.hp - playerTotalDamage;
    }

    // Allow boss to attack player.
    if (player.hp < bossTotalDamage) {
      player.hp = 0;
    } else {
      player.hp = player.hp - bossTotalDamage;
    }

    console.log("Player attacked boss. New boss hp: %s", bigBoss.hp);
    console.log("Boss attacked player. New player hp: %s\n", player.hp);

    emit AttackComplete(bigBoss.hp, player.hp, playerAddr, bossTotalDamage, playerTotalDamage);
  }

  function tokenURI(uint256 _tokenId) public view override returns (string memory) {
    CharacterAttributes memory charAttributes = nftHolderAttributes[_tokenId];

    string memory strHp = Strings.toString(charAttributes.hp);
    string memory strMaxHp = Strings.toString(charAttributes.maxHp);
    string memory strAttackDamage = Strings.toString(charAttributes.attackDamage);

    string memory json = Base64.encode(
      abi.encodePacked(
        '{"name": "',
        charAttributes.name,
        ' -- NFT #: ',
        Strings.toString(_tokenId),
        '", "description": "This is an NFT that lets people play in the game Metaverse Avengers!", "image": "',
        charAttributes.imageURI,
        '", "attributes": [ { "trait_type": "Health Points", "value": ',strHp,', "max_value":',strMaxHp,'}, { "trait_type": "Attack Damage", "value": ',
        strAttackDamage,'} ]}'
      )
    );

    string memory output = string(
      abi.encodePacked("data:application/json;base64,", json)
    );
  
    return output;
  }

  function checkIfUserHasNFT() public view returns (CharacterAttributes memory) {
    uint256 userNftTokenId = nftHolders[msg.sender];
    if (userNftTokenId > 0) {
      return nftHolderAttributes[userNftTokenId];
    }
    else {
      CharacterAttributes memory emptyStruct;
      return emptyStruct;
    }
  }

  function getAllDefaultCharacters() public view returns (CharacterAttributes[] memory) {
    return defaultCharacters;
  }

  function getBigBoss() public view returns (BigBoss memory) {
    return bigBoss;
  }
}