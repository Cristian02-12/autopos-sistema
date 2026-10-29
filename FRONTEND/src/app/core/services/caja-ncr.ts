import { Injectable, inject } from '@angular/core';
import { Inventario } from './inventario';
@Injectable({
  providedIn: 'root'
})
export class CajaNcr {
  private inv = inject(Inventario);

  shiftState = {
    fixedFund: 0.0,
    cashSalesTotal: 0.0,
    cashSalesCount: 0,
    qrSipTotal: 0.0,
    qrSipCount: 0,
    cardBancTotal: 0.0,
    cardBancCount: 0,
    debitSipTotal: 0.0,
    debitSipCount: 0,
    withdrawalsTotal: 0.0,
    withdrawalsCount: 0,
    cashRefundsTotal: 0.0,
    cashRefundsCount: 0,
    arqueoLines: [] as { label: string; amount: number }[],
    arqueoTotal: 0.0,
    discountTotal: 0.0,
    discountCount: 0,
    ticketsCount: 0
  };

  currentCart: any[] = [];
  selectedCartIndex = -1;
  currentCustomer = { doc: '0', name: '--', docType: 'Boleta', plate: '' };
  isMechanicPrice = false;
  nextQtyMultiplier = 1;
  currentPaymentBlocks: any[] = [];
  pendingQrMethodLabel = 'QR SIP';
  nextUniqueSaleId = 880002;
  nextUniqueReturnId = 990002;

  posScreenState = 'SALES';
  pendingSupOption: string | null = null;
  tempSupUser: any = null;
  tempCashEntries: { label: string; amount: number }[] = [];
  supSelectedIndex = 0;
  closeAfterVoucherAction: string | null = null;
  cashDigitsBuffer = '';

  supOptionsList = [
    { code: '03', label: '03. APERTURA CAJON' },
    { code: '09', label: '09. ARQUEO DE CAJA' },
    { code: '10', label: '10. FONDO FIJO' },
    { code: '11', label: '11. RETIRO' },
    { code: '19', label: '19. CIERRE DE CAJERO' },
    { code: '21', label: '21. REPORTE DE CAJEROS' },
    { code: '76', label: '76. CAMBIO CLAVE CAJERO' }
  ];

  returnOptionsList = [
    { code: '01', label: '01. DEVOLUCIÓN COMPLETA (Todos los productos de la boleta)' },
    { code: '02', label: '02. DEVOLUCIÓN PARCIAL (Ingresar código del producto a devolver)' }
  ];

  salesHistoryDB: any[] = [
    {
      uniqueId: '880001',
      serie: 'BJ83-011781',
      docType: 'Boleta',
      date: '24.10.26 09:10',
      cashierCode: '0019',
      cashierName: 'CRISTIAN ELINSON OLA',
      customerDoc: '45892104',
      customerName: 'CARLOS MENDOZA VARGAS (TOYOTA YARIS)',
      items: [
        { productId: 1, barcode: '671576', sku: 'FR-001', name: 'PASTILLA FRENO DEL. YARIS CERAMICA', qty: 1, returnedQty: 0, price: 95.0 },
        { productId: 3, barcode: '20391060', sku: 'MT-101', name: 'FILTRO ACEITE SELLADO TOYOTA 1NZ', qty: 2, returnedQty: 0, price: 35.0 }
      ],
      payments: [{ method: 'QR SIP', label: 'QR SIP', amount: 165.0 }],
      total: 165.0,
      change: 0.0,
      status: 'COMPLETADA',
      voucherHtml: ''
    }
  ];

  returnsHistoryDB: any[] = [
    {
      returnId: '990001',
      originalSaleId: '880000',
      date: '23.10.26 17:40',
      type: 'PARCIAL',
      customerName: 'TALLER MECANICO EL RAPIDO E.I.R.L.',
      customerDoc: '10458921041',
      cashierName: 'CRISTIAN ELINSON OLA',
      refundChannel: 'DIGITAL_EXTORNO (Yape/Plin/Transferencia por Sup.)',
      totalRefunded: 35.0,
      items: [{ barcode: '20391060', name: 'FILTRO ACEITE SELLADO TOYOTA 1NZ', qty: 1, price: 35.0 }],
      voucherHtml: ''
    }
  ];

  returnFlowState: any = {
    mode: 'COMPLETA',
    targetSale: null,
    itemsToReturn: [],
    refundChannel: 'DIGITAL_EXTORNO'
  };

  savedQuotes = [
    {
      id: 'COT-A4-001',
      date: '23/10/2026 09:15 AM',
      customerName: 'TALLER MECÁNICO EL RÁPIDO E.I.R.L.',
      customerDoc: '10458921041',
      plate: 'B7K-412 (Toyota Yaris 2018)',
      operator: 'CRISTIAN ELINSON OLA',
      items: [
        { sku: 'FR-001', name: 'PASTILLA FRENO DEL. YARIS CERAMICA', brand: 'Kashiyama', qty: 1, price: 95.0 },
        { sku: 'MT-101', name: 'FILTRO ACEITE SELLADO TOYOTA 1NZ', brand: 'Denso', qty: 2, price: 35.0 }
      ]
    },
    {
      id: 'COT-A4-002',
      date: '23/10/2026 10:30 AM',
      customerName: 'CARLOS MENDOZA VARGAS',
      customerDoc: '45892104',
      plate: 'M1T-889 (Nissan Sentra)',
      operator: 'CRISTIAN ELINSON OLA',
      items: [
        { sku: 'SP-201', name: 'AMORTIGUADOR DEL. DER. GAS SENTRA', brand: 'KYB Japón', qty: 2, price: 240.0 },
        { sku: 'EL-304', name: 'JUEGO 4 BUJIAS IRIDIUM NGK', brand: 'NGK', qty: 1, price: 160.0 }
      ]
    }
  ];

  isCashScreenState(state = this.posScreenState): boolean {
    return ['PAYMENT', 'FONDO_FIJO_INPUT', 'RETIRO_INPUT', 'ARQUEO_INPUT'].includes(state);
  }

  getUnitEffectivePrice(item: any): number {
    const prod = (this.inv.productsDB || []).find((p: any) => p.id === item.productId);
    const pubPrice = prod ? prod.price : item.price;
    const mechPrice = prod && prod.mechanicPrice ? prod.mechanicPrice : Math.round(pubPrice * 0.85 * 100) / 100;
    return this.isMechanicPrice ? mechPrice : pubPrice;
  }

  getCartTotal(): number {
    return this.currentCart.reduce((sum, item) => sum + this.getUnitEffectivePrice(item) * item.qty, 0);
  }

  getCartSavings(): number {
    if (!this.isMechanicPrice) return 0;
    return this.currentCart.reduce((sum, item) => sum + (item.price - this.getUnitEffectivePrice(item)) * item.qty, 0);
  }

  getTotalPaidInBlocks(): number {
    return this.currentPaymentBlocks.reduce((sum, b) => sum + b.amount, 0);
  }

  getRemainingToPay(): number {
    return Math.max(0, this.getCartTotal() - this.getTotalPaidInBlocks());
  }

  getCalculatedChange(): number {
    return Math.max(0, this.getTotalPaidInBlocks() - this.getCartTotal());
  }

  getCurrentCashInDrawer(): number {
    return Math.max(0, this.shiftState.fixedFund + this.shiftState.cashSalesTotal - this.shiftState.withdrawalsTotal - this.shiftState.cashRefundsTotal);
  }
}
