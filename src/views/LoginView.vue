<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Message from 'primevue/message';

const username = ref('');
const password = ref('');
const authStore = useAuthStore();
const router = useRouter();

const handleLogin = async () => {
  if (!username.value || !password.value) return;
  
  const success = await authStore.login(username.value, password.value);
  if (success) {
    router.push('/');
  }
};
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <Card class="w-full max-w-md shadow-lg">
      <template #title>
        <div class="text-center text-2xl font-bold text-gray-800 mb-4">
          TOC Pharma Packing
        </div>
      </template>
      <template #content>
        <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label for="username" class="font-medium text-gray-700">Username</label>
            <InputText id="username" v-model="username" class="w-full" placeholder="Enter username" :disabled="authStore.loading" />
          </div>
          
          <div class="flex flex-col gap-2">
            <label for="password" class="font-medium text-gray-700">Password</label>
            <Password id="password" v-model="password" :feedback="false" toggleMask class="w-full" inputClass="w-full" placeholder="Enter password" :disabled="authStore.loading" />
          </div>

          <Message v-if="authStore.error" severity="error" :closable="false">{{ authStore.error }}</Message>

          <Button type="submit" label="Login" :loading="authStore.loading" class="w-full mt-2" />
        </form>
      </template>
    </Card>
  </div>
</template>

<style scoped>
:deep(.p-password-input) {
    width: 100%;
}
</style>
