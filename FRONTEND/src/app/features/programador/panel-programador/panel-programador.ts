import { Component, AfterViewInit, inject } from '@angular/core';
import { Auth } from '../../../core/services/auth';
import { CajaNcr } from '../../../core/services/caja-ncr';
import { TicketsSoporte } from '../../../core/services/tickets-soporte';

@Component({
  imports: [],
  standalone: true,
  selector: 'app-panel-programador',
  styleUrl: './panel-programador.css',
  templateUrl: './panel-programador.html',
})
export class PanelProgramador implements AfterViewInit {
  private auth = inject(Auth);
  private caja = inject(CajaNcr);
  private tickets = inject(TicketsSoporte);

  ngAfterViewInit(): void {
    const win = window as any;

    win.renderProgrammerModule = () => {
      const ticketsGrid = document.getElementById('programmer-tickets-grid');
      if (ticketsGrid) {
        ticketsGrid.innerHTML = this.tickets.programmerTicketsDB
          .map(tk => {
            const isPending = tk.status === 'PENDIENTE';
            const badge = isPending
              ? `<span class="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-[10px]">⏳ PENDIENTE DE RESOLVER</span>`
              : `<span class="bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded text-[10px]">✅ RESUELTO Y CUADRADO</span>`;

            if (tk.type === 'ELIMINAR_FONDO') {
              return `
                <div class="p-4 rounded-2xl border ${isPending ? 'border-rose-500/50 bg-slate-800/90' : 'border-slate-700 bg-slate-900/60 opacity-75'} space-y-2.5 text-xs">
                    <div class="flex items-center justify-between">
                        <span class="font-mono-code font-black text-rose-400">${tk.ticketId} • ELIMINAR FONDO FIJO ERRÓNEO</span>
                        ${badge}
                    </div>
                    <div class="bg-slate-950/70 p-2.5 rounded-xl border border-slate-700 font-mono-code text-[11px] space-y-0.5">
                        <p>Código de Cajero: <strong class="text-amber-400">${tk.cashierCode}</strong></p>
                        <p>Código Baucher Fondo Fijo: <strong class="text-rose-400">${tk.voucherCode}</strong> (Monto: S/ ${tk.currentAmount.toFixed(2)})</p>
                        <p class="font-sans text-slate-300 pt-1">Nota del Dueño: "${tk.note}"</p>
                    </div>
                    ${isPending ? `
                        <button onclick="resolveDeleteFixedFundTicket('${tk.ticketId}')" class="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl uppercase shadow flex items-center justify-center gap-2">
                            <i class="fa-solid fa-trash-can"></i> Eliminar Fondo Fijo (${tk.voucherCode}) y Cuadrar Cajero
                        </button>
                    ` : `<p class="text-[11px] text-emerald-400 font-bold">✓ Fondo fijo ${tk.voucherCode} anulado del sistema sin afectar al cajero.</p>`}
                </div>
              `;
            } else {
              return `
                <div class="p-4 rounded-2xl border ${isPending ? 'border-indigo-500/60 bg-slate-800/90' : 'border-slate-700 bg-slate-900/60 opacity-75'} space-y-2.5 text-xs">
                    <div class="flex items-center justify-between">
                        <span class="font-mono-code font-black text-indigo-400">${tk.ticketId} • CORREGIR RETIRO MAL DIGITADO</span>
                        ${badge}
                    </div>
                    <div class="bg-slate-950/70 p-2.5 rounded-xl border border-slate-700 font-mono-code text-[11px] space-y-0.5">
                        <p>Código Cajero: <strong class="text-amber-400">${tk.cashierCode}</strong> • DNI Cajero: <strong class="text-white">${tk.cashierDni}</strong></p>
                        <p>Código Único Baucher Retiro: <strong class="text-indigo-400">${tk.voucherCode}</strong> (Registrado con error: S/ ${tk.currentAmount.toFixed(2)})</p>
                        <p class="font-sans text-slate-300 pt-1">Nota del Dueño: "${tk.note}"</p>
                    </div>
                    ${isPending ? `
                        <div class="flex items-center gap-2 pt-1">
                            <div class="flex-1">
                                <label class="text-[10px] font-bold text-amber-400 uppercase block mb-0.5">Monto Exacto y Redondo (S/):</label>
                                <input type="number" step="10" id="prog-fix-input-${tk.ticketId}" value="${tk.targetAmount}" class="w-full p-2 bg-slate-950 border-2 border-indigo-500 rounded-xl font-mono-code font-black text-white">
                            </div>
                            <button onclick="resolveWithdrawalCorrectionTicket('${tk.ticketId}')" class="px-4 py-2.5 mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl uppercase shadow shrink-0">
                                <i class="fa-solid fa-floppy-disk mr-1"></i> Guardar y Actualizar
                            </button>
                        </div>
                    ` : `<p class="text-[11px] text-emerald-400 font-bold">✓ Retiro ${tk.voucherCode} corregido y actualizado a S/ ${tk.targetAmount.toFixed(2)}.</p>`}
                </div>
              `;
            }
          })
          .join('');
      }

      const tbody = document.getElementById('programmer-users-tbody');
      if (tbody) {
        tbody.innerHTML = this.auth.usersDB
          .map((u, idx) => `
            <tr class="hover:bg-slate-800/50">
                <td class="py-2.5 px-3 font-bold text-amber-400">${u.code} (Cajero ${u.shortCode})</td>
                <td class="py-2.5 px-3 text-slate-300">${u.pass}</td>
                <td class="py-2.5 px-3 font-bold text-white">${u.name}</td>
                <td class="py-2.5 px-3 text-slate-300">${u.dni}</td>
                <td class="py-2.5 px-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-extrabold ${u.role === 'PROGRAMADOR' ? 'bg-indigo-600 text-white' : u.role === 'DUENO' ? 'bg-amber-400 text-slate-950' : u.role === 'SUPERVISOR' ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'}">
                        ${u.role}
                    </span>
                </td>
                <td class="py-2.5 px-3 text-center">
                    ${u.code === '9999' ? '<span class="text-[10px] text-slate-500">SuperAdmin</span>' : `<button onclick="deleteWorker(${idx})" class="text-rose-400 hover:text-rose-300 font-bold"><i class="fa-solid fa-trash"></i> Eliminar</button>`}
                </td>
            </tr>
          `)
          .join('');
      }
    };

    win.resolveDeleteFixedFundTicket = (ticketId: string) => {
      const tk = this.tickets.programmerTicketsDB.find(t => t.ticketId === ticketId);
      if (!tk || tk.status === 'RESUELTO') return;

      const fundRec = this.tickets.fixedFundRecordsDB.find(f => f.voucherCode === tk.voucherCode && f.status === 'ACTIVO');
      if (fundRec) {
        fundRec.status = 'ELIMINADO_POR_PROGRAMADOR';
        this.caja.shiftState.fixedFund = Math.max(0, this.caja.shiftState.fixedFund - fundRec.amount);
      } else {
        this.caja.shiftState.fixedFund = Math.max(0, this.caja.shiftState.fixedFund - tk.currentAmount);
      }

      tk.status = 'RESUELTO';
      win.updateHeaderStatus?.();
      win.updateNotificationBadges?.();
      win.renderProgrammerModule();
      this.auth.showToast(`✅ Fondo Fijo ${tk.voucherCode} (S/ ${tk.currentAmount.toFixed(2)}) eliminado. La caja del cajero ${tk.cashierCode} quedó cuadrada automáticamente.`, 'success');
    };

    win.resolveWithdrawalCorrectionTicket = (ticketId: string) => {
      const tk = this.tickets.programmerTicketsDB.find(t => t.ticketId === ticketId);
      if (!tk || tk.status === 'RESUELTO') return;

      const inputEl = document.getElementById(`prog-fix-input-${tk.ticketId}`) as HTMLInputElement;
      const newExactAmount = parseFloat(inputEl ? inputEl.value : String(tk.targetAmount));
      if (isNaN(newExactAmount) || newExactAmount <= 0 || newExactAmount % 10 !== 0) {
        this.auth.showToast('Ingresa un monto exacto y redondo múltiplo de 10 (ej. 400.00)', 'warning');
        return;
      }

      const diff = newExactAmount - tk.currentAmount;
      const retRec = this.tickets.withdrawalRecordsDB.find(r => r.voucherCode === tk.voucherCode);
      if (retRec) {
        retRec.amount = newExactAmount;
        retRec.note = `Corregido por Programador (Ticket ${tk.ticketId})`;
      }
      if (this.caja.shiftState.withdrawalsTotal > 0) {
        this.caja.shiftState.withdrawalsTotal = Math.max(0, this.caja.shiftState.withdrawalsTotal + diff);
      }

      tk.targetAmount = newExactAmount;
      tk.status = 'RESUELTO';
      win.updateHeaderStatus?.();
      win.updateNotificationBadges?.();
      win.renderProgrammerModule();
      this.auth.showToast(`✅ Baucher de Retiro ${tk.voucherCode} corregido de S/ ${tk.currentAmount.toFixed(2)} a S/ ${newExactAmount.toFixed(2)} y actualizado en el sistema.`, 'success');
    };

    win.createNewWorker = (e: Event) => {
      e.preventDefault();
      const code = (document.getElementById('pw-code') as HTMLInputElement).value.trim();
      const pass = (document.getElementById('pw-pass') as HTMLInputElement).value.trim();
      const name = (document.getElementById('pw-name') as HTMLInputElement).value.trim().toUpperCase();
      const dni = (document.getElementById('pw-dni') as HTMLInputElement).value.trim();
      const role = (document.getElementById('pw-role') as HTMLSelectElement).value;

      this.auth.usersDB.push({
        code,
        shortCode: code.slice(-3),
        pass,
        name,
        dni,
        role
      });
      win.renderProgrammerModule();
      this.auth.showToast(`Trabajador ${name} (${role}) creado. Ya puede iniciar sesión con código ${code}.`, 'success');
      (e.target as HTMLFormElement).reset();
    };

    win.deleteWorker = (idx: number) => {
      this.auth.usersDB.splice(idx, 1);
      win.renderProgrammerModule();
      this.auth.showToast('Trabajador eliminado del sistema', 'info');
    };

    win.saveSystemConfig = () => {
      const cfg = this.auth.systemConfig;
      cfg.companyName = (document.getElementById('cfg-company') as HTMLInputElement).value.trim();
      cfg.ruc = (document.getElementById('cfg-ruc') as HTMLInputElement).value.trim();
      cfg.address = (document.getElementById('cfg-address') as HTMLInputElement).value.trim();
      cfg.defaultFixedFund = parseFloat((document.getElementById('cfg-default-fund') as HTMLInputElement).value) || 150.0;
      cfg.usdRate = parseFloat((document.getElementById('cfg-usd') as HTMLInputElement).value) || 3.72;
      this.auth.showToast('Parámetros globales actualizados para todos los bauchers digitales', 'success');
    };
  }
}
