<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import Sidebar from '../components/Sidebar.vue';

// Mock Data
const assets = ref([
  {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: 'mdi:ethereum',
    color: 'text-blue-400',
    totalSupply: '10.2M',
    supplyAPY: '4.0%',
    totalBorrowed: '4.1M',
    borrowAPY: '6.0%',
    address: '0x0000000000000000000000000000000000000000' // Native
  },
  {
    symbol: 'TOK',
    name: 'Mock Token',
    icon: 'mdi:circle-multiple-outline',
    color: 'text-purple-400',
    totalSupply: '50.5M',
    supplyAPY: '4.0%',
    totalBorrowed: '35.2M',
    borrowAPY: '6.0%',
    address: import.meta.env.VITE_TOKEN_ADDRESS || '0x...'
  }
]);

const handleDetails = (asset: any) => {
  console.log('View details for', asset.symbol);
  // Future: Navigate to detail page or open modal
};
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white font-sans flex">
    
    <Sidebar />

    <main class="flex-grow p-8 overflow-y-auto">
      <h1 class="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-8">
        Lending Market
      </h1>

      <div class="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
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
               <tr 
                 v-for="asset in assets" 
                 :key="asset.symbol"
                 class="hover:bg-gray-700/30 transition-colors group cursor-pointer"
               >
                  <td class="p-4 flex items-center gap-3">
                     <Icon :icon="asset.icon" class="w-8 h-8" :class="asset.color" />
                     <div>
                       <div class="font-bold">{{ asset.name }}</div>
                       <div class="text-xs text-gray-500">{{ asset.symbol }}</div>
                     </div>
                  </td>
                  <td class="p-4 text-gray-300">{{ asset.totalSupply }}</td>
                  <td class="p-4 text-green-400 font-bold">{{ asset.supplyAPY }}</td>
                  <td class="p-4 text-gray-300">{{ asset.totalBorrowed }}</td>
                  <td class="p-4 text-purple-400 font-bold">{{ asset.borrowAPY }}</td>
                  <td class="p-4">
                     <button 
                      @click.stop="handleDetails(asset)"
                      class="bg-gray-700 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1"
                     >
                       <Icon icon="mdi:information-outline" class="w-4 h-4" />
                       Details
                     </button>
                  </td>
               </tr>
             </tbody>
          </table>
        </div>
      </div>

    </main>
  </div>
</template>
