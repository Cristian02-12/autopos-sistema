import { Component, AfterViewInit, inject } from '@angular/core';
import { Auth } from '../../../core/services/auth';
import { CajaNcr } from '../../../core/services/caja-ncr';
import { TicketsSoporte } from '../../../core/services/tickets-soporte';

@Component({
  imports: [],
  standalone: true,
  selector: 'app-panel-dueno-reportes',
  styleUrl: './panel-dueno-reportes.css',
  templateUrl: './panel-dueno-reportes.html',
})
export class PanelDuenoReportes implements AfterViewInit {
  private auth = inject(Auth);
  private caja = inject(CajaNcr);
  private tickets = inject(TicketsSoporte);

  ngAfterViewInit(): void {
    const win = window as any;

    win.setOwnerPeriod = (period: string) => {
      this.tickets.activeOwnerPeriod = period;
      ['DAY', 'WEEK', 'MONTH', 'YEAR'].forEach(p => {
        const btn = document.getElementById(`owner-period-${p}`);
        if (btn) {
          btn.className = p === period
            ? 'px-3 py-1.5 rounded-lg font-black bg-amber-400 text-slate-950 shadow'
            : 'px-3 py-1.5 rounded-lg font-bold text-slate-300 hover:text-white';
        }
      });
      win.renderOwnerModule();
    };

    const getOwnerAnalyticsData = () => {
      const liveDaySales = this.caja.salesHistoryDB.reduce((s, x) => s + x.total, 0);
      const liveCount = this.caja.salesHistoryDB.length;
      const datasets: Record<string, any> = {
        DAY: {
          title: 'Gráfico de Evolución de Ventas por Hora — Hoy',
          kpiLabel: 'Ventas Brutas (Hoy)',
          totalSales: Math.max(1480.0, liveDaySales + 1315.0),
          tickets: liveCount + 14,
          cashRatio: 0.58,
          bars: [
            { label: '08-10h', val: 280 },
            { label: '10-12h', val: 420 },
            { label: '12-14h', val: 310 },
            { label: '14-16h', val: 195 },
            { label: '16-18h', val: 275 + liveDaySales }
          ],
          categories: [
            { name: 'Frenos y Pastillas', pct: 38, amount: 562.4 },
            { name: 'Filtros y Motor', pct: 27, amount: 399.6 },
            { name: 'Lubricantes y Fluidos', pct: 20, amount: 296.0 },
            { name: 'Suspensión y Eléctrico', pct: 15, amount: 222.0 }
          ]
        },
        WEEK: {
          title: 'Gráfico de Evolución de Ventas — Esta Semana (Lunes a Sábado)',
          kpiLabel: 'Ventas Brutas (Semana)',
          totalSales: 9840.0 + liveDaySales,
          tickets: 86 + liveCount,
          cashRatio: 0.52,
          bars: [
            { label: 'Lun', val: 1520 },
            { label: 'Mar', val: 1680 },
            { label: 'Mié', val: 1410 },
            { label: 'Jue', val: 1790 },
            { label: 'Vie', val: 1960 },
            { label: 'Sáb', val: 1480 + liveDaySales }
          ],
          categories: [
            { name: 'Frenos y Pastillas', pct: 35, amount: 3444.0 },
            { name: 'Lubricantes y Fluidos', pct: 28, amount: 2755.2 },
            { name: 'Filtros y Motor', pct: 22, amount: 2164.8 },
            { name: 'Suspensión y Eléctrico', pct: 15, amount: 1476.0 }
          ]
        },
        MONTH: {
          title: 'Gráfico de Evolución de Ventas — Este Mes (4 Semanas)',
          kpiLabel: 'Ventas Brutas (Mes Actual)',
          totalSales: 42650.0 + liveDaySales,
          tickets: 364 + liveCount,
          cashRatio: 0.49,
          bars: [
            { label: 'Sem 1', val: 9800 },
            { label: 'Sem 2', val: 11200 },
            { label: 'Sem 3', val: 11810 },
            { label: 'Sem 4', val: 9840 + liveDaySales }
          ],
          categories: [
            { name: 'Frenos y Discos', pct: 34, amount: 14501.0 },
            { name: 'Suspensión KYB', pct: 26, amount: 11089.0 },
            { name: 'Lubricantes Castrol', pct: 24, amount: 10236.0 },
            { name: 'Filtros y Bujías', pct: 16, amount: 6824.0 }
          ]
        },
        YEAR: {
          title: 'Gráfico de Evolución Anual de Ventas — Año 2026',
          kpiLabel: 'Ventas Brutas (Año 2026)',
          totalSales: 468900.0 + liveDaySales,
          tickets: 4120 + liveCount,
          cashRatio: 0.47,
          bars: [
            { label: 'Ene-Feb', val: 72400 },
            { label: 'Mar-Abr', val: 78900 },
            { label: 'May-Jun', val: 81200 },
            { label: 'Jul-Ago', val: 86500 },
            { label: 'Sep-Oct', val: 84900 + liveDaySales },
            { label: 'Nov-Dic (Proy)', val: 65000 }
          ],
          categories: [
            { name: 'Frenos y Discos', pct: 36, amount: 168804.0 },
            { name: 'Suspensión y Dirección', pct: 25, amount: 117225.0 },
            { name: 'Lubricantes y Fluidos', pct: 22, amount: 103158.0 },
            { name: 'Filtros y Eléctrico', pct: 17, amount: 79713.0 }
          ]
        }
      };
      return datasets[this.tickets.activeOwnerPeriod];
    };

    win.renderOwnerModule = () => {
      const data = getOwnerAnalyticsData();
      const avgTicket = data.totalSales / Math.max(1, data.tickets);
      const cashAmt = data.totalSales * data.cashRatio;
      const digAmt = data.totalSales - cashAmt;
      const netProfit = data.totalSales * 0.34;

      document.getElementById('owner-kpi-label-1')!.textContent = data.kpiLabel;
      document.getElementById('owner-kpi-sales')!.textContent = `S/ ${data.totalSales.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      document.getElementById('owner-kpi-tickets')!.textContent = String(data.tickets);
      document.getElementById('owner-kpi-avg')!.textContent = `Ticket Promedio: S/ ${avgTicket.toFixed(2)}`;
      document.getElementById('owner-kpi-cash-vs-dig')!.textContent = `Efec: S/ ${Math.round(cashAmt)} | Dig: S/ ${Math.round(digAmt)}`;
      document.getElementById('owner-kpi-profit')!.textContent = `S/ ${netProfit.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      document.getElementById('owner-chart-title')!.textContent = data.title;

      const maxVal = Math.max(...data.bars.map((b: any) => b.val), 1);
      document.getElementById('owner-bar-chart')!.innerHTML = data.bars
        .map((b: any) => {
          const heightPct = Math.max(12, Math.round((b.val / maxVal) * 100));
          return `
            <div class="flex-1 flex flex-col items-center justify-end h-full group relative">
                <span class="text-[10px] font-mono-code font-black text-slate-700 mb-1">S/ ${b.val.toLocaleString('es-PE')}</span>
                <div style="height: ${heightPct}%" class="w-full max-w-[54px] bg-gradient-to-t from-indigo-700 to-amber-500 rounded-t-xl shadow group-hover:brightness-110 transition-all"></div>
            </div>
          `;
        })
        .join('');

      document.getElementById('owner-bar-labels')!.innerHTML = data.bars.map((b: any) => `<span class="flex-1 text-center">${b.label}</span>`).join('');
      document.getElementById('owner-category-breakdown')!.innerHTML = data.categories
        .map((c: any) => `<div class="space-y-1"><div class="flex justify-between font-bold text-slate-800"><span>${c.name}</span><span class="font-mono-code text-indigo-700">${c.pct}% (S/ ${c.amount.toLocaleString('es-PE')})</span></div><div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden"><div style="width: ${c.pct}%" class="h-full bg-indigo-600 rounded-full"></div></div></div>`)
        .join('');

      const fundChips = document.getElementById('owner-fund-vouchers-Chips');
      if (fundChips) {
        fundChips.innerHTML = this.tickets.fixedFundRecordsDB
          .filter(f => f.status === 'ACTIVO')
          .map(f => `<button type="button" onclick="fillOwnerFundTicket('${f.cashierCode}', '${f.voucherCode}', ${f.amount})" class="px-2.5 py-1 rounded-lg bg-white border border-rose-300 hover:bg-rose-50 font-mono-code text-[10px] font-bold text-rose-800">${f.voucherCode} (Cajero ${f.cashierCode}: S/ ${f.amount.toFixed(2)})</button>`)
          .join('') || `<span class="text-slate-400 italic">No hay fondos fijos activos</span>`;
      }

      const retChips = document.getElementById('owner-withdrawal-vouchers-chips');
      if (retChips) {
        retChips.innerHTML = this.tickets.withdrawalRecordsDB
          .map(r => `<button type="button" onclick="fillOwnerWithdrawalTicket('${r.cashierCode}', '${r.cashierDni}', '${r.voucherCode}', ${r.amount})" class="px-2.5 py-1 rounded-lg bg-white border border-indigo-300 hover:bg-indigo-50 font-mono-code text-[10px] font-bold text-indigo-800">${r.voucherCode} (DNI ${r.cashierDni}: S/ ${r.amount.toFixed(2)})</button>`)
          .join('') || `<span class="text-slate-400 italic">No hay retiros registrados</span>`;
      }
    };

    win.fillOwnerFundTicket = (cashierCode: string, voucherCode: string, amount: number) => {
      (document.getElementById('tk-fund-cashier') as HTMLInputElement).value = cashierCode;
      (document.getElementById('tk-fund-voucher') as HTMLInputElement).value = voucherCode;
      (document.getElementById('tk-fund-note') as HTMLInputElement).value = `Eliminar fondo fijo erróneo/adicional de S/ ${amount.toFixed(2)} (Baucher ${voucherCode})`;
    };

    win.fillOwnerWithdrawalTicket = (cashierCode: string, dni: string, voucherCode: string, amount: number) => {
      const suggestedRound = Math.floor(amount / 10) * 10;
      (document.getElementById('tk-ret-cashier') as HTMLInputElement).value = cashierCode;
      (document.getElementById('tk-ret-dni') as HTMLInputElement).value = dni;
      (document.getElementById('tk-ret-voucher') as HTMLInputElement).value = voucherCode;
      (document.getElementById('tk-ret-target-amount') as HTMLInputElement).value = String(suggestedRound);
      (document.getElementById('tk-ret-note') as HTMLInputElement).value = `Cajero digitó por error S/ ${amount.toFixed(2)} en lugar del monto redondo S/ ${suggestedRound.toFixed(2)}`;
    };

    win.createFundDeletionTicket = (e: Event) => {
      e.preventDefault();
      const cashierCode = (document.getElementById('tk-fund-cashier') as HTMLInputElement).value.trim();
      const voucherCode = (document.getElementById('tk-fund-voucher') as HTMLInputElement).value.trim().toUpperCase();
      const note = (document.getElementById('tk-fund-note') as HTMLInputElement).value.trim();
      const foundFund = this.tickets.fixedFundRecordsDB.find(f => f.voucherCode === voucherCode);

      const newTicket = {
        ticketId: `TK-00${this.tickets.programmerTicketsDB.length + 1}`,
        type: 'ELIMINAR_FONDO',
        createdAt: this.auth.getFormattedDateTime(),
        createdBy: this.auth.currentUser.name,
        cashierCode,
        cashierDni: '--',
        voucherCode,
        currentAmount: foundFund ? foundFund.amount : 150.0,
        targetAmount: 0.0,
        note,
        status: 'PENDIENTE'
      };
      this.tickets.programmerTicketsDB.unshift(newTicket);
      win.updateNotificationBadges?.();
      this.auth.showToast(`🎫 Ticket ${newTicket.ticketId} enviado al Programador para eliminar el Fondo Fijo ${voucherCode}.`, 'success');
      (e.target as HTMLFormElement).reset();
    };

    win.createWithdrawalCorrectionTicket = (e: Event) => {
      e.preventDefault();
      const cashierCode = (document.getElementById('tk-ret-cashier') as HTMLInputElement).value.trim();
      const dni = (document.getElementById('tk-ret-dni') as HTMLInputElement).value.trim();
      const voucherCode = (document.getElementById('tk-ret-voucher') as HTMLInputElement).value.trim().toUpperCase();
      const targetAmount = parseFloat((document.getElementById('tk-ret-target-amount') as HTMLInputElement).value) || 400;
      const note = (document.getElementById('tk-ret-note') as HTMLInputElement).value.trim();
      const foundRet = this.tickets.withdrawalRecordsDB.find(r => r.voucherCode === voucherCode);

      const newTicket = {
        ticketId: `TK-00${this.tickets.programmerTicketsDB.length + 1}`,
        type: 'CORREGIR_RETIRO',
        createdAt: this.auth.getFormattedDateTime(),
        createdBy: this.auth.currentUser.name,
        cashierCode,
        cashierDni: dni,
        voucherCode,
        currentAmount: foundRet ? foundRet.amount : 401.0,
        targetAmount,
        note,
        status: 'PENDIENTE'
      };
      this.tickets.programmerTicketsDB.unshift(newTicket);
      win.updateNotificationBadges?.();
      this.auth.showToast(`🎫 Ticket ${newTicket.ticketId} enviado al Programador para corregir el Retiro ${voucherCode}.`, 'success');
    };

    win.exportOwnerReportExcel = () => {
      const data = getOwnerAnalyticsData();
      let csvContent = 'Periodo,Segmento,Monto_Soles\n';
      data.bars.forEach((b: any) => (csvContent += `${this.tickets.activeOwnerPeriod},${b.label},${b.val.toFixed(2)}\n`));
      csvContent += `\nCategoria,Porcentaje,Monto_Soles\n`;
      data.categories.forEach((c: any) => (csvContent += `"${c.name}",${c.pct}%,${c.amount.toFixed(2)}\n`));

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Ejecutivo_AutoPOS_${this.tickets.activeOwnerPeriod}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      this.auth.showToast('📊 Reporte descargado en formato Excel (.CSV)', 'success');
    };

    win.exportOwnerReportPDF = () => {
      const data = getOwnerAnalyticsData();
      const cfg = this.auth.systemConfig;
      const rowsHtml = data.bars.map((b: any) => `<tr class="border-b border-slate-200"><td class="py-2 px-3 font-bold">${b.label}</td><td class="py-2 px-3 text-right font-mono-code font-bold">S/ ${b.val.toFixed(2)}</td></tr>`).join('');
      document.getElementById('a4-quote-printable')!.innerHTML = `
        <div class="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
                <h1 class="text-xl font-black text-slate-900">${cfg.companyName}</h1>
                <p class="text-xs text-slate-600">REPORTE EJECUTIVO DE VENTAS (${data.kpiLabel.toUpperCase()})</p>
            </div>
            <div class="text-right font-mono-code text-xs">
                <p class="font-bold">Emitido por: ${this.auth.currentUser.name}</p>
                <p>${this.auth.getFormattedDateTime()}</p>
            </div>
        </div>
        <div class="grid grid-cols-3 gap-4 my-4 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono-code">
            <div><span class="text-[10px] text-slate-500 block">VENTAS TOTALES</span><strong class="text-lg">S/ ${data.totalSales.toFixed(2)}</strong></div>
            <div><span class="text-[10px] text-slate-500 block">TRANSACCIONES</span><strong class="text-lg">${data.tickets}</strong></div>
            <div><span class="text-[10px] text-slate-500 block">UTILIDAD NETA (34%)</span><strong class="text-lg text-emerald-700">S/ ${(data.totalSales * 0.34).toFixed(2)}</strong></div>
        </div>
        <table class="w-full text-left border-collapse text-xs">
            <thead>
                <tr class="bg-slate-900 text-white"><th class="py-2 px-3">Tramo / Período</th><th class="py-2 px-3 text-right">Ventas Registradas (S/)</th></tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
        </table>
      `;
      document.getElementById('a4-quote-modal')?.classList.remove('hidden');
      this.auth.showToast('Vista PDF A4 lista. Haz clic en "Imprimir en Hoja A4" para guardar como PDF.', 'info');
    };
  }
}
