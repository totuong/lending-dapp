<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Icon } from '@iconify/vue';
import Sidebar from '../components/Sidebar.vue';
import { useWeb3 } from '../composables/useWeb3';
import { lendingService } from '../services/lendingService';
import { useToast } from 'primevue/usetoast';
import { useLanguage } from '../composables/useLanguage';

const { t } = useLanguage();
const toast = useToast();

const { account, isConnected, signer } = useWeb3();

// Data Refs
const totalSupplied = ref(0);
const totalBorrowed = ref(0);
const healthFactor = ref(2.0); // Default to safe

const supplies = ref<any[]>([]);
const borrows = ref<any[]>([]);
const isLoading = ref(true);

const fetchUserAssets = async () => {
    if (!isConnected.value || !signer.value) {
        isLoading.value = false;
        return;
    }

    try {
        const supplyRes = await lendingService.getUserBalance(signer.value);
        const borrowRes = await lendingService.getUserBorrowBalance(signer.value);

        // --- 1. Process Supply Data ("ETH") ---
        const ethBalance = supplyRes.success && supplyRes.data ? parseFloat(supplyRes.data) : 0;

        if (ethBalance > 0) {
            supplies.value = [{
                symbol: 'ETH',
                name: 'Ethereum',
                icon: 'mdi:ethereum',
                balance: ethBalance.toFixed(4), // Display 4 decimals
                apy: '2.5%', // Mock APY for now
                isCollateral: true,
                rawBalance: ethBalance
            }];
        } else {
            supplies.value = [];
        }

        // --- 2. Process Borrow Data ("Mock Token") ---
        const tokenDebt = borrowRes.success && borrowRes.data ? parseFloat(borrowRes.data) : 0;

        if (tokenDebt > 0) {
            borrows.value = [{
                symbol: 'MOK',
                name: 'Mock Token',
                icon: 'mdi:circle-multiple-outline',
                debt: tokenDebt.toFixed(2),
                apy: '5.5%', // Mock APY
                rawBalance: tokenDebt
            }];
        } else {
            borrows.value = [];
        }

        // --- 3. Calculate Totals (Assuming 1 ETH = $2000, 1 MOK = $1) ---
        // Contract logic uses 2000 MockTokens = 1 ETH. 
        // If we assume MockToken is $1, then ETH is $2000.
        let ethPrice = 2000;
        const priceRes = await lendingService.getETHPrice(signer.value);
        if (priceRes.success && priceRes.data) {
            ethPrice = Number(priceRes.data);
        }
        const tokenPrice = 1;

        totalSupplied.value = parseFloat((ethBalance * ethPrice).toFixed(2));
        totalBorrowed.value = parseFloat((tokenDebt * tokenPrice).toFixed(2));

        // --- 4. Calculate Health Factor ---
        // Max Borrow = Supply * Price * 80%
        // HF = Max Borrow / Total Borrowed
        const maxBorrow = totalSupplied.value * 0.8;
        if (totalBorrowed.value > 0) {
            healthFactor.value = parseFloat((maxBorrow / totalBorrowed.value).toFixed(2));
        } else {
            healthFactor.value = 999; // Infinite/Safe
        }

    } catch (e) {
        console.error("Error fetching assets:", e);
    } finally {
        isLoading.value = false;
    }
};

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
    // Cap at 100% for display
    if (healthFactor.value > 2) return '100%';
    return Math.min(Math.max((healthFactor.value - 1) * 100, 5), 100) + '%';
});

const visibleActionDialog = ref(false);
const actionType = ref<'withdraw' | 'repay'>('withdraw');
const selectedActionAsset = ref<any>(null);
const actionAmount = ref<number | null>(null);
const isProcessing = ref(false);

const handleWithdraw = (asset: any) => {
    selectedActionAsset.value = asset;
    actionType.value = 'withdraw';
    actionAmount.value = null;
    visibleActionDialog.value = true;
};

const handleRepay = (asset: any) => {
    selectedActionAsset.value = asset;
    actionType.value = 'repay';
    actionAmount.value = null;
    visibleActionDialog.value = true;
};

const submitAction = async () => {
    if (!actionAmount.value || !signer.value || !selectedActionAsset.value) return;

    isProcessing.value = true;
    try {
        let res;
        const amountStr = String(actionAmount.value);

        if (actionType.value === 'withdraw') {
            // For now assume ETH withdraw since we only have ETH supply logic in fetchUserAssets 
            // Logic: withdrawETH(amount)
            res = await lendingService.withdrawETH(signer.value, amountStr);
        } else {
            // For now assume Token repay
            // Logic: repayToken(amount)
            res = await lendingService.repayToken(signer.value, amountStr);
        }

        if (res.success) {
            toast.add({ severity: 'success', summary: 'Success', detail: `${actionType.value === 'withdraw' ? 'Withdrawal' : 'Repayment'} successful!`, life: 3000 });
            visibleActionDialog.value = false;
            await fetchUserAssets();
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: res.error, life: 5000 });
        }
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 });
    } finally {
        isProcessing.value = false;
    }
};

