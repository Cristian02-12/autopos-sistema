import { Component, AfterViewInit, inject } from '@angular/core';
import { Auth } from '../../../core/services/auth';
import { Inventario } from '../../../core/services/inventario';

@Component({
  imports: [],
  standalone: true,
  selector: 'app-conteo-ciclico',
  styleUrl: './conteo-ciclico.css',
  templateUrl: './conteo-ciclico.html',
})
export class ConteoCiclico implements AfterViewInit {
  private auth = inject(Auth);
  private inv = inject(Inventario);

  ngAfterViewInit(): void {
    const win = window as any;

    win.changeCountDay = (dayVal: string) => {
      this.inv.selectedCountDay = parseInt(dayVal, 10);
      (document.getElementById('count-day-selector') as HTMLSelectElement).value = String(this.inv.selectedCountDay);
      this.inv.currentPhysicalCountsMap = {};
      win.renderInventoryCountSubtab();
    };

    win.advanceNextWeekCycle = () => {
      this.inv.currentCycleWeekNumber++;
      this.inv.selectedCountDay = 1;
      (document.getElementById('count-day-selector') as HTMLSelectElement).value = '1';
      document.getElementById('count-cycle-week-label')!.textContent = `Ciclo Anual: Semana #${this.inv.currentCycleWeekNumber} (Continuo)`;
      this.inv.currentPhysicalCountsMap = {};
      win.renderInventoryCountSubtab();
      this.auth.showToast(`Ciclo avanzado al Lunes de la Semana #${this.inv.currentCycleWeekNumber}.`, 'info');
    };

    win.renderInventoryCountSubtab = () => {
      const weekendBlocker = document.getElementById('count-weekend-blocker')!;
      const weekdayWorkspace = document.getElementById('count-weekday-workspace')!;

      if (this.inv.selectedCountDay === 0 || this.inv.selectedCountDay === 6) {
        weekendBlocker.classList.remove('hidden');
        weekdayWorkspace.classList.add('hidden');
        return;
      }

      weekendBlocker.classList.add('hidden');
      weekdayWorkspace.classList.remove('hidden');

      const schedule = this.inv.weekdayCategoriesMap[this.inv.selectedCountDay];
      document.getElementById('count-active-cat-badge')!.textContent = `${schedule.dayName.toUpperCase()} • ${schedule.hours}`;
      document.getElementById('count-active-title')!.textContent = `Categoría Asignada: ${schedule.category}`;

      const categoryProducts = this.inv.productsDB.filter(p => p.category === schedule.category);
      const tbody = document.getElementById('count-items-tbody')!;

      let totalMissingUnits = 0;
      let totalSurplusUnits = 0;
      let netMoneyImpact = 0;

      tbody.innerHTML = categoryProducts
        .map(p => {
          if (this.inv.currentPhysicalCountsMap[p.id] === undefined) {
            this.inv.currentPhysicalCountsMap[p.id] = p.stock;
          }
          const counted = this.inv.currentPhysicalCountsMap[p.id];
          const diff = counted - p.stock;
          const moneyImpact = diff * p.price;

          if (diff < 0) totalMissingUnits += Math.abs(diff);
          if (diff > 0) totalSurplusUnits += diff;
          netMoneyImpact += moneyImpact;

          const diffBadge = diff === 0
            ? `<span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black">0 (Cuadra)</span>`
            : diff < 0
              ? `<span class="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-black">${diff} (Falta)</span>`
              : `<span class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-black">+${diff} (Sobra)</span>`;

          return `
            <tr class="hover:bg-slate-50">
                <td class="py-3 px-4">
                    <span class="font-bold text-slate-900 block">${p.name}</span>
                    <span class="text-[10px] text-indigo-600 font-bold">Barra: ${p.barcode} | SKU: ${p.sku}</span>
                </td>
                <td class="py-3 px-4 text-slate-600 font-sans">${p.location}</td>
                <td class="py-3 px-3 text-center font-black text-slate-800">${p.stock}</td>
                <td class="py-3 px-3 text-center">
                    <input type="number" min="0" value="${counted}" 
                           oninput="updatePhysicalCountInput(${p.id}, this.value)"
                           class="w-20 p-1.5 text-center bg-amber-50 border-2 border-indigo-600 rounded-lg font-black text-slate-900">
                </td>
                <td class="py-3 px-3 text-center">${diffBadge}</td>
                <td class="py-3 px-4 text-right font-black ${moneyImpact < 0 ? 'text-rose-700' : moneyImpact > 0 ? 'text-blue-700' : 'text-emerald-700'}">
                    ${moneyImpact >= 0 ? '+' : ''}S/ ${moneyImpact.toFixed(2)}
                </td>
            </tr>
          `;
        })
        .join('');

      document.getElementById('count-summary-totals')!.innerHTML = `
        <span>Faltantes: <strong class="text-rose-600">${totalMissingUnits} uds</strong></span> • 
        <span>Sobrantes: <strong class="text-blue-600">${totalSurplusUnits} uds</strong></span> • 
        <span>Balance Monetario: <strong class="${netMoneyImpact < 0 ? 'text-rose-700' : 'text-emerald-700'}">S/ ${netMoneyImpact.toFixed(2)}</strong></span>
      `;

      win.renderCountReportsList();
    };

    win.updatePhysicalCountInput = (productId: number, val: string) => {
      const parsed = parseInt(val, 10);
      this.inv.currentPhysicalCountsMap[productId] = isNaN(parsed) || parsed < 0 ? 0 : parsed;
      win.renderInventoryCountSubtab();
    };

    win.submitDailyInventoryCountReport = () => {
      const schedule = this.inv.weekdayCategoriesMap[this.inv.selectedCountDay];
      const categoryProducts = this.inv.productsDB.filter(p => p.category === schedule.category);
      if (categoryProducts.length === 0) return;

      const reportItems = categoryProducts.map(p => {
        const counted = this.inv.currentPhysicalCountsMap[p.id] ?? p.stock;
        const diffQty = counted - p.stock;
        return {
          productId: p.id,
          barcode: p.barcode,
          sku: p.sku,
          name: p.name,
          systemStock: p.stock,
          physicalCount: counted,
          diffQty,
          unitPrice: p.price,
          diffMoney: diffQty * p.price
        };
      });

      const netMoney = reportItems.reduce((s, i) => s + i.diffMoney, 0);
      const hasDiscrepancies = reportItems.some(i => i.diffQty !== 0);

      const newReport = {
        reportId: `CNT-2026-00${this.inv.inventoryCountReportsDB.length + 1}`,
        date: this.auth.getFormattedDateTime(),
        dayName: schedule.dayName,
        category: schedule.category,
        supervisorName: this.auth.currentUser.name,
        status: hasDiscrepancies ? 'PENDIENTE_AJUSTE' : 'SIN_NOVEDAD',
        items: reportItems,
        netMoneyDiff: netMoney
      };

      this.inv.inventoryCountReportsDB.unshift(newReport);
      win.renderCountReportsList();
      win.updateNotificationBadges?.();
      this.auth.showToast(`📋 Reporte ${newReport.reportId} (${schedule.category}) enviado al Dueño y al Programador.`, 'success');
    };

    win.renderCountReportsList = () => {
      const list = document.getElementById('count-reports-list');
      if (!list) return;
      const canAdjust = this.auth.currentUser.role === 'DUENO' || this.auth.currentUser.role === 'PROGRAMADOR';

      list.innerHTML = this.inv.inventoryCountReportsDB
        .map(rep => {
          const statusBadge = rep.status === 'PENDIENTE_AJUSTE'
            ? `<span class="bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded text-[10px]">⚠️ PENDIENTE DE AJUSTE</span>`
            : rep.status === 'AJUSTADO'
              ? `<span class="bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded text-[10px]">✅ STOCK AJUSTADO</span>`
              : `<span class="bg-blue-100 text-blue-800 font-black px-2 py-0.5 rounded text-[10px]">✓ CONTEO EXACTO (0 DIF)</span>`;

          const linesHtml = rep.items
            .map(i => `
              <div class="flex justify-between text-[11px] font-mono-code py-0.5 border-b border-slate-100">
                  <span class="truncate max-w-[160px]">${i.name}</span>
                  <span>Sist: ${i.systemStock} | Fís: <strong>${i.physicalCount}</strong> (${i.diffQty >= 0 ? '+' : ''}${i.diffQty})</span>
              </div>
            `)
            .join('');

          const adjustBtn = rep.status === 'PENDIENTE_AJUSTE' && canAdjust
            ? `<button onclick="applyCountReportAdjustment('${rep.reportId}')" class="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-[11px] shadow">
                <i class="fa-solid fa-wrench mr-1"></i> Aplicar Ajuste de Stock (${this.auth.currentUser.role})
               </button>`
            : rep.status === 'PENDIENTE_AJUSTE'
              ? `<p class="text-[10px] text-amber-700 font-bold mt-1.5 italic">⏳ Enviado al Dueño y Programador para ajuste oficial.</p>`
              : '';

          return `
            <div class="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div class="flex items-center justify-between">
                    <span class="font-mono-code font-black text-indigo-700">${rep.reportId} • ${rep.dayName}</span>
                    ${statusBadge}
                </div>
                <p class="text-[11px] font-bold text-slate-800">Categoría: ${rep.category}</p>
                <p class="text-[10px] text-slate-500">Contado por: ${rep.supervisorName} • ${rep.date}</p>
                <div class="bg-white p-2 rounded-lg border border-slate-200">${linesHtml}</div>
                <div class="flex justify-between font-mono-code font-bold text-[11px] pt-1">
                    <span>Diferencia Valorizada:</span>
                    <span class="${rep.netMoneyDiff < 0 ? 'text-rose-700' : 'text-emerald-700'}">${rep.netMoneyDiff >= 0 ? '+' : ''}S/ ${rep.netMoneyDiff.toFixed(2)}</span>
                </div>
                ${adjustBtn}
            </div>
          `;
        })
        .join('');
    };

    win.applyCountReportAdjustment = (reportId: string) => {
      if (this.auth.currentUser.role !== 'DUENO' && this.auth.currentUser.role !== 'PROGRAMADOR') {
        this.auth.showToast('Solo el Dueño y el Programador pueden ejecutar el ajuste de inventario.', 'warning');
        return;
      }
      const rep = this.inv.inventoryCountReportsDB.find(r => r.reportId === reportId);
      if (!rep) return;

      rep.items.forEach(item => {
        const prod = this.inv.productsDB.find(p => p.id === item.productId);
        if (prod) prod.stock = item.physicalCount;
      });
      rep.status = 'AJUSTADO';
      win.renderInventoryCountSubtab();
      win.renderInventoryModule?.();
      win.updateNotificationBadges?.();
      this.auth.showToast(`✅ Ajuste del reporte ${reportId} aplicado al Stock del sistema por ${this.auth.currentUser.name}.`, 'success');
    };
  }
}
