import { useState } from '#app';
import { computed } from 'vue';

export const useLanguage = () => {
    const lang = useState<'en' | 'vi'>('language', () => 'vi');

    const toggleLanguage = () => {
        lang.value = lang.value === 'en' ? 'vi' : 'en';
    };

    const dict = {
        en: {
            sidebar: {
                dashboard: 'Dashboard',
                market: 'Lending Market',
                liquidation: 'Liquidation',
                myAssets: 'My Assets',
                guide: 'Guide',
                settings: 'Settings'
            },
            title: "User Guide",
            gettingStarted: {
                title: "Getting Started",
                intro: "Welcome to the Lending DApp! This platform allows you to supply assets to earn interest and borrow other assets against them used as collateral.",
                connect: {
                    title: "1. Connect Wallet",
                    desc: "Click the \"Connect Wallet\" button on the top right. You need MetaMask installed. The application runs on a local Hardhat network, so you'll be prompted to switch to \"Localhost 8545\"."
                },
                funds: {
                    title: "2. Test Funds",
                    desc: "If you are using the local test environment, your wallet should be pre-funded with 10,000 ETH to test the platform features."
                }
            },
            dashboard: {
                title: "Dashboard Features",
                supply: {
                    title: "Supply Assets",
                    desc: "Deposit your ETH into the protocol. This increases your \"Total Supply\" and \"Net Worth\". Supplied assets can be used as collateral to borrow other tokens."
                },
                borrow: {
                    title: "Borrow Assets",
                    desc: "Borrow Mock Tokens (TOK) by using your supplied ETH as collateral. Be careful not to borrow too much to avoid liquidation risk."
                },
                repay: {
                    title: "Repay",
                    desc: "Repay your borrowed tokens to reduce your debt and improve your Health Factor."
                },
                withdraw: {
                    title: "Withdraw",
                    desc: "Withdraw your supplied assets back to your wallet. You can only withdraw if you have enough excess collateral."
                },
                netWorth: {
                    title: "Net Worth",
                    desc: "The total value of your assets minus the value of your debts, calculated in ETH."
                },
                poolLiquidity: {
                    title: "Pool Liquidity",
                    desc: "The total amount of ETH available in the lending pool for borrowing. (Admin Only view)"
                }
            },
            health: {
                title: "Health Factor & Risks",
                concept: "Important Concept",
                conceptDesc: "The <strong>Health Factor</strong> represents the safety of your loan. It is calculated based on your collateral vs. your borrowed amount.",
                safe: "<strong>Health Factor > 1.5</strong>: Safe. Low risk of liquidation.",
                risky: "<strong>1.0 < Health Factor < 1.5</strong>: Risky. You should repay some debt or supply more collateral.",
                danger: "<strong>Health Factor < 1.0</strong>: DANGER. Your collateral can be liquidated (seized) to repay your debt.",
                monitor: "You can monitor your Health Factor in the <strong>My Assets</strong> page."
            },
            interest: {
                title: "Interest Rate Mechanics",
                desc: "Our protocol uses a <strong>Linear Interest Rate Model</strong>. Rates adjust automatically based on supply and demand.",
                borrow: "<strong>Borrow APY</strong>: Increases as more funds are borrowed. Base Rate typically starts at <strong>5%</strong>.",
                supply: "<strong>Supply APY</strong>: Earned from interest. Typical rates can be around <strong>3.5%</strong> depending on utilization.",
                accrual: "<strong>Real-time Accrual</strong>: Interest is calculated every second and added to your balance whenever you interact with the pool."
            },
            ui: {
                common: {
                    connect: "Connect",
                    disconnect: "Disconnect",
                    netWorth: "Net Worth",
                    totalSupply: "Total Supply",
                    totalBorrow: "Total Borrow",
                    poolLiquidity: "Pool Liquidity",
                    healthFactor: "Health Factor",
                    asset: "Asset",
                    balance: "Balance",
                    wallet: "Wallet",
                    deposited: "Deposited",
                    supplied: "Supplied",
                    apy: "APY",
                    details: "Details",
                    utilization: "Utilization Rate",
                    liquidationThreshold: "Liquidation Threshold",
                    reserveFactor: "Reserve Factor",
                    protocolStats: "Protocol Stats",
                    action: "Action"
                },
                dashboard: {
                    supplyAssets: "Supply Assets",
                    borrowAssets: "Borrow Assets",
                    marketOverview: "Market Overview",
                    supply: "Supply",
                    withdraw: "Withdraw",
                    borrow: "Borrow",
                    repay: "Repay",
                    actions: {
                        supplyEth: "Supply ETH",
                        supplyToken: "Supply Mock Token",
                        withdrawEth: "Withdraw ETH",
                        withdrawToken: "Withdraw Mock Token",
                        borrowToken: "Borrow Token",
                        repayToken: "Repay Token"
                    }
                }
            }
        },
        vi: {
            sidebar: {
                dashboard: 'Tổng quan',
                market: 'Thị trường',
                liquidation: 'Thanh lý',
                myAssets: 'Tài sản',
                guide: 'Hướng dẫn',
                settings: 'Cài đặt'
            },
            title: "Hướng dẫn Sử dụng",
            gettingStarted: {
                title: "Bắt đầu",
                intro: "Chào mừng bạn đến với Lending DApp! Nền tảng này cho phép bạn gửi tài sản để nhận lãi suất và thế chấp chúng để vay các tài sản khác.",
                connect: {
                    title: "1. Kết nối Ví",
                    desc: "Nhấn nút \"Connect Wallet\" ở góc trên bên phải. Bạn cần cài đặt MetaMask. Ứng dụng chạy trên mạng Local Hardhat, vì vậy bạn sẽ được yêu cầu chuyển sang mạng \"Localhost 8545\"."
                },
                funds: {
                    title: "2. Tiền Thử nghiệm (Test Funds)",
                    desc: "Nếu bạn đang dùng môi trường test local, ví của bạn sẽ có sẵn 10,000 ETH để trải nghiệm các tính năng."
                }
            },
            dashboard: {
                title: "Tính năng Dashboard",
                supply: {
                    title: "Gửi Tài sản (Supply)",
                    desc: "Gửi ETH của bạn vào giao thức. Điều này làm tăng \"Tổng cung\" (Total Supply) và \"Tài sản ròng\" (Net Worth). Tài sản đã gửi có thể dùng làm thế chấp để vay token khác."
                },
                borrow: {
                    title: "Vay Tài sản (Borrow)",
                    desc: "Vay Mock Tokens (TOK) bằng cách thế chấp ETH đã gửi. Hãy cẩn thận đừng vay quá nhiều để tránh rủi ro bị thanh lý tài sản."
                },
                repay: {
                    title: "Trả nợ (Repay)",
                    desc: "Trả lại số token đã vay để giảm nợ và cải thiện Hệ số Sức khỏe (Health Factor)."
                },
                withdraw: {
                    title: "Rút tiền (Withdraw)",
                    desc: "Rút tài sản đã gửi về ví của bạn. Bạn chỉ có thể rút nếu bạn có đủ tài sản thế chấp dư thừa."
                },
                netWorth: {
                    title: "Tài sản ròng (Net Worth)",
                    desc: "Tổng giá trị tài sản của bạn trừ đi giá trị nợ, được tính bằng ETH."
                },
                poolLiquidity: {
                    title: "Thanh khoản Pool (Pool Liquidity)",
                    desc: "Tổng số lượng ETH có sẵn trong pool cho vay. (Chỉ Admin mới thấy)"
                }
            },
            health: {
                title: "Hệ số Sức khỏe & Rủi ro",
                concept: "Khái niệm Quan trọng",
                conceptDesc: "<strong>Health Factor</strong> thể hiện độ an toàn khoản vay của bạn. Nó được tính toán dựa trên Tỉ lệ Tài sản thế chấp so với Số tiền vay.",
                safe: "<strong class='text-green-500'>Health Factor > 1.5</strong>: An toàn. Rủi ro thanh lý thấp.",
                risky: "<strong class='text-yellow-500'>1.0 < Health Factor < 1.5</strong>: Rủi ro. Bạn nên trả bớt nợ hoặc nạp thêm tài sản thế chấp.",
                danger: "<strong class='text-red-500'>Health Factor < 1.0</strong>: NGUY HIỂM. Tài sản thế chấp của bạn có thể bị thanh lý (tịch thu) để trả nợ.",
                monitor: "Bạn có thể theo dõi Health Factor tại trang <strong>My Assets</strong>."
            },
            interest: {
                title: "Cơ chế Lãi suất",
                desc: "Giao thức sử dụng <strong>Mô hình Lãi suất Tuyến tính</strong>. Lãi suất tự động điều chỉnh dựa trên cung và cầu.",
                borrow: "<strong>Lãi suất Vay (APY)</strong>: Tăng khi nhu cầu vay cao. Lãi suất cơ bản thường bắt đầu từ <strong>5%</strong>.",
                supply: "<strong>Lãi suất Gửi (APY)</strong>: Kiếm được từ tiền lãi. Lãi suất điển hình khoảng <strong>3.5%</strong> tùy thuộc vào mức sử dụng vốn.",
                accrual: "<strong>Tính lãi Thời gian thực</strong>: Lãi suất được tính mỗi giây và cộng vào số dư mỗi khi bạn tương tác với pool."
            },
            ui: {
                common: {
                    connect: "Kết nối",
                    disconnect: "Ngắt kết nối",
                    netWorth: "Tài sản ròng",
                    totalSupply: "Tổng cung",
                    totalBorrow: "Tổng vay",
                    poolLiquidity: "Thanh khoản Pool",
                    healthFactor: "Hệ số Sức khỏe",
                    asset: "Tài sản",
                    balance: "Số dư",
                    wallet: "Ví",
                    deposited: "Đã gửi",
                    supplied: "Đã cung cấp",
                    apy: "Lãi suất (APY)",
                    details: "Chi tiết",
                    utilization: "Hiệu suất hoạt động",
                    liquidationThreshold: "Ngưỡng thanh lý",
                    reserveFactor: "Quỹ dự trữ",
                    protocolStats: "Thống kê Giao thức",
                    action: "Hành động"
                },
                dashboard: {
                    supplyAssets: "Gửi Tài sản",
                    borrowAssets: "Vay Tài sản",
                    marketOverview: "Tổng quan Thị trường",
                    supply: "Gửi tiền",
                    withdraw: "Rút tiền",
                    borrow: "Vay tiền",
                    repay: "Trả nợ",
                    actions: {
                        supplyEth: "Gửi ETH",
                        supplyToken: "Gửi Token",
                        withdrawEth: "Rút ETH",
                        withdrawToken: "Rút Token",
                        borrowToken: "Vay Token",
                        repayToken: "Trả Token"
                    }
                }
            }
        }
    };

    const t = computed(() => dict[lang.value]);

    return { lang, toggleLanguage, t };
};
