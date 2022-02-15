import React, { useEffect, useState } from 'react';
import './SelectCharacter.css';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, transformCharacterData } from '../../constants';
import ABI from '../../utils/NftGame.json';
import LoadingIndicator from '../LoadingIndicator';

const SelectCharacter = ({ setCharacterNFT }) => {
  const [characters, setCharacters] = useState([]);
  const [gameContract, setGameContract] = useState(null);
  const [mintingCharacter, setMintingCharacter] = useState(false);

  // Actions
  const mintCharacterNFTAction = (characterId) => async () => {
    try {
      if (gameContract) {
        setMintingCharacter(true);
        console.log('Minting character in progress...');
        const mintTxn = await gameContract.mintCharacterNFT(characterId);
        await mintTxn.wait();
        console.log('mintTxn:', mintTxn);
        setMintingCharacter(false);
      }
    } catch (error) {
      console.warn('MintCharacterAction Error:', error);
      setMintingCharacter(false);
    }
  };

  // Render Methods
  const renderCharacters = () => {
    return (
      characters.map((character, index) => (
        <div className="character-item" key={character.name}>
          <div className="name-container">
            <p>{character.name}</p>
          </div>
          <div className="character-image">
            <img src={character.imageURI} alt={character.name} />
            <div className="description">
              <div className="text">John Doe</div>
            </div>
          </div>
          <button
            type="button"
            className="character-mint-button"
            onClick={mintCharacterNFTAction(index)}
          >{`Mint ${character.name}`}</button>
        </div>
      ))
    )  
  }

  const renderRandomCharacter = () => {
    return (
      <div className="character-item" key="random">
        <div className="name-container">
          <p>???</p>
        </div>
        <div className="random-image">
          <img src="https://i.imgur.com/haouzwo.jpg" alt="random" />
        </div>
        <button
          type="button"
          className="character-mint-button"
          onClick={
            mintCharacterNFTAction(Math.floor(Math.random() * (characters.length - 1)))
          }
        >{`Mint Random Avenger`}</button>
      </div>
    )
  }

  const renderContent = () => {
    if (mintingCharacter) {
      return <div className="loading">
        <div className="indicator">
          <LoadingIndicator />
          <p>Minting In Progress...</p>
        </div>
        <img
          src="https://allears.net/wp-content/uploads/2020/09/avengers-assemble-gif.gif"
          alt="Minting loading indicator"
        />
      </div>
    } else {
      return <>
        <h2>Mint Your Avenger. Choose wisely.</h2>
        {characters.length > 0 && (
          <div className="character-grid">
            {renderCharacters()}
            {renderRandomCharacter()}
          </div>
        )}
      </>
    }
  }

  useEffect(() => {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ABI.abi,
        signer
      );

      setGameContract(gameContract);
    } else {
      console.log('Ethereum object not found');
    }
  }, []);

  useEffect(() => {
    const getCharacters = async () => {
      try {
        console.log('Getting contract characters to mint');
  
        const charactersTxn = await gameContract.getAllDefaultCharacters();
        console.log('charactersTxn:', charactersTxn);
  
        const characters = charactersTxn.map((characterData) =>
          transformCharacterData(characterData)
        );

        setCharacters(characters);
      } catch (error) {
        console.error('Something went wrong fetching characters:', error);
      }
    };

    const onCharacterMint = async (sender, tokenId, characterIndex) => {
      console.log(
        `CharacterNFTMinted - sender: ${sender} tokenId: ${tokenId.toNumber()} characterIndex: ${characterIndex.toNumber()}`
      );
  
      if (gameContract) {
        const characterNFT = await gameContract.checkIfUserHasNFT();
        console.log('CharacterNFT: ', characterNFT);
        setCharacterNFT(transformCharacterData(characterNFT));
        alert(`Your NFT is all done -- see it here: https://testnets.opensea.io/assets/${gameContract}/${tokenId.toNumber()}`)
      }
    };

    if (gameContract) {
      getCharacters();
      gameContract.on('CharacterNFTMinted', onCharacterMint);
    }

    return () => {
      if (gameContract) {
        gameContract.off('CharacterNFTMinted', onCharacterMint);
      }
    };
  }, [gameContract]);

  return (
    <div className="select-character-container">
      {renderContent()}
    </div>
  );
};

export default SelectCharacter;