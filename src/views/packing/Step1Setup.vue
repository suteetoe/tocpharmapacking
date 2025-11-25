<script setup lang="ts">
import { ref } from 'vue';
import { usePackingStore } from '../../stores/packing';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Message from 'primevue/message';

const packingStore = usePackingStore();
const employeeCode = ref('');
const invoiceNo = ref('');

const handleEmployeeSubmit = async () => {
    if (!employeeCode.value) return;
    await packingStore.validateEmployee(employeeCode.value);
};

const handleInvoiceSubmit = async () => {
    if (!invoiceNo.value) return;
    const success = await packingStore.getInvoiceDetails(invoiceNo.value);
    if (success) {
        packingStore.currentStep = 2;
    }
};
</script>

<template>
    <div class="flex flex-col gap-6 max-w-2xl mx-auto">
        <Card>
            <template #title>Step 1: Setup</template>
            <template #content>
                <div class="flex flex-col gap-6">
                    <!-- Employee Section -->
                    <div class="flex flex-col gap-2">
                        <label class="font-bold">Employee Code</label>
                        <div class="flex gap-2">
                            <InputText 
                                v-model="employeeCode" 
                                placeholder="Scan Employee ID (e.g. EMP001)" 
                                class="flex-1" 
                                :disabled="!!packingStore.employee"
                                @keyup.enter="handleEmployeeSubmit"
                            />
                            <Button 
                                label="Verify" 
                                @click="handleEmployeeSubmit" 
                                :loading="packingStore.loading"
                                :disabled="!!packingStore.employee"
                            />
                        </div>
                        <Message v-if="packingStore.employee" severity="success" :closable="false">
                            Verified: {{ packingStore.employee.name }}
                        </Message>
                    </div>

                    <!-- Invoice Section (Only shows after employee is verified) -->
                    <div v-if="packingStore.employee" class="flex flex-col gap-2 border-t pt-4">
                        <label class="font-bold">Invoice Number</label>
                        <div class="flex gap-2">
                            <InputText 
                                v-model="invoiceNo" 
                                placeholder="Scan Invoice No (e.g. INV001)" 
                                class="flex-1" 
                                @keyup.enter="handleInvoiceSubmit"
                            />
                            <Button 
                                label="Start Packing" 
                                @click="handleInvoiceSubmit" 
                                :loading="packingStore.loading"
                            />
                        </div>
                    </div>

                    <Message v-if="packingStore.error" severity="error" :closable="false">
                        {{ packingStore.error }}
                    </Message>
                </div>
            </template>
        </Card>
    </div>
</template>
