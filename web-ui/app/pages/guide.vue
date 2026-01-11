<script setup lang="ts">
import { ref, computed } from 'vue';
import Sidebar from '../components/Sidebar.vue';
import { Icon } from '@iconify/vue';

const lang = ref<'en' | 'vi'>('vi'); // Default to Vietnamese

const translations = {
    en: {
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
        }
    },
    vi: {
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
        }
    }
};

const t = computed(() => translations[lang.value]);
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-sans flex">
    <Sidebar />
    
    <main class="flex-grow p-8 overflow-y-auto">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            {{ t.title }}
          </h1>

          <!-- Language Toggle -->
          <div class="flex items-center bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 shadow-sm">
              <button 
                @click="lang = 'vi'" 
                class="px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                :class="lang === 'vi' ? 'bg-blue-100 text-blue-700 dark:bg-blue-600 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'"
              >
                Tiếng Việt
              </button>
              <button 
                @click="lang = 'en'"
                class="px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                :class="lang === 'en' ? 'bg-blue-100 text-blue-700 dark:bg-blue-600 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'"
              >
                English
              </button>
          </div>
      </div>

      <div class="space-y-8 max-w-4xl">
        
        <!-- Section 1: Getting Started -->
        <section class="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
            <h2 class="text-2xl font-bold mb-6 flex items-center gap-3 text-blue-600 dark:text-blue-400">
                <Icon icon="mdi:rocket-launch" class="w-8 h-8" />
                {{ t.gettingStarted.title }}
            </h2>
            <div class="space-y-4 text-gray-600 dark:text-gray-300">
                <p>{{ t.gettingStarted.intro }}</p>
                
                <div class=" p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 mt-4">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ t.gettingStarted.connect.title }}</h3>
                    <p class="mt-1 text-sm">{{ t.gettingStarted.connect.desc }}</p>
                </div>
                
                <div class=" p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 mt-2">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ t.gettingStarted.funds.title }}</h3>
                    <p class="mt-1 text-sm">{{ t.gettingStarted.funds.desc }}</p>
                </div>
            </div>
        </section>

        <!-- Section 2: Dashboard Features -->
        <section class="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
            <h2 class="text-2xl font-bold mb-6 flex items-center gap-3 text-green-600 dark:text-green-400">
                <Icon icon="mdi:view-dashboard" class="w-8 h-8" />
                {{ t.dashboard.title }}
            </h2>
            <div class="grid md:grid-cols-2 gap-6">
                <div>
                    <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                        <Icon icon="mdi:bank-transfer-in" class="text-green-500" /> {{ t.dashboard.supply.title }}
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ t.dashboard.supply.desc }}</p>
                </div>
                <div>
                    <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                        <Icon icon="mdi:hand-coin" class="text-purple-500" /> {{ t.dashboard.borrow.title }}
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ t.dashboard.borrow.desc }}</p>
                </div>
            </div>
        </section>

        <!-- Section 3: Managing Assets & Health Factor -->
        <section class="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
            <h2 class="text-2xl font-bold mb-6 flex items-center gap-3 text-red-500 dark:text-red-400">
                <Icon icon="mdi:heart-pulse" class="w-8 h-8" />
                {{ t.health.title }}
            </h2>
            <div class="space-y-4 text-gray-600 dark:text-gray-300">
                <div class="p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-xl">
                    <p class="font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                        <Icon icon="mdi:alert" /> {{ t.health.concept }}
                    </p>
                    <p class="mt-2 text-sm text-yellow-800 dark:text-yellow-200" v-html="t.health.conceptDesc" />
                </div>
                
                <ul class="list-disc pl-5 space-y-2 mt-4">
                    <li v-html="t.health.safe" />
                    <li v-html="t.health.risky" />
                    <li v-html="t.health.danger" />
                </ul>

                <p class="mt-4" v-html="t.health.monitor" />
            </div>
        </section>

      </div>
    </main>
  </div>
</template>
