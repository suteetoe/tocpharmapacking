<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
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

    console.log(invoiceNo)
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

// Transform data into rows for the slip
const slipRows = computed(() => {
    if (!printData.value) return [];
    const rows: any[] = [];
    for (const item of printData.value.details) {
        const serials = printData.value.serialnumbers
            .filter((serial: any) => serial.ic_code === item.item_code)
            .map((serial: any) => serial.serial_number);
        for (const serial of serials) {
            rows.push({
                itemCode: item.item_code,
                itemName: item.item_name,
                qty: 1,
                serialNumber: serial
            });
        }
    }
    return rows;
});

// Format the packing slip as ASCII text with pagination
const formattedSlip = computed(() => {
    if (!printData.value) return [];
    const ROWS_PER_PAGE = 20;
    const pages: string[] = [];
    const allRows = slipRows.value;

    for (let pageIndex = 0; pageIndex < allRows.length; pageIndex += ROWS_PER_PAGE) {
        const pageRows = allRows.slice(pageIndex, pageIndex + ROWS_PER_PAGE);
        const lines: string[] = [];
        const totalPages = Math.ceil(allRows.length / ROWS_PER_PAGE);
        const currentPage = Math.floor(pageIndex / ROWS_PER_PAGE) + 1;

        // Page header
        lines.push(''.padEnd(75, ' ') + `PAGE : ${currentPage}/${totalPages}`);
        lines.push('');
        lines.push('                             SERIAL NUMBER RECORD');
        lines.push('                  ****************************************');
        lines.push('');
        lines.push(`                  INV.      : ${printData.value.doc_no}`);
        lines.push(`                  DATE      : ${printData.value.doc_date ? new Date(printData.value.doc_date).toLocaleDateString() : ''}`);
        // แสดงข้อมูลพนักงานผู้จัดสินค้า
        if (printData.value.packer) {
            const packerInfo = `${printData.value.packer.user_code}${printData.value.packer.user_name ? ` (${printData.value.packer.user_name})` : ''}`;
            lines.push(`                  PACKER    : ${packerInfo}`);
        }
        lines.push('--------------------------------------------------------------------------------');
        lines.push('Item Code       Item Name                          Qty     Serial Number    '.padEnd(80, ' '));
        lines.push('--------------------------------------------------------------------------------');

        // Rows
        for (const row of pageRows) {
            const itemCode = row.itemCode.padEnd(16, ' ');
            const itemName = row.itemName.padEnd(35, ' ');
            const qty = row.qty.toString().padEnd(8, ' ');
            const serial = row.serialNumber.padEnd(20, ' ');
            lines.push(`${itemCode}${itemName}${qty}${serial}`.padEnd(80, ' '));
        }

        pages.push(lines.join('\n'));
    }

    return pages;
});
</script>

<template>
    <div class="min-h-screen bg-gray-100 p-8 print:bg-white print:p-0">
        <!-- Toolbar (Hidden on Print) -->
        <div class="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
            <Button label="Back to Packing" icon="pi pi-arrow-left" text @click="handleBack" />
            <div class="flex gap-2">
                <Button label="Print Packing Slip" icon="pi pi-print" @click="handlePrint" />
            </div>
        </div>

        <!-- Print Content -->
        <div v-if="printData" class="max-w-4xl mx-auto bg-white shadow-lg p-8 print:shadow-none print:max-w-none print:p-0">
            <div v-for="(page, index) in formattedSlip" :key="index" class="page-break">
                <pre class="font-mono text-sm leading-tight whitespace-pre-wrap">{{ page }}</pre>
            </div>
        </div>

        <div v-else-if="loading" class="text-center py-20">
            <i class="pi pi-spin pi-spinner text-4xl text-gray-400"></i>
            <p class="mt-4 text-gray-500">Loading print data...</p>
        </div>
    </div>
</template>

<style>
.page-break {
    page-break-after: always;
}

@media print {
    @page {
        margin: 10mm;
        size: A4;
    }
    body {
        background: white;
    }
    .page-break:last-child {
        page-break-after: avoid;
    }
}
</style>
