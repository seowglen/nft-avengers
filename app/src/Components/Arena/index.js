import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, transformCharacterData } from '../../constants';
import ABI from '../../utils/NftGame.json';
import './Arena.css';
import LoadingIndicator from '../LoadingIndicator';

const Arena = ({ characterNFT, setCharacterNFT, currentAccount }) => {
  // State
  const [gameContract, setGameContract] = useState(null);
  const [boss, setBoss] = useState(null);
  const [attackStateBoss, setAttackStateBoss] = useState('');
  const [attackStatePlayer, setAttackStatePlayer] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [damages, setDamages] = useState({
    playerAddress: "asdfghjklasdfghjkl",
    bossDamage: 0,
    playerDamage: 0,
  });

  // Actions
  const runAttackAction = async () => {
    try {
      if (gameContract) {
        setAttackStateBoss('attacking');
        setAttackStatePlayer('attacking');
        console.log('Attacking boss...');
        const attackTxn = await gameContract.attackBoss();
        await attackTxn.wait();
        console.log('attackTxn:', attackTxn);
      }
    } catch (error) {
      console.error('Error attacking boss:', error);
      setAttackStateBoss('');
      setAttackStatePlayer('');
    }
  };

  const runMintAction = async () => {
    try {
      if (gameContract) {
        setCharacterNFT(null);
      }
    } catch (error) {
      console.error('Error running mint action: ', error);
    }
  }

  // UseEffects
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
    const fetchBoss = async () => {
      const bossTxn = await gameContract.getBigBoss();
      console.log('Boss:', bossTxn);
      setBoss(transformCharacterData(bossTxn));
    };

    const onAttackComplete = (newBossHp, newPlayerHp, playerAddress, bossAttackDamage, playerAttackDamage) => {
      const bossHp = newBossHp.toNumber();
      const playerHp = newPlayerHp.toNumber();
      const bossDamage = bossAttackDamage.toNumber();
      const playerDamage = playerAttackDamage.toNumber();

      setBoss((prevState) => {
        return { ...prevState, hp: bossHp };
      });
      
      if (currentAccount.toLowerCase() === playerAddress.toLowerCase()) {
        setCharacterNFT((prevState) => {
          return { ...prevState, hp: playerHp };
        });

        if (bossDamage > 0) {
          setAttackStateBoss('hit');
        }

        if (playerDamage > 0) {
          setAttackStatePlayer('hit');
        }
      }

      setDamages({
        playerAddress: playerAddress,
        bossDamage: bossDamage,
        playerDamage: playerDamage,
      })
    };

    if (gameContract) {
      fetchBoss();
      gameContract.on('AttackComplete', onAttackComplete);
    }

    return () => {
      if (gameContract) {
        gameContract.off('AttackComplete', onAttackComplete);
      }
    }
  }, [gameContract]);

  useEffect(() => {
    if (damages.playerAddress !== "asdfghjklasdfghjkl") {
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 5000);
    }
  }, [damages])

  return (
    <div className="arena-container">
      {boss && characterNFT && (
        <>
          <div id="toast" className={showToast ? 'show' : ''}>
            <div id="desc">{`💥 ${damages.playerAddress.slice(0,5) + "..." + damages.playerAddress.slice(damages.playerAddress.length-4,)}'s ${characterNFT.name} hit ${boss.name} for ${damages.playerDamage}`}</div>
          </div>
          <div id="toast2" className={showToast ? 'show' : ''}>
            <div id="desc">{`💥 ${boss.name} hit ${damages.playerAddress.slice(0,5) + "..." + damages.playerAddress.slice(damages.playerAddress.length-4,)}'s ${characterNFT.name} for ${damages.bossDamage}`}</div>
          </div>
        </>
      )}
      <div className="battle-container">
        {/* Character NFT */}
        {characterNFT && (
          <div className="players-container">
            <div className="player-container">
              <div className={`player ${attackStatePlayer}`}>
                <div className="image-content">
                  <h2>{characterNFT.name}</h2>
                  <img
                    src={characterNFT.imageURI}
                    alt={`Character ${characterNFT.name}`}
                  />
                  <div className="health-bar">
                    <progress value={characterNFT.hp} max={characterNFT.maxHp} />
                    <p>{`${characterNFT.hp} / ${characterNFT.maxHp} HP`}</p>
                  </div>
                </div>
                <div className="stats">
                  <h4>{`⚔️ Attack Damage: ${characterNFT.attackDamage}`}</h4>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="versus">
          <img src="https://i.imgur.com/NSptv9M.png" alt="versus" />
        </div>
        {/* Boss */}
        {boss && (
          <div className="boss-container">
            <div className={`boss-content ${attackStateBoss}`}>
              <h2>🔥 {boss.name} 🔥</h2>
              <div className="image-content">
                <img src={boss.imageURI} alt={`Boss ${boss.name}`} />
                <div className="health-bar">
                  <progress value={boss.hp} max={boss.maxHp} />
                  <p>{`${boss.hp} / ${boss.maxHp} HP`}</p>
                </div>
              </div>
              <div className="stats">
                <h4>{`⚔️ Attack Damage: ???`}</h4>
              </div>
            </div>
          </div>
        )}
      </div>
      {characterNFT.hp !== 0 ? (
        attackStatePlayer === 'attacking' ? ( 
          <div className="loading-indicator">
            <LoadingIndicator />
          </div>
        ) : (
         <div className="attack-container">
           <button className="cta-button" onClick={runAttackAction}>
             {`💥 Attack`}
           </button>
         </div>
        )
      ) : (
        <div className="attack-container">
          <button className="cta-button" onClick={runMintAction}>
             {`🦸‍♂️ Mint another Avenger`}
           </button>
        </div>
      )} 
    </div>
  );
};

export default Arena;