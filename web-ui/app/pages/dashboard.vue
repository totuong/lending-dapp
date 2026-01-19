<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent, watch } from 'vue';
import { Icon } from '@iconify/vue';
import { ethers } from 'ethers';
import Sidebar from '../components/Sidebar.vue';
import DashboardHeader from '../components/DashboardHeader.vue';
import { useWeb3 } from '../composables/useWeb3';
import { lendingService } from '../services/lendingService';
import { useToast } from 'primevue/usetoast';
import { useLanguage } from '../composables/useLanguage';

const { t } = useLanguage();
const toast = useToast();
const { disconnect, account, isConnected, signer, isAdmin } = useWeb3();

// --- Lazy Load Charts ---
// Only load these components when they are actually rendered (Market Tab)

const currentTab = ref('overview');
const depositAmount = ref<number | null>(null);
const borrowAmount = ref<number | null>(null);
const userBalance = ref('0');
const userSupplyBalance = ref('0');
const userBorrowBalance = ref('0');
const poolETHBalance = ref('0');
const netWorth = ref('0');
const isLoading = ref(false);
const statusMessage = ref('');
const newEthPrice = ref<number | null>(null);
const isUpdatingPrice = ref(false);

const isDataLoading = ref(true);
const isRepayMode = ref(false);
const isWithdrawMode = ref(false);
const selectedSupplyAsset = ref('ETH'); // 'ETH' or 'MCK'
const userSupplyTokenBalance = ref('0');
const userWalletTokenBalance = ref('0');

// Mock Health Factor (1.0 - 2.0 range)
const healthFactor = ref(1.8);

const marketData = ref([
  {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: 'mdi:ethereum',
    color: 'text-blue-600 dark:text-blue-400',
    totalSupply: '10.2M',
    supplyAPY: '3.0%',
    totalBorrowed: '-',
    borrowAPY: '5.0%',
    utilization: 0
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    icon: 'mdi:bitcoin',
    color: 'text-orange-500 dark:text-orange-400',
    totalSupply: '850.5K',
    supplyAPY: '1.2%',
    totalBorrowed: '420.1K',
    borrowAPY: '2.5%',
    utilization: 45
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    icon: 'mdi:currency-usd-circle-outline',
    color: 'text-blue-500 dark:text-blue-400',
    totalSupply: '240.2M',
    supplyAPY: '3.8%',
    totalBorrowed: '180.5M',
    borrowAPY: '5.2%',
    utilization: 75
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    icon: 'mdi:circle-slice-8',
    color: 'text-yellow-500 dark:text-yellow-400',
    totalSupply: '150.1M',
    supplyAPY: '4.1%',
    totalBorrowed: '90.4M',
    borrowAPY: '5.8%',
    utilization: 60
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    icon: 'mdi:hexagon-multiple-outline',
    color: 'text-blue-600 dark:text-blue-500',
    totalSupply: '12.5M',
    supplyAPY: '2.4%',
    totalBorrowed: '5.2M',
    borrowAPY: '4.1%',
    utilization: 41
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    icon: 'mdi:dollar',
    color: 'text-green-600 dark:text-green-400',
    totalSupply: '105.4M',
    supplyAPY: '3.5%',
    totalBorrowed: '80.1M',
    borrowAPY: '5.0%',
    utilization: 70
  },
  {
    symbol: 'MCK',
    name: 'Mock Token',
    icon: 'mdi:circle-multiple-outline',
    color: 'text-purple-600 dark:text-purple-400',
    totalSupply: 'Loading...',
    supplyAPY: '3.5%',
    totalBorrowed: 'Loading...',
    borrowAPY: '5.0%',
    utilization: 0
  }
]);

