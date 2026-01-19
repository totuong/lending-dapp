<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useWeb3 } from '../composables/useWeb3';
import { lendingService } from '../services/lendingService';
import Sidebar from '../components/Sidebar.vue';
import { useToast } from 'primevue/usetoast';
import { Icon } from '@iconify/vue';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';

const { signer, isConnected, isAdmin } = useWeb3();
const toast = useToast();
const borrowers = ref<any[]>([]);
const isLoading = ref(true);
const processingMap = ref<Record<string, boolean>>({});

// --- Price Admin Logic ---
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

const fetchBorrowers = async () => {
    if (!signer.value) return;

    isLoading.value = true;
    const res = await lendingService.getBorrowersData(signer.value);

    if (res.success) {
        borrowers.value = res.data || [];
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
        fetchPrice();
    }
});

watch(isConnected, (newVal) => {
    if (newVal && signer.value) {
        fetchBorrowers();
        fetchPrice();
    }
});
</script>

<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-sans flex">

        <!-- Sidebar Navigation -->
        <Sidebar />

        <main class="flex-grow p-8 overflow-y-auto w-full">
            <!-- Admin Content -->
            <div v-if="isAdmin">
                <header class="mb-8">
                    <h1
                        class="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
                        Liquidation Dashboard
                    </h1>
                    <p class="text-gray-500 dark:text-gray-400 mt-2">
                        Monitor and liquidate unhealthy positions. Hunt for liquidation bonuses!
                    </p>
                </header>

                <!-- Admin Configuration Panel -->
                <div class="grid lg:grid-cols-2 gap-8 mb-8">
                    <!-- Price Oracle -->
                    <div
                        class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                            <Icon icon="mdi:tag-multiple" class="text-orange-500" />
                            Price Oracle
                        </h3>
                        <div class="flex flex-col gap-4">
                            <div>
                                <p class="text-gray-500 dark:text-gray-400 mb-1 text-sm">Current ETH Price</p>
                                <p class="text-2xl font-mono font-bold">{{ currentEthPrice }} MCK/ETH</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Price
                                    (MCK)</label>
                                <div class="flex gap-2">
                                    <InputNumber v-model="newEthPrice" placeholder="Price" class="flex-1"
                                        inputClass="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors" />
                                    <Button label="Update" @click="handleUpdatePrice" :loading="isUpdating"
                                        class="!bg-orange-500 hover:!bg-orange-600 !border-none !text-white !font-bold !py-2 !px-4 !rounded-lg !shadow-md hover:!shadow-lg transition-all" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Interest Rate Config -->
                    <div
                        class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                            <Icon icon="mdi:chart-bell-curve-cumulative" class="text-purple-500" />
                            Interest Rate Config
                        </h3>
                        <div class="flex flex-col gap-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Base
                                        Rate % (APY)</label>
                                    <InputNumber v-model="newBaseRate" :min="0" :max="100" suffix="%"
                                        inputClass="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-colors" />
                                </div>
                                <div>
                                    <label
                                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Multiplier
                                        % (Slope)</label>
                                    <InputNumber v-model="newMultiplier" :min="0" :max="1000" suffix="%"
                                        inputClass="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-colors" />
                                </div>
                            </div>

                            <div class="pt-2">
                                <Button label="Update Rates" @click="handleUpdateRates" :loading="isUpdatingRates"
                                    class="w-full !bg-purple-600 hover:!bg-purple-700 !border-none !text-white !font-bold !py-2 !px-6 !rounded-lg !shadow-md hover:!shadow-lg transition-all" />
                                <p class="text-xs text-gray-400 mt-2 text-center">
                                    Note: Updates apply immediately to global index accrual.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Loading State -->
                <div v-if="isLoading && borrowers.length === 0" class="flex justify-center items-center h-64">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                </div>

                <!-- Empty State -->
                <div v-else-if="borrowers.length === 0"
                    class="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-sm">
                    <p class="text-xl text-gray-500">No active borrowers found.</p>
                </div>

                <!-- Borrowers Table -->
                <div v-else
                    class="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr
                                class="border-b border-gray-200 dark:border-gray-700 text-gray-400 uppercase text-xs tracking-wider">
                                <th class="p-4 font-medium">Wallet Address</th>
                                <th class="p-4 font-medium">Total Borrowed (Mock)</th>
                                <th class="p-4 font-medium">Total Collateral (ETH)</th>
                                <th class="p-4 font-medium">Health Factor</th>
                                <th class="p-4 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                            <tr v-for="user in borrowers" :key="user.address" class="transition-colors duration-200"
                                :class="{ 'bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20': parseFloat(user.healthFactor) < 1.1, 'hover:bg-gray-50 dark:hover:bg-gray-700/50': parseFloat(user.healthFactor) >= 1.1 }">
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
                                    <span class="px-3 py-1 rounded-full text-xs font-bold" :class="{
                                        'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400': parseFloat(user.healthFactor) < 1.1,
                                        'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400': parseFloat(user.healthFactor) >= 1.1
                                    }">
                                        {{ parseFloat(user.healthFactor).toFixed(2) }}
                                    </span>
                                </td>
                                <td class="p-4 text-right">
                                    <button v-if="parseFloat(user.healthFactor) < 1.1"
                                        @click="handleLiquidate(user.address)" :disabled="processingMap[user.address]"
                                        class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                                        <span v-if="processingMap[user.address]" class="flex items-center gap-2">
                                            <svg class="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                                    stroke-width="4"></circle>
                                                <path class="opacity-75" fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                                </path>
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
            </div>

            <!-- Unauthorized State -->
            <div v-else class="h-full flex flex-col items-center justify-center text-center p-8">
                <div class="bg-red-100 dark:bg-red-900/20 p-6 rounded-full mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 text-red-500" width="24" height="24"
                        viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round"
                        stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                        <path d="M5 11m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z">
                        </path>
                        <path d="M12 16m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
                        <path d="M8 11v-4a4 4 0 0 1 8 0v4"></path>
                    </svg>
                </div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
                <p class="text-gray-500 dark:text-gray-400 max-w-md">
                    Only administrators can access the Liquidation Dashboard. Please connect with an authorized wallet
                    to proceed.
                </p>
            </div>
        </main>
    </div>
</template>
