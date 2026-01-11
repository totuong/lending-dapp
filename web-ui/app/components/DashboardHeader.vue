<script setup lang="ts">
import { computed } from 'vue';
import { useWeb3 } from '../composables/useWeb3';

const { disconnect, isConnected } = useWeb3();

const props = defineProps<{
  healthFactor: number;
}>();

// Calculate Health Bar Color
const healthColor = computed(() => {
  if (props.healthFactor >= 1.5) return 'bg-green-500';
  if (props.healthFactor >= 1.1) return 'bg-yellow-500';
  return 'bg-red-500';
});

const healthPercentage = computed(() => {
  // Map 1.0 -> 0%, 2.0 -> 100% just for visual
  return Math.min(Math.max((props.healthFactor - 1) * 100, 5), 100) + '%'; 
});
</script>

<template>
  <div class="flex justify-between items-center mb-8">
    <h1 class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
      Dashboard
    </h1>
    <!-- Health Factor -->
    <div class="hidden md:flex items-center gap-6">
       <div class="w-64">
           <div class="flex justify-between text-sm mb-1">
             <span class="text-gray-500 dark:text-gray-400">Health Factor</span>
             <span :class="props.healthFactor >= 1.5 ? 'text-green-500 dark:text-green-400' : 'text-yellow-500 dark:text-yellow-400'" class="font-bold">{{ props.healthFactor }}</span>
           </div>
           <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
             <div 
                class="h-full transition-all duration-500 rounded-full"
                :class="healthColor"
                :style="{ width: healthPercentage }"
             ></div>
           </div>
       </div>

       <!-- User Actions -->
       <div class="flex items-center gap-3 border-l pl-6 border-gray-200 dark:border-gray-700">
          <Button 
            v-if="isConnected"
            @click="disconnect" 
            icon="pi pi-sign-out" 
            class="!text-red-400 hover:!text-red-500 !bg-red-50 dark:!bg-red-500/10 border-none !h-10 !w-10 !rounded-full" 
            v-tooltip.bottom="'Disconnect'"
          />
       </div>
    </div>
  </div>
</template>
