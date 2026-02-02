import pdfMake from 'pdfmake/build/pdfmake';
import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces';
import type { PickingListOrder, PickingListItem, PickingListPrintOptions } from '../types/pickingList';
import { vfsFontsTh, fontFamilyTh } from '../assets/fonts/vfs_fonts_th';

// Initialize pdfMake with Thai fonts
(pdfMake as any).vfs = vfsFontsTh;

// Set fonts for pdfMake - must be done before any PDF creation
if (!(pdfMake as any).fonts) {
  (pdfMake as any).fonts = {};
}
Object.assign((pdfMake as any).fonts, fontFamilyTh);

// Thai font support - using Sarabun font
const THAI_FONT = 'Sarabun';

// Debug: Log vfs and fonts
console.log('pdfMake vfs keys:', Object.keys(vfsFontsTh));
console.log('pdfMake fonts:', (pdfMake as any).fonts);

/**
 * Generate Picking List PDF (ใบจัดสินค้า)
 * @param orders - Array of orders to include in the picking list
 * @param options - Print options
 * @returns pdfMake document definition
 */
export function generatePickingListPdf(
  orders: PickingListOrder[],
  options: PickingListPrintOptions = {}
): TDocumentDefinitions {
  const {
    title = 'ใบจัดสินค้า (Picking List)',
    showSignatureSection = true,
    preparedBy = '',
    checkedBy = '',
    deliveredBy = ''
  } = options;

  const currentDate = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const content: Content[] = [];

  // Add each order
  orders.forEach((order, orderIndex) => {
    // Page break between orders (except first)
    if (orderIndex > 0) {
      content.push({ text: '', pageBreak: 'before' });
    }

    // Header Section
    content.push(...generateOrderHeader(order, title, currentDate));

    // Items Table
    const tableContent = generateItemsTable(order.items);
    content.push(tableContent);

    // Summary Section
    content.push(...generateSummarySection(order));

    // Signature Section
    if (showSignatureSection) {
      content.push(...generateSignatureSection(preparedBy, checkedBy, deliveredBy));
    }

    // Footer
    content.push({
      text: `หน้า ${orderIndex + 1} จาก ${orders.length}`,
      alignment: 'center',
      fontSize: 9,
      margin: [0, 20, 0, 0],
      color: '#666666'
    });
  });

  return {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [40, 40, 40, 60],
    defaultStyle: {
      font: THAI_FONT,
      fontSize: 10
    },
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 12,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      orderInfo: {
        fontSize: 10,
        margin: [0, 2, 0, 2]
      },
      tableHeader: {
        fontSize: 10,
        bold: true,
        alignment: 'center',
        fillColor: '#f0f0f0'
      },
      tableCell: {
        fontSize: 9,
        margin: [2, 2, 2, 2]
      },
      serialNumber: {
        fontSize: 8,
        color: '#333333'
      },
      summary: {
        fontSize: 10,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      signature: {
        fontSize: 10,
        alignment: 'center'
      },
      signatureLine: {
        margin: [0, 30, 0, 5]
      }
    },
    content: content,
    footer: (currentPage: number, pageCount: number) => {
      return {
        text: `พิมพ์เมื่อ: ${currentDate} | หน้า ${currentPage} จาก ${pageCount}`,
        alignment: 'center',
        fontSize: 8,
        color: '#666666',
        margin: [0, 10, 0, 0]
      };
    }
  };
}

/**
 * Generate order header section
 */
