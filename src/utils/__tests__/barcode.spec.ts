import { describe, it, expect } from 'vitest';
import { parseAIDataMatrix } from '../barcode';

describe('parseAIDataMatrix', () => {
    it('should parse format (01)GTIN(21)SN', () => {
        const barcode = '(01)08850000000000(21)SN123456';
        const result = parseAIDataMatrix(barcode);
        expect(result).toEqual({
            ic_code: '08850000000000',
            serial_number: 'SN123456'
        });
    });

    it('should parse format 01GTIN21SN (without parentheses)', () => {
        const barcode = '010885000000000021SN123456';
        const result = parseAIDataMatrix(barcode);
        expect(result).toEqual({
            ic_code: '08850000000000',
            serial_number: 'SN123456'
        });
    });

    it('should parse complex format with AI 10 and 17: 01...10...17...21...', () => {
        const barcode = '010880999999999710TK12341725111121TK1234000093';
        const result = parseAIDataMatrix(barcode);
        expect(result).toEqual({
            ic_code: '08809999999997',
            serial_number: 'TK1234000093'
        });
    });

    it('should return null for invalid barcode', () => {
        const barcode = '123456789';
        const result = parseAIDataMatrix(barcode);
        expect(result).toBeNull();
    });

    it('should parse format with Group Separators (GS): <GS>01...10...<GS>17...21...', () => {
        // \u001d is the Group Separator (GS) character
        const barcode = '\u001d010880999999999710TK1234\u001d1725111121TK1234000093';
        const result = parseAIDataMatrix(barcode);
        expect(result).toEqual({
            ic_code: '08809999999997',
            serial_number: 'TK1234000093'
        });
    });

        it('should parse format with Group Separators (GS): <GS>01...10...<GS>17...21... ascii', () => {
        // \u001d is the Group Separator (GS) character
        const barcode = '010880999999999710TK12341725111121TK1234000093';
        const result = parseAIDataMatrix(barcode);
        expect(result).toEqual({
            ic_code: '08809999999997',
            serial_number: 'TK1234000093'
        });
    });

    
});
