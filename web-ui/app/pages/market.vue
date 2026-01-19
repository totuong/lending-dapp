<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Icon } from '@iconify/vue';
import Sidebar from '../components/Sidebar.vue';
import TVLChart from '../components/market/TVLChart.vue';
import DistributionChart from '../components/market/DistributionChart.vue';
import TableModel from '../components/market/TableModel.vue';
import { useWeb3 } from '../composables/useWeb3';
import { lendingService } from '../services/lendingService';
import { useToast } from 'primevue/usetoast';
import { useLanguage } from '../composables/useLanguage';

const { t } = useLanguage();
const isLoading = ref(true);

onMounted(async () => {
    // Simulate data fetching for visual feedback
    await new Promise(resolve => setTimeout(resolve, 500));
    isLoading.value = false;
    await fetchPrice();
});

// Price Admin Logic
const { signer, isAdmin } = useWeb3();
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

    const res = await lendingService.updateETHPrice(signer.value, String(newEthPrice.value));

    isUpdating.value = false;
    if (res.success) {
        toast.add({ severity: 'success', summary: 'Price Updated', detail: `ETH Price updated to ${newEthPrice.value}`, life: 3000 });
        newEthPrice.value = null;
        await fetchPrice();
    } else {
        toast.add({ severity: 'error', summary: 'Update Failed', detail: res.error, life: 5000 });
    }
};

// --- Interest Rate Admin Logic ---
const newBaseRate = ref<number | null>(5); // Default 5%
const newMultiplier = ref<number | null>(20); // Default 20%
const isUpdatingRates = ref(false);

const SECONDS_PER_YEAR = 31536000;
const WAD = 1e18;

// Convert APY % (e.g., 5 for 5%) to Per-Second Rate (scaled 1e18)
const apyToPerSecond = (apyPercent: number) => {
    // Formula approximation: RatePerSec = (APY / 100) / SecondsPerYear
    // Only simple interest approx for small rates.
    // For APY 5%: 0.05 / 31536000
    // Scaled: (APY * 1e18) / (100 * 31536000)

    // Using BigInt for precision
    // Rate = (Percent * 1e18) / (100 * 31536000)
    const numerator = BigInt(apyPercent) * BigInt(WAD);
    const denominator = 100n * BigInt(SECONDS_PER_YEAR);
    return (numerator / denominator).toString();
};

const handleUpdateRates = async () => {
    if (newBaseRate.value === null || newMultiplier.value === null || !signer.value) return;

    isUpdatingRates.value = true;

    const baseRateStr = apyToPerSecond(newBaseRate.value);
    const multiplierStr = apyToPerSecond(newMultiplier.value);

    console.log(`Updating Rates: Base=${newBaseRate.value}% (${baseRateStr}), Multi=${newMultiplier.value}% (${multiplierStr})`);

    const res = await lendingService.setInterestParameters(signer.value, baseRateStr, multiplierStr);

    isUpdatingRates.value = false;
    if (res.success) {
        toast.add({ severity: 'success', summary: 'Rates Updated', detail: 'Interest Rate Parameters updated successfully.', life: 3000 });
    } else {
        toast.add({ severity: 'error', summary: 'Update Failed', detail: res.error, life: 5000 });
    }
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-sans flex">

        <Sidebar />

        <main class="flex-grow p-8 overflow-y-auto w-full">
            <h1
                class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-8">
                {{ t.sidebar.market }}
            </h1>

            <!-- Charts Section -->
            <div v-if="!isLoading" class="grid lg:grid-cols-2 gap-8 mb-8 animate-fade-in">
                <TVLChart />
                <DistributionChart />
            </div>
            <div v-else class="grid lg:grid-cols-2 gap-8 mb-8">
                <!-- Skeletons for Charts -->
                <Skeleton height="360px" borderRadius="16px" class="!bg-gray-200 dark:!bg-gray-700" />
                <Skeleton height="360px" borderRadius="16px" class="!bg-gray-200 dark:!bg-gray-700" />
            </div>

            <!-- Market Table -->
            <TableModel />
        </main>
    </div>
</template>