const fetchBalance = async () => {
  isDataLoading.value = true;
  if (isConnected.value && signer.value && account.value) {
    // 1. Get Wallet Balance (ETH for display in input max)
    const walletRes = await lendingService.getWalletBalance(signer.value);

    // 2. Get Contract Balances
    const supplyRes = await lendingService.getUserBalance(signer.value); // Contract Deposits
    const borrowRes = await lendingService.getUserBorrowBalance(signer.value); // Contract Borrows

    if (walletRes.success && walletRes.data) {
      userBalance.value = walletRes.data;
    }

    if (supplyRes.success && supplyRes.data) {
      userSupplyBalance.value = supplyRes.data;
    }

    if (borrowRes.success && borrowRes.data) {
      userBorrowBalance.value = borrowRes.data;
    }

    // 3. Get Token Balances (Mock Token)
    const walletTokenRes = await lendingService.getWalletTokenBalance(signer.value);
    const supplyTokenRes = await lendingService.getUserSupplyTokenBalance(signer.value);

    if (walletTokenRes.success && walletTokenRes.data) {
      userWalletTokenBalance.value = walletTokenRes.data;
    }
    if (supplyTokenRes.success && supplyTokenRes.data) {
      userSupplyTokenBalance.value = supplyTokenRes.data;
    }

    // 4. Get Pool ETH Balance
    const poolETHRes = await lendingService.getPoolETHBalance(signer.value);
    if (poolETHRes.success && poolETHRes.data) {
      poolETHBalance.value = poolETHRes.data;
    }

    // 5. Get ETH Price from Oracle
    let ethPrice = 2000; // Default fallback
    const priceRes = await lendingService.getETHPrice(signer.value);
    if (priceRes.success && priceRes.data) {
      ethPrice = Number(priceRes.data);
    }

    // 6. Get Market Details (Real APY & Stats)
    const marketRes = await lendingService.getMarketDetails(signer.value);
    if (marketRes.success && marketRes.data) {
      const mckIndex = marketData.value.findIndex(a => a.symbol === 'MCK');
      const asset = marketData.value[mckIndex];
      if (asset) {
        const data = marketRes.data;
        asset.totalSupply = formatNumber(data.totalSupply) + ' MCK';
        asset.totalBorrowed = formatNumber(data.totalBorrows) + ' MCK';
        asset.supplyAPY = data.supplyAPY.toFixed(2) + '%';
        asset.borrowAPY = data.borrowAPY.toFixed(2) + '%';
        asset.utilization = data.utilization;
      }
    }

    const supplyVal = Number.parseFloat(userSupplyBalance.value || '0');
    const borrowVal = Number.parseFloat(userBorrowBalance.value || '0');

    // Net Worth in ETH = SupplyETH - (BorrowMCK / ETH_PRICE)
    const borrowInEth = borrowVal / ethPrice;
    netWorth.value = (supplyVal - borrowInEth).toFixed(2);

    // --- Calculate Health Factor ---
    // Supply USD = SupplyETH * ETH_PRICE
    // Max Borrow = Supply USD * 0.8 (80% LTV)
    // HF = Max Borrow / Borrow USD
    const supplyInUsd = supplyVal * ethPrice;
    const maxBorrowUsd = supplyInUsd * 0.8;

    if (borrowVal > 0) {
      healthFactor.value = Number.parseFloat((maxBorrowUsd / borrowVal).toFixed(2));
    } else {
      healthFactor.value = 999; // Safe/Infinite
    }

    // Simulate loading delay for skeleton (optional, can reduce)
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  isDataLoading.value = false;
};

const formatNumber = (num: number) => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
  return num.toFixed(2);
};

const handleDeposit = async () => {
  if (!depositAmount.value || !signer.value) return;
  isLoading.value = true;
  statusMessage.value = 'Depositing...';

  const res = await lendingService.depositETH(signer.value, String(depositAmount.value));

  isLoading.value = false;

  if (res.success) {
    statusMessage.value = 'Deposit Successful!';
    toast.add({ severity: 'success', summary: 'Deposit Successful', detail: 'ETH deposited to pool', life: 3000 });
    depositAmount.value = 0;
    await fetchBalance();
  } else {
    statusMessage.value = 'Error: ' + res.error;
    toast.add({ severity: 'error', summary: 'Deposit Failed', detail: res.error, life: 5000 });
  }
};

