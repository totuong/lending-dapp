<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import Sidebar from '../components/Sidebar.vue';
import TVLChart from '../components/market/TVLChart.vue';
import DistributionChart from '../components/market/DistributionChart.vue';
import TableModel from '../components/market/TableModel.vue';
import { useWeb3 } from '../composables/useWeb3';
import { lendingService } from '../services/lendingService';
import { useToast } from 'primevue/usetoast';

const isLoading = ref(true);

onMounted(async () => {
    // Simulate data fetching for visual feedback
    await new Promise(resolve => setTimeout(resolve, 500));
    isLoading.value = false;
    await fetchPrice();
});

// Price Admin Logic
const { signer } = useWeb3();
const toast = useToast();
const currentEthPrice = ref('0');
const newEthPrice = ref<number | null>(null);
const isUpdating = ref(false);

const fetchPrice = async () => {
    if (signer.value) {
        const res = await lendingService.getETHPrice(signer.value);
        if (res.success && res.data) {
            currentEthPrice.value = res.data;
        }
    }
};

const handleUpdatePrice = async () => {
    if (!newEthPrice.value || !signer.value) return;
    isUpdating.value = true;
    
    // Check if user is owner (optional check, contract enforces it anyway)
    // For better UX we could check address but let's rely on contract revert.
    
    const res = await lendingService.updateETHPrice(signer.value, String(newEthPrice.value));
    
    isUpdating.value = false;
    if (res.success) {
        toast.add({ severity: 'success', summary:'Price Updated', detail: `ETH Price updated to ${newEthPrice.value}`, life: 3000 });
        newEthPrice.value = null;
        await fetchPrice();
    } else {
        toast.add({ severity: 'error', summary: 'Update Failed', detail: res.error, life: 5000 });
    }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-sans flex">
    
    <Sidebar />

    <main class="flex-grow p-8 overflow-y-auto w-full">
      <h1 class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-8">
        Lending Market
      </h1>

      <!-- Charts Section -->
      <div v-if="!isLoading" class="grid lg:grid-cols-2 gap-8 mb-8 animate-fade-in">
          <TVLChart />
          <DistributionChart />
      </div>

      <!-- Admin Price Oracle -->
      <div v-if="!isLoading" class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
             <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                 <Icon icon="mdi:tag-multiple" class="text-orange-500" />
                 Price Oracle (Admin)
             </h3>
             <div class="flex flex-col md:flex-row gap-6 items-end">
                 <div class="flex-1">
                     <p class="text-gray-500 dark:text-gray-400 mb-1 text-sm">Current ETH Price</p>
                     <p class="text-2xl font-mono font-bold">{{ currentEthPrice }} MCK/ETH</p>
                 </div>
                 <div class="flex-1 w-full">
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Price</label>
                      <div class="flex gap-2">
                          <InputNumber v-model="newEthPrice" placeholder="Enter new price" class="flex-1" inputClass="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors" />
                          <Button label="Update" @click="handleUpdatePrice" :loading="isUpdating" class="!bg-orange-500 hover:!bg-orange-600 !border-none !text-white !font-bold !py-2 !px-6 !rounded-lg !shadow-md hover:!shadow-lg transition-all" />
                      </div>
                 </div>
             </div>
      </div>
      <div v-else class="grid lg:grid-cols-2 gap-8 mb-8">
          <!-- Skeletons for Charts -->
          <Skeleton height="300px" borderRadius="16px" class="!bg-gray-200 dark:!bg-gray-700" />
          <Skeleton height="300px" borderRadius="16px" class="!bg-gray-200 dark:!bg-gray-700" />
      </div>
      
      <!-- Market Table -->
      <TableModel />
    </main>
  </div>
</template>