onMounted(() => {
    fetchUserAssets();
});

// Watch for connection changes
watch(isConnected, (newVal) => {
    if (newVal) {
        fetchUserAssets();
    }
});
</script>

<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-sans flex">
        <Sidebar />

        <main class="flex-grow p-8 overflow-y-auto">
            <h1
                class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-8">
                {{ t.ui.myAssets.title }}
            </h1>

            <div v-if="!isConnected" class="flex flex-col items-center justify-center h-[50vh] text-center">
                <Icon icon="mdi:wallet-off" class="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
                <h2 class="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-2">{{ t.ui.myAssets.walletNotConnected
                    }}</h2>
                <p class="text-gray-500">{{ t.ui.myAssets.connectWalletMessage }}</p>
            </div>

            <div v-else>
                <!-- Top Stats -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div
                        class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 relative overflow-hidden shadow-sm dark:shadow-none">
                        <div
                            class="absolute -right-6 -top-6 w-24 h-24 bg-green-100 dark:bg-green-500/10 rounded-full blur-2xl">
                        </div>
                        <p class="text-gray-500 dark:text-gray-400 text-sm mb-2">{{ t.ui.myAssets.totalSuppliedValue }}
                        </p>
                        <p v-if="!isLoading" class="text-3xl font-bold text-green-500 dark:text-green-400">${{
                            totalSupplied }}</p>
                        <Skeleton v-else width="8rem" height="2rem" class="!bg-gray-200 dark:!bg-gray-700" />
                    </div>
                    <div
                        class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 relative overflow-hidden shadow-sm dark:shadow-none">
                        <div
                            class="absolute -right-6 -top-6 w-24 h-24 bg-red-100 dark:bg-red-500/10 rounded-full blur-2xl">
                        </div>
                        <p class="text-gray-500 dark:text-gray-400 text-sm mb-2">{{ t.ui.myAssets.totalBorrowedValue }}
                        </p>
                        <p v-if="!isLoading" class="text-3xl font-bold text-red-500 dark:text-red-400">${{ totalBorrowed
                            }}</p>
                        <Skeleton v-else width="8rem" height="2rem" class="!bg-gray-200 dark:!bg-gray-700" />
                    </div>
                </div>

                <!-- Health Factor -->
                <div
                    class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 mb-8 shadow-sm dark:shadow-none">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-gray-500 dark:text-gray-400 font-bold flex items-center gap-2">
                            <Icon icon="mdi:heart-pulse" class="text-red-500 dark:text-red-400" />
                            {{ t.ui.common.healthFactor }}
                        </span>
                        <span
                            :class="healthFactor >= 1.5 ? 'text-green-500 dark:text-green-400' : 'text-yellow-500 dark:text-yellow-400'"
                            class="font-bold text-xl">{{ healthFactor }}</span>
                    </div>
                    <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div class="h-full transition-all duration-500 rounded-full relative" :class="healthColor"
                            :style="{ width: healthPercentage }">
                            <div class="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>
                    <p class="text-xs text-gray-500 mt-2">
                        {{ t.ui.myAssets.healthFactorWarning }}
                    </p>
                </div>

                <!-- Empty State -->
                <div v-if="isEmpty"
                    class="flex flex-col items-center justify-center p-12 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 border-dashed text-center">
                    <Icon icon="mdi:package-variant-closed" class="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
                    <h3 class="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">{{ t.ui.myAssets.noAssetsFound
                        }}</h3>
                    <p class="text-gray-500 mb-6">{{ t.ui.myAssets.noAssetsMessage }}</p>
                    <Button :label="t.ui.myAssets.goToMarket" icon="pi pi-arrow-right" iconPos="right"
                        @click="navigateTo('/market')"
                        class="!bg-gradient-to-r !from-blue-600 !to-cyan-600 hover:!from-blue-500 hover:!to-cyan-500 !border-none !text-white !font-bold !py-2.5 !px-6 !rounded-xl !shadow-lg !shadow-blue-500/20 hover:!shadow-blue-500/40 transition-all duration-300 transform hover:-translate-y-0.5" />
                </div>

                <div v-else class="space-y-8">
                    <!-- Supplies Table -->
                    <div
                        class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm dark:shadow-none">
                        <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                            <Icon icon="mdi:arrow-up-circle" class="text-green-500 dark:text-green-400 w-6 h-6" />
                            <h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ t.ui.myAssets.yourSupplies }}
                            </h3>
                        </div>
                        <div class="overflow-x-auto">
                            <DataTable :value="supplies"
                                :rowClass="() => 'hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors'">
                                <Column :header="t.ui.common.asset">
                                    <template #body="slotProps">
                                        <div class="flex items-center gap-3">
                                            <Icon :icon="slotProps.data.icon"
                                                class="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                            <span class="font-bold text-gray-900 dark:text-white">{{
                                                slotProps.data.symbol }}</span>
                                        </div>
                                    </template>
                                </Column>
                                <Column field="balance" :header="t.ui.common.balance"
                                    class="font-mono text-gray-600 dark:text-gray-300"></Column>
                                <Column field="apy" :header="t.ui.common.apy"
                                    class="text-green-500 dark:text-green-400"></Column>
                                <Column :header="t.ui.myAssets.collateral">
                                    <template #body="slotProps">
                                        <span v-if="slotProps.data.isCollateral"
                                            class="text-green-600 dark:text-green-400 text-xs border border-green-200 dark:border-green-500/30 bg-green-100 dark:bg-green-500/10 px-2 py-1 rounded">{{
                                            t.ui.myAssets.enabled }}</span>
                                        <span v-else class="text-gray-500 text-xs">{{ t.ui.myAssets.disabled }}</span>
                                    </template>
                                </Column>
                                <Column :header="t.ui.myAssets.action">
                                    <template #body="slotProps">
                                        <Button :label="t.ui.myAssets.withdraw" size="small" severity="info" outlined
                                            class="!text-blue-600 dark:!text-blue-400 hover:!text-white hover:!bg-blue-600 !border-blue-200 dark:!border-blue-500/30 transition-colors"
                                            @click="handleWithdraw(slotProps.data)" />
                                    </template>
                                </Column>
                            </DataTable>
                        </div>
                    </div>

                    <!-- Borrows Table -->
                    <div
                        class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm dark:shadow-none">
                        <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                            <Icon icon="mdi:arrow-down-circle" class="text-red-500 dark:text-red-400 w-6 h-6" />
                            <h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ t.ui.myAssets.yourBorrows }}
                            </h3>
                        </div>
                        <div class="overflow-x-auto">
                            <DataTable :value="borrows"
                                :rowClass="() => 'hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors'">
                                <Column :header="t.ui.common.asset">
                                    <template #body="slotProps">
                                        <div class="flex items-center gap-3">
                                            <Icon :icon="slotProps.data.icon"
                                                class="w-8 h-8 text-purple-600 dark:text-purple-400" />
                                            <span class="font-bold text-gray-900 dark:text-white">{{
                                                slotProps.data.symbol }}</span>
                                        </div>
                                    </template>
                                </Column>
                                <Column field="debt" :header="t.ui.myAssets.debt"
                                    class="font-mono text-gray-600 dark:text-gray-300">
                                </Column>
                                <Column field="apy" :header="t.ui.common.apy"
                                    class="text-purple-500 dark:text-purple-400"></Column>
                                <Column :header="t.ui.myAssets.action">
                                    <template #body="slotProps">
                                        <Button :label="t.ui.myAssets.repay" size="small" severity="help" outlined
                                            class="!text-purple-600 dark:!text-purple-400 hover:!text-white hover:!bg-purple-600 !border-purple-200 dark:!border-purple-500/30 transition-colors"
                                            @click="handleRepay(slotProps.data)" />
                                    </template>
                                </Column>
                            </DataTable>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- Withdraw/Repay Dialog -->
        <Dialog v-model:visible="visibleActionDialog" modal
            :header="actionType === 'withdraw' ? t.ui.myAssets.withdrawAsset : t.ui.myAssets.repayDebt"
            :style="{ width: '30rem' }">
            <div v-if="selectedActionAsset" class="space-y-4">
                <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center gap-4">
                    <Icon :icon="selectedActionAsset.icon" class="w-10 h-10"
                        :class="actionType === 'withdraw' ? 'text-blue-500' : 'text-purple-500'" />
                    <div>
                        <h4 class="font-bold text-lg">{{ selectedActionAsset.name }}</h4>
                        <p class="text-sm text-gray-500">{{ selectedActionAsset.symbol }}</p>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{{
                        t.ui.myAssets.amount
                        }}</label>
                    <InputNumber v-model="actionAmount" :maxFractionDigits="18" placeholder="0.00" class="w-full"
                        inputClass="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-3" />
                    <p class="text-xs text-gray-500 mt-1 text-right">
                        {{ t.ui.myAssets.available }}: <span class="font-bold font-mono">{{ actionType === 'withdraw' ?
                            selectedActionAsset.balance
                            : selectedActionAsset.debt }}</span>
                    </p>
                </div>

                <div class="flex gap-3 pt-4">
                    <Button :label="t.ui.myAssets.cancel" outlined class="flex-1"
                        @click="visibleActionDialog = false" />
                    <Button :label="actionType === 'withdraw' ? t.ui.myAssets.withdraw : t.ui.myAssets.repay"
                        :loading="isProcessing" class="flex-1"
                        :class="actionType === 'withdraw' ? '!bg-blue-600 hover:!bg-blue-700 !border-none' : '!bg-purple-600 hover:!bg-purple-700 !border-none'"
                        @click="submitAction" :disabled="!actionAmount" />
                </div>
            </div>
        </Dialog>
    </div>
</template>
