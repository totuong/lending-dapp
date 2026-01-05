<script setup lang="ts">
import { ref, onMounted } from 'vue';

const isLoading = ref(true);

onMounted(() => {
  // Wait a short moment for hydration and styles to apply
  setTimeout(() => {
    isLoading.value = false;
  }, 500); 
});

useHead({
  htmlAttrs: {
    class: 'dark'
  }
})
</script>

<template>
  <div>
    <!-- Splash Screen (Critical CSS) -->
    <div v-if="isLoading" class="splash-screen">
      <div class="loader"></div>
    </div>

    <NuxtRouteAnnouncer />
    <Toast />
    <div v-show="!isLoading">
      <NuxtPage />
    </div>
  </div>
</template>

<style>
/* Inline critical CSS for the loader */
.splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #111827; /* gray-900 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loader {
  width: 48px;
  height: 48px;
  border: 5px solid #3b82f6; /* blue-500 */
  border-bottom-color: transparent;
  border-radius: 50%;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
