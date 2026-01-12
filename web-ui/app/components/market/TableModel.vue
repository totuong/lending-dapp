<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@iconify/vue';

// Define assets data directly here or accept via props. 
// For this refactor, keeping it self-contained as it was in market.vue mostly.
// In a real app, this might come from a store or API prop.
const assets = ref([
  {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: 'mdi:ethereum',
    color: 'text-blue-600 dark:text-blue-400',
    totalSupply: '10.2M',
    supplyAPY: '4.0%',
    totalBorrowed: '4.1M',
    borrowAPY: '3.8%',
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    icon: 'mdi:dollar',
    color: 'text-green-600 dark:text-green-400',
    totalSupply: '105.4M',
    supplyAPY: '3.5%',
    totalBorrowed: '80.1M',
    borrowAPY: '4.2%',
  },
  {
    symbol: 'TOK',
    name: 'Mock Token',
    icon: 'mdi:circle-multiple-outline',
    color: 'text-purple-600 dark:text-purple-400',
    totalSupply: '50.5M',
    supplyAPY: '4.0%',
    totalBorrowed: '35.2M',
    borrowAPY: '5.5%',
  },
]);

// --- Dialog Logic ---
const visible = ref(false);
const selectedAsset = ref<any>(null);

const openDetails = (asset: any) => {
  selectedAsset.value = asset;
  visible.value = true;
};
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm dark:shadow-none">
    <DataTable :value="assets" selectionMode="single" @rowSelect="(e: any) => openDetails(e.data)" dataKey="symbol"
        tableStyle="min-width: 50rem"
        :rowClass="() => 'hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer'"
    >
        <Column header="Asset">
            <template #body="slotProps">
                <div class="flex items-center gap-3">
                    <Icon :icon="slotProps.data.icon" class="w-8 h-8" :class="slotProps.data.color" />
                    <div>
                        <div class="font-bold text-gray-900 dark:text-white">{{ slotProps.data.name }}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">{{ slotProps.data.symbol }}</div>
                    </div>
                </div>
            </template>
        </Column>
        <Column field="totalSupply" header="Total Supplied" class="text-gray-600 dark:text-gray-300"></Column>
        <Column field="supplyAPY" header="Supply APY" class="text-green-500 dark:text-green-400 font-bold"></Column>
        <Column field="totalBorrowed" header="Total Borrowed" class="text-gray-600 dark:text-gray-300"></Column>
        <Column field="borrowAPY" header="Borrow APY" class="text-purple-500 dark:text-purple-400 font-bold"></Column>
        <Column header="Action">
            <template #body="slotProps">
                <Button 
                    label="Details" 
                    icon="pi pi-info-circle" 
                    size="small" 
                    class="!bg-gradient-to-r !from-blue-500 !to-cyan-500 hover:!from-blue-600 hover:!to-cyan-600 !text-white !border-none !rounded-lg !px-4 !py-1.5 !shadow-sm hover:!shadow-md transition-all font-semibold"
                    @click.stop="openDetails(slotProps.data)"
                />
            </template>
        </Column>
    </DataTable>
  </div>

  <Dialog v-model:visible="visible" modal :header="selectedAsset?.name + ' Details'" :style="{ width: '30rem' }">
      <div v-if="selectedAsset" class="space-y-4">
          <div class="flex items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Icon :icon="selectedAsset.icon" class="w-12 h-12" :class="selectedAsset.color" />
              <div>
                  <p class="text-2xl font-bold">{{ selectedAsset.name }}</p>
                  <p class="text-gray-500">{{ selectedAsset.symbol }}</p>
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
      </div>
  </Dialog>
</template>
