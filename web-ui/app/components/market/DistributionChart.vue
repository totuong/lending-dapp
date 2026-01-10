<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useTheme } from '../../composables/useTheme';

const { isDark } = useTheme();
const chartData = ref();
const chartOptions = ref();

const setChartData = () => {
    const documentStyle = getComputedStyle(document.documentElement);

    chartData.value = {
        labels: ['Ethereum', 'USDT', 'Mock Token'],
        datasets: [
            {
                data: [300, 50, 100],
                backgroundColor: [
                    documentStyle.getPropertyValue('--p-blue-500'), 
                    documentStyle.getPropertyValue('--p-purple-500'), 
                    documentStyle.getPropertyValue('--p-green-500')
                ],
                hoverBackgroundColor: [
                    documentStyle.getPropertyValue('--p-blue-400'), 
                    documentStyle.getPropertyValue('--p-purple-400'), 
                    documentStyle.getPropertyValue('--p-green-400')
                ],
                borderWidth: 0 // Remove border for cleaner look
            }
        ]
    };
};

const setChartOptions = () => {
    const tickColor = isDark.value ? '#9ca3af' : '#4b5563'; // gray-400 : gray-600
    
    chartOptions.value = {
        cutout: '60%', // Thinner ring
        plugins: {
            legend: {
                position: 'right', // Move legend to the right
                labels: {
                    usePointStyle: true,
                    color: tickColor,
                    padding: 20,
                    font: {
                        size: 14
                    }
                }
            }
        },
        layout: {
            padding: 20
        }
    };
};

watch(isDark, () => {
    setChartOptions();
});

onMounted(() => {
    setChartData();
    setChartOptions();
});
</script>

<template>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none flex flex-col h-full">
      <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">Asset Distribution</h3>
      <div class="flex-grow flex items-center justify-center relative">
          <Chart type="doughnut" :data="chartData" :options="chartOptions" class="h-[250px] w-full" />
          <!-- Optional Center Text Overlay -->
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none pr-32 md:pr-0 lg:pr-32 xl:pr-0"> 
             <!-- Legend on right pushes chart left, so centering might need adjustment or simpler approach. 
                  Keeping it simple for now without hardcoded center text to avoid alignment issues with responsive legend. -->
          </div>
      </div>
  </div>
</template>
