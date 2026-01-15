<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useWeb3 } from '../composables/useWeb3';
import { lendingService } from '../services/lendingService';
import Sidebar from '../components/Sidebar.vue';
import { useToast } from 'primevue/usetoast';

const { signer, isConnected } = useWeb3();
const toast = useToast();
const borrowers = ref<any[]>([]);
const isLoading = ref(true);
const processingMap = ref<Record<string, boolean>>({});

const fetchBorrowers = async () => {
    if (!signer.value) return;
    
    isLoading.value = true;
    const res = await lendingService.getBorrowersData(signer.value);
    
    if (res.success) {
        borrowers.value = res.data;
    } else {
        console.error(res.error);
        toast.add({ severity: 'error', summary: 'Fetch Error', detail: 'Failed to load borrowers data' });
    }
    isLoading.value = false;
};

const handleLiquidate = async (borrowerAddress: string) => {
    if (processingMap.value[borrowerAddress]) return;
    
    processingMap.value[borrowerAddress] = true;
    toast.add({ severity: 'info', summary: 'Processing', detail: 'Liquidation in progress...', life: 2000 });

    const res = await lendingService.liquidateUser(signer.value, borrowerAddress);
    
    if (res.success) {
        toast.add({ severity: 'success', summary: 'Success', detail: 'User liquidated successfully!' });
        await fetchBorrowers(); // Refresh list
    } else {
        toast.add({ severity: 'error', summary: 'Liquidation Failed', detail: res.error });
    }
    
    processingMap.value[borrowerAddress] = false;
};

// Lifecycle
onMounted(() => {
    if (isConnected.value && signer.value) {
        fetchBorrowers();
    }
});

watch(isConnected, (newVal) => {
    if (newVal && signer.value) fetchBorrowers();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-sans flex">
    
    <!-- Sidebar Navigation -->
    <Sidebar />

    <main class="flex-grow p-8 overflow-y-auto w-full">
      <header class="mb-8">
        <h1 class="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
          Liquidation Dashboard
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-2">
            Monitor and liquidate unhealthy positions. Hunt for liquidation bonuses!
        </p>
      </header>

      <!-- Loading State -->
      <div v-if="isLoading && borrowers.length === 0" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="borrowers.length === 0" class="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-sm">
          <p class="text-xl text-gray-500">No active borrowers found.</p>
      </div>

      <!-- Borrowers Table -->
      <div v-else class="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700 text-gray-400 uppercase text-xs tracking-wider">
                    <th class="p-4 font-medium">Wallet Address</th>
                    <th class="p-4 font-medium">Total Borrowed (Mock)</th>
                    <th class="p-4 font-medium">Total Collateral (ETH)</th>
                    <th class="p-4 font-medium">Health Factor</th>
                    <th class="p-4 font-medium text-right">Action</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr v-for="user in borrowers" :key="user.address" 
                    class="transition-colors duration-200"
                    :class="{ 'bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20': parseFloat(user.healthFactor) < 1.1, 'hover:bg-gray-50 dark:hover:bg-gray-700/50': parseFloat(user.healthFactor) >= 1.1 }"
                >
                    <td class="p-4 font-mono text-sm text-gray-600 dark:text-gray-300">
                        {{ user.address }}
                    </td>
                    <td class="p-4 font-semibold">
                        {{ parseFloat(user.loans).toFixed(4) }}
                    </td>
                    <td class="p-4 text-gray-600 dark:text-gray-300">
                        {{ parseFloat(user.deposits).toFixed(4) }}
                    </td>
                    <td class="p-4">
                        <span class="px-3 py-1 rounded-full text-xs font-bold"
                            :class="{
                                'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400': parseFloat(user.healthFactor) < 1.1,
                                'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400': parseFloat(user.healthFactor) >= 1.1
                            }"
                        >
                            {{ parseFloat(user.healthFactor).toFixed(2) }}
                        </span>
                    </td>
                    <td class="p-4 text-right">
                        <button 
                            v-if="parseFloat(user.healthFactor) < 1.1"
                            @click="handleLiquidate(user.address)"
                            :disabled="processingMap[user.address]"
                            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            <span v-if="processingMap[user.address]" class="flex items-center gap-2">
                                <svg class="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing
                            </span>
                            <span v-else>Liquidate Now</span>
                        </button>
                        <span v-else class="text-xs text-gray-400 italic">Safe</span>
                    </td>
                </tr>
            </tbody>
        </table>
      </div>
    </main>
  </div>
</template>
