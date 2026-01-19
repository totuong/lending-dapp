<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Icon } from '@iconify/vue';
import { useWeb3 } from '../../composables/useWeb3';
import { lendingService } from '../../services/lendingService';

const { isConnected, signer } = useWeb3();

const filters = ref({
    global: { value: null, matchMode: 'contains' },
});

// Initial Mock Data Structure
const assets = ref([
    {
        symbol: 'ETH',
        name: 'Ethereum',
        icon: 'mdi:ethereum',
        color: 'text-blue-600 dark:text-blue-400',
        totalSupply: '10.2M', // Placeholder, could fetch if needed
        supplyAPY: '3.0%', // Reflects user default preference
        totalBorrowed: '-',
        borrowAPY: '5.0%',
        // Extra details
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
    // Mock USDT with requested default rates
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
        supplyAPY: '3.5%', // Default before load
        totalBorrowed: 'Loading...',
        borrowAPY: '5.0%', // Default before load
        utilization: 0
    },
]);

const fetchMarketData = async () => {
    if (!signer.value) return;

    const res = await lendingService.getMarketDetails(signer.value);
    if (res.success && res.data) {
        const mckIndex = assets.value.findIndex(a => a.symbol === 'MCK');
        if (mckIndex !== -1 && assets.value[mckIndex]) {
            const data = res.data;
            const asset = assets.value[mckIndex];
            asset.totalSupply = formatNumber(data.totalSupply) + ' MCK';
            asset.totalBorrowed = formatNumber(data.totalBorrows) + ' MCK';
            asset.supplyAPY = data.supplyAPY.toFixed(2) + '%';
            asset.borrowAPY = data.borrowAPY.toFixed(2) + '%';
            asset.utilization = data.utilization;
        }
    }
};

const formatNumber = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(2) + 'K';
    return num.toFixed(2);
};

onMounted(() => {
    if (isConnected.value && signer.value) {
        fetchMarketData();
    }
});

watch(isConnected, (val) => {
    if (val && signer.value) fetchMarketData();
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
    <div
        class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm dark:shadow-none">
        <DataTable v-model:filters="filters" :value="assets" selectionMode="single"
            @rowSelect="(e: any) => openDetails(e.data)" dataKey="symbol" :paginator="true" :rows="5"
            :rowsPerPageOptions="[5, 10, 20]" :globalFilterFields="['name', 'symbol']" tableStyle="min-width: 50rem"
            :rowClass="() => 'hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer'">

            <template #header>
                <div class="flex justify-between items-center">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">Assets</h3>
                    <span class="relative">
                        <i class="pi pi-search absolute top-2/4 -mt-2 left-3 text-gray-400 dark:text-gray-500" />
                        <InputText v-model="filters['global'].value" placeholder="Search Asset..."
                            class="pl-10 !w-64" />
                    </span>
                </div>
            </template>

            <Column field="name" header="Asset" sortable>
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
            <Column field="totalSupply" header="Total Supplied" sortable class="text-gray-600 dark:text-gray-300">
            </Column>
            <Column field="supplyAPY" header="Supply APY" sortable class="text-green-500 dark:text-green-400 font-bold">
            </Column>
            <Column field="totalBorrowed" header="Total Borrowed" sortable class="text-gray-600 dark:text-gray-300">
            </Column>
            <Column field="borrowAPY" header="Borrow APY" sortable
                class="text-purple-500 dark:text-purple-400 font-bold">
            </Column>
            <Column header="Action">
                <template #body="slotProps">
                    <Button label="Details" icon="pi pi-info-circle" size="small"
                        class="!bg-gradient-to-r !from-blue-500 !to-cyan-500 hover:!from-blue-600 hover:!to-cyan-600 !text-white !border-none !rounded-lg !px-4 !py-1.5 !shadow-sm hover:!shadow-md transition-all font-semibold"
                        @click.stop="openDetails(slotProps.data)" />
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
                <h4 class="font-bold mb-2">Protocol Stats</h4>
                <div class="flex justify-between text-sm py-1">
                    <span class="text-gray-500">Utilization Rate</span>
                    <span class="font-mono font-bold">{{ typeof selectedAsset.utilization === 'number' ?
                        selectedAsset.utilization.toFixed(2) + '%' : '-' }}</span>
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
