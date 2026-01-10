<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useTheme } from '../../composables/useTheme';

const { isDark } = useTheme();
const chartData = ref();
const chartOptions = ref();

const setChartData = () => {
    const documentStyle = getComputedStyle(document.documentElement);

    chartData.value = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [
            {
                label: 'Total Value Locked (TVL)',
                data: [65, 59, 80, 81, 56, 95, 120],
                fill: false,
                borderColor: documentStyle.getPropertyValue('--p-blue-500'),
                tension: 0.4
            },
            {
                label: 'Total Borrowed',
                data: [28, 48, 40, 19, 86, 27, 90],
                fill: false,
                borderColor: documentStyle.getPropertyValue('--p-purple-500'),
                tension: 0.4
            }
        ]
    };
};

const setChartOptions = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    // Dark mode colors
    const tickColor = isDark.value ? '#9ca3af' : '#4b5563'; // gray-400 : gray-600
    const gridColor = isDark.value ? '#374151' : '#e5e7eb'; // gray-700 : gray-200

    chartOptions.value = {
        maintainAspectRatio: false,
        aspectRatio: 0.6,
        plugins: {
            legend: {
                labels: {
                    color: tickColor
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: tickColor
                },
                grid: {
                    color: gridColor
                }
            },
            y: {
                ticks: {
                    color: tickColor
                },
                grid: {
                    color: gridColor
                }
            }
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
  <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none">
      <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">TVL History</h3>
      <div class="h-[300px] flex items-center justify-center">
          <Chart type="line" :data="chartData" :options="chartOptions" class="h-full w-full" />
      </div>
  </div>
</template>