function generateOrderHeader(order: PickingListOrder, title: string, currentDate: string): Content[] {
  const orderDate = order.orderDate 
    ? new Date(order.orderDate).toLocaleDateString('th-TH')
    : currentDate;

  return [
    {
      text: title,
      style: 'header'
    },
    {
      table: {
        widths: ['50%', '50%'],
        body: [
          [
            {
              text: [
                { text: 'เลขที่ Order: ', bold: true },
                order.orderNumber
              ],
              style: 'orderInfo'
            },
            {
              text: [
                { text: 'วันที่: ', bold: true },
                orderDate
              ],
              style: 'orderInfo',
              alignment: 'right'
            }
          ],
          [
            {
              text: [
                { text: 'รหัสลูกค้า: ', bold: true },
                order.customerCode
              ],
              style: 'orderInfo'
            },
            {
              text: [
                { text: 'สถานะ: ', bold: true },
                { text: order.isComplete ? '✓ บันทึกครบถ้วน' : '⚠ รอดำเนินการ', color: order.isComplete ? 'green' : 'orange' }
              ],
              style: 'orderInfo',
              alignment: 'right'
            }
          ],
          [
            {
              text: [
                { text: 'ชื่อลูกค้า: ', bold: true },
                order.customerName
              ],
              style: 'orderInfo',
              colSpan: 2
            },
            ''
          ]
        ]
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 15]
    },
    {
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 0,
          x2: 515,
          y2: 0,
          lineWidth: 1,
          lineColor: '#cccccc'
        }
      ],
      margin: [0, 0, 0, 15]
    }
  ];
}

/**
 * Generate items table with serial numbers
 */
function generateItemsTable(items: PickingListItem[]): Content {
  const tableBody: TableCell[][] = [
    // Header row
    [
      { text: 'ลำดับ', style: 'tableHeader', alignment: 'center' },
      { text: 'SKU', style: 'tableHeader', alignment: 'center' },
      { text: 'ชื่อสินค้า', style: 'tableHeader', alignment: 'center' },
      { text: 'จำนวน', style: 'tableHeader', alignment: 'center' },
      { text: 'Serial Numbers', style: 'tableHeader', alignment: 'center' },
      { text: 'พื้นที่จัดเก็บ', style: 'tableHeader', alignment: 'center' },
      { text: 'หมายเหตุ', style: 'tableHeader', alignment: 'center' }
    ]
  ];

  // Data rows
  items.forEach((item, index) => {
    const serialNumbersText = item.serialNumbers.length > 0
      ? item.serialNumbers.join('\n')
      : '-';

    tableBody.push([
      { text: (index + 1).toString(), alignment: 'center', style: 'tableCell' },
      { text: item.sku, style: 'tableCell' },
      { text: item.productName, style: 'tableCell' },
      { text: item.quantity.toString(), alignment: 'center', style: 'tableCell' },
      { text: serialNumbersText, style: ['tableCell', 'serialNumber'] },
      { text: item.location || '-', alignment: 'center', style: 'tableCell' },
      { text: item.notes || '-', style: 'tableCell' }
    ]);
  });

  return {
    table: {
      headerRows: 1,
      widths: ['6%', '14%', '20%', '8%', '28%', '12%', '12%'],
      body: tableBody
    },
    layout: {
      fillColor: (rowIndex: number) => {
        return rowIndex === 0 ? '#f5f5f5' : (rowIndex % 2 === 0 ? '#fafafa' : null);
      },
      hLineWidth: (i: number, node: any) => {
        return (i === 0 || i === node.table.body.length) ? 1 : 0.5;
      },
      vLineWidth: () => 0.5,
      hLineColor: () => '#cccccc',
      vLineColor: () => '#cccccc',
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 4,
      paddingBottom: () => 4
    },
    margin: [0, 0, 0, 15]
  };
}

/**
 * Generate summary section
 */
function generateSummarySection(order: PickingListOrder): Content[] {
  return [
    {
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 0,
          x2: 515,
          y2: 0,
          lineWidth: 0.5,
          lineColor: '#cccccc'
        }
      ],
      margin: [0, 10, 0, 10]
    },
    {
      columns: [
        {
          width: '*',
          text: [
            { text: 'รวมจำนวนรายการ: ', bold: true },
            `${order.totalItems} รายการ`
          ]
        },
        {
          width: '*',
          alignment: 'right',
          text: [
            { text: 'รวมจำนวนสินค้าทั้งหมด: ', bold: true },
            `${order.totalQuantity} ชิ้น`
          ]
        }
      ],
      style: 'summary',
      margin: [0, 0, 0, 20]
    }
  ];
}

