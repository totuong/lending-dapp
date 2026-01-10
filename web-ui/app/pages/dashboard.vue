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
  <div class="min-h-screen bg-gray-900 text-white font-sans flex">
    
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <main class="flex-grow p-8 overflow-y-auto">
      
      <!-- Top Bar (Mobile Menu + Title) -->
      <DashboardHeader :healthFactor="healthFactor" />

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <p class="text-gray-400 text-sm mb-1">Net Worth</p>
            <div v-if="isDataLoading" class="h-8 w-32 bg-gray-700 rounded animate-pulse"></div>
            <p v-else class="text-3xl font-bold text-white">$4,250.00</p>
         </div>
         <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <p class="text-gray-400 text-sm mb-1">Total Supply</p>
             <div v-if="isDataLoading" class="h-8 w-32 bg-gray-700 rounded animate-pulse"></div>
            <p v-else class="text-3xl font-bold text-green-400">$3,000.00</p>
         </div>
         <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <p class="text-gray-400 text-sm mb-1">Total Borrow</p>
             <div v-if="isDataLoading" class="h-8 w-32 bg-gray-700 rounded animate-pulse"></div>
            <p v-else class="text-3xl font-bold text-purple-400">$1,250.00</p>
         </div>
      </div>

      <!-- Main Actions Area -->
      <div class="grid lg:grid-cols-2 gap-8 mb-8">
          <!-- Supply Section -->
          <div class="bg-gray-800 rounded-2xl p-6 border border-gray-700">
             <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
               <Icon icon="mdi:bank-transfer-in" class="text-green-400" />
               Supply Assets
             </h3>
             <div class="bg-gray-900 rounded-xl p-4 mb-4">
               <div class="flex justify-between mb-2">
                 <span class="text-gray-400">Asset</span>
                 <span class="text-gray-400">Balance</span>
               </div>
               <div class="flex justify-between items-center">
                 <div class="flex items-center gap-2">
                   <div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                     <Icon icon="mdi:ethereum" />
                   </div>
                   <span class="font-bold">ETH</span>
                 </div>
                 <div v-if="isDataLoading" class="h-6 w-20 bg-gray-700 rounded animate-pulse"></div>
                 <span v-else class="font-mono">{{ userBalance }}</span>
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
                    inputClass="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-green-500 transition-colors"
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
          <div class="bg-gray-800 rounded-2xl p-6 border border-gray-700">
             <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
               <Icon icon="mdi:hand-coin" class="text-purple-400" />
               Borrow Assets
             </h3>
             <div class="bg-gray-900 rounded-xl p-4 mb-4">
               <div class="flex justify-between mb-2">
                 <span class="text-gray-400">Asset</span>
                 <span class="text-gray-400">APY / Rate</span>
               </div>
               <div class="flex justify-between items-center">
                 <div class="flex items-center gap-2">
                   <div class="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                     <Icon icon="mdi:cash" />
                   </div>
                   <span class="font-bold">USDT</span>
                 </div>
                 <span class="text-purple-400 font-bold">3.5%</span>
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
                    inputClass="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-purple-500 transition-colors"
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
      <div class="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <div class="p-6 border-b border-gray-700">
           <h3 class="text-xl font-bold">Market Overview</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
             <thead class="bg-gray-900/50 text-gray-400 text-sm uppercase">
               <tr>
                 <th class="p-4">Asset</th>
                 <th class="p-4">Total Supplied</th>
                 <th class="p-4">Supply APY</th>
                 <th class="p-4">Total Borrowed</th>
                 <th class="p-4">Borrow APY</th>
                 <th class="p-4">Action</th>
               </tr>
             </thead>
             <tbody class="divide-y divide-gray-700">
               <!-- Skeleton Rows -->
               <template v-if="isDataLoading">
                  <tr v-for="i in 3" :key="i" class="animate-pulse">
                    <td class="p-4"><div class="h-6 w-24 bg-gray-700 rounded"></div></td>
                    <td class="p-4"><div class="h-6 w-16 bg-gray-700 rounded"></div></td>
                    <td class="p-4"><div class="h-6 w-12 bg-gray-700 rounded"></div></td>
                    <td class="p-4"><div class="h-6 w-16 bg-gray-700 rounded"></div></td>
                    <td class="p-4"><div class="h-6 w-12 bg-gray-700 rounded"></div></td>
                    <td class="p-4"><div class="h-8 w-20 bg-gray-700 rounded"></div></td>
                  </tr>
               </template>

               <!-- Data Rows -->
               <template v-else>
                 <tr class="hover:bg-gray-700/30 transition-colors group">
                    <td class="p-4 flex items-center gap-3">
                       <Icon icon="mdi:ethereum" class="w-6 h-6 text-blue-400" />
                       <span class="font-bold">Ethereum</span>
                    </td>
                    <td class="p-4 text-gray-300">$10.2M</td>
                    <td class="p-4 text-green-400 font-bold">2.5%</td>
                    <td class="p-4 text-gray-300">$4.1M</td>
                    <td class="p-4 text-purple-400 font-bold">3.8%</td>
                    <td class="p-4">
                       <button class="bg-gray-700 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm transition-colors">Details</button>
                    </td>
                 </tr>
                 <tr class="hover:bg-gray-700/30 transition-colors group">
                    <td class="p-4 flex items-center gap-3">
                       <Icon icon="mdi:circle-multiple-outline" class="w-6 h-6 text-purple-400" />
                       <span class="font-bold">USDT</span>
                    </td>
                    <td class="p-4 text-gray-300">$50.5M</td>
                    <td class="p-4 text-green-400 font-bold">4.2%</td>
                    <td class="p-4 text-gray-300">$35.2M</td>
                    <td class="p-4 text-purple-400 font-bold">5.5%</td>
                    <td class="p-4">
                       <button class="bg-gray-700 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm transition-colors">Details</button>
                    </td>
                 </tr>
               </template>
             </tbody>
          </table>
        </div>
      </div>

    </main>
  </div>
</template>
