<script setup lang="ts">
import { usePackingStore } from '../../stores/packing';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Message from 'primevue/message';

const packingStore = usePackingStore();
const router = useRouter();

const handleConfirm = async () => {
    const success = await packingStore.confirmPacking();
    if (success) {
        // Maybe redirect or show success dialog
        // For now, we stay here and show success message
    }
};

const handlePrint = () => {
    if (packingStore.invoice?.receipt_number) {
        router.push(`/print/packing/${packingStore.invoice.receipt_number}`);
    }
};

const handleBack = () => {
    packingStore.currentStep = 2;
};

const handleNew = () => {
    packingStore.reset();
};
</script>

<template>
    <div class="flex flex-col gap-6 max-w-4xl mx-auto">
        <Card>
            <template #title>Step 3: Confirmation</template>
            <template #content>
                <div v-if="packingStore.successMessage" class="flex flex-col items-center gap-6 py-10">
                    <i class="pi pi-check-circle text-green-500 text-6xl"></i>
                    <h2 class="text-2xl font-bold text-green-700">{{ packingStore.successMessage }}</h2>
                    <div class="flex gap-4">
                        <Button label="Print Packing Slip" icon="pi pi-print" severity="secondary" @click="handlePrint" size="large" />
                        <Button label="Start New Packing" @click="handleNew" size="large" />
                    </div>
                </div>

                <div v-else class="flex flex-col gap-6">
                    <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                        <div>
                            <span class="text-gray-500">Invoice No:</span>
                            <div class="font-bold">{{ packingStore.invoice?.receipt_number }}</div>
                        </div>
                        <div>
                            <span class="text-gray-500">Customer:</span>
                            <div class="font-bold">{{ packingStore.invoice?.customer_name }}</div>
                        </div>
                        <div>
                            <span class="text-gray-500">Employee:</span>
                            <div class="font-bold">{{ packingStore.employee?.name }}</div>
                        </div>
                        <div>
                            <span class="text-gray-500">Total Items:</span>
                            <div class="font-bold">{{ packingStore.totalScanned }}</div>
                        </div>
                    </div>

                    <div>
                        <h3 class="font-bold mb-2">Scanned Serials</h3>
                        <DataTable :value="packingStore.scannedSerials.map(s => ({ serial: s }))" size="small" stripedRows paginator :rows="10">
                            <Column field="serial" header="Serial Number"></Column>
                        </DataTable>
                    </div>

                    <Message v-if="packingStore.error" severity="error" :closable="false">
                        {{ packingStore.error }}
                    </Message>

                    <div class="flex justify-between pt-4 border-t">
                        <Button label="Back to Scanning" icon="pi pi-arrow-left" text @click="handleBack" :disabled="packingStore.loading" />
                        <Button label="Confirm Shipment" icon="pi pi-check" severity="success" @click="handleConfirm" :loading="packingStore.loading" />
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>
