pragma solidity >=0.4.21 <0.7.0;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// TODO: look into the difference between external vs. public

contract DoubleTrouble is ERC721 {
  mapping (address => mapping(uint256 => address)) internal _ownership;

  // Returns the current owner of the NFT
  function ownerOf(address _collection, uint256 _tokenId) external view returns (address) {
    return _ownership[_collection][_tokenId]; 
  }

  // Changes ownership of the NFT
  function transferFrom(address _from, address _to, address _collection, uint256 _tokenId) external { 
  }

  // sets currentForSalePrice to price
  function putUpForSale(address _from, address _collection, uint256 _tokenId, uint256 price) external {
  }

  // Transfers ownership of the NFT to the _newOwner
  // as long as price >= currentForSalePrice or price >= lastPurchasePrice * 2
  // Moves price ether from _newOwner to the current owner
  // sets lastPurchasePrice = price
  function buy(address _newOwner, address _collection, uint256 _tokenId, uint256 price) external {
  }
}
