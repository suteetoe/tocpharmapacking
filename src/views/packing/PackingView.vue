<script setup lang="ts">
import { usePackingStore } from '../../stores/packing';
import Step1Setup from './Step1Setup.vue';
import Step2Scanning from './Step2Scanning.vue';
import Step3Confirm from './Step3Confirm.vue';
import Steps from 'primevue/steps';
import ConfirmDialog from 'primevue/confirmdialog';
import { ref, computed } from 'vue';

const packingStore = usePackingStore();

const items = ref([
    {
        label: 'ตรวจสอบข้อมูล',
        command: () => {
            // Prevent jumping ahead
            if (packingStore.currentStep > 1) packingStore.currentStep = 1;
        }
    },
    {
        label: 'สแกนสินค้า',
        command: () => {
             if (packingStore.currentStep > 2) packingStore.currentStep = 2;
        }
    },
    {
        label: 'ยืนยัน',
        command: () => {
            // Cannot jump to confirm without finishing scan
        }
    }
]);

// Map step number to active index (0-based)
const activeIndex = computed(() => packingStore.currentStep - 1);
</script>

<template>
    <ConfirmDialog />
    <div class="flex flex-col h-full gap-4">
        <div class="w-full max-w-4xl mx-auto">
            <Steps :model="items" :activeStep="activeIndex" :readonly="true" />
        </div>

        <div class="flex-1 min-h-0">
            <Step1Setup v-if="packingStore.currentStep === 1" />
            <Step2Scanning v-else-if="packingStore.currentStep === 2" />
            <Step3Confirm v-else-if="packingStore.currentStep === 3" />
        </div>
    </div>
</template>

<style scoped>
:deep(.p-steps) .p-steps-item .p-menuitem-link {
    background: transparent;
}
</style>
