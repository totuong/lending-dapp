<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { useWeb3 } from '../composables/useWeb3';
import { lendingService } from '../services/lendingService';

const { connectWallet, disconnect, account, isConnected } = useWeb3();

const depositAmount = ref('');
const borrowAmount = ref('');
const userBalance = ref('0');
const isLoading = ref(false);
const statusMessage = ref('');

const fetchBalance = async () => {
  if (isConnected.value) {
    const res = await lendingService.getUserBalance();
    if (res.success) {
      userBalance.value = res.data;
    }
  }
};

const handleConnect = async () => {
  await connectWallet();
  if (isConnected.value) {
    await fetchBalance();
  }
};

const handleDeposit = async () => {
  if (!depositAmount.value) return;
  isLoading.value = true;
  statusMessage.value = 'Depositing...';
  
  const res = await lendingService.depositETH(depositAmount.value);
  
  isLoading.value = false;
  if (res.success) {
    statusMessage.value = 'Deposit Successful!';
    depositAmount.value = '';
    await fetchBalance();
  } else {
    statusMessage.value = 'Error: ' + res.error;
  }
};

const handleBorrow = async () => {
  if (!borrowAmount.value) return;
  isLoading.value = true;
  statusMessage.value = 'Borrowing...';
  
  const res = await lendingService.borrowToken(borrowAmount.value);
  
  isLoading.value = false;
  if (res.success) {
    statusMessage.value = 'Borrow Successful!';
    borrowAmount.value = '';
    // Optionally fetch loans usage or token balance
  } else {
    statusMessage.value = 'Error: ' + res.error;
  }
};

// Refresh balance occasionally or on mount
onMounted(() => {
  if (isConnected.value) {
    fetchBalance();
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white font-sans">
    <!-- Header -->
    <header class="flex justify-between items-center p-6 border-b border-gray-700 bg-gray-800">
      <div class="text-2xl font-bold text-blue-400 flex items-center gap-2">
        <Icon icon="mdi:bank" class="w-8 h-8" />
        Lending DApp
      </div>
      <div>
        <button 
          v-if="!isConnected"
          @click="handleConnect"
          class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          <Icon icon="ph:wallet-bold" class="w-5 h-5" />
          Connect Wallet
        </button>
        <div v-else class="flex items-center gap-4">
          <span class="text-gray-300 text-sm bg-gray-700 px-3 py-1 rounded-full">
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

    <!-- Main Content -->
    <main class="container mx-auto p-8">
      
      <!-- Status Message -->
      <div v-if="statusMessage" class="mb-6 p-4 rounded-lg bg-gray-800 border border-gray-700 text-center">
        <p :class="statusMessage.includes('Error') ? 'text-red-400' : 'text-green-400'">
            {{ statusMessage }}
        </p>
      </div>

      <div class="grid md:grid-cols-2 gap-8">
        
        <!-- Supply Card -->
        <div class="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700 hover:border-blue-500 transition-colors">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-gray-100 flex items-center gap-2">
              <Icon icon="mdi:safe" class="text-green-400 w-6 h-6" />
              Supply
            </h2>
            <div class="text-right">
              <p class="text-xs text-gray-400 uppercase">Deposited Balance</p>
              <p class="text-xl font-mono text-green-300">{{ userBalance }} ETH</p>
            </div>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-gray-400 mb-1">Amount to Deposit (ETH)</label>
              <div class="relative">
                <input 
                  v-model="depositAmount"
                  type="number" 
                  placeholder="0.0"
                  class="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
                <span class="absolute right-4 top-3 text-gray-500">ETH</span>
              </div>
            </div>
            
            <button 
              @click="handleDeposit"
              :disabled="isLoading || !isConnected || !depositAmount"
              class="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex justify-center items-center gap-2 transition-all"
            >
              <Icon v-if="isLoading" icon="eos-icons:loading" class="animate-spin w-5 h-5" />
              <Icon v-else icon="mdi:bank-transfer-in" class="w-5 h-5" />
              Deposit
            </button>
          </div>
        </div>

        <!-- Borrow Card -->
        <div class="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700 hover:border-purple-500 transition-colors">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-gray-100 flex items-center gap-2">
              <Icon icon="mdi:cash-multiple" class="text-purple-400 w-6 h-6" />
              Borrow
            </h2>
            <div class="text-right">
               <!-- Placeholder for Borrow Limit calculation if needed -->
               <p class="text-xs text-gray-400 uppercase">Borrow Limit</p>
               <p class="text-xl font-mono text-purple-300">80% LTV</p>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm text-gray-400 mb-1">Amount to Borrow (Token)</label>
              <div class="relative">
                <input 
                  v-model="borrowAmount"
                  type="number" 
                  placeholder="0.0"
                  class="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
                <span class="absolute right-4 top-3 text-gray-500">TOK</span>
              </div>
            </div>
            
            <button 
              @click="handleBorrow"
              :disabled="isLoading || !isConnected || !borrowAmount"
              class="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex justify-center items-center gap-2 transition-all"
            >
              <Icon v-if="isLoading" icon="eos-icons:loading" class="animate-spin w-5 h-5" />
              <Icon v-else icon="mdi:hand-coin" class="w-5 h-5" />
              Borrow
            </button>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>
