const main = async () => {
  const gameContractFactory = await hre.ethers.getContractFactory('NftGame');
  const gameContract = await gameContractFactory.deploy(
    ["Captain America", "Iron Man", "Thor", "Hawkeye", "Hulk", "Black Widow"],       // Names
    ["https://i.imgur.com/q2KjZhq.jpeg", // Images
    "https://i.imgur.com/PlubeWo.png", 
    "https://i.imgur.com/oQMX7G2.png",
    "https://i.imgur.com/GiGkbmj.jpeg",
    "https://i.imgur.com/DxxnUpa.jpeg",
    "https://i.imgur.com/uXS9Ewv.jpeg"],
    [300, 500, 800, 200, 1000, 200],                    // HP values
    [300, 500, 1000, 200, 800, 200],                       // Attack damage values
    "Thanos", // Boss name
    "https://i.imgur.com/hVuFcaF.jpeg", // Boss image
    500000, // Boss hp
    100 // Boss attack damage
  );
  await gameContract.deployed();
  console.log("Contract deployed to:", gameContract.address);
  let txn;
  // We only have three characters.
  // an NFT w/ the character at index 2 of our array.
  txn = await gameContract.mintCharacterNFT(2);
  await txn.wait();

  // Get the value of the NFT's URI.
  let returnedTokenUri = await gameContract.tokenURI(1);
  console.log("Token URI:", returnedTokenUri);

  txn = await gameContract.attackBoss();
  await txn.wait();

  txn = await gameContract.attackBoss();
  await txn.wait();
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();