<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent, watch } from 'vue';
import { Icon } from '@iconify/vue';
import { ethers } from 'ethers';
import Sidebar from '../components/Sidebar.vue';
import DashboardHeader from '../components/DashboardHeader.vue';
import { useWeb3 } from '../composables/useWeb3';
import { lendingService } from '../services/lendingService';
import { useToast } from 'primevue/usetoast';

const toast = useToast();
const { disconnect, account, isConnected, signer } = useWeb3();

// --- Lazy Load Charts ---
// Only load these components when they are actually rendered (Market Tab)
const TVLChart = defineAsyncComponent(() => import('../components/market/TVLChart.vue'));
const DistributionChart = defineAsyncComponent(() => import('../components/market/DistributionChart.vue'));

const currentTab = ref('overview');
const depositAmount = ref<number | null>(null);
const borrowAmount = ref<number | null>(null);
const userBalance = ref('0');
const userSupplyBalance = ref('0');
const userBorrowBalance = ref('0');
const netWorth = ref('0');
const isLoading = ref(false);
const statusMessage = ref('');

const isDataLoading = ref(true);
const isRepayMode = ref(false);
const isWithdrawMode = ref(false); // Fix: Define isWithdrawMode for symmetry

// Mock Health Factor (1.0 - 2.0 range)
const healthFactor = ref(1.8);

const marketData = ref([
  {
    name: 'Ethereum',
    icon: 'mdi:ethereum',
    color: 'text-blue-600 dark:text-blue-400',
    totalSupply: '$10.2M',
    supplyAPY: '2.5%',
    totalBorrowed: '$4.1M',
    borrowAPY: '3.8%'
  },
  {
    name: 'Mock Token',
    icon: 'mdi:circle-multiple-outline',
    color: 'text-purple-600 dark:text-purple-400',
    totalSupply: '$50.5M',
    supplyAPY: '4.2%',
    totalBorrowed: '$35.2M',
    borrowAPY: '5.5%'
  }
]);

