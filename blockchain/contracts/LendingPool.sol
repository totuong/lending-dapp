// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LendingPool is ReentrancyGuard, Ownable {
    mapping(address => uint256) public deposits;
    mapping(address => uint256) public loans;

    IERC20 public lendingToken;
    uint256 public ethPrice; // Price of 1 ETH in LendingToken units (e.g. 2000 Tokens)

    event Deposit(address indexed user, uint256 amount);
    event Borrow(address indexed user, uint256 amount);
    event PriceUpdated(uint256 newPrice);

    constructor(address _lendingToken, uint256 _initialEthPrice) {
        lendingToken = IERC20(_lendingToken);
        ethPrice = _initialEthPrice;
    }

    /**
     * @dev User deposits ETH into the pool.
     */
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Amount must be greater than 0");
        deposits[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @dev User borrows tokens based on 80% LTV of their ETH deposit.
     * @param amount The amount of tokens to borrow.
     */
    function borrow(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        uint256 ethValue = deposits[msg.sender];
        // Calculate max borrowable amount: (ETH Amount * Price * 80) / 100
        // We assume ethPrice has same decimals handling as the token for simplicity, 
        // or effectively: 1 ETH * Price = Value in Token.
        // real-world oracles require careful decimal handling.
        uint256 collateralValueInToken = ethValue * ethPrice; 
        uint256 maxBorrow = (collateralValueInToken * 80) / 100;

        require(loans[msg.sender] + amount <= maxBorrow, "Insufficient collateral");
        require(lendingToken.balanceOf(address(this)) >= amount, "Insufficient pool liquidity");

        loans[msg.sender] += amount;
        require(lendingToken.transfer(msg.sender, amount), "Transfer failed");

        emit Borrow(msg.sender, amount);
    }

    /**
     * @dev Mock Oracle function to update ETH price.
     * @param _newPrice New price of 1 ETH in Token.
     */
    function updatePrice(uint256 _newPrice) external onlyOwner {
        require(_newPrice > 0, "Price must be > 0");
        ethPrice = _newPrice;
        emit PriceUpdated(_newPrice);
    }

    // Function to fund the contract with lending tokens (for testing purposes)
    function fundPool(uint256 amount) external onlyOwner {
        require(lendingToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }
}
