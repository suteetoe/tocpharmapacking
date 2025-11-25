<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePackingStore } from '../../stores/packing';
import Button from 'primevue/button';
// import DataTable from 'primevue/datatable';
// import Column from 'primevue/column';

const route = useRoute();
const router = useRouter();
const packingStore = usePackingStore();
const printData = ref<any>(null);
const loading = ref(true);

onMounted(async () => {
    const invoiceNo = route.params.id as string;
    if (invoiceNo) {
        printData.value = await packingStore.getPackingPrintData(invoiceNo);
    }
    loading.value = false;
});

const handlePrint = () => {
    window.print();
};

const handleBack = () => {
    router.push('/packing');
};
</script>

<template>
    <div class="min-h-screen bg-gray-100 p-8 print:bg-white print:p-0">
        <!-- Toolbar (Hidden on Print) -->
        <div class="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
            <Button label="Back to Packing" icon="pi pi-arrow-left" text @click="handleBack" />
            <Button label="Print Packing Slip" icon="pi pi-print" @click="handlePrint" />
        </div>

        <!-- Print Content -->
        <div v-if="printData" class="max-w-4xl mx-auto bg-white shadow-lg p-8 print:shadow-none print:max-w-none">
            <!-- Header -->
            <div class="flex justify-between items-start border-b pb-6 mb-6">
                <div>
                    <h1 class="text-3xl font-bold text-gray-800">PACKING SLIP</h1>
                    <div class="text-gray-500 mt-2">TOC Pharma Co., Ltd.</div>
                    <div class="text-sm text-gray-500">123 Pharma Road, Bangkok, Thailand</div>
                </div>
                <div class="text-right">
                    <div class="text-xl font-bold text-gray-700">#{{ printData.invoice_no }}</div>
                    <div class="text-gray-500">Date: {{ printData.date }}</div>
                </div>
            </div>

            <!-- Info -->
            <div class="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <h3 class="text-gray-500 font-bold uppercase text-xs tracking-wider mb-1">Ship To</h3>
                    <div class="font-bold text-lg">{{ printData.customer_name }}</div>
                </div>
                <div class="text-right">
                    <h3 class="text-gray-500 font-bold uppercase text-xs tracking-wider mb-1">Packed By</h3>
                    <div class="font-bold">{{ printData.packer }}</div>
                </div>
            </div>

            <!-- Items -->
            <div class="mb-8">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b-2 border-gray-200">
                            <th class="py-3 font-bold text-gray-600">Product</th>
                            <th class="py-3 font-bold text-gray-600 text-center">Qty</th>
                            <th class="py-3 font-bold text-gray-600">Serials</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in printData.items" :key="item.product_id" class="border-b border-gray-100">
                            <td class="py-4 align-top">
                                <div class="font-bold">{{ item.product_name }}</div>
                                <div class="text-xs text-gray-400">ID: {{ item.product_id }}</div>
                            </td>
                            <td class="py-4 align-top text-center font-bold">{{ item.quantity }}</td>
                            <td class="py-4 align-top">
                                <div class="flex flex-wrap gap-1">
                                    <span v-for="serial in item.serials" :key="serial" class="text-xs font-mono bg-gray-100 px-1 rounded">
                                        {{ serial }}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Footer -->
            <div class="border-t pt-8 mt-12 text-center text-gray-500 text-sm">
                <p>Thank you for your business.</p>
                <p class="mt-2">If you have any questions about this shipment, please contact support@tocpharma.com</p>
            </div>
        </div>

        <div v-else-if="loading" class="text-center py-20">
            <i class="pi pi-spin pi-spinner text-4xl text-gray-400"></i>
            <p class="mt-4 text-gray-500">Loading print data...</p>
        </div>
    </div>
</template>

<style>
@media print {
    @page {
        margin: 0;
        size: auto;
    }
    body {
        background: white;
    }
}
</style>
