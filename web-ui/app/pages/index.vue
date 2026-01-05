<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useWeb3 } from '../composables/useWeb3';

const { connectWallet, isConnected, account, disconnect } = useWeb3();

const handleConnect = async () => {
  await connectWallet();
  // Redirect happens in useWeb3
};
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
    <!-- Header -->
    <header class="flex justify-between items-center p-6 border-b border-gray-700 bg-gray-800 z-10">
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
    <main class="flex-grow flex flex-col items-center justify-center min-h-[80vh] container mx-auto px-4">
      
      <!-- Hero Section -->
      <div class="text-center mb-16 fade-up" style="animation-delay: 0.1s;">
        <h1 class="py-4 text-6xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
          Lending dApp: Future of Finance
        </h1>
        <p class="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Experience the next generation of decentralized lending, instant borrowing, and high-yield savings.
        </p>
        <button 
          @click="handleConnect"
          class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xl font-bold py-4 px-12 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300"
        >
          Get Started
        </button>
      </div>

      <!-- Features Cards -->
      <div class="grid md:grid-cols-3 gap-8 w-full max-w-6xl">
        <!-- Card 1 -->
        <div class="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:-translate-y-2 fade-up" style="animation-delay: 0.3s;">
          <div class="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-400">
             <Icon icon="fluent:money-hand-24-filled" class="w-10 h-10" />
          </div>
          <h3 class="text-2xl font-bold mb-3 text-gray-100">Tiết kiệm với APY cao</h3>
          <p class="text-gray-400">Earn industry-leading interest rates on your crypto assets with our optimized lending pools.</p>
        </div>

        <!-- Card 2 -->
        <div class="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:-translate-y-2 fade-up" style="animation-delay: 0.5s;">
          <div class="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 text-purple-400">
             <Icon icon="mdi:paper-remove" class="w-10 h-10" />
          </div>
          <h3 class="text-2xl font-bold mb-3 text-gray-100">Vay không cần giấy tờ</h3>
          <p class="text-gray-400">Instant approval. No credit checks. Use your crypto as collateral and access liquidity instantly.</p>
        </div>

        <!-- Card 3 -->
        <div class="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-green-500 transition-all duration-300 hover:-translate-y-2 fade-up" style="animation-delay: 0.7s;">
          <div class="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 text-green-400">
             <Icon icon="mdi:shield-check" class="w-10 h-10" />
          </div>
          <h3 class="text-2xl font-bold mb-3 text-gray-100">An toàn tuyệt đối</h3>
          <p class="text-gray-400">Audited smart contracts and non-custodial architecture ensure your funds are always secure.</p>
        </div>
      </div>

    </main>
  </div>
</template>

<style scoped>
/* Simple CSS Animation for Fade In Up */
.fade-up {
  opacity: 0;
  transform: translateY(30px);
  animation: fadeInUp 0.8s ease-out forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