const fetchBalance = async () => {
  isDataLoading.value = true;
  if (isConnected.value && signer.value && account.value) {
    // 1. Get Wallet Balance (ETH for display in Supply card)
    // Note: getUserBalance in lendingService currently returns DEPOSITED balance from contract, NOT wallet balance.
    // We should probably explicitly separate them if needed. 
    // Creating a quick fix: reusing getUserBalance (deposits) for "Total Supply".
    
    // Pass signer to service methods
    const supplyRes = await lendingService.getUserBalance(signer.value); // Contract Deposits
    const borrowRes = await lendingService.getUserBorrowBalance(signer.value); // Contract Borrows

    if (supplyRes.success && supplyRes.data) {
      userSupplyBalance.value = supplyRes.data;
    }
    
    if (borrowRes.success && borrowRes.data) {
      userBorrowBalance.value = borrowRes.data;
    }

    // Simple Net Worth Calc (Mock Price: ETH = $2000, MCK = $1)
    const PREDEFINED_ETH_PRICE = 2000;
    const supplyVal = Number.parseFloat(userSupplyBalance.value || '0');
    const borrowVal = Number.parseFloat(userBorrowBalance.value || '0');
    
    // Net Worth in ETH = SupplyETH - (BorrowMCK / ETH_PRICE)
    const borrowInEth = borrowVal / PREDEFINED_ETH_PRICE;
    netWorth.value = (supplyVal - borrowInEth).toFixed(4);

    // --- Calculate Health Factor ---
    // Supply USD = SupplyETH * 2000
    // Max Borrow = Supply USD * 0.8 (80% LTV)
    // HF = Max Borrow / Borrow USD
    const supplyInUsd = supplyVal * PREDEFINED_ETH_PRICE;
    const maxBorrowUsd = supplyInUsd * 0.8;
    
    if (borrowVal > 0) {
        healthFactor.value = Number.parseFloat((maxBorrowUsd / borrowVal).toFixed(2));
    } else {
        healthFactor.value = 999; // Safe/Infinite
    }
    
    // Update display strings
    // We might need a real price feed for $ value, but using ETH amounts for now as per "Mock" removal request
    
    // Simulate loading delay for skeleton (optional, can reduce)
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  isDataLoading.value = false;
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
   // TODO: Implement actual withdraw when contract supports it
   if (!depositAmount.value) return;
   toast.add({ severity: 'info', summary: 'Coming Soon', detail: 'Withdraw functionality will be available in the next update.', life: 3000 });
};

const setMaxDeposit = () => {
    if (userBalance.value) {
        depositAmount.value = Number.parseFloat(userBalance.value);
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
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
               <p class="text-gray-500 dark:text-gray-400 text-sm mb-1">Net Worth</p>
              <div v-if="isDataLoading" class="h-8 w-32">
                <Skeleton width="8rem" height="2rem" class="!bg-gray-200 dark:!bg-gray-700" />
              </div>
              <p v-else class="text-3xl font-bold text-gray-900 dark:text-white">{{ netWorth }} ETH</p>
           </div>
           <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
              <p class="text-gray-500 dark:text-gray-400 text-sm mb-1">Total Supply</p>
               <div v-if="isDataLoading" class="h-8 w-32">
                 <Skeleton width="8rem" height="2rem" class="!bg-gray-200 dark:!bg-gray-700" />
               </div>
              <p v-else class="text-3xl font-bold text-green-500 dark:text-green-400">{{ userSupplyBalance }} ETH</p>
           </div>
           <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
              <p class="text-gray-500 dark:text-gray-400 text-sm mb-1">Total Borrow</p>
               <div v-if="isDataLoading" class="h-8 w-32">
                 <Skeleton width="8rem" height="2rem" class="!bg-gray-200 dark:!bg-gray-700" />
               </div>
              <p v-else class="text-3xl font-bold text-purple-500 dark:text-purple-400">{{ userBorrowBalance }} USDT</p>
           </div>
        </div>

        <!-- Main Actions Area -->
        <div class="grid lg:grid-cols-2 gap-8">
            <!-- Supply Section -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
               <h3 class="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                 <Icon icon="mdi:bank-transfer-in" class="text-green-500 dark:text-green-400" />
                 Supply Assets
               </h3>
               <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-4 border border-gray-100 dark:border-gray-800">
                 <div class="flex justify-between mb-2">
                   <span class="text-gray-500 dark:text-gray-400">Asset</span>
                   <span class="text-gray-500 dark:text-gray-400">Balance</span>
                 </div>
                 <div class="flex justify-between items-center">
                   <div class="flex items-center gap-2">
                     <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                       <Icon icon="mdi:ethereum" />
                     </div>
                     <span class="font-bold text-gray-900 dark:text-white">ETH</span>
                   </div>
                   <div v-if="isDataLoading">
                      <Skeleton width="5rem" height="1.5rem" class="!bg-gray-200 dark:!bg-gray-700" />
                   </div>
                   <span v-else class="font-mono text-gray-900 dark:text-white">{{ userBalance }}</span>
                 </div>
               </div>
               
               <div class="relative mb-4">
                    <InputNumber 
                      v-model="depositAmount" 
                      placeholder="0.00" 
                      mode="decimal" 
                      :minFractionDigits="2" 
                      :maxFractionDigits="18"
                      fluid
                      class="w-full"
                      inputClass="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 transition-colors"
                    />
                    <div class="absolute right-3 top-3 z-10">
                       <Button label="MAX" @click="setMaxDeposit" size="small" severity="secondary" text class="!text-xs !bg-gray-700 !text-gray-300 hover:!bg-gray-600" />
                    </div>
               </div>
               
               <div v-if="!isWithdrawMode">
                  <Button 
                    @click="handleDeposit"
                    :disabled="isLoading || !depositAmount"
                    :loading="isLoading"
                    label="Supply ETH"
                    icon="pi pi-check"
                    class="w-full !bg-gradient-to-r !from-green-600 !to-emerald-600 hover:!from-green-500 hover:!to-emerald-500 !border-none !text-white !font-bold !py-3 !rounded-xl !shadow-lg !shadow-green-500/20 hover:!shadow-green-500/40 transition-all duration-300 transform hover:-translate-y-0.5"
                  />
               </div>
               <div v-else>
                  <Button 
                    @click="handleWithdraw"
                    :disabled="isLoading"
                    label="Withdraw ETH"
                    icon="pi pi-wallet"
                    class="w-full !bg-gradient-to-r !from-orange-500 !to-amber-600 hover:!from-orange-400 hover:!to-amber-500 !border-none !text-white !font-bold !py-3 !rounded-xl !shadow-lg !shadow-orange-500/20 hover:!shadow-orange-500/40 transition-all duration-300 transform hover:-translate-y-0.5"
                  />
               </div>
            </div>

            <!-- Borrow Section -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
               <h3 class="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                 <Icon icon="mdi:hand-coin" class="text-purple-500 dark:text-purple-400" />
                 Borrow Assets
               </h3>
               <!-- Mode Toggle -->
               <div class="flex p-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-xl relative">
                   <div class="absolute inset-y-1 rounded-lg bg-white dark:bg-gray-600 shadow-sm transition-all duration-300 ease-out"
                        :class="isRepayMode ? 'left-1/2 right-1' : 'left-1 right-1/2'"></div>
                   <button 
                      @click="isRepayMode = false"
                      class="relative z-10 flex-1 py-2 text-sm font-bold transition-colors duration-200"
                      :class="!isRepayMode ? 'text-purple-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
                   >
                     Borrow
                   </button>
                   <button 
                      @click="isRepayMode = true"
                      class="relative z-10 flex-1 py-2 text-sm font-bold transition-colors duration-200"
                      :class="isRepayMode ? 'text-pink-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
                   >
                     Repay
                   </button>
               </div>
               <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-4 border border-gray-100 dark:border-gray-800">
                 <div class="flex justify-between mb-2">
                   <span class="text-gray-500 dark:text-gray-400">Asset</span>
                   <span class="text-gray-500 dark:text-gray-400">APY / Rate</span>
                 </div>
                 <div class="flex justify-between items-center">
                   <div class="flex items-center gap-2">
                     <div class="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                       <Icon icon="mdi:cash" />
                     </div>
                     <span class="font-bold text-gray-900 dark:text-white">MCK</span>
                   </div>
                   <span class="text-purple-500 dark:text-purple-400 font-bold">3.5%</span>
                 </div>
               </div>

               <div class="relative mb-4">
                    <InputNumber 
                      v-model="borrowAmount" 
                      placeholder="0.00" 
                      mode="decimal"
                      :minFractionDigits="2"
                      fluid 
                      class="w-full"
                      inputClass="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <span class="absolute right-4 top-3 text-gray-500">TOK</span>
               </div>

               <div v-if="!isRepayMode">
                 <Button 
                    @click="handleBorrow"
                    :disabled="isLoading || !borrowAmount"
                    :loading="isLoading"
                    label="Borrow Token"
                    icon="pi pi-briefcase"
                    class="w-full !bg-gradient-to-r !from-purple-600 !to-indigo-600 hover:!from-purple-500 hover:!to-indigo-500 !border-none !text-white !font-bold !py-3 !rounded-xl !shadow-lg !shadow-purple-500/20 hover:!shadow-purple-500/40 transition-all duration-300 transform hover:-translate-y-0.5"
                 />
               </div>
               <div v-else>
                  <Button 
                    @click="handleRepay"
                    :disabled="isLoading || !borrowAmount"
                    :loading="isLoading"
                    label="Repay Token"
                    icon="pi pi-replay"
                    class="w-full !bg-gradient-to-r !from-pink-600 !to-rose-600 hover:!from-pink-500 hover:!to-rose-500 !border-none !text-white !font-bold !py-3 !rounded-xl !shadow-lg !shadow-pink-500/20 hover:!shadow-pink-500/40 transition-all duration-300 transform hover:-translate-y-0.5"
                 />
               </div>
            </div>
        </div>
      </div>

      <!-- === TAB: LENDING MARKET === -->
      <div v-else-if="currentTab === 'market'" class="space-y-8 animate-fade-in">
          <!-- Charts Section (Lazy Loaded) -->
          <div class="grid lg:grid-cols-2 gap-8">
             <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 h-[400px]">
                <h3 class="text-lg font-bold mb-4 text-gray-900 dark:text-white">Total Value Locked</h3>
                <TVLChart /> 
             </div>
             <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 h-[400px]">
                <h3 class="text-lg font-bold mb-4 text-gray-900 dark:text-white">Asset Distribution</h3>
                <DistributionChart />
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
      <div v-if="currentTab === 'overview'" class="mt-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm dark:shadow-none">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
           <h3 class="text-xl font-bold text-gray-900 dark:text-white">Market Overview</h3>
        </div>
        <div class="overflow-x-auto">
          <DataTable :value="marketData" :loading="isDataLoading" tableStyle="min-width: 50rem"
            :rowClass="() => 'hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer'"
          >
             <Column header="Asset">
                <template #body="slotProps">
                    <div class="flex items-center gap-3">
                        <Icon :icon="slotProps.data.icon" class="w-6 h-6" :class="slotProps.data.color" />
                        <span class="font-bold text-gray-900 dark:text-white">{{ slotProps.data.name }}</span>
                    </div>
                </template>
             </Column>
             <Column field="totalSupply" header="Total Supplied" class="text-gray-600 dark:text-gray-300"></Column>
             <Column field="supplyAPY" header="Supply APY" class="text-green-500 dark:text-green-400 font-bold"></Column>
             <Column field="totalBorrowed" header="Total Borrowed" class="text-gray-600 dark:text-gray-300"></Column>
             <Column field="borrowAPY" header="Borrow APY" class="text-purple-500 dark:text-purple-400 font-bold"></Column>
             <Column header="Action">
                <template #body="slotProps">
                    <Button label="Details" size="small" 
                        class="!bg-gradient-to-r !from-blue-500 !to-cyan-500 hover:!from-blue-600 hover:!to-cyan-600 !text-white !border-none !rounded-lg !px-4 !py-1.5 !shadow-sm hover:!shadow-md transition-all font-semibold" 
                        @click="openDetails(slotProps.data)"
                        icon="pi pi-info-circle"
                    />
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
                     <p class="text-xs text-gray-500 mb-1">Total Supply</p>
                     <p class="font-bold text-lg">{{ selectedAsset.totalSupply }}</p>
                 </div>
                 <div class="p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
                     <p class="text-xs text-gray-500 mb-1">Total Borrow</p>
                     <p class="font-bold text-lg">{{ selectedAsset.totalBorrowed }}</p>
                 </div>
                 <div class="p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
                     <p class="text-xs text-gray-500 mb-1">Supply APY</p>
                     <p class="font-bold text-green-500">{{ selectedAsset.supplyAPY }}</p>
                 </div>
                 <div class="p-3 border border-gray-100 dark:border-gray-700 rounded-lg">
                     <p class="text-xs text-gray-500 mb-1">Borrow APY</p>
                     <p class="font-bold text-purple-500">{{ selectedAsset.borrowAPY }}</p>
                 </div>
             </div>

             <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                 <h4 class="font-bold mb-2">Protocol Stats (Mock)</h4>
                 <div class="flex justify-between text-sm py-1">
                     <span class="text-gray-500">Utilization Rate</span>
                     <span class="font-mono">74.5%</span>
                 </div>
                 <div class="flex justify-between text-sm py-1">
                     <span class="text-gray-500">Liquidation Threshold</span>
                     <span class="font-mono">82.5%</span>
                 </div>
                 <div class="flex justify-between text-sm py-1">
                     <span class="text-gray-500">Reserve Factor</span>
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
