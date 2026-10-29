import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Inventario {
  productsDB = [
    { id: 1, barcode: '671576', sku: 'FR-001', oem: '04465-0D150', category: 'Frenos y Discos', name: 'PASTILLA FRENO DEL. YARIS CERAMICA', brand: 'Kashiyama', price: 95.0, mechanicPrice: 80.5, stock: 8, minStock: 3, location: 'Pasillo A - Estante 2', vehicles: 'Toyota Yaris 2015-2021, Etios' },
    { id: 2, barcode: '671577', sku: 'FR-002', oem: '04465-0D150', category: 'Frenos y Discos', name: 'PASTILLA FRENO DEL. YARIS ORIGINAL', brand: 'Toyota Genuine', price: 180.0, mechanicPrice: 153.0, stock: 0, minStock: 2, location: 'Pasillo A - Estante 1', vehicles: 'Toyota Yaris 2015-2021' },
    { id: 3, barcode: '20391060', sku: 'MT-101', oem: '90915-YZZE1', category: 'Filtros y Motor', name: 'FILTRO ACEITE SELLADO TOYOTA 1NZ', brand: 'Denso', price: 35.0, mechanicPrice: 29.5, stock: 22, minStock: 6, location: 'Pasillo B - Estante 1', vehicles: 'Toyota Yaris, Corolla, Hilux' },
    { id: 4, barcode: '22002050', sku: 'LB-401', oem: 'OIL-10W30-4L', category: 'Lubricantes y Fluidos', name: 'ACEITE SINTETICO 10W-30 GALON 4L', brand: 'Castrol', price: 145.0, mechanicPrice: 123.0, stock: 15, minStock: 5, location: 'Pasillo D - Zona Lubricantes', vehicles: 'Multimarca Gasolina / GLP' },
    { id: 5, barcode: '88401920', sku: 'SP-201', oem: '339114-KYB', category: 'Suspensión y Dirección', name: 'AMORTIGUADOR DEL. DER. GAS SENTRA', brand: 'KYB', price: 240.0, mechanicPrice: 204.0, stock: 4, minStock: 2, location: 'Pasillo C - Estante 4', vehicles: 'Nissan Sentra 2015-2020, Versa' },
    { id: 6, barcode: '99102341', sku: 'EL-304', oem: 'DILKAR6A11', category: 'Sistema Eléctrico y Bujías', name: 'JUEGO 4 BUJIAS IRIDIUM NGK', brand: 'NGK', price: 160.0, mechanicPrice: 136.0, stock: 2, minStock: 4, location: 'Vitrina Principal - N2', vehicles: 'Nissan Sentra, Toyota Corolla, Hyundai Elantra' },
    { id: 7, barcode: '77301122', sku: 'FR-009', oem: '43512-0D060', category: 'Frenos y Discos', name: 'DISCO DE FRENO VENTILADO DEL. YARIS', brand: 'Bosch', price: 130.0, mechanicPrice: 110.0, stock: 3, minStock: 4, location: 'Pasillo A - Estante 3', vehicles: 'Toyota Yaris 2014-2022' },
    { id: 8, barcode: '55401290', sku: 'MT-205', oem: '17801-21050', category: 'Filtros y Motor', name: 'FILTRO DE AIRE MOTOR COROLLA / YARIS', brand: 'Denso', price: 48.0, mechanicPrice: 40.0, stock: 0, minStock: 5, location: 'Pasillo B - Estante 2', vehicles: 'Toyota Yaris, Corolla 1.8' }
  ];

  activeInvSubtab = 'catalog';
  activeInvStatusSegment = 'ALL';
  catalogOEMFilter: string | null = null;

  weekdayCategoriesMap: Record<number, { dayName: string; category: string; hours: string }> = {
    1: { dayName: 'Lunes', category: 'Frenos y Discos', hours: '08:00 AM - 10:30 AM' },
    2: { dayName: 'Martes', category: 'Filtros y Motor', hours: '08:00 AM - 10:30 AM' },
    3: { dayName: 'Miércoles', category: 'Suspensión y Dirección', hours: '08:00 AM - 10:30 AM' },
    4: { dayName: 'Jueves', category: 'Sistema Eléctrico y Bujías', hours: '08:00 AM - 10:30 AM' },
    5: { dayName: 'Viernes', category: 'Lubricantes y Fluidos', hours: '08:00 AM - 10:30 AM' }
  };

  selectedCountDay = 1;
  currentCycleWeekNumber = 14;
  currentPhysicalCountsMap: Record<number, number> = {};

  inventoryCountReportsDB = [
    {
      reportId: 'CNT-2026-001',
      date: '23/10/2026 09:45 AM',
      dayName: 'Lunes',
      category: 'Frenos y Discos',
      supervisorName: 'ESTEFANY NATALIA NEC',
      status: 'PENDIENTE_AJUSTE',
      items: [
        { productId: 1, barcode: '671576', sku: 'FR-001', name: 'PASTILLA FRENO DEL. YARIS CERAMICA', systemStock: 8, physicalCount: 7, diffQty: -1, unitPrice: 95.0, diffMoney: -95.0 },
        { productId: 7, barcode: '77301122', sku: 'FR-009', name: 'DISCO DE FRENO VENTILADO DEL. YARIS', systemStock: 3, physicalCount: 3, diffQty: 0, unitPrice: 130.0, diffMoney: 0.0 }
      ],
      netMoneyDiff: -95.0
    }
  ];

  merchandiseEntriesDB = [
    { date: '24/10/2026 08:15 AM', barcode: '20391060', sku: 'MT-101', name: 'FILTRO ACEITE SELLADO TOYOTA 1NZ', addedQty: 12, docRef: 'Guía GR01-00891 Denso Perú', operator: 'ESTEFANY NATALIA NEC' }
  ];
}
