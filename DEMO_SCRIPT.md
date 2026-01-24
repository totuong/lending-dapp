# KỊCH BẢN DEMO LENDING DAPP

## 1. Giới thiệu tổng quan
- **Lời mở đầu**: Xin chào mọi người, hôm nay tôi xin demo dự án **Lending DApp** - một ứng dụng tài chính phi tập trung (DeFi) cho phép người dùng gửi tiền (Supply) để nhận lãi suất và vay tiền (Borrow) bằng cách thế chấp tài sản.
- **Công nghệ**: Dự án được xây dựng trên nền tảng Ethereum (sử dụng Hardhat Localhost cho demo) và giao diện Web (Nuxt 3).

## 2. Kết nối Ví (Wallet Connection)
- **Bước 1**: Truy cập vào trang chủ ứng dụng.
- **Bước 2**: Nhấn vào nút **"Connect Wallet"** ở góc trên bên phải.
- **Mô tả**: Ứng dụng sẽ yêu cầu kết nối với ví MetaMask. (Lưu ý: Đảm bảo ví đang ở mạng Hardhat Localhost).
- **Kết quả**: Sau khi kết nối, địa chỉ ví và số dư ETH của người dùng sẽ hiện ra.

## 3. Chức năng Dashboard (Bảng điều khiển)
Đây là màn hình chính để người dùng tương tác.

### a. Gửi tiền (Supply)
- **Thao tác**: Tại mục "Supply", nhập số lượng ETH muốn gửi (ví dụ: 10 ETH).
- **Chức năng**: Nhấn nút **"Supply"**.
- **Giải thích**: Số ETH này sẽ được chuyển vào Smart Contract làm tài sản thế chấp.

### b. Vay tiền (Borrow)
- **Điều kiện**: Sau khi đã gửi tiền thế chấp (Supply), hạn mức vay (Borrow Limit) sẽ tăng lên.
- **Thao tác**: Chuyển sang tab hoặc mục "Borrow". Nhập số lượng Token (MCK) muốn vay.
- **Chức năng**: Nhấn nút **"Borrow"**.
- **Giải thích**: Người dùng nhận được Token MCK về ví, đồng thời Health Factor (Hệ số an toàn) sẽ giảm xuống.

## 4. Quản lý Tài sản (My Assets)
- **Điều hướng**: Chọn **"My Assets"** trên thanh Menu bên trái.
- **Hiển thị**:
    - **Supplied**: Tổng số tiền đã gửi và lãi suất kiếm được.
    - **Borrowed**: Tổng số tiền đang nợ.
- **Health Factor**:
    - Chỉ số quan trọng nhất. Nếu > 1: An toàn. Nếu < 1: Có nguy cơ bị thanh lý.
    - Demo: Cho thấy Health Factor thay đổi khi vay thêm tiền.

## 5. Thị trường (Market)
- **Điều hướng**: Chọn **"Market"** trên Menu.
- **Nội dung**: Hiển thị danh sách các tài sản được hỗ trợ, tổng thanh khoản (Total Supply), tổng nợ (Total Borrow) và lãi suất hiện tại (APY).

## 6. Thanh lý (Liquidation)
- **Điều hướng**: Chọn **"Liquidation"** trên Menu.
- **Mục đích**: Trang này dành cho những người tìm kiếm các khoản vay "xấu" (Health Factor < 1) để thanh lý kiếm lời.
- **Demo**: (Nếu có dữ liệu mẫu) Hiển thị danh sách các tài khoản đang bị dưới mức thế chấp an toàn và thực hiện chức năng thanh lý.

## 7. Các tiện ích khác
- **Guide (Hướng dẫn)**: Trang tài liệu hướng dẫn người dùng mới cách sử dụng các tính năng.
- **Settings (Cài đặt)**:
    - **Dark Mode**: Chuyển đổi giao diện Sáng/Tối.
    - **Language**: Đổi ngôn ngữ Tiếng Việt / Tiếng Anh.

## 8. Kết thúc
- Tổng kết lại các chức năng chính.
- Cảm ơn và chuyển sang phần hỏi đáp.
