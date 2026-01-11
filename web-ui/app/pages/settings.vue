<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import Sidebar from '../components/Sidebar.vue';
import { useTheme } from '../composables/useTheme';

// Configuration
const LENDING_POOL_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
const MOCK_TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const CHAIN_ID = import.meta.env.VITE_CHAIN_ID || '31337';

// State
const slippage = ref('0.1');
const infiniteApproval = ref(false);
const language = ref('en');
const { isDark, toggleTheme } = useTheme();
const toast = useToast();

// Load settings from localStorage
onMounted(() => {
    if (localStorage.getItem('slippage')) slippage.value = localStorage.getItem('slippage')!;
    if (localStorage.getItem('infiniteApproval')) infiniteApproval.value = localStorage.getItem('infiniteApproval') === 'true';
    if (localStorage.getItem('language')) language.value = localStorage.getItem('language')!;
});

// Save settings to localStorage
watch(slippage, (val) => localStorage.setItem('slippage', val));
watch(infiniteApproval, (val) => localStorage.setItem('infiniteApproval', String(val)));
watch(language, (val) => localStorage.setItem('language', val));

const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Suggestion: Add toast here
   toast.add({ severity: 'success', position: 'bottom-right', summary: 'Copied', detail: 'Copied to clipboard: ' + text, life: 3000 });
};

const handleRevoke = () => {
    if (confirm("Are you sure you want to revoke all permissions? This will require re-approval for transactions.")) {
        console.log("Revoking permissions...");
        alert("Permissions revoked (Mock)");
    }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-sans flex">
    <Sidebar />

    <main class="flex-grow p-8 overflow-y-auto">
      <h1 class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-8">
        Settings
      </h1>

      <div class="space-y-6 max-w-4xl">
          
          <!-- Protocol Settings -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm dark:shadow-none">
              <h2 class="text-xl font-bold mb-4 flex items-center gap-2 text-blue-400">
                  <Icon icon="mdi:connection" class="w-6 h-6" />
                  Protocol Information
              </h2>
              <div class="space-y-4">
                  <div>
                      <label class="block text-gray-500 dark:text-gray-400 text-sm mb-1">Lending Pool Address</label>
                      <div class="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                          <code class="text-sm flex-grow truncate">{{ LENDING_POOL_ADDRESS }}</code>
                          <button @click="copyToClipboard(LENDING_POOL_ADDRESS)" class="text-gray-400 hover:text-white">
                              <Icon icon="mdi:content-copy" class="w-5 h-5" />
                          </button>
                          <a href="#" class="text-gray-400 hover:text-blue-400">
                              <Icon icon="mdi:open-in-new" class="w-5 h-5" />
                          </a>
                      </div>
                  </div>
                  <div>
                      <label class="block text-gray-500 dark:text-gray-400 text-sm mb-1">Token Address (Mock)</label>
                      <div class="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                          <code class="text-sm flex-grow truncate">{{ MOCK_TOKEN_ADDRESS }}</code>
                          <button @click="copyToClipboard(MOCK_TOKEN_ADDRESS)" class="text-gray-400 hover:text-white">
                              <Icon icon="mdi:content-copy" class="w-5 h-5" />
                          </button>
                      </div>
                  </div>
                  <div>
                      <label class="block text-gray-500 text-sm mb-1">Current Chain ID</label>
                      <div class="inline-block bg-green-500/10 text-green-400 border border-green-500/30 px-3 py-1 rounded text-sm font-bold">
                          {{ CHAIN_ID }}
                      </div>
                  </div>
              </div>
          </div>

          <!-- Transaction Settings -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm dark:shadow-none">
              <h2 class="text-xl font-bold mb-4 flex items-center gap-2 text-purple-400">
                  <Icon icon="mdi:cog-transfer" class="w-6 h-6" />
                  Transaction Settings
              </h2>
              <div class="space-y-6">
                  <div>
                      <label class="block text-gray-600 dark:text-gray-400 mb-2">Slippage Tolerance</label>
                      <div class="flex gap-2">
                          <button 
                            v-for="val in ['0.1', '0.5', '1.0']" 
                            :key="val"
                            @click="slippage = val"
                            class="px-4 py-2 rounded-lg text-sm font-bold border transition-colors"
                            :class="slippage === val ? 'bg-purple-600 text-white border-purple-500' : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'"
                          >
                              {{ val }}%
                          </button>
                      </div>
                  </div>
                  <div class="flex items-center justify-between">
                      <div>
                          <label class="block text-gray-600 dark:text-gray-400 font-bold">Infinite Approval</label>
                          <p class="text-xs text-gray-500">Approve tokens once for minimal transaction fees.</p>
                      </div>
                      <button 
                        @click="infiniteApproval = !infiniteApproval"
                        class="w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out relative"
                        :class="infiniteApproval ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'"
                      >
                          <div 
                            class="w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300"
                            :class="infiniteApproval ? 'translate-x-6' : 'translate-x-0'"
                          ></div>
                      </button>
                  </div>
              </div>
          </div>

          <!-- Interface Settings -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm dark:shadow-none">
              <h2 class="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-400">
                  <Icon icon="mdi:palette" class="w-6 h-6" />
                  Interface
              </h2>
              <div class="space-y-4">
                  <div class="flex items-center justify-between">
                      <span class="text-gray-600 dark:text-gray-400">Dark Mode</span>
                      <button 
                        @click="toggleTheme"
                        class="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                      >
                          <Icon :icon="isDark ? 'mdi:weather-night' : 'mdi:weather-sunny'" class="w-5 h-5" :class="isDark ? 'text-blue-300' : 'text-yellow-400'" />
                      </button>
                  </div>
                  <div class="flex items-center justify-between">
                      <span class="text-gray-600 dark:text-gray-400">Language</span>
                      <select v-model="language" class="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 outline-none focus:border-blue-500">
                          <option value="en">English</option>
                          <option value="vi">Tiếng Việt</option>
                      </select>
                  </div>
              </div>
          </div>

          <!-- Danger Zone -->
          <div class="bg-red-500/10 rounded-2xl border border-red-500/30 p-6">
              <h2 class="text-xl font-bold mb-4 flex items-center gap-2 text-red-500">
                  <Icon icon="mdi:alert-decagram" class="w-6 h-6" />
                  Danger Zone
              </h2>
              <p class="text-sm text-red-400 mb-4">
                  Revoking permissions will disable the lending protocol from accessing your assets. You will need to re-approve tokens for future transactions.
              </p>
              <button 
                @click="handleRevoke"
                class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                  <Icon icon="mdi:lock-off" class="w-5 h-5" />
                  Revoke All Permissions
              </button>
          </div>

      </div>
    </main>
  </div>
</template>
