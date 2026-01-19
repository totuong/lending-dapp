# Báo Cáo Dự Án: Decentralized Lending Application (Lending DApp)

## 1. Tổng Quan Dự Án (Project Overview)
**Lending DApp** là một ứng dụng tài chính phi tập trung (DeFi) cho phép người dùng thực hiện các hoạt động vay và cho vay tiền mã hóa một cách minh bạch, tự động và không cần thông qua trung gian. Hệ thống hoạt động dựa trên Smart Contracts (Hợp đồng thông minh) trên nền tảng Blockchain.

### Mô hình hoạt động chính:
- **Người gửi (Supplier):** Cung cấp thanh khoản (Token) vào Pool để nhận lãi suất (Future feature) hoặc hỗ trợ thanh khoản.
- **Người vay (Borrower):** Thế chấp tài sản (ETH) để vay Token (ví dụ: Stablecoin).
- **Cơ chế thanh lý (Liquidation):** Đảm bảo an toàn vốn cho giao thức bằng cách thanh lý tài sản thế chấp khi giá trị giảm xuống dưới ngưỡng an toàn.

---

## 2. Công Nghệ Sử Dụng (Technology Stack)

### 2.1. Blockchain Layer (Backend & Smart Contracts)
Nền tảng cốt lõi xử lý logic nghiệp vụ và lưu trữ dữ liệu.

| Công nghệ | Phiên bản / Chi tiết | Vai trò |
| :--- | :--- | :--- |
| **Solidity** | ^0.8.0 | Ngôn ngữ lập trình Smart Contract chính. |
| **Hardhat** | Latest | Môi trường phát triển, kiểm thử và triển khai Smart Contract. |
| **OpenZeppelin** | Contracts | Cung cấp các chuẩn bảo mật (`ReentrancyGuard`, `Ownable`) và chuẩn Token (`ERC20`). |
| **Ethereum / EVM** | Localhost / Testnet | Mạng lưới Blockchain triển khai ứng dụng. |

### 2.2. Frontend Layer (User Interface)
Giao diện người dùng tương tác với Blockchain.

| Công nghệ | Phiên bản / Chi tiết | Vai trò |
| :--- | :--- | :--- |
| **Nuxt 4** | Beta/Latest | Framework Vue.js tối ưu cho SSR và cấu trúc dự án. |
| **Vue 3** | Latest | Framework JavaScript xây dựng giao diện phản hồi (Reactive UI). |
| **Tailwind CSS** | Latest | Framework CSS utility-first giúp thiết kế giao diện nhanh chóng. |
| **PrimeVue** | v4.5 | Bộ thư viện UI Component cao cấp (Table, Button, Dialog, etc.). |
| **Ethers.js** | v6.x | Thư viện kết nối Frontend với Blockchain (Wallet, Provider, Contract). |
| **Chart.js** | v4.x | Hiển thị biểu đồ dữ liệu thị trường. |

---

## 3. Chức Năng Cốt Lõi (Core Functions)

### 3.1. Quản lý Tài Sản & Thế Chấp (Deposit & Collateral)
- **Chức năng:** `deposit()`
- **Mô tả:** Người dùng gửi ETH vào Smart Contract. Số ETH này được khóa lại và sử dụng làm tài sản đảm bảo (Collateral) cho khoản vay.
- **Công nghệ:** Payable function trong Solidity, mapping lưu trữ số dư `deposits`.

### 3.2. Vay Tài Sản (Borrowing)
- **Chức năng:** `borrow(uint256 amount)`
- **Mô tả:** Người dùng vay Token dựa trên giá trị tài sản thế chấp. 
- **Quy tắc an toàn (LTV):** Hệ thống chỉ cho phép vay tối đa **80%** giá trị tài sản thế chấp (Loan-to-Value Ratio).
- **Oracle:** Sử dụng Mock Oracle (`ethPrice`) để quy đổi giá trị ETH sang Token.

### 3.3. Hoàn Trả Khoản Vay (Repayment)
- **Chức năng:** `repay(uint256 amount)`
- **Mô tả:** Người dùng trả lại số Token đã vay để giảm nợ. Sau khi trả hết nợ, tài sản thế chấp (ETH) sẽ được mở khóa để rút.

### 3.4. Rút Tài Sản (Withdrawal)
- **Chức năng:** `withdraw(uint256 amount)`
- **Mô tả:** Rút ETH thế chấp về ví. 
- **Kiểm tra an toàn:** Chỉ cho phép rút nếu Health Factor (Hệ số sức khỏe) vẫn giữ ở mức an toàn (>= 1) sau khi rút.

### 3.5. Thanh Lý (Liquidation) - Quản trị rủi ro
- **Chức năng:** `liquidate(address user)`
- **Mô tả:** Khi giá trị tài sản thế chấp giảm mạnh (Health Factor < 1), bất kỳ ai cũng có thể trở thành "người thanh lý" (Liquidator).
- **Cơ chế:**
    1. Liquidator trả thay nợ cho Borrower.
    2. Liquidator nhận lại phần tài sản thế chấp (ETH) tương ứng + **10% Bonus** (phần thưởng thanh lý).
- **Mục đích:** Đảm bảo Pool luôn có đủ khả năng chi trả (Solvency).

### 3.6. Cung Cấp Thanh Khoản (Supply Liquidity)
- **Chức năng:** `supply(uint256 amount)` & `withdrawSupply(uint256 amount)`
- **Mô tả:** Người dùng gửi Token vào Pool để cung cấp vốn cho người khác vay (Tính năng nền tảng cho Lending Pool).

---

## 4. Kiến Trúc Hệ Thống (System Architecture)

```mermaid
graph TD
    User[Người dùng] -->|Tương tác qua Trình duyệt| FE[Frontend (Nuxt/Vue)]
    
    subgraph Frontend Logic
        FE -->|PrimeVue/Tailwind| UI[Giao diện UI]
        FE -->|Ethers.js| Web3[Web3 Provider\n(Metamask)]
    end

    User -->|Ký giao dịch| Web3

    subgraph Blockchain Layer
        Web3 -->|RPC Call| SC[Smart Contract: LendingPool]
        SC -->|Lưu trữ| State[Blockchain State\n(Balance, Collateral)]
    end

    subgraph External
        Admin -->|Update Price| Oracle[Mock Oracle]
        Oracle -->|Set ETH Price| SC
    end
```

## 5. Điểm Nổi Bật Về Kỹ Thuật (Technical Highlights)

1.  **An toàn bảo mật (Security First):**
    -   Sử dụng `ReentrancyGuard` để ngăn chặn các cuộc tấn công Reentrancy (lỗi bảo mật phổ biến nhất trong DeFi).
    -   Kiểm tra điều kiện (`require`) chặt chẽ trước mọi thay đổi trạng thái.

2.  **Khả năng mở rộng (Scalability):**
    -   Kiến trúc tách biệt giữa Token (`IERC20`) và Logic (`LendingPool`), dễ dàng hỗ trợ nhiều loại tài sản trong tương lai.

3.  **Trải nghiệm người dùng (UX):**
    -   Giao diện cập nhật Real-time (thời gian thực) khi giao dịch thành công.
    -   Thông báo trạng thái rõ ràng, xử lý lỗi giao dịch trực quan trên Frontend.
