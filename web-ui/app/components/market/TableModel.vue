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

const handleDetails = (asset: any) => {
  console.log('View details for', asset.symbol);
};
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm dark:shadow-none">
    <DataTable :value="assets" selectionMode="single" @rowSelect="(e) => handleDetails(e.data)" dataKey="symbol"
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
                    severity="secondary" 
                    outlined
                    class="!bg-gray-200 dark:!bg-gray-700 !border-none hover:!bg-blue-600 hover:!text-white dark:hover:!text-white !text-gray-900 dark:!text-white transition-colors"
                    @click="handleDetails(slotProps.data)"
                />
            </template>
        </Column>
    </DataTable>
  </div>
</template>
