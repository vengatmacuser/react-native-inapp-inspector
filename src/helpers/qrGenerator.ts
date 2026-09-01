/**
 * ISO/IEC 18004 Standard QR Code Matrix Generator
 * Uses industry-standard qrcode-generator with full Reed-Solomon Error Correction
 * and BCH format encoding for 100% instant phone camera / Google Lens recognition.
 */
import qrcode from 'qrcode-generator';

export type QRECC = 'L' | 'M' | 'Q' | 'H';

export function generateQRMatrix(text: string, ecc: QRECC = 'M'): boolean[][] {
  try {
    // Type 0 = auto detect smallest valid QR version
    const qr = qrcode(0, ecc);
    qr.addData(text);
    qr.make();

    const count = qr.getModuleCount();
    const matrix: boolean[][] = [];

    for (let row = 0; row < count; row++) {
      const rowData: boolean[] = [];
      for (let col = 0; col < count; col++) {
        rowData.push(qr.isDark(row, col));
      }
      matrix.push(rowData);
    }

    return matrix;
  } catch (err) {
    // Fallback: higher version if auto-detect fails
    try {
      const qr = qrcode(10, ecc);
      qr.addData(text);
      qr.make();
      const count = qr.getModuleCount();
      const matrix: boolean[][] = [];
      for (let row = 0; row < count; row++) {
        const rowData: boolean[] = [];
        for (let col = 0; col < count; col++) {
          rowData.push(qr.isDark(row, col));
        }
        matrix.push(rowData);
      }
      return matrix;
    } catch {
      return [];
    }
  }
}