const handleBorrow = async () => {
  if (!borrowAmount.value || !signer.value) return;
  isLoading.value = true;
  statusMessage.value = 'Borrowing...';

  const res = await lendingService.borrowToken(signer.value, String(borrowAmount.value));

  isLoading.value = false;
  if (res.success) {
    statusMessage.value = 'Borrow Successful!';
    toast.add({ severity: 'success', summary: 'Borrow Successful', detail: 'Tokens borrowed successfully', life: 3000 });
    borrowAmount.value = 0;
    await fetchBalance();
  } else {
    statusMessage.value = 'Error: ' + res.error;
    toast.add({ severity: 'error', summary: 'Borrow Failed', detail: res.error, life: 5000 });
  }
};

const handleSupplyToken = async () => {
  if (!depositAmount.value || !signer.value) return;
  isLoading.value = true;
  statusMessage.value = 'Supplying Token...';

  const res = await lendingService.supplyToken(signer.value, String(depositAmount.value));

  isLoading.value = false;
  if (res.success) {
    statusMessage.value = 'Supply Successful!';
    toast.add({ severity: 'success', summary: 'Supply Successful', detail: 'Tokens supplied to pool', life: 3000 });
    depositAmount.value = 0;
    await fetchBalance();
  } else {
    statusMessage.value = 'Error: ' + res.error;
    toast.add({ severity: 'error', summary: 'Supply Failed', detail: res.error, life: 5000 });
  }
};

const handleWithdrawToken = async () => {
  if (!depositAmount.value || !signer.value) return;
  isLoading.value = true;
  statusMessage.value = 'Withdrawing Token...';

  const res = await lendingService.withdrawSupplyToken(signer.value, String(depositAmount.value));

  isLoading.value = false;
  if (res.success) {
    statusMessage.value = 'Withdraw Successful!';
    toast.add({ severity: 'success', summary: 'Withdraw Successful', detail: 'Tokens withdrawn from pool', life: 3000 });
    depositAmount.value = 0;
    await fetchBalance();
  } else {
    statusMessage.value = 'Error: ' + res.error;
    toast.add({ severity: 'error', summary: 'Withdraw Failed', detail: res.error, life: 5000 });
  }
};



const handleRepay = async () => {
  if (!borrowAmount.value || !signer.value) return;
  isLoading.value = true;
  statusMessage.value = 'Repaying...';

  const res = await lendingService.repayToken(signer.value, String(borrowAmount.value));

  isLoading.value = false;
  if (res.success) {
    statusMessage.value = 'Repay Successful!';
    toast.add({ severity: 'success', summary: 'Repay Successful', detail: 'Loan repaid successfully', life: 3000 });
    borrowAmount.value = 0;
    await fetchBalance();
  } else {
    statusMessage.value = 'Error: ' + res.error;
    toast.add({ severity: 'error', summary: 'Repay Failed', detail: res.error, life: 5000 });
  }
};

const handleWithdraw = async () => {
  if (!depositAmount.value || !signer.value) return;
  isLoading.value = true;
  statusMessage.value = 'Withdrawing...';

  const res = await lendingService.withdrawETH(signer.value, String(depositAmount.value));

  isLoading.value = false;

  if (res.success) {
    statusMessage.value = 'Withdraw Successful!';
    toast.add({ severity: 'success', summary: 'Withdraw Successful', detail: 'ETH withdrawn from pool', life: 3000 });
    depositAmount.value = 0;
    await fetchBalance();
  } else {
    statusMessage.value = 'Error: ' + res.error;
    toast.add({ severity: 'error', summary: 'Withdraw Failed', detail: res.error, life: 5000 });
  }
};



