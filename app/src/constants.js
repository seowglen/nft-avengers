// const CONTRACT_ADDRESS = '0x77243AbFFE7820075Ce917b0F3ed482a05E3Fba6';
const CONTRACT_ADDRESS = '0x8985F2dd2b076a67908eDFA9B4c9Dbe74A28F4ab';

const transformCharacterData = (characterData) => {
  return {
    name: characterData.name,
    imageURI: characterData.imageURI,
    hp: characterData.hp.toNumber(),
    maxHp: characterData.maxHp.toNumber(),
    attackDamage: characterData.attackDamage.toNumber(),
  };
};

export { CONTRACT_ADDRESS, transformCharacterData };