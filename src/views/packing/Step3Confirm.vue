<script setup lang="ts">
import { usePackingStore } from '../../stores/packing';
import Button from 'primevue/button';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Message from 'primevue/message';
import { generatePickingListPdf, printPdf } from '../../utils/pickingListPdf';
import type { PickingListOrder, PickingListItem } from '../../types/pickingList';

const packingStore = usePackingStore();

const handleConfirm = async () => {
    const success = await packingStore.confirmPacking();
    if (success) {
        // Maybe redirect or show success dialog
        // For now, we stay here and show success message
    }
};

const handlePrint = () => {
    if (packingStore.invoice?.receipt_number) {
        packingStore.downloadPackingPdf(packingStore.invoice.receipt_number);
    }
};

const handlePrintPickingList = () => {
    if (!packingStore.invoice || !packingStore.scannedItemsDetails.length) return;

    // Group scanned items by product
    const itemMap = new Map<string, PickingListItem>();

    packingStore.scannedItemsDetails.forEach((detail) => {
        const serial = detail.serial_number;
        const sku = detail.ic_code;

        // Find product name from invoice items
        const invoiceItem = packingStore.invoice?.items.find(item => item.product_id === sku);
        const productName = invoiceItem?.product_name || sku;

        if (itemMap.has(sku)) {
            const existing = itemMap.get(sku)!;
            existing.quantity += 1;
            existing.serialNumbers.push(serial);
        } else {
            itemMap.set(sku, {
                sku: sku,
                productName: productName,
                quantity: 1,
                serialNumbers: [serial],
                location: detail.shelf_code || '-',
                notes: ''
            });
        }
    });

    const items = Array.from(itemMap.values());

    const order: PickingListOrder = {
        orderId: packingStore.invoice.receipt_number,
        orderNumber: packingStore.invoice.receipt_number,
        customerName: packingStore.invoice.customer_name,
        customerCode: packingStore.invoice.cust_code,
        orderDate: new Date().toISOString(),
        items: items,
        totalItems: items.length,
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
        isComplete: true,
        employeeCode: packingStore.employee?.code || '',
        employeeName: packingStore.employee?.name || ''
    };

    const docDefinition = generatePickingListPdf([order], {
        preparedBy: packingStore.employee?.name || '',
        checkedBy: '',
        deliveredBy: ''
    });
    printPdf(docDefinition);
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
            <template #title>ขั้นตอนที่ 3: ยืนยัน</template>
            <template #content>
                <div v-if="packingStore.successMessage" class="flex flex-col items-center gap-6 py-10">
                    <i class="pi pi-check-circle text-green-500 text-6xl"></i>
                    <h2 class="text-2xl font-bold text-green-700">{{ packingStore.successMessage }}</h2>
                    <div class="flex gap-4 flex-wrap justify-center">
                        <Button label="Download Packing Slip PDF" icon="pi pi-download" severity="secondary" @click="handlePrint" size="large" />
                        <Button label="Print Picking List" icon="pi pi-file-pdf" severity="info" @click="handlePrintPickingList" size="large" />
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