const handleUpdatePrice = async () => {
  if (!newEthPrice.value || !signer.value) return;
  isUpdatingPrice.value = true;

  const res = await lendingService.updateETHPrice(signer.value, String(newEthPrice.value));

  isUpdatingPrice.value = false;
  if (res.success) {
    toast.add({ severity: 'success', summary: 'Price Updated', detail: 'ETH Price updated successfully', life: 3000 });
    newEthPrice.value = null;
    await fetchBalance();
  } else {
    toast.add({ severity: 'error', summary: 'Update Failed', detail: res.error, life: 5000 });
  }
};

const setMaxDeposit = () => {
  if (isWithdrawMode.value) {
    if (selectedSupplyAsset.value === 'ETH' && userSupplyBalance.value) {
      depositAmount.value = Number.parseFloat(userSupplyBalance.value);
    } else if (selectedSupplyAsset.value === 'MCK' && userSupplyTokenBalance.value) {
      depositAmount.value = Number.parseFloat(userSupplyTokenBalance.value);
    }
  } else {
    if (selectedSupplyAsset.value === 'ETH' && userBalance.value) {
      depositAmount.value = Number.parseFloat(userBalance.value);
    } else if (selectedSupplyAsset.value === 'MCK' && userWalletTokenBalance.value) {
      // TODO: We need to fetch wallet token balance. For now assuming user borrows logic brings it? No, need separate fetch.
      // We haven't implemented fetchWalletTokenBalance yet in dashboard.
      depositAmount.value = Number.parseFloat(userWalletTokenBalance.value);
    }
  }
};

onMounted(() => {
  fetchBalance();
});

// Watch for connection changes (handle refresh/auto-connect)
watch(isConnected, (newVal) => {
  if (newVal) {
    fetchBalance();
  }
});

// --- Dialog Logic ---
const visible = ref(false);
const selectedAsset = ref<any>(null);

const openDetails = (asset: any) => {
  selectedAsset.value = asset;
  visible.value = true;
};

