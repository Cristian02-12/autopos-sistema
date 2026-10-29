import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TicketsSoporte {
  activeOwnerPeriod = 'DAY';

  fixedFundRecordsDB = [
    { voucherCode: 'FF-5635', cashierCode: '0019', cashierName: 'CRISTIAN ELINSON OLA', amount: 150.0, date: '24.10.26 08:20', status: 'ACTIVO', note: 'Fondo fijo inicial de apertura' },
    { voucherCode: 'FF-5636', cashierCode: '0019', cashierName: 'CRISTIAN ELINSON OLA', amount: 180.0, date: '24.10.26 08:25', status: 'ACTIVO', note: 'Fondo fijo adicional ingresado por error (>150)' }
  ];

  withdrawalRecordsDB = [
    { voucherCode: 'RET-5640', cashierCode: '0019', cashierName: 'CRISTIAN ELINSON OLA', cashierDni: '73075981', amount: 401.0, date: '24.10.26 12:50', status: 'ACTIVO', note: 'Retiro digitado como 401.00 por error (debió ser 400.00)' }
  ];

  programmerTicketsDB = [
    { ticketId: 'TK-001', type: 'ELIMINAR_FONDO', createdAt: '24/10/2026 10:15 AM', createdBy: 'ROBERTO GOMEZ (DUEÑO)', cashierCode: '0019', cashierDni: '73075981', voucherCode: 'FF-5636', currentAmount: 180.0, targetAmount: 0.0, note: 'El cajero 0019 registró un segundo fondo fijo adicional de S/ 180.00 por error. Eliminar para no descuadrar su cierre.', status: 'PENDIENTE' },
    { ticketId: 'TK-002', type: 'CORREGIR_RETIRO', createdAt: '24/10/2026 12:55 PM', createdBy: 'ROBERTO GOMEZ (DUEÑO)', cashierCode: '0019', cashierDni: '73075981', voucherCode: 'RET-5640', currentAmount: 401.0, targetAmount: 400.0, note: 'El cajero digitó S/ 401.00 en su retiro en lugar del monto exacto y redondo S/ 400.00. Corregir baucher RET-5640.', status: 'PENDIENTE' }
  ];
}
