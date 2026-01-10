<script setup lang="ts">
import { computed } from 'vue';

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
    <h1 class="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
      Dashboard
    </h1>
    <!-- Health Factor -->
    <div class="hidden md:block w-64">
       <div class="flex justify-between text-sm mb-1">
         <span class="text-gray-400">Health Factor</span>
         <span :class="props.healthFactor >= 1.5 ? 'text-green-400' : 'text-yellow-400'" class="font-bold">{{ props.healthFactor }}</span>
       </div>
       <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
         <div 
            class="h-full transition-all duration-500 rounded-full"
            :class="healthColor"
            :style="{ width: healthPercentage }"
         ></div>
       </div>
    </div>
  </div>
</template>
