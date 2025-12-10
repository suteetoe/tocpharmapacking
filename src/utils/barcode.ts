export interface ParsedBarcode {
    ic_code: string;
    serial_number: string;
}

export function parseAIDataMatrix(barcode: string): ParsedBarcode | null {
    // Remove leading Group Separator (GS - ASCII 29) if present
    // Some scanners might prepend it.
    if (barcode.startsWith(String.fromCharCode(29))) {
        barcode = barcode.substring(1);
    }

    // Pattern 1: With parentheses (01)GTIN(21)SN...
    // GTIN is fixed 14 digits.
    // We look for (01) followed by 14 digits, then (21) followed by the serial number.
    // We stop capturing SN if we encounter another open parenthesis (start of next AI) or end of string.
    const patternWithParens = /\(01\)(\d{14})\(21\)([^()]+)/;
    const matchParens = barcode.match(patternWithParens);
    if (matchParens && matchParens[1] && matchParens[2]) {
        return {
            ic_code: matchParens[1],
            serial_number: matchParens[2]
        };
    }

    // Pattern 2: Without parentheses 01GTIN...
    // 01 + 14 digits (GTIN) + ...
    if (barcode.startsWith('01') && barcode.length > 18) {
        const gtin = barcode.substring(2, 16);
        const rest = barcode.substring(16);
        
        // Case 2.1: Rest starts with 21 (01...21...)
        if (rest.startsWith('21')) {
            let sn = rest.substring(2);
            const gsIndex = sn.indexOf(String.fromCharCode(29));
            if (gsIndex !== -1) {
                sn = sn.substring(0, gsIndex);
            }
            return {
                ic_code: gtin,
                serial_number: sn
            };
        }

        // Case 2.2: Rest contains 17(YYMMDD)21... (01...17...21...)
        // This handles the case where 10 or other AIs might be before 17.
        // We look for 17 followed by 6 digits, then 21.
        const match17_21 = rest.match(/17(\d{6})21(.+)$/);
        if (match17_21 && match17_21[2]) {
             // match17_21[1] is date, match17_21[2] is SN
             let sn = match17_21[2];
             const gsIndex = sn.indexOf(String.fromCharCode(29));
             if (gsIndex !== -1) {
                 sn = sn.substring(0, gsIndex);
             }
             return {
                 ic_code: gtin,
                 serial_number: sn
             };
        }
        
        // Case 2.3: Fallback - Try to find 21 at the end if nothing else matched?
        // For now, let's stick to safe patterns.
    }

    return null;
}
