<script setup lang="ts">
import Sidebar from '../components/Sidebar.vue';
import { Icon } from '@iconify/vue';
import { useLanguage } from '../composables/useLanguage';

const { t, lang } = useLanguage();
</script>

<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-sans flex">
        <Sidebar />

        <main class="flex-grow p-8 overflow-y-auto">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1
                    class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                    {{ t.title }}
                </h1>

                <!-- Language Toggle (Sticky) -->
                <div
                    class="fixed top-8 right-8 z-50 flex items-center bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <button @click="lang = 'vi'" class="px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                        :class="lang === 'vi' ? 'bg-blue-100 text-blue-700 dark:bg-blue-600 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'">
                        Tiếng Việt
                    </button>
                    <button @click="lang = 'en'" class="px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                        :class="lang === 'en' ? 'bg-blue-100 text-blue-700 dark:bg-blue-600 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'">
                        English
                    </button>
                </div>
            </div>

            <div class="space-y-8 max-w-4xl">

                <!-- Section 1: Getting Started -->
                <section
                    class="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
                    <h2 class="text-2xl font-bold mb-6 flex items-center gap-3 text-blue-600 dark:text-blue-400">
                        <Icon icon="mdi:rocket-launch" class="w-8 h-8" />
                        {{ t.gettingStarted.title }}
                    </h2>
                    <div class="space-y-4 text-gray-600 dark:text-gray-300">
                        <p>{{ t.gettingStarted.intro }}</p>

                        <div class=" p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 mt-4">
                            <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{
                                t.gettingStarted.connect.title }}</h3>
                            <p class="mt-1 text-sm">{{ t.gettingStarted.connect.desc }}</p>
                        </div>

                        <div class=" p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 mt-2">
                            <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ t.gettingStarted.funds.title
                                }}</h3>
                            <p class="mt-1 text-sm">{{ t.gettingStarted.funds.desc }}</p>
                        </div>
                    </div>
                </section>

                <!-- Section 2: Dashboard Features -->
                <section
                    class="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
                    <h2 class="text-2xl font-bold mb-6 flex items-center gap-3 text-green-600 dark:text-green-400">
                        <Icon icon="mdi:view-dashboard" class="w-8 h-8" />
                        {{ t.dashboard.title }}
                    </h2>
                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                                <Icon icon="mdi:bank-transfer-in" class="text-green-500" /> {{ t.dashboard.supply.title
                                }}
                            </h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t.dashboard.supply.desc }}</p>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                                <Icon icon="mdi:hand-coin" class="text-purple-500" /> {{ t.dashboard.borrow.title }}
                            </h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t.dashboard.borrow.desc }}</p>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                                <Icon icon="mdi:wallet-plus" class="text-orange-500" /> {{ t.dashboard.withdraw.title }}
                            </h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t.dashboard.withdraw.desc }}</p>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                                <Icon icon="mdi:cash-refund" class="text-pink-500" /> {{ t.dashboard.repay.title }}
                            </h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t.dashboard.repay.desc }}</p>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                                <Icon icon="mdi:finance" class="text-blue-500" /> {{ t.dashboard.netWorth.title }}
                            </h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t.dashboard.netWorth.desc }}</p>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                                <Icon icon="mdi:water" class="text-cyan-500" /> {{ t.dashboard.poolLiquidity.title }}
                            </h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t.dashboard.poolLiquidity.desc }}</p>
                        </div>
                    </div>
                </section>

                <!-- Section 3: Managing Assets & Health Factor -->
                <section
                    class="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
                    <h2 class="text-2xl font-bold mb-6 flex items-center gap-3 text-red-500 dark:text-red-400">
                        <Icon icon="mdi:heart-pulse" class="w-8 h-8" />
                        {{ t.health.title }}
                    </h2>
                    <div class="space-y-4 text-gray-600 dark:text-gray-300">
                        <div
                            class="p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-xl">
                            <p class="font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                                <Icon icon="mdi:alert" /> {{ t.health.concept }}
                            </p>
                            <p class="mt-2 text-sm text-yellow-800 dark:text-yellow-200"
                                v-html="t.health.conceptDesc" />
                        </div>

                        <ul class="list-disc pl-5 space-y-2 mt-4">
                            <li v-html="t.health.safe" />
                            <li v-html="t.health.risky" />
                            <li v-html="t.health.danger" />
                        </ul>

                        <p class="mt-4" v-html="t.health.monitor" />
                    </div>
                </section>

                <!-- Section 4: Interest Rates -->
                <section
                    class="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
                    <h2 class="text-2xl font-bold mb-6 flex items-center gap-3 text-purple-600 dark:text-purple-400">
                        <Icon icon="mdi:chart-bell-curve-cumulative" class="w-8 h-8" />
                        {{ t.interest.title }}
                    </h2>
                    <div class="space-y-4 text-gray-600 dark:text-gray-300">
                        <p v-html="t.interest.desc" />

                        <div class="grid md:grid-cols-2 gap-4 mt-4">
                            <div
                                class="p-4 bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/30 rounded-xl">
                                <p class="text-sm" v-html="t.interest.supply" />
                            </div>
                            <div
                                class="p-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/30 rounded-xl">
                                <p class="text-sm" v-html="t.interest.borrow" />
                            </div>
                        </div>

                        <p class="text-sm text-gray-500 flex items-center gap-2 mt-2">
                            <Icon icon="mdi:clock-fast" /> <span v-html="t.interest.accrual" />
                        </p>
                    </div>
                </section>

            </div>
        </main>
    </div>
</template>
