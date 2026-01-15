<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import { useWeb3 } from '../composables/useWeb3';
import { useTheme } from '../composables/useTheme';

const { disconnect, account } = useWeb3();
const { isDark, toggleTheme } = useTheme();
const isCollapsed = ref(false);
</script>

<template>
  <aside
    class="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:flex flex-col h-screen sticky top-0 transition-all duration-300 relative"
    :class="isCollapsed ? 'w-20' : 'w-64'">
    <!-- Toggle Button -->
    <button @click="isCollapsed = !isCollapsed"
      class="absolute -right-3 top-9 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-full p-1 shadow-lg z-50 transition-colors">
      <Icon :icon="isCollapsed ? 'mdi:chevron-right' : 'mdi:chevron-left'" class="w-4 h-4" />
    </button>

    <div
      class="p-6 border-b border-gray-200 dark:border-gray-700 overflow-hidden whitespace-nowrap flex items-center justify-between">
      <div class="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2"
        :class="{ 'justify-center': isCollapsed }">
        <Icon icon="mdi:bank" class="w-8 h-8 flex-shrink-0" />
        <span v-if="!isCollapsed" class="transition-opacity duration-300">Lending</span>
      </div>

      <!-- Dark Mode Toggle (only visible when expanded) -->
      <button v-if="!isCollapsed" @click="toggleTheme"
        class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Toggle Dark Mode">
        <Icon :icon="isDark ? 'mdi:weather-night' : 'mdi:weather-sunny'" class="w-6 h-6"
          :class="isDark ? 'text-blue-400' : 'text-yellow-500'" />
      </button>
    </div>

    <nav class="flex-grow p-4 space-y-2 overflow-x-hidden">
      <NuxtLink to="/dashboard"
        active-class="bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
        class="flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent transition-colors whitespace-nowrap text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white"
        :class="{ 'justify-center px-2': isCollapsed }">
        <Icon icon="mdi:view-dashboard" class="w-5 h-5 flex-shrink-0" />
        <span v-if="!isCollapsed">General Overview</span>
      </NuxtLink>
      <NuxtLink to="/market"
        active-class="bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
        class="flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent transition-colors whitespace-nowrap text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white"
        :class="{ 'justify-center px-2': isCollapsed }">
        <Icon icon="mdi:chart-line" class="w-5 h-5 flex-shrink-0" />
        <span v-if="!isCollapsed">Lending Market</span>
      </NuxtLink>
      <NuxtLink to="/my-assets"
        active-class="bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
        class="flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent transition-colors whitespace-nowrap text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white"
        :class="{ 'justify-center px-2': isCollapsed }">
        <Icon icon="mdi:wallet" class="w-5 h-5 flex-shrink-0" />
        <span v-if="!isCollapsed">My Assets</span>
      </NuxtLink>
      <ClientOnly>
        <NuxtLink to="/liquidation"
          active-class="bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
          class="flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent transition-colors whitespace-nowrap text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white"
          :class="{ 'justify-center px-2': isCollapsed }">
          <Icon icon="mdi:gavel" class="w-5 h-5 flex-shrink-0" />
          <span v-if="!isCollapsed">Liquidation</span>
        </NuxtLink>
      </ClientOnly>
      <NuxtLink to="/settings"
        active-class="bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
        class="flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent transition-colors whitespace-nowrap text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white"
        :class="{ 'justify-center px-2': isCollapsed }">
        <Icon icon="mdi:cog" class="w-5 h-5 flex-shrink-0" />
        <span v-if="!isCollapsed">Settings</span>
      </NuxtLink>
      <NuxtLink to="/guide"
        active-class="bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
        class="flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent transition-colors whitespace-nowrap text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white"
        :class="{ 'justify-center px-2': isCollapsed }">
        <Icon icon="mdi:book-open-page-variant" class="w-5 h-5 flex-shrink-0" />
        <span v-if="!isCollapsed">Guide</span>
      </NuxtLink>
    </nav>

    <div class="p-6 border-t border-gray-200 dark:border-gray-700 overflow-hidden whitespace-nowrap">
      <div class="flex items-center gap-3 mb-4" :class="{ 'justify-center': isCollapsed }">
        <div
          class="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold flex-shrink-0">
          {{ account?.slice(2, 4) }}
        </div>
        <div v-if="!isCollapsed" class="overflow-hidden">
          <p class="text-sm font-bold text-gray-900 dark:text-white truncate w-24" :title="account">{{ account }}</p>
          <p class="text-xs text-green-600 dark:text-green-400">Connected</p>
        </div>
      </div>
      <button @click="disconnect"
        class="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2 rounded-lg transition-all whitespace-nowrap"
        :class="{ '!px-0': isCollapsed }">
        <Icon icon="mdi:logout" class="w-4 h-4 flex-shrink-0" />
        <span v-if="!isCollapsed">Disconnect</span>
      </button>
    </div>
  </aside>
</template>
