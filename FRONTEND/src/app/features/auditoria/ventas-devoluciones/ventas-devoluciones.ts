import { Component, AfterViewInit, ViewEncapsulation, inject } from '@angular/core';
import { Auth } from '../../../core/services/auth';
import { CajaNcr } from '../../../core/services/caja-ncr';

@Component({
  imports: [],
  standalone: true,
  selector: 'app-ventas-devoluciones',
  styleUrl: './ventas-devoluciones.css',
  templateUrl: './ventas-devoluciones.html',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'contents' }
})
export class VentasDevoluciones implements AfterViewInit {
  private auth = inject(Auth);
  private caja = inject(CajaNcr);

  ngAfterViewInit(): void {
    const win = window as any;

    win.renderAuditModule = () => {
      const sQuery = ((document.getElementById('audit-sales-search') as HTMLInputElement)?.value || '').trim().toLowerCase();
      const sDate = ((document.getElementById('audit-sales-date') as HTMLInputElement)?.value || '').trim().toLowerCase();

      const filteredSales = this.caja.salesHistoryDB.filter(s => {
        const matchText = !sQuery || `${s.uniqueId} ${s.serie} ${s.customerName} ${s.customerDoc} ${s.cashierName}`.toLowerCase().includes(sQuery);
        const matchDate = !sDate || s.date.toLowerCase().includes(sDate);
        return matchText && matchDate;
      });

      const salesCountEl = document.getElementById('audit-sales-count');
      if (salesCountEl) salesCountEl.textContent = `${filteredSales.length} Venta(s)`;

      const salesListEl = document.getElementById('audit-sales-list');
      if (salesListEl) {
        salesListEl.innerHTML = filteredSales
          .map(s => {
            const methodsText = s.payments.map((p: any) => `${p.label || p.method}: S/ ${p.amount.toFixed(2)}`).join(' | ');
            return `
              <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-all space-y-2">
                  <div class="flex items-center justify-between">
                      <div>
                          <span class="font-mono-code font-black text-xs bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded">ID QR: ${s.uniqueId}</span>
                          <span class="font-mono-code font-bold text-slate-700 ml-1">${s.serie} (${s.docType})</span>
                      </div>
                      <span class="text-[11px] font-mono-code text-slate-500">${s.date}</span>
                  </div>
                  <div class="flex justify-between items-center">
                      <div>
                          <p class="font-bold text-slate-900">${s.customerName} <span class="font-mono-code text-slate-500">(${s.customerDoc})</span></p>
                          <p class="text-[11px] text-slate-500">Cajero: ${s.cashierName} • Pagos: ${methodsText}</p>
                      </div>
                      <span class="font-mono-code font-black text-sm text-emerald-700">S/ ${s.total.toFixed(2)}</span>
                  </div>
                  <div class="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span class="text-[10px] font-extrabold px-2 py-0.5 rounded ${s.status === 'COMPLETADA' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${s.status}</span>
                      <div class="flex gap-1.5">
                          <button onclick="viewSaleVoucherFromAudit('${s.uniqueId}')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-[11px]">
                              <i class="fa-solid fa-receipt mr-1"></i>Ver Baucher
                          </button>
                          <button onclick="sendSaleToReturnFromAudit('${s.uniqueId}', 'COMPLETA')" class="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-[11px]">
                              Devolución
                          </button>
                      </div>
                  </div>
              </div>
            `;
          })
          .join('') || `<p class="text-center text-slate-400 py-6">No se encontraron ventas con ese filtro.</p>`;
      }

      const rQuery = ((document.getElementById('audit-returns-search') as HTMLInputElement)?.value || '').trim().toLowerCase();
      const rDate = ((document.getElementById('audit-returns-date') as HTMLInputElement)?.value || '').trim().toLowerCase();

      const filteredReturns = this.caja.returnsHistoryDB.filter(r => {
        const matchText = !rQuery || `${r.returnId} ${r.originalSaleId} ${r.customerName} ${r.customerDoc} ${r.type}`.toLowerCase().includes(rQuery);
        const matchDate = !rDate || r.date.toLowerCase().includes(rDate);
        return matchText && matchDate;
      });

      const returnsCountEl = document.getElementById('audit-returns-count');
      if (returnsCountEl) returnsCountEl.textContent = `${filteredReturns.length} Devolución(es)`;

      const returnsListEl = document.getElementById('audit-returns-list');
      if (returnsListEl) {
        returnsListEl.innerHTML = filteredReturns
          .map(r => `
            <div class="p-3.5 rounded-xl border border-rose-200 bg-rose-50/30 hover:bg-white transition-all space-y-2">
                <div class="flex items-center justify-between">
                    <div>
                        <span class="font-mono-code font-black text-xs bg-rose-100 text-rose-900 px-2 py-0.5 rounded">ID DEV: ${r.returnId}</span>
                        <span class="font-mono-code font-bold text-slate-700 ml-1">Boleta Origen: ${r.originalSaleId}</span>
                    </div>
                    <span class="text-[11px] font-mono-code text-slate-500">${r.date}</span>
                </div>
                <div class="flex justify-between items-center">
                    <div>
                        <p class="font-bold text-slate-900">${r.customerName}</p>
                        <p class="text-[11px] text-slate-600">Modalidad: <strong>${r.type}</strong> • Canal: ${r.refundChannel}</p>
                    </div>
                    <span class="font-mono-code font-black text-sm text-rose-700">-S/ ${r.totalRefunded.toFixed(2)}</span>
                </div>
                <div class="flex justify-end pt-2 border-t border-rose-100">
                    <button onclick="viewReturnVoucherFromAudit('${r.returnId}')" class="px-2.5 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px]">
                        <i class="fa-solid fa-receipt mr-1"></i>Ver Baucher Devolución
                    </button>
                </div>
            </div>
          `)
          .join('') || `<p class="text-center text-slate-400 py-6">No se encontraron devoluciones con ese filtro.</p>`;
      }
    };

    win.viewSaleVoucherFromAudit = (uniqueId: string) => {
      const s = this.caja.salesHistoryDB.find(x => x.uniqueId === uniqueId);
      if (!s) return;
      const cfg = this.auth.systemConfig;
      const usr = this.auth.currentUser;
      const opGravada = s.total / 1.18;
      const igv = s.total - opGravada;
      const totalUnits = s.items.reduce((acc: number, i: any) => acc + i.qty, 0);
      const totalPaid = s.payments.reduce((acc: number, p: any) => acc + p.amount, 0);

      const itemsHtml = s.items
        .map((i: any) => {
          const lineTotal = (i.qty * i.price).toFixed(2);
          return `<div class="flex justify-between"><span class="truncate max-w-[190px]">${i.barcode} ${i.qty}x ${i.name}</span><span>${lineTotal}</span></div>`;
        })
        .join('');

      const html = s.voucherHtml || `
        <div class="text-center space-y-0.5 mb-2">
            <p class="font-bold">${cfg.companyName}</p>
            <p>RUC ${cfg.ruc}</p>
            <p>${cfg.address}</p>
            <p>${cfg.district}</p>
            <p class="font-bold pt-1">${s.docType.toUpperCase()} DE VENTA ELECTRONICA</p>
            <p class="font-bold">${s.serie}</p>
            <p class="font-bold text-indigo-800 bg-indigo-50 py-0.5 rounded border border-indigo-200 mt-1">ID ÚNICO BOLETA: ${s.uniqueId}</p>
        </div>
        <div class="space-y-0.5 mb-2">
            <p>CAJERO &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${parseInt(s.cashierCode || '19', 10)}</p>
            <p>CLIENTE &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${s.customerName} (${s.customerDoc})</p>
            ${itemsHtml}
            <div class="flex justify-between pt-1">
                <span>SUBTOTAL &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;S/</span>
                <span>${s.total.toFixed(2)}</span>
            </div>
            <p>${totalUnits} UNIDAD(ES)</p>
        </div>
        <div class="space-y-0.5 border-t border-dashed border-slate-400 pt-1.5 mb-2">
            <div class="flex justify-between"><span>OP. EXONERADA</span><span>0.00</span></div>
            <div class="flex justify-between"><span>OP. INAFECTA</span><span>0.00</span></div>
            <div class="flex justify-between"><span>OP. GRAVADA</span><span>${opGravada.toFixed(2)}</span></div>
            <div class="flex justify-between"><span>I.G.V. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;S/</span><span>${igv.toFixed(2)}</span></div>
            <div class="flex justify-between font-bold"><span>TOTAL A PAGAR &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;S/</span><span>${s.total.toFixed(2)}</span></div>
            <div class="border-t border-dotted border-slate-300 my-1 pt-1 space-y-0.5">
                ${s.payments.map((p: any) => `<div class="flex justify-between"><span>${p.label || p.method}</span><span>${p.amount.toFixed(2)}</span></div>`).join('')}
            </div>
            <div class="flex justify-between font-bold"><span>TOTAL RECIBIDO &nbsp;&nbsp;&nbsp;&nbsp;S/</span><span>${totalPaid.toFixed(2)}</span></div>
            <div class="flex justify-between font-bold text-emerald-800"><span>VUELTO &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;S/</span><span>${(s.change || 0).toFixed(2)}</span></div>
        </div>
        <div class="text-center my-2 pt-1 border-t border-dashed border-slate-400">
            <svg class="w-20 h-20 mx-auto text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                <path d="M10 10h25v25H10zM15 15v15h15V15zM20 20h5v5h-5zM65 10h25v25H65zM70 15v15h15V15zM75 20h5v5h-5zM10 65h25v25H10zM15 70v15h15V70zM20 75h5v5h-5zM45 15h10v15H45zM40 40h20v20H40zM70 45h15v10H70zM45 70h15v20H45zM70 70h20v20H70z"/>
            </svg>
            <p class="font-bold text-xs tracking-widest mt-1">ID QR COMPRA: ${s.uniqueId}</p>
            <p class="text-[9px] text-slate-600 mt-0.5 leading-tight">
                Para devoluciones parciales o completas digite el código único <strong>${s.uniqueId}</strong> en la barra principal.
            </p>
        </div>
        <div class="text-[10px] flex justify-between pt-2 mt-1 border-t border-slate-200">
            <span>${cfg.currentTranNumber} ${cfg.localCode}/${cfg.cajaCode}/${usr.shortCode}</span>
            <span>${s.date} AC-00</span>
        </div>
      `;
      win.openVoucherModal?.(`Comprobante Emitido (ID: ${s.uniqueId})`, html, 'STAY_AUDIT');
    };

    win.viewReturnVoucherFromAudit = (returnId: string) => {
      const r = this.caja.returnsHistoryDB.find(x => x.returnId === returnId);
      if (!r) return;
      const cfg = this.auth.systemConfig;
      const itemsHtml = r.items
        .map((i: any) => {
          const lineTotal = (i.qty * i.price).toFixed(2);
          return `<div class="flex justify-between"><span>${i.barcode} ${i.qty}x ${i.name}</span><span>-${lineTotal}</span></div>`;
        })
        .join('');

      const html = r.voucherHtml || `
        <div class="text-center space-y-0.5 mb-2">
            <p class="font-bold">${cfg.companyName}</p>
            <p>RUC ${cfg.ruc}</p>
            <p>${cfg.address}</p>
            <p class="font-bold pt-1 text-rose-800">COMPROBANTE DE DEVOLUCIÓN (${r.type})</p>
            <p class="font-bold">ID DEVOLUCIÓN: ${r.returnId}</p>
            <p>BOLETA ORIGEN: ${r.originalSaleId}</p>
        </div>
        <div class="border-t border-dashed border-slate-400 py-1.5 space-y-0.5">
            ${itemsHtml}
        </div>
        <div class="border-t border-dashed border-slate-400 pt-1 font-bold flex justify-between text-rose-800">
            <span>TOTAL REEMBOLSADO S/</span>
            <span>-${r.totalRefunded.toFixed(2)}</span>
        </div>
        <div class="text-center my-2 pt-1 border-t border-dashed border-slate-400">
            <svg class="w-20 h-20 mx-auto text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                <path d="M10 10h25v25H10zM15 15v15h15V15zM20 20h5v5h-5zM65 10h25v25H65zM70 15v15h15V15zM75 20h5v5h-5zM10 65h25v25H10zM15 70v15h15V70zM20 75h5v5h-5zM45 15h10v15H45zM40 40h20v20H40zM70 45h15v10H70zM45 70h15v20H45zM70 70h20v20H70z"/>
            </svg>
            <p class="font-bold text-xs tracking-widest mt-1">ID QR DEVOLUCIÓN: ${r.returnId}</p>
        </div>
      `;
      win.openVoucherModal?.(`Baucher de Devolución (ID: ${r.returnId})`, html, 'STAY_AUDIT');
    };

    win.sendSaleToReturnFromAudit = (uniqueId: string, mode: string) => {
      const sale = this.caja.salesHistoryDB.find(s => s.uniqueId === uniqueId);
      if (!sale) return;
      this.caja.returnFlowState.mode = mode;
      win.switchModule?.('pos');
      win.loadSaleForReturn?.(sale);
    };

    // Renderizar datos iniciales de auditoría apenas carga el componente
    setTimeout(() => win.renderAuditModule?.(), 0);
  }
}
