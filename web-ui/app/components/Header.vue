<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useWeb3 } from '../composables/useWeb3';

const { connectWallet, isConnected, account, disconnect, isConnecting } = useWeb3();

const handleConnect = async () => {
  await connectWallet();
};
</script>

<template>
  <header class="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10 hidden md:flex">
    <div class="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
      <Icon icon="mdi:bank" class="w-8 h-8" />
      Lending DApp
    </div>
    <div>
      <button 
        v-if="!isConnected"
        class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        @click="handleConnect"
        :disabled="isConnecting"
      >
        <template v-if="isConnecting">
          <Icon icon="eos-icons:loading" class="w-5 h-5 animate-spin" />
          Connecting...
        </template>
        <template v-else>
          <Icon icon="ph:wallet-bold" class="w-5 h-5" />
          Connect Wallet
        </template>
      </button>
      <div v-else class="flex items-center gap-4">
        <span class="text-gray-600 dark:text-gray-300 text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
          {{ account?.slice(0, 6) }}...{{ account?.slice(-4) }}
        </span>
        <button 
          @click="disconnect"
          class="text-red-400 hover:text-red-300 transition-colors"
        >
          Disconnect
        </button>
      </div>
    </div>
  </header>
  <!-- Mobile Header (Simplified for now, can be expanded) -->
  <header class="flex md:hidden justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
      <div class="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
        <Icon icon="mdi:bank" class="w-6 h-6" />
        Lending
      </div>
      <div>
         <button 
          v-if="!isConnected"
          @click="handleConnect"
          :disabled="isConnecting"
          class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <template v-if="isConnecting">
            <Icon icon="eos-icons:loading" class="w-4 h-4 animate-spin" />
            Connecting
          </template>
          <template v-else>
            <Icon icon="ph:wallet-bold" class="w-4 h-4" />
            Connect
          </template>
        </button>
        <div v-else class="flex items-center gap-2">
           <span class="text-gray-600 dark:text-gray-300 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
            {{ account?.slice(0, 4) }}...{{ account?.slice(-4) }}
          </span>
           <button 
            @click="disconnect"
            class="text-red-400 hover:text-red-300 transition-colors text-sm"
          >
            <Icon icon="mdi:logout" class="w-4 h-4" />
          </button>
        </div>
      </div>
  </header>
</template>
