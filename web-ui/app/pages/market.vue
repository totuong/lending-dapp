<script setup lang="ts">
import Sidebar from '../components/Sidebar.vue';
import TVLChart from '../components/market/TVLChart.vue';
import DistributionChart from '../components/market/DistributionChart.vue';
import TableModel from '../components/market/TableModel.vue';
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-sans flex">
    
    <Sidebar />

    <main class="flex-grow p-8 overflow-y-auto w-full">
      <h1 class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-8">
        Lending Market
      </h1>

      <!-- Charts Section -->
      <div class="grid lg:grid-cols-2 gap-8 mb-8">
          <TVLChart />
          <DistributionChart />
      </div>
      
      <!-- Market Table -->
      <TableModel />
    </main>
  </div>
</template>
