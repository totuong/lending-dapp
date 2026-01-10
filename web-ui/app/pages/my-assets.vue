<script setup lang="ts">
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import Sidebar from '../components/Sidebar.vue';
import { useWeb3 } from '../composables/useWeb3';

const { account, isConnected } = useWeb3();

// Mock Data
const totalSupplied = ref(1250.00);
const totalBorrowed = ref(450.00);
const healthFactor = ref(1.8);

const supplies = ref([
  {
      symbol: 'ETH',
      name: 'Ethereum',
      icon: 'mdi:ethereum',
      balance: '1.5',
      apy: '4.0%',
      isCollateral: true
  }
]);

const borrows = ref([
  {
      symbol: 'TOK',
      name: 'Mock Token',
      icon: 'mdi:circle-multiple-outline',
      debt: '500',
      apy: '6.0%'
  }
]);

const isEmpty = computed(() => {
    return supplies.value.length === 0 && borrows.value.length === 0;
});

// Health Bar Logic
const healthColor = computed(() => {
  if (healthFactor.value >= 1.5) return 'bg-green-500';
  if (healthFactor.value >= 1.1) return 'bg-yellow-500';
  return 'bg-red-500';
});

const healthPercentage = computed(() => {
  return Math.min(Math.max((healthFactor.value - 1) * 100, 5), 100) + '%'; 
});

const handleWithdraw = (asset: any) => {
    console.log("Withdraw", asset);
}

const handleRepay = (asset: any) => {
    console.log("Repay", asset);
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white font-sans flex">
    <Sidebar />
    
    <main class="flex-grow p-8 overflow-y-auto">
      <h1 class="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-8">
        My Assets
      </h1>
      
      <div v-if="!isConnected" class="flex flex-col items-center justify-center h-[50vh] text-center">
          <Icon icon="mdi:wallet-off" class="w-16 h-16 text-gray-600 mb-4" />
          <h2 class="text-2xl font-bold text-gray-400 mb-2">Wallet Not Connected</h2>
          <p class="text-gray-500">Please connect your wallet to view your assets.</p>
      </div>

      <div v-else>
         <!-- Top Stats -->
         <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
             <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700 relative overflow-hidden">
                 <div class="absolute -right-6 -top-6 w-24 h-24 bg-green-500/10 rounded-full blur-2xl"></div>
                 <p class="text-gray-400 text-sm mb-2">Total Supplied Value</p>
                 <p class="text-3xl font-bold text-green-400">${{ totalSupplied }}</p>
             </div>
             <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700 relative overflow-hidden">
                 <div class="absolute -right-6 -top-6 w-24 h-24 bg-red-500/10 rounded-full blur-2xl"></div>
                 <p class="text-gray-400 text-sm mb-2">Total Borrowed Value</p>
                 <p class="text-3xl font-bold text-red-400">${{ totalBorrowed }}</p>
             </div>
         </div>

         <!-- Health Factor -->
         <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700 mb-8">
             <div class="flex justify-between items-center mb-2">
                 <span class="text-gray-400 font-bold flex items-center gap-2">
                     <Icon icon="mdi:heart-pulse" class="text-red-400" />
                     Health Factor
                 </span>
                 <span :class="healthFactor >= 1.5 ? 'text-green-400' : 'text-yellow-400'" class="font-bold text-xl">{{ healthFactor }}</span>
             </div>
             <div class="h-3 bg-gray-700 rounded-full overflow-hidden">
                 <div 
                    class="h-full transition-all duration-500 rounded-full relative"
                    :class="healthColor"
                    :style="{ width: healthPercentage }"
                 >
                    <div class="absolute inset-0 bg-white/20 animate-pulse"></div>
                 </div>
             </div>
             <p class="text-xs text-gray-500 mt-2">
                 Ensure your health factor stays above 1.0 to avoid liquidation.
             </p>
         </div>

         <!-- Empty State -->
         <div v-if="isEmpty" class="flex flex-col items-center justify-center p-12 bg-gray-800/50 rounded-2xl border border-gray-700/50 border-dashed text-center">
             <Icon icon="mdi:package-variant-closed" class="w-16 h-16 text-gray-600 mb-4" />
             <h3 class="text-xl font-bold text-gray-300 mb-2">No Assets Found</h3>
             <p class="text-gray-500 mb-6">You haven't supplied or borrowed any assets yet.</p>
             <NuxtLink to="/market" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                 Go to Market
             </NuxtLink>
         </div>

         <div v-else class="space-y-8">
             <!-- Supplies Table -->
             <div class="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                <div class="p-6 border-b border-gray-700 flex items-center gap-2">
                    <Icon icon="mdi:arrow-up-circle" class="text-green-400 w-6 h-6" />
                    <h3 class="text-xl font-bold">Your Supplies</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-gray-900/50 text-gray-400 text-sm uppercase">
                            <tr>
                                <th class="p-4">Asset</th>
                                <th class="p-4">Balance</th>
                                <th class="p-4">APY</th>
                                <th class="p-4">Collateral</th>
                                <th class="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-700">
                            <tr v-for="asset in supplies" :key="asset.symbol" class="hover:bg-gray-700/30 transition-colors">
                                <td class="p-4 flex items-center gap-3">
                                    <Icon :icon="asset.icon" class="w-8 h-8 text-blue-400" />
                                    <span class="font-bold">{{ asset.symbol }}</span>
                                </td>
                                <td class="p-4 font-mono">{{ asset.balance }}</td>
                                <td class="p-4 text-green-400">{{ asset.apy }}</td>
                                <td class="p-4">
                                    <span v-if="asset.isCollateral" class="text-green-400 text-xs border border-green-500/30 bg-green-500/10 px-2 py-1 rounded">Enabled</span>
                                    <span v-else class="text-gray-500 text-xs">Disabled</span>
                                </td>
                                <td class="p-4">
                                    <button @click="handleWithdraw(asset)" class="text-blue-400 hover:text-white hover:bg-blue-600 px-3 py-1 rounded transition-colors text-sm border border-blue-500/30">
                                        Withdraw
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
             </div>

             <!-- Borrows Table -->
             <div class="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                <div class="p-6 border-b border-gray-700 flex items-center gap-2">
                    <Icon icon="mdi:arrow-down-circle" class="text-red-400 w-6 h-6" />
                    <h3 class="text-xl font-bold">Your Borrows</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-gray-900/50 text-gray-400 text-sm uppercase">
                            <tr>
                                <th class="p-4">Asset</th>
                                <th class="p-4">Debt</th>
                                <th class="p-4">APY</th>
                                <th class="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-700">
                            <tr v-for="asset in borrows" :key="asset.symbol" class="hover:bg-gray-700/30 transition-colors">
                                <td class="p-4 flex items-center gap-3">
                                    <Icon :icon="asset.icon" class="w-8 h-8 text-purple-400" />
                                    <span class="font-bold">{{ asset.symbol }}</span>
                                </td>
                                <td class="p-4 font-mono">{{ asset.debt }}</td>
                                <td class="p-4 text-purple-400">{{ asset.apy }}</td>
                                <td class="p-4">
                                    <button @click="handleRepay(asset)" class="text-purple-400 hover:text-white hover:bg-purple-600 px-3 py-1 rounded transition-colors text-sm border border-purple-500/30">
                                        Repay
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
             </div>
         </div>
      </div>
    </main>
  </div>
</template>
