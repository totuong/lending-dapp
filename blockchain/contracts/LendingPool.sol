// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LendingPool is ReentrancyGuard, Ownable {
    mapping(address => uint256) public deposits; // ETH provided as collateral
    mapping(address => uint256) public loans;    // Borrowed Token amount (Principal + Interest)
    
    // --- Interest Rate Model State ---
    uint256 public borrowIndex = 1e18;
    uint256 public supplyIndex = 1e18;
    uint256 public lastAccrualTimestamp;
    uint256 public totalBorrowsGlobal; // Total borrowed amount (Principal + Interest)

    mapping(address => uint256) public userBorrowIndex;
    mapping(address => uint256) public userSupplyIndex;

    // Constants for Linear Rate Model (1e18 scale)
    // Approx 5% Base + 20% Slope
    // 5% / (365 * 24 * 60 * 60) approx 1585489599 per second (1e18 scale)
    // Constants for Linear Rate Model (1e18 scale)
    // Approx 5% Base + 20% Slope
    // 5% / (365 * 24 * 60 * 60) approx 1585489599 per second (1e18 scale)
    uint256 public BASE_RATE_PER_SECOND = 1585489599; 
    uint256 public MULTIPLIER_PER_SECOND = 6341958396;
    uint256 public constant WAD = 1e18;

    IERC20 public lendingToken;
    uint256 public ethPrice; // Price of 1 ETH in LendingToken units

    address[] public borrowers;
    mapping(address => bool) public hasBorrowed;

    function getBorrowers() external view returns (address[] memory) {
        return borrowers;
    }

    event Deposit(address indexed user, uint256 amount);
    event Borrow(address indexed user, uint256 amount);
    event Repay(address indexed user, uint256 amount);
    event PriceUpdated(uint256 newPrice);
    
    event InterestAccrued(uint256 borrowIndex, uint256 supplyIndex, uint256 totalBorrows);
    event InterestParamsUpdated(uint256 baseRate, uint256 multiplier);

    constructor(address _lendingToken, uint256 _initialEthPrice) {
        lendingToken = IERC20(_lendingToken);
        ethPrice = _initialEthPrice;
        lastAccrualTimestamp = block.timestamp;
    }

    /**
     * @dev Core function to accrue interest and update global indices
     */
    function accrueInterest() public {
        uint256 currentTimestamp = block.timestamp;
        if (currentTimestamp == lastAccrualTimestamp) {
            return;
        }

        uint256 timeDelta = currentTimestamp - lastAccrualTimestamp;
        if (timeDelta == 0) return;

        uint256 cash = lendingToken.balanceOf(address(this));
        uint256 borrows = totalBorrowsGlobal;
        uint256 totalLiquidity = cash + borrows;

        uint256 util = 0;
        if (totalLiquidity > 0) {
            util = (borrows * WAD) / totalLiquidity;
        }

        // Borrow Rate = Base + (Multiplier * Util)
        uint256 borrowRate = BASE_RATE_PER_SECOND + (MULTIPLIER_PER_SECOND * util) / WAD;
        
        // Supply Rate = Borrow Rate * Util
        // (Assuming 0 reserve factor for simplicity)
        uint256 supplyRate = (borrowRate * util) / WAD;

        // Simple Interest Accumulation: Index * (1 + Rate * Time)
        uint256 borrowInterestFactor = (borrowRate * timeDelta);
        uint256 supplyInterestFactor = (supplyRate * timeDelta);

        borrowIndex = borrowIndex + (borrowIndex * borrowInterestFactor) / WAD;
        supplyIndex = supplyIndex + (supplyIndex * supplyInterestFactor) / WAD;
        
        // Update total borrows with interest
        totalBorrowsGlobal = totalBorrowsGlobal + (totalBorrowsGlobal * borrowInterestFactor) / WAD;

        lastAccrualTimestamp = currentTimestamp;
        
        emit InterestAccrued(borrowIndex, supplyIndex, totalBorrowsGlobal);
    }

    /**
     * @dev Helper to update a specific user's borrow balance based on new index
     */
    function _updateUserBorrow(address user) internal {
        uint256 userIndex = userBorrowIndex[user];
        
        // If first time, set index to current global
        if (userIndex == 0) {
            userBorrowIndex[user] = borrowIndex;
            return;
        }

        // Apply interest: Balance = StoredBalance * (GlobalIndex / UserIndex)
        uint256 storedBalance = loans[user];
        if (storedBalance > 0) {
            uint256 newBalance = (storedBalance * borrowIndex) / userIndex;
            loans[user] = newBalance;
        }
        
        // Sync index
        userBorrowIndex[user] = borrowIndex;
    }

    /**
     * @dev Helper to update a specific user's supply balance based on new index
     */
    function _updateUserSupply(address user) internal {
        uint256 userIndex = userSupplyIndex[user];
        
        if (userIndex == 0) {
            userSupplyIndex[user] = supplyIndex;
            return;
        }

        uint256 storedBalance = suppliedTokens[user];
        if (storedBalance > 0) {
            uint256 newBalance = (storedBalance * supplyIndex) / userIndex;
            suppliedTokens[user] = newBalance;
        }
        
        userSupplyIndex[user] = supplyIndex;
    }

    /**
     * @dev User deposits ETH into the pool.
     */
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Amount must be greater than 0");
        // ETH deposit doesn't accrue interest in this model, but we should accrue global state just in case
        accrueInterest();
        
        deposits[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @dev User borrows tokens based on 80% LTV of their ETH deposit.
     * @param amount The amount of tokens to borrow.
     */
    function borrow(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        accrueInterest();
        _updateUserBorrow(msg.sender); // Update user balance to current with interest

        uint256 ethValue = deposits[msg.sender];
        uint256 collateralValueInToken = ethValue * ethPrice;
        uint256 maxBorrow = (collateralValueInToken * 80) / 100;

        require(
            loans[msg.sender] + amount <= maxBorrow,
            "Insufficient collateral"
        );
        require(
            lendingToken.balanceOf(address(this)) >= amount,
            "Insufficient pool liquidity"
        );

        loans[msg.sender] += amount;
        totalBorrowsGlobal += amount; // Track global

        if (!hasBorrowed[msg.sender]) {
            borrowers.push(msg.sender);
            hasBorrowed[msg.sender] = true;
        }
        
        // Ensure user index is set if it was 0 (first borrow)
        if (userBorrowIndex[msg.sender] == 0) {
             userBorrowIndex[msg.sender] = borrowIndex;
        }

        require(lendingToken.transfer(msg.sender, amount), "Transfer failed");

        emit Borrow(msg.sender, amount);
    }

    /**
     * @dev User repays tokens to reduce debt.
     * @param amount The amount of tokens to repay.
     */
    function repay(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        accrueInterest();
        _updateUserBorrow(msg.sender);

        require(loans[msg.sender] >= amount, "Amount exceeds debt");

        loans[msg.sender] -= amount;
        if(totalBorrowsGlobal >= amount) {
            totalBorrowsGlobal -= amount;
        } else {
            totalBorrowsGlobal = 0; // Should not happen mathematically but safety check
        }

        require(
            lendingToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        emit Repay(msg.sender, amount);
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

    /**
     * @dev Update interest rate model parameters.
     * @param _baseRatePerSecond New base rate per second (1e18 scale).
     * @param _multiplierPerSecond New multiplier per second (1e18 scale).
     */
    function setInterestParameters(uint256 _baseRatePerSecond, uint256 _multiplierPerSecond) external onlyOwner {
        accrueInterest(); // Accrue with old rates first
        BASE_RATE_PER_SECOND = _baseRatePerSecond;
        MULTIPLIER_PER_SECOND = _multiplierPerSecond;
        emit InterestParamsUpdated(_baseRatePerSecond, _multiplierPerSecond);
    }

    // Function to fund the contract with lending tokens (for testing purposes)
    function fundPool(uint256 amount) external onlyOwner {
        require(
            lendingToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        // Note: Admin funding doesn't count as 'suppliedTokens' so doesn't dilute APY
    }

    /**
     * @dev Liquidate a user's position if Health Factor < 1.
     * @param user The address of the borrower to liquidate.
     */
    function liquidate(address user) external nonReentrant {
        accrueInterest();
        _updateUserBorrow(user); // Make sure debt is up to date

        uint256 totalDebt = loans[user];
        require(totalDebt > 0, "No debt to liquidate");

        uint256 ethValue = deposits[user];
        uint256 collateralValueInToken = ethValue * ethPrice;
        uint256 maxBorrow = (collateralValueInToken * 80) / 100;

        require(totalDebt > maxBorrow, "Health Factor is >= 1");

        // Calculate theoretical collateral needed for full repayment
        // Logic: (Debt / Price) * 1.1
        uint256 baseCollateralETH = totalDebt / ethPrice;
        uint256 bonusETH = (baseCollateralETH * 10) / 100;
        uint256 neededCollateral = baseCollateralETH + bonusETH;

        uint256 amountToRepay = totalDebt;
        uint256 totalCollateralToSeize = neededCollateral;

        // If user is insolvent (collateral < needed), liquidate as much as possible
        if (deposits[user] < neededCollateral) {
            totalCollateralToSeize = deposits[user];
            // Calculate max repayable debt with available collateral
            // Formula: Repay = (Collateral * Price) / 1.1
            // Refined to match integer math: 
            // baseCollateral = Collateral * 100 / 110
            uint256 maxBaseCollateral = (totalCollateralToSeize * 100) / 110;
            amountToRepay = maxBaseCollateral * ethPrice;
        }

        require(amountToRepay > 0, "Collateral too small to liquidate");

        require(
            lendingToken.transferFrom(msg.sender, address(this), amountToRepay),
            "Token transfer failed"
        );

        loans[user] -= amountToRepay;
        
        // Global borrows logic
        if(totalBorrowsGlobal >= amountToRepay) {
            totalBorrowsGlobal -= amountToRepay;
        } else {
            totalBorrowsGlobal = 0;
        }

        deposits[user] -= totalCollateralToSeize;

        (bool success, ) = msg.sender.call{value: totalCollateralToSeize}("");
        require(success, "ETH transfer failed");
    }

    /**
     * @dev User withdraws ETH from their deposit.
     * @param amount The amount of ETH to withdraw.
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(deposits[msg.sender] >= amount, "Insufficient balance");
        
        accrueInterest();
        _updateUserBorrow(msg.sender); // Update debt to check HF correctly

        // Check Health Factor after withdrawal
        uint256 totalDebt = loans[msg.sender];
        if (totalDebt > 0) {
            uint256 remainingCollateral = deposits[msg.sender] - amount;
            uint256 collateralValueInToken = remainingCollateral * ethPrice;
            uint256 maxBorrow = (collateralValueInToken * 80) / 100;
            
            require(totalDebt <= maxBorrow, "Cannot withdraw: Health Factor would drop below 1");
        }

        deposits[msg.sender] -= amount;
        
        emit Withdraw(msg.sender, amount);

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "ETH transfer failed");
    }

    event Withdraw(address indexed user, uint256 amount);

    // --- Supply Liquidity Feature ---
    mapping(address => uint256) public suppliedTokens;
    event Supply(address indexed user, uint256 amount);
    event WithdrawSupply(address indexed user, uint256 amount);

    /**
     * @dev User supplies Lending Tokens (MCK) to the pool.
     * @param amount The amount of tokens to supply.
     */
    function supply(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        accrueInterest();
        _updateUserSupply(msg.sender);

        require(
            lendingToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        suppliedTokens[msg.sender] += amount;
        
        // Ensure index set
        if (userSupplyIndex[msg.sender] == 0) {
            userSupplyIndex[msg.sender] = supplyIndex;
        }

        emit Supply(msg.sender, amount);
    }

    /**
     * @dev User withdraws supplied Lending Tokens.
     * @param amount The amount of tokens to withdraw.
     */
    function withdrawSupply(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        accrueInterest();
        _updateUserSupply(msg.sender);

        require(suppliedTokens[msg.sender] >= amount, "Insufficient supply balance");
        
        require(
            lendingToken.balanceOf(address(this)) >= amount,
            "Insufficient pool liquidity to withdraw"
        );

        suppliedTokens[msg.sender] -= amount;

        require(
            lendingToken.transfer(msg.sender, amount),
            "Transfer failed"
        );

        emit WithdrawSupply(msg.sender, amount);
    }

    // View functions for UI to see updated balances without transaction
    function getUserBorrowBalance(address user) external view returns (uint256) {
        uint256 storedBalance = loans[user];
        if (storedBalance == 0) return 0;
        
        // Calculate pending interest
        uint256 currentTimestamp = block.timestamp;
        if (currentTimestamp == lastAccrualTimestamp) return storedBalance;
        
        uint256 timeDelta = currentTimestamp - lastAccrualTimestamp;
        uint256 cash = lendingToken.balanceOf(address(this));
        uint256 borrows = totalBorrowsGlobal;
        uint256 totalLiquidity = cash + borrows;
        
        uint256 util = 0;
        if (totalLiquidity > 0) {
            util = (borrows * WAD) / totalLiquidity;
        }
        
        uint256 borrowRate = BASE_RATE_PER_SECOND + (MULTIPLIER_PER_SECOND * util) / WAD;
        uint256 interestFactor = borrowRate * timeDelta;
        
        uint256 predictedBorrowIndex = borrowIndex + (borrowIndex * interestFactor) / WAD;
        
        uint256 userIndex = userBorrowIndex[user];
        if (userIndex == 0) return storedBalance;
        
        return (storedBalance * predictedBorrowIndex) / userIndex;
    }

    function getUserSupplyBalance(address user) external view returns (uint256) {
        uint256 storedBalance = suppliedTokens[user];
        if (storedBalance == 0) return 0;
        
        uint256 currentTimestamp = block.timestamp;
        if (currentTimestamp == lastAccrualTimestamp) return storedBalance;
        
        // Similarly calculate pending supply interest
        uint256 timeDelta = currentTimestamp - lastAccrualTimestamp;
        uint256 cash = lendingToken.balanceOf(address(this));
        uint256 borrows = totalBorrowsGlobal;
        uint256 totalLiquidity = cash + borrows;
        
        uint256 util = 0;
        if (totalLiquidity > 0) {
            util = (borrows * WAD) / totalLiquidity;
        }
        
        uint256 borrowRate = BASE_RATE_PER_SECOND + (MULTIPLIER_PER_SECOND * util) / WAD;
        uint256 supplyRate = (borrowRate * util) / WAD;
         
        uint256 supplyInterestFactor = supplyRate * timeDelta;
        uint256 predictedSupplyIndex = supplyIndex + (supplyIndex * supplyInterestFactor) / WAD;

        uint256 userIndex = userSupplyIndex[user];
        if (userIndex == 0) return storedBalance;

        return (storedBalance * predictedSupplyIndex) / userIndex;
    }
}
