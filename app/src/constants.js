// const CONTRACT_ADDRESS = '0x77243AbFFE7820075Ce917b0F3ed482a05E3Fba6';
const CONTRACT_ADDRESS = '0x8DC0Ec1dDF3035641B9C0906087d467ed4168062';

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