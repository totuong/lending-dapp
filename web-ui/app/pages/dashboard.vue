<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import Sidebar from '../components/Sidebar.vue';
import DashboardHeader from '../components/DashboardHeader.vue';
import { useWeb3 } from '../composables/useWeb3';
import { lendingService } from '../services/lendingService';

const { disconnect, account, isConnected } = useWeb3();

const depositAmount = ref<number | null>(null);
const borrowAmount = ref<number | null>(null);
const userBalance = ref('0');
const isLoading = ref(false);
const statusMessage = ref('');
const isDataLoading = ref(true);

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
    name: 'USDT',
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
  if (isConnected.value) {
    const res = await lendingService.getUserBalance();
    if (res.success) {
      userBalance.value = res.data;
    }
    // Simulate loading delay for skeleton
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  isDataLoading.value = false;
};

const handleDeposit = async () => {
  if (!depositAmount.value) return;
  isLoading.value = true;
  statusMessage.value = 'Depositing...';
  
  const res = await lendingService.depositETH(String(depositAmount.value));
  
  isLoading.value = false;
  if (res.success) {
    statusMessage.value = 'Deposit Successful!';
    depositAmount.value = 0;
    await fetchBalance();
  } else {
    statusMessage.value = 'Error: ' + res.error;
  }
};

const handleBorrow = async () => {
  if (!borrowAmount.value) return;
  isLoading.value = true;
  statusMessage.value = 'Borrowing...';
  
  const res = await lendingService.borrowToken(String(borrowAmount.value));
  
  isLoading.value = false;
  if (res.success) {
    statusMessage.value = 'Borrow Successful!';
    borrowAmount.value = 0;
  } else {
    statusMessage.value = 'Error: ' + res.error;
  }
};

onMounted(() => {
    fetchBalance();
});

</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-sans flex">
    
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <main class="flex-grow p-8 overflow-y-auto">
      
      <!-- Top Bar (Mobile Menu + Title) -->
      <DashboardHeader :healthFactor="healthFactor" />

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
             <p class="text-gray-500 dark:text-gray-400 text-sm mb-1">Net Worth</p>
            <div v-if="isDataLoading" class="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <p v-else class="text-3xl font-bold text-gray-900 dark:text-white">$4,250.00</p>
         </div>
         <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
            <p class="text-gray-500 dark:text-gray-400 text-sm mb-1">Total Supply</p>
             <div v-if="isDataLoading" class="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <p v-else class="text-3xl font-bold text-green-500 dark:text-green-400">$3,000.00</p>
         </div>
         <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
            <p class="text-gray-500 dark:text-gray-400 text-sm mb-1">Total Borrow</p>
             <div v-if="isDataLoading" class="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <p v-else class="text-3xl font-bold text-purple-500 dark:text-purple-400">$1,250.00</p>
         </div>
      </div>

      <!-- Main Actions Area -->
      <div class="grid lg:grid-cols-2 gap-8 mb-8">
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
                 <div v-if="isDataLoading" class="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
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
                     <Button label="MAX" size="small" severity="secondary" text class="!text-xs !bg-gray-700 !text-gray-300 hover:!bg-gray-600" />
                  </div>
             </div>
             
             <Button 
                @click="handleDeposit"
                :disabled="isLoading || !depositAmount"
                :loading="isLoading"
                label="Supply ETH"
                icon="pi pi-check"
                class="w-full !bg-gradient-to-r !from-green-600 !to-emerald-600 hover:!from-green-500 hover:!to-emerald-500 !border-none"
             />
          </div>

          <!-- Borrow Section -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
             <h3 class="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
               <Icon icon="mdi:hand-coin" class="text-purple-500 dark:text-purple-400" />
               Borrow Assets
             </h3>
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
                   <span class="font-bold text-gray-900 dark:text-white">USDT</span>
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

             <Button 
                @click="handleBorrow"
                :disabled="isLoading || !borrowAmount"
                :loading="isLoading"
                label="Borrow Token"
                icon="pi pi-briefcase"
                class="w-full !bg-gradient-to-r !from-purple-600 !to-indigo-600 hover:!from-purple-500 hover:!to-indigo-500 !border-none"
             />
          </div>
      </div>
      
      <!-- Markets Table -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm dark:shadow-none">
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
                <template #body>
                    <Button label="Details" size="small" severity="secondary" 
                        class="bg-gray-200 dark:bg-gray-700 hover:bg-blue-600 text-gray-900 dark:text-white dark:hover:text-white border-none py-1.5" 
                    />
                </template>
             </Column>
          </DataTable>
        </div>
      </div>

    </main>
  </div>
</template>
