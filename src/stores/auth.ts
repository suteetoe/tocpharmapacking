import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../api/axios';
import type { User, LoginResponse } from '../types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value);

  function setUser(newUser: User) {
    user.value = newUser;
    localStorage.setItem('user', JSON.stringify(newUser));
  }

  function setToken(newToken: string) {
    token.value = newToken;
    localStorage.setItem('token', newToken);
  }

  function clearAuth() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Initialize state from local storage
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser);
    } catch (e) {
      localStorage.removeItem('user');
    }
  }

  async function login(username: string, password: string): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post<LoginResponse>('/auth/login', { username, password });
      
      if (response.data.success) {
        setToken(response.data.token);
        setUser(response.data.user);
        return true;
      } else {
        error.value = 'Login failed';
        return false;
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response && err.response.status === 401) {
        error.value = 'Invalid username or password';
      } else {
        error.value = err.message || 'An error occurred during login';
      }
      return false;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    clearAuth();
    // Router redirection should be handled by the component calling logout or a global guard
    window.location.href = `${import.meta.env.BASE_URL}login`;
  }

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login,
    logout
  };
});
