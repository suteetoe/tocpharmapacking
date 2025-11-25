<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { usePackingStore } from '../../stores/packing';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
// import ProgressBar from 'primevue/progressbar';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import { useConfirm } from "primevue/useconfirm";

const packingStore = usePackingStore();
const confirm = useConfirm();
const serialInput = ref('');
const inputRef = ref();

// Focus input on mount and keep focus
const focusInput = () => {
    nextTick(() => {
        inputRef.value?.$el.focus();
    });
};

onMounted(() => {
    focusInput();
    window.addEventListener('click', focusInput);
});

onUnmounted(() => {
    window.removeEventListener('click', focusInput);
});

const handleScan = async () => {
    if (!serialInput.value) return;
    
    const success = await packingStore.scanProduct(serialInput.value);
    if (success) {
        // Play success sound
        playBeep(true);
    } else {
        // Play error sound
        playBeep(false);
    }
    serialInput.value = '';
    focusInput();
};

const playBeep = (success: boolean) => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    if (success) {
        oscillator.type = 'sine';
        oscillator.frequency.value = 1000; // High pitch
        gainNode.gain.value = 0.1;
        oscillator.start();
        setTimeout(() => oscillator.stop(), 100);
    } else {
        oscillator.type = 'sawtooth';
        oscillator.frequency.value = 200; // Low pitch
        gainNode.gain.value = 0.2;
        oscillator.start();
        setTimeout(() => oscillator.stop(), 300);
    }
};

const finishPacking = () => {
    packingStore.currentStep = 3;
};

const confirmReset = () => {
    confirm.require({
        message: 'Are you sure you want to clear all scanned items?',
        header: 'Confirm Reset',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: () => {
            packingStore.resetScanning();
            focusInput();
        }
    });
};

const confirmCancelTransaction = () => {
    confirm.require({
        message: 'Are you sure you want to cancel this transaction? All progress will be lost and you will return to invoice selection.',
        header: 'Cancel Transaction',
        icon: 'pi pi-times-circle',
        acceptClass: 'p-button-danger',
        accept: () => {
            packingStore.changeInvoice();
        }
    });
};
</script>

<template>
    <div class="flex flex-col gap-4 h-full">
        <!-- Header Info -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card class="bg-blue-50">
                <template #content>
                    <div class="text-sm text-gray-600 mb-1">Invoice No</div>
                    <div class="flex justify-between items-center">
                        <div class="text-xl font-bold text-blue-700">{{ packingStore.invoice?.receipt_number }}</div>
                    </div>
                </template>
            </Card>
            <Card class="bg-blue-50">
                <template #content>
                    <div class="text-sm text-gray-600">Customer</div>
                    <div class="text-xl font-bold text-blue-700">{{ packingStore.invoice?.customer_name }}</div>
                </template>
            </Card>
            <Card :class="packingStore.isComplete ? 'bg-green-100' : 'bg-yellow-50'">
                <template #content>
                    <div class="text-sm text-gray-600">Progress</div>
                    <div class="flex items-center gap-2">
                        <div class="text-2xl font-bold" :class="packingStore.isComplete ? 'text-green-700' : 'text-yellow-700'">
                            {{ packingStore.totalScanned }} / {{ packingStore.totalTarget }}
                        </div>
                        <Tag :severity="packingStore.isComplete ? 'success' : 'warn'" :value="packingStore.isComplete ? 'Complete' : 'Pending'" />
                    </div>
                </template>
            </Card>
        </div>

        <!-- Scanning Area -->
        <Card class="flex-1 flex flex-col">
            <template #title>
                <div class="flex justify-between items-center">
                    <span>Scanning Operation</span>
                    <div class="flex gap-2">
                        <Button 
                            label="Cancel" 
                            icon="pi pi-times" 
                            severity="secondary" 
                            outlined
                            @click="confirmCancelTransaction"
                        />
                        <Button 
                            label="Reset" 
                            icon="pi pi-refresh" 
                            severity="danger" 
                            outlined
                            @click="confirmReset"
                            :disabled="packingStore.scannedSerials.length === 0"
                        />
                        <Button 
                            label="Finish & Review" 
                            icon="pi pi-check" 
                            severity="success" 
                            @click="finishPacking"
                            :disabled="!packingStore.isComplete"
                        />
                    </div>
                </div>
            </template>
            <template #content>
                <div class="flex flex-col gap-4 h-full">
                    <!-- Input -->
                    <div class="flex gap-2">
                        <InputText 
                            ref="inputRef"
                            v-model="serialInput" 
                            placeholder="Scan Serial Number here..." 
                            class="flex-1 text-lg p-3" 
                            autofocus
                            @keyup.enter="handleScan"
                            :disabled="packingStore.loading"
                        />
                        <Button icon="pi pi-barcode" @click="handleScan" :loading="packingStore.loading" />
                    </div>

                    <Message v-if="packingStore.error" severity="error" :closable="false" class="mb-2">
                        {{ packingStore.error }}
                    </Message>

                    <!-- Lists Grid -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
                        <!-- Target List -->
                        <div class="border rounded-lg p-2 flex flex-col bg-gray-50">
                            <h3 class="font-bold mb-2 px-2">Target Items</h3>
                            <div class="overflow-auto flex-1">
                                <DataTable :value="packingStore.invoice?.items" size="small" stripedRows>
                                    <Column field="product_name" header="Product"></Column>
                                    <Column field="quantity" header="Qty" style="width: 3rem" class="text-center"></Column>
                                </DataTable>
                            </div>
                        </div>

                        <!-- Scanned List -->
                        <div class="border rounded-lg p-2 flex flex-col bg-white">
                            <h3 class="font-bold mb-2 px-2 flex justify-between">
                                <span>Scanned Items</span>
                                <span class="text-sm font-normal text-gray-500">Latest on top</span>
                            </h3>
                            <div class="overflow-auto flex-1">
                                <DataTable :value="[...packingStore.scannedSerials].reverse()" size="small" stripedRows>
                                    <Column header="Serial Number">
                                        <template #body="slotProps">
                                            <span class="font-mono">{{ slotProps.data }}</span>
                                        </template>
                                    </Column>
                                    <Column style="width: 3rem">
                                        <template #body="slotProps">
                                            <Button 
                                                icon="pi pi-trash" 
                                                text 
                                                severity="danger" 
                                                size="small"
                                                @click="packingStore.removeSerial(slotProps.data)"
                                            />
                                        </template>
                                    </Column>
                                </DataTable>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>