/**
 * Generate signature section
 */
function generateSignatureSection(
  preparedBy: string,
  checkedBy: string,
  deliveredBy: string
): Content[] {
  return [
    {
      text: 'ลงชื่อผู้เกี่ยวข้อง',
      style: 'subheader',
      margin: [0, 20, 0, 15]
    },
    {
      table: {
        widths: ['33%', '33%', '33%'],
        body: [
          [
            {
              stack: [
                { text: '_________________________', alignment: 'center', margin: [0, 20, 0, 5] },
                { text: '(ผู้จัดทำ)', alignment: 'center', fontSize: 9 },
                { text: preparedBy || '_________________', alignment: 'center', fontSize: 9, margin: [0, 5, 0, 0] }
              ],
              border: [false, false, false, false] as [boolean, boolean, boolean, boolean]
            },
            {
              stack: [
                { text: '_________________________', alignment: 'center', margin: [0, 20, 0, 5] },
                { text: '(ผู้ตรวจสอบ)', alignment: 'center', fontSize: 9 },
                { text: checkedBy || '_________________', alignment: 'center', fontSize: 9, margin: [0, 5, 0, 0] }
              ],
              border: [false, false, false, false] as [boolean, boolean, boolean, boolean]
            },
            {
              stack: [
                { text: '_________________________', alignment: 'center', margin: [0, 20, 0, 5] },
                { text: '(ผู้จัดส่ง)', alignment: 'center', fontSize: 9 },
                { text: deliveredBy || '_________________', alignment: 'center', fontSize: 9, margin: [0, 5, 0, 0] }
              ],
              border: [false, false, false, false] as [boolean, boolean, boolean, boolean]
            }
          ]
        ]
      },
      layout: {
        defaultBorder: false
      },
      margin: [0, 10, 0, 0]
    }
  ];
}

/**
 * Download PDF file
 * @param docDefinition - pdfMake document definition
 * @param filename - Output filename
 */
export function downloadPdf(docDefinition: TDocumentDefinitions, filename: string): void {
  pdfMake.createPdf(docDefinition).download(filename);
}

/**
 * Open PDF in new window/print dialog
 * @param docDefinition - pdfMake document definition
 */
export function printPdf(docDefinition: TDocumentDefinitions): void {
  pdfMake.createPdf(docDefinition).print();
}

/**
 * Get PDF as data URL for preview
 * @param docDefinition - pdfMake document definition
 * @returns Promise with data URL
 */
export function getPdfDataUrl(docDefinition: TDocumentDefinitions): Promise<string> {
  return new Promise((resolve) => {
    const pdfDoc = pdfMake.createPdf(docDefinition);
    pdfDoc.getDataUrl().then((dataUrl: string) => {
      resolve(dataUrl);
    });
  });
}

/**
 * Generate and download Picking List for single order
 * @param order - Single order data
 * @param options - Print options
 */
export function generateSinglePickingList(
  order: PickingListOrder,
  options?: PickingListPrintOptions
): void {
  const docDefinition = generatePickingListPdf([order], options);
  const filename = `PickingList_${order.orderNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
  downloadPdf(docDefinition, filename);
}

/**
 * Generate and download Picking List for multiple orders
 * @param orders - Array of orders
 * @param options - Print options
 */
export function generateBatchPickingList(
  orders: PickingListOrder[],
  options?: PickingListPrintOptions
): void {
  const docDefinition = generatePickingListPdf(orders, options);
  const filename = `PickingList_Batch_${orders.length}Orders_${new Date().toISOString().split('T')[0]}.pdf`;
  downloadPdf(docDefinition, filename);
}
