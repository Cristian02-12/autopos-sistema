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

    // Garantizar que los arreglos existan en CajaNcr aunque algún archivo antiguo no los hubiera inicializado
    if (!Array.isArray(this.caja.salesHistoryDB) || this.caja.salesHistoryDB.length === 0) {
      this.caja.salesHistoryDB = [
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
    }

    if (!Array.isArray(this.caja.returnsHistoryDB) || this.caja.returnsHistoryDB.length === 0) {
      this.caja.returnsHistoryDB = [
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
    }

    const renderAudit = () => {
      const salesSource: any[] = win.salesHistoryDB || this.caja.salesHistoryDB || [];
      const returnsSource: any[] = win.returnsHistoryDB || this.caja.returnsHistoryDB || [];

      const sQuery = ((document.getElementById('audit-sales-search') as HTMLInputElement)?.value || '').trim().toLowerCase();
      const sDate = ((document.getElementById('audit-sales-date') as HTMLInputElement)?.value || '').trim().toLowerCase();

      const filteredSales = salesSource.filter(s => {
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
            const methodsText = (s.payments || []).map((p: any) => `${p.label || p.method}: S/ ${Number(p.amount).toFixed(2)}`).join(' | ');
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
                      <span class="font-mono-code font-black text-sm text-emerald-700">S/ ${Number(s.total).toFixed(2)}</span>
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

      const filteredReturns = returnsSource.filter(r => {
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
                    <span class="font-mono-code font-black text-sm text-rose-700">-S/ ${Number(r.totalRefunded).toFixed(2)}</span>
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

    win.renderAuditModule = renderAudit;

    // Asegurar que después de que el padre (TerminalNcr) termine su ngAfterViewInit, renderAuditModule siga activo y pinte los datos
    setTimeout(() => {
      win.renderAuditModule = renderAudit;
      renderAudit();
      document.getElementById('mod-btn-audit')?.addEventListener('click', () => setTimeout(renderAudit, 20));
      document.getElementById('mob-btn-audit')?.addEventListener('click', () => setTimeout(renderAudit, 20));
    }, 100);
  }
}