</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-sans flex">

    <!-- Sidebar -->
    <Sidebar :currentTab="currentTab" @update:currentTab="currentTab = $event" />

    <!-- Main Content -->
    <main class="flex-grow p-8 overflow-y-auto">

      <!-- Top Bar (Mobile Menu + Title) -->
      <DashboardHeader :healthFactor="healthFactor" title="Dashboard" />

      <!-- === TAB: OVERVIEW === -->
      <div v-if="currentTab === 'overview'" class="space-y-8 animate-fade-in">
        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6" :class="isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'">
          <div
            class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
            <p class="text-gray-500 dark:text-gray-400 text-sm mb-1">{{ t.ui.common.netWorth }}</p>
            <div v-if="isDataLoading" class="h-8 w-32">
              <Skeleton width="8rem" height="2rem" class="!bg-gray-200 dark:!bg-gray-700" />
            </div>
            <p v-else class="text-3xl font-bold text-gray-900 dark:text-white">{{ netWorth }} ETH</p>
          </div>
          <div
            class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
            <p class="text-gray-500 dark:text-gray-400 text-sm mb-1">{{ t.ui.common.totalSupply }}</p>
            <div v-if="isDataLoading" class="h-8 w-32">
              <Skeleton width="8rem" height="2rem" class="!bg-gray-200 dark:!bg-gray-700" />
            </div>
            <p v-else class="text-3xl font-bold text-green-500 dark:text-green-400">{{
              Number(userSupplyBalance).toFixed(2) }} ETH</p>
          </div>
          <div
            class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
            <p class="text-gray-500 dark:text-gray-400 text-sm mb-1">{{ t.ui.common.totalBorrow }}</p>
            <div v-if="isDataLoading" class="h-8 w-32">
              <Skeleton width="8rem" height="2rem" class="!bg-gray-200 dark:!bg-gray-700" />
            </div>
            <p v-else class="text-3xl font-bold text-purple-500 dark:text-purple-400">{{
              Number(userBorrowBalance).toFixed(2) }} MCK</p>
          </div>

          <!-- Pool Liquidity Card (Admin Only) -->
          <div v-if="isAdmin"
            class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
            <p class="text-gray-500 dark:text-gray-400 text-sm mb-1">{{ t.ui.common.poolLiquidity }}</p>
            <div v-if="isDataLoading" class="h-8 w-32">
              <Skeleton width="8rem" height="2rem" class="!bg-gray-200 dark:!bg-gray-700" />
            </div>
            <p v-else class="text-3xl font-bold text-blue-500 dark:text-blue-400 flex items-center gap-2">
              {{ Number(poolETHBalance).toFixed(2) }} <span class="text-lg text-gray-400">ETH</span>
            </p>
          </div>


        </div>

        <!-- Main Actions Area -->
        <div class="grid lg:grid-cols-2 gap-8">
          <!-- Supply Section -->
          <div
            class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
            <h3 class="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <Icon icon="mdi:bank-transfer-in" class="text-green-500 dark:text-green-400" />
              {{ t.ui.dashboard.supplyAssets }}
            </h3>

            <!-- Mode Toggle -->
            <div class="flex p-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-xl relative">
              <div
                class="absolute inset-y-1 rounded-lg bg-white dark:bg-gray-600 shadow-sm transition-all duration-300 ease-out"
                :class="isWithdrawMode ? 'left-1/2 right-1' : 'left-1 right-1/2'"></div>
              <button @click="isWithdrawMode = false"
                class="relative z-10 flex-1 py-2 text-sm font-bold transition-colors duration-200"
                :class="!isWithdrawMode ? 'text-green-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'">
                {{ t.ui.dashboard.supply }}
              </button>
              <button @click="isWithdrawMode = true"
                class="relative z-10 flex-1 py-2 text-sm font-bold transition-colors duration-200"
                :class="isWithdrawMode ? 'text-orange-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'">
                {{ t.ui.dashboard.withdraw }}
              </button>
            </div>

            <!-- Asset Selector -->
            <div class="flex items-center gap-2 mb-4">
              <button @click="selectedSupplyAsset = 'ETH'"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all"
                :class="selectedSupplyAsset === 'ETH' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'">
                <Icon icon="mdi:ethereum" class="text-blue-500" />
                <span class="font-bold text-sm"
                  :class="selectedSupplyAsset === 'ETH' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'">ETH</span>
              </button>
              <button @click="selectedSupplyAsset = 'MCK'"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all"
                :class="selectedSupplyAsset === 'MCK' ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'">
                <Icon icon="mdi:cash" class="text-purple-500" />
                <span class="font-bold text-sm"
                  :class="selectedSupplyAsset === 'MCK' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500'">MCK</span>
              </button>
            </div>

            <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-4 border border-gray-100 dark:border-gray-800">
              <div class="flex justify-between mb-2">
                <span class="text-gray-500 dark:text-gray-400">{{ t.ui.common.asset }}</span>
                <span class="text-gray-500 dark:text-gray-400">{{ isWithdrawMode ? (selectedSupplyAsset === 'ETH' ?
                  t.ui.common.deposited : t.ui.common.supplied) : t.ui.common.wallet }} {{ t.ui.common.balance }}</span>
              </div>
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center"
                    :class="selectedSupplyAsset === 'ETH' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400'">
                    <Icon :icon="selectedSupplyAsset === 'ETH' ? 'mdi:ethereum' : 'mdi:cash'" />
                  </div>
                  <span class="font-bold text-gray-900 dark:text-white">{{ selectedSupplyAsset }}</span>
                </div>
                <div v-if="isDataLoading">
                  <Skeleton width="5rem" height="1.5rem" class="!bg-gray-200 dark:!bg-gray-700" />
                </div>
                <span v-else class="font-mono text-gray-900 dark:text-white">
                  {{ isWithdrawMode
                    ? (selectedSupplyAsset === 'ETH' ? userSupplyBalance : userSupplyTokenBalance)
                    : (selectedSupplyAsset === 'ETH' ? userBalance : userWalletTokenBalance)
                  }}
                </span>
              </div>
            </div>

            <div class="relative mb-4">
              <InputNumber v-model="depositAmount" placeholder="0.00" mode="decimal" :minFractionDigits="2"
                :maxFractionDigits="18" fluid class="w-full"
                inputClass="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 transition-colors" />
              <div class="absolute right-3 top-3 z-10">
                <Button label="MAX" @click="setMaxDeposit" size="small" severity="secondary" text
                  class="!text-xs !bg-gray-700 !text-gray-300 hover:!bg-gray-600" />
              </div>
            </div>


            <div v-if="!isWithdrawMode">
              <Button @click="selectedSupplyAsset === 'ETH' ? handleDeposit() : handleSupplyToken()"
                :disabled="isLoading || !depositAmount" :loading="isLoading"
                :label="selectedSupplyAsset === 'ETH' ? t.ui.dashboard.actions.supplyEth : t.ui.dashboard.actions.supplyToken"
                icon="pi pi-check"
                class="w-full !bg-gradient-to-r !from-green-600 !to-emerald-600 hover:!from-green-500 hover:!to-emerald-500 !border-none !text-white !font-bold !py-3 !rounded-xl !shadow-lg !shadow-green-500/20 hover:!shadow-green-500/40 transition-all duration-300 transform hover:-translate-y-0.5" />
            </div>
            <div v-else>
              <Button @click="selectedSupplyAsset === 'ETH' ? handleWithdraw() : handleWithdrawToken()"
                :disabled="isLoading"
                :label="selectedSupplyAsset === 'ETH' ? t.ui.dashboard.actions.withdrawEth : t.ui.dashboard.actions.withdrawToken"
                icon="pi pi-wallet"
                class="w-full !bg-gradient-to-r !from-orange-500 !to-amber-600 hover:!from-orange-400 hover:!to-amber-500 !border-none !text-white !font-bold !py-3 !rounded-xl !shadow-lg !shadow-orange-500/20 hover:!shadow-orange-500/40 transition-all duration-300 transform hover:-translate-y-0.5" />
            </div>
          </div>

          <!-- Borrow Section -->
          <div
            class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
            <h3 class="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <Icon icon="mdi:hand-coin" class="text-purple-500 dark:text-purple-400" />
              {{ t.ui.dashboard.borrowAssets }}
            </h3>
            <!-- Mode Toggle -->
            <div class="flex p-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-xl relative">
              <div
                class="absolute inset-y-1 rounded-lg bg-white dark:bg-gray-600 shadow-sm transition-all duration-300 ease-out"
                :class="isRepayMode ? 'left-1/2 right-1' : 'left-1 right-1/2'"></div>
              <button @click="isRepayMode = false"
                class="relative z-10 flex-1 py-2 text-sm font-bold transition-colors duration-200"
                :class="!isRepayMode ? 'text-purple-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'">
                {{ t.ui.dashboard.borrow }}
              </button>
              <button @click="isRepayMode = true"
                class="relative z-10 flex-1 py-2 text-sm font-bold transition-colors duration-200"
                :class="isRepayMode ? 'text-pink-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'">
                {{ t.ui.dashboard.repay }}
              </button>
            </div>

            <!-- Asset Selector (Placeholder for alignment) -->
            <div class="flex items-center gap-2 mb-4">
              <button
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 transition-all cursor-default">
                <Icon icon="mdi:cash" class="text-purple-500" />
                <span class="font-bold text-sm text-purple-600 dark:text-purple-400">MCK</span>
              </button>
            </div>
            <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-4 border border-gray-100 dark:border-gray-800">
              <div class="flex justify-between mb-2">
                <span class="text-gray-500 dark:text-gray-400">{{ t.ui.common.asset }}</span>
                <span class="text-gray-500 dark:text-gray-400">{{ t.ui.common.apy }} / Rate</span>
              </div>
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <div
                    class="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Icon icon="mdi:cash" />
                  </div>
                  <span class="font-bold text-gray-900 dark:text-white">MCK</span>
                </div>
                <span class="text-purple-500 dark:text-purple-400 font-bold">{{marketData.find(a => a.symbol ===
                  'MCK')?.borrowAPY || '5.0%'}}</span>
              </div>
            </div>

            <div class="relative mb-4">
              <InputNumber v-model="borrowAmount" placeholder="0.00" mode="decimal" :minFractionDigits="2" fluid
                class="w-full"
                inputClass="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors" />
              <span class="absolute right-4 top-3 text-gray-500">MOK</span>
            </div>

            <div v-if="!isRepayMode">
              <Button @click="handleBorrow" :disabled="isLoading || !borrowAmount" :loading="isLoading"
                :label="t.ui.dashboard.actions.borrowToken" icon="pi pi-briefcase"
                class="w-full !bg-gradient-to-r !from-purple-600 !to-indigo-600 hover:!from-purple-500 hover:!to-indigo-500 !border-none !text-white !font-bold !py-3 !rounded-xl !shadow-lg !shadow-purple-500/20 hover:!shadow-purple-500/40 transition-all duration-300 transform hover:-translate-y-0.5" />
            </div>
            <div v-else>
              <Button @click="handleRepay" :disabled="isLoading || !borrowAmount" :loading="isLoading"
                :label="t.ui.dashboard.actions.repayToken" icon="pi pi-replay"
                class="w-full !bg-gradient-to-r !from-pink-600 !to-rose-600 hover:!from-pink-500 hover:!to-rose-500 !border-none !text-white !font-bold !py-3 !rounded-xl !shadow-lg !shadow-pink-500/20 hover:!shadow-pink-500/40 transition-all duration-300 transform hover:-translate-y-0.5" />
            </div>
          </div>
        </div>
      </div>

      <!-- Common: Markets Table (Visible on both or just one? Usually shared, keeping it shared for now or just under Overview?) 
           Lets keep it always visible or just in overview? The user said "load charts when clicked market", implying separate view.
           I'll put the table in BOTH or just leave it at bottom. 
           Actually, let's put it at the bottom for Overview, and maybe Market has a more detailed table.
           For now I'll leave the table at the bottom, ALWAYS visible, or maybe just for Overview?
           "Market Overview" implies it belongs to Overview.
           Let's move the table into 'Overview' div to be safe, or if 'Market' tab is selected, show it there too?
           I'll keep it outside for now so it's always accessible, unless the user wants a distinct "Market" page.
           The prompt specifically asked about CHARTS.
      -->

      <!-- Markets Table (Always visible or conditional?) 
           Let's duplicate it into Overview for now as "Top Markets" and maybe full list in Market? 
           For simplicity, I will keep the table always visible below the tab content for now, 
           BUT usually "Lending Market" view replaces everything. 
           I'll move the Table INSIDE the Overview tab for now to make the switch clear. 
           And 'Market' tab has charts.
      -->
      <div v-if="currentTab === 'overview'"
        class="mt-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm dark:shadow-none">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ t.ui.dashboard.marketOverview }}</h3>
        </div>
        <div class="overflow-x-auto">
          <DataTable :value="marketData" :loading="isDataLoading" tableStyle="min-width: 50rem" :paginator="true"
            :rows="5" :rowsPerPageOptions="[5, 10, 20]"
            :rowClass="() => 'hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer'">
            <Column :header="t.ui.common.asset" sortable field="name">
              <template #body="slotProps">
                <div class="flex items-center gap-3">
                  <Icon :icon="slotProps.data.icon" class="w-6 h-6" :class="slotProps.data.color" />
                  <span class="font-bold text-gray-900 dark:text-white">{{ slotProps.data.name }}</span>
                </div>
              </template>
            </Column>
            <Column field="totalSupply" :header="t.ui.common.totalSupply" sortable
              class="text-gray-600 dark:text-gray-300">
            </Column>
            <Column field="supplyAPY" :header="t.ui.dashboard.supply + ' APY'" sortable
              class="text-green-500 dark:text-green-400 font-bold">
            </Column>
            <Column field="totalBorrowed" :header="t.ui.common.totalBorrow" sortable
              class="text-gray-600 dark:text-gray-300">
            </Column>
            <Column field="borrowAPY" :header="t.ui.dashboard.borrow + ' APY'" sortable
              class="text-purple-500 dark:text-purple-400 font-bold">
            </Column>
            <Column :header="t.ui.common.action">
              <template #body="slotProps">
                <Button :label="t.ui.common.details" size="small"
                  class="!bg-gradient-to-r !from-blue-500 !to-cyan-500 hover:!from-blue-600 hover:!to-cyan-600 !text-white !border-none !rounded-lg !px-4 !py-1.5 !shadow-sm hover:!shadow-md transition-all font-semibold"
                  @click="openDetails(slotProps.data)" icon="pi pi-info-circle" />
              </template>
            </Column>
          </DataTable>
        </div>
      </div>

    </main>
    <Dialog v-model:visible="visible" modal :header="selectedAsset?.name + ' Details'" :style="{ width: '30rem' }">
      <div v-if="selectedAsset" class="space-y-4">
        <div class="flex items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <Icon :icon="selectedAsset.icon" class="w-12 h-12" :class="selectedAsset.color" />
          <div>
            <p class="text-2xl font-bold">{{ selectedAsset.name }}</p>
            <p class="text-gray-500">{{ selectedAsset.name === 'Ethereum' ? 'ETH' : 'MCK' }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
            <p class="text-xs text-gray-500 mb-1">{{ t.ui.common.totalSupply }}</p>
            <p class="font-bold text-lg">{{ selectedAsset.totalSupply }}</p>
          </div>
          <div class="p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
            <p class="text-xs text-gray-500 mb-1">{{ t.ui.common.totalBorrow }}</p>
            <p class="font-bold text-lg">{{ selectedAsset.totalBorrowed }}</p>
          </div>
          <div class="p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
            <p class="text-xs text-gray-500 mb-1">{{ t.ui.dashboard.supply }} APY</p>
            <p class="font-bold text-green-500">{{ selectedAsset.supplyAPY }}</p>
          </div>
          <div class="p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
            <p class="text-xs text-gray-500 mb-1">{{ t.ui.dashboard.borrow }} APY</p>
            <p class="font-bold text-purple-500">{{ selectedAsset.borrowAPY }}</p>
          </div>
        </div>

        <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <h4 class="font-bold mb-2">{{ t.ui.common.protocolStats }} (Mock)</h4>
          <div class="flex justify-between text-sm py-1">
            <span class="text-gray-500">{{ t.ui.common.utilization }}</span>
            <span class="font-mono">74.5%</span>
          </div>
          <div class="flex justify-between text-sm py-1">
            <span class="text-gray-500">{{ t.ui.common.liquidationThreshold }}</span>
            <span class="font-mono">82.5%</span>
          </div>
          <div class="flex justify-between text-sm py-1">
            <span class="text-gray-500">{{ t.ui.common.reserveFactor }}</span>
            <span class="font-mono">10.0%</span>
          </div>
        </div>

        <div class="flex gap-2 mt-6">
          <!-- Actions could go here -->
        </div>
      </div>
    </Dialog>
  </div>
</template>
