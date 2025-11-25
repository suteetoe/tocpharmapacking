<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import Menu from 'primevue/menu';

const authStore = useAuthStore();
const route = useRoute();

const isSidebarOpen = ref(true);
const menu = ref();
const isDark = ref(false);

const toggleDarkMode = () => {
    document.documentElement.classList.toggle('app-dark');
    isDark.value = document.documentElement.classList.contains('app-dark');
};

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const userInitials = computed(() => {
  if (authStore.user?.username) {
    return authStore.user.username.substring(0, 2).toUpperCase();
  }
  return 'U';
});

const userMenuItems = ref([
    {
        label: 'Profile',
        items: [
            {
                label: 'Logout',
                icon: 'pi pi-sign-out',
                command: () => {
                    authStore.logout();
                }
            }
        ]
    }
]);

const toggleUserMenu = (event: Event) => {
    menu.value.toggle(event);
};

</script>

<template>
  <div class="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
    <!-- Sidebar -->
    <aside 
      class="bg-white dark:bg-gray-800 shadow-md transition-all duration-300 flex flex-col border-r dark:border-gray-700"
      :class="isSidebarOpen ? 'w-64' : 'w-0 -ml-64 md:ml-0 md:w-20'"
    >
      <div class="p-4 flex items-center justify-center h-16 border-b dark:border-gray-700">
        <span v-if="isSidebarOpen" class="text-xl font-bold text-primary-600 dark:text-primary-400">TOC Pharma</span>
        <span v-else class="text-xl font-bold text-primary-600 dark:text-primary-400">TP</span>
      </div>
      
      <nav class="flex-1 overflow-y-auto py-4">
        <ul class="space-y-1 px-2">
          <li>
            <router-link 
              to="/" 
              class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              :class="{ 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300': route.path === '/' }"
            >
              <i class="pi pi-home text-lg"></i>
              <span v-if="isSidebarOpen" class="ml-3 font-medium">Dashboard</span>
            </router-link>
          </li>
          <li>
            <router-link 
              to="/packing" 
              class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              :class="{ 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300': route.path.startsWith('/packing') }"
            >
              <i class="pi pi-box text-lg"></i>
              <span v-if="isSidebarOpen" class="ml-3 font-medium">Packing</span>
            </router-link>
          </li>
        </ul>
      </nav>

      <div class="p-4 border-t dark:border-gray-700">
        <button 
          @click="authStore.logout()" 
          class="flex items-center w-full px-4 py-2 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <i class="pi pi-sign-out text-lg"></i>
          <span v-if="isSidebarOpen" class="ml-3 font-medium">Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Top Header -->
      <header class="bg-white dark:bg-gray-800 shadow-sm h-16 flex items-center justify-between px-4 z-10 border-b dark:border-gray-700">
        <div class="flex items-center">
          <Button icon="pi pi-bars" text rounded @click="toggleSidebar" class="mr-4 dark:text-white" />
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white">{{ route.name }}</h2>
        </div>

        <div class="flex items-center gap-4">
          <Button :icon="isDark ? 'pi pi-moon' : 'pi pi-sun'" text rounded @click="toggleDarkMode" aria-label="Toggle Dark Mode" class="dark:text-white" />
          
          <div class="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
            <span class="w-2 h-2 bg-green-500 rounded-full"></span>
            Online
          </div>
          
          <div class="flex items-center gap-3 cursor-pointer" @click="toggleUserMenu" aria-haspopup="true" aria-controls="overlay_menu">
            <div class="text-right hidden md:block">
              <div class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ authStore.user?.username || 'User' }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">{{ authStore.user?.role || 'Staff' }}</div>
            </div>
            <Avatar :label="userInitials" shape="circle" size="large" class="bg-primary-500 text-white" />
          </div>
          <Menu ref="menu" id="overlay_menu" :model="userMenuItems" :popup="true" />
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<style scoped>
.router-link-active {
  @apply bg-blue-50 text-blue-600;
}
</style>
