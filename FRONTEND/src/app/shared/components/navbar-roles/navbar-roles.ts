import { Component, AfterViewInit, ViewEncapsulation, inject } from '@angular/core';
import { Auth } from '../../../core/services/auth';
import { CajaNcr } from '../../../core/services/caja-ncr';
import { Inventario } from '../../../core/services/inventario';
import { TicketsSoporte } from '../../../core/services/tickets-soporte';

@Component({
  imports: [],
  standalone: true,
  selector: 'app-navbar-roles',
  styleUrl: './navbar-roles.css',
  templateUrl: './navbar-roles.html',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'contents' }
})
export class NavbarRoles implements AfterViewInit {
  private auth = inject(Auth);
  private caja = inject(CajaNcr);
  private inv = inject(Inventario);
  private tickets = inject(TicketsSoporte);

  ngAfterViewInit(): void {
    const win = window as any;

    win.toggleMobileMenu = (forceState?: boolean) => {
      const drawer = document.getElementById('mobile-nav-drawer');
      const icon = document.getElementById('mobile-menu-icon');
      if (!drawer) return;
      const shouldShow = forceState !== undefined ? forceState : drawer.classList.contains('hidden');
      if (shouldShow) {
        drawer.classList.remove('hidden');
        if (icon) icon.className = 'fa-solid fa-xmark';
      } else {
        drawer.classList.add('hidden');
        if (icon) icon.className = 'fa-solid fa-bars';
      }
    };

    win.confirmDrawerClosed = () => {
      document.getElementById('drawer-open-banner')?.classList.add('hidden');
      this.auth.showToast('Cajón físico registrado como CERRADO.', 'info');
    };

    win.updateHeaderStatus = () => {
      const cashDrawer = this.caja.getCurrentCashInDrawer();
      const statusEl = document.getElementById('header-drawer-status');
      if (statusEl) {
        statusEl.textContent = `Fondo: S/ ${this.caja.shiftState.fixedFund.toFixed(2)} | Cajón: S/ ${cashDrawer.toFixed(2)}`;
      }
      const lineEl = document.getElementById('ncr-status-line');
      if (lineEl) {
        const cfg = this.auth.systemConfig;
        lineEl.textContent = `${this.auth.getFormattedDateTime()} Operador: ${this.auth.currentUser.name} Local: ${cfg.localCode} Caja: ${cfg.cajaCode} Tran: ${cfg.currentTranNumber} ${cfg.serverCode}`;
      }
    };

    win.updateNotificationBadges = () => {
      const pendingCounts = this.inv.inventoryCountReportsDB.filter(r => r.status === 'PENDIENTE_AJUSTE').length;
      const ownerBadge = document.getElementById('owner-pending-counts-badge');
      const mobOwnerBadge = document.getElementById('mob-owner-pending-badge');
      if (ownerBadge) ownerBadge.textContent = String(pendingCounts);
      if (mobOwnerBadge) mobOwnerBadge.textContent = String(pendingCounts);

      const pendingTickets = this.tickets.programmerTicketsDB.filter(t => t.status === 'PENDIENTE').length;
      const progBadge = document.getElementById('prog-tickets-badge');
      const mobProgBadge = document.getElementById('mob-prog-tickets-badge');
      if (progBadge) progBadge.textContent = String(pendingTickets);
      if (mobProgBadge) mobProgBadge.textContent = String(pendingTickets);
    };

    win.applyRolePermissions = () => {
      const role = this.auth.currentUser.role;
      const roleBadge = document.getElementById('header-role-badge');
      const opInfo = document.getElementById('header-operator-info');
      const progBtn = document.getElementById('mod-btn-programmer');
      const ownerBtn = document.getElementById('mod-btn-owner');
      const auditBtn = document.getElementById('mod-btn-audit');
      const mobProgBtn = document.getElementById('mob-btn-programmer');
      const mobOwnerBtn = document.getElementById('mob-btn-owner');
      const mobAuditBtn = document.getElementById('mob-btn-audit');
      const invModeTag = document.getElementById('inv-mode-tag');
      const mobInvModeTag = document.getElementById('mob-inv-mode-tag');
      const invAdminActions = document.getElementById('inv-admin-actions');
      const invRoleBanner = document.getElementById('inv-role-banner');

      const subCountBtn = document.getElementById('inv-subtab-btn-count');
      const subRestockBtn = document.getElementById('inv-subtab-btn-restock');
      const subPricingBtn = document.getElementById('inv-subtab-btn-pricing');

      if (opInfo) opInfo.textContent = `Op: ${this.auth.currentUser.code} ${this.auth.currentUser.name}`;

      if (role === 'CAJERO') {
        if (roleBadge) {
          roleBadge.textContent = 'ROL: CAJERO';
          roleBadge.className = 'text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap';
        }
        progBtn?.classList.add('hidden');
        ownerBtn?.classList.add('hidden');
        auditBtn?.classList.add('hidden');
        mobProgBtn?.classList.add('hidden');
        mobOwnerBtn?.classList.add('hidden');
        mobAuditBtn?.classList.add('hidden');
        subCountBtn?.classList.add('hidden');
        subRestockBtn?.classList.add('hidden');
        subPricingBtn?.classList.add('hidden');
        if (invModeTag) {
          invModeTag.textContent = 'Solo Consulta';
          invModeTag.className = 'text-[9px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded';
        }
        if (mobInvModeTag) mobInvModeTag.textContent = 'Solo Consulta';
        invAdminActions?.classList.add('hidden');
        if (invRoleBanner) {
          invRoleBanner.textContent = '🔒 Modo Cajero: Solo visualización y consulta de stock (Sin permisos para agregar, contar o eliminar)';
          invRoleBanner.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800';
        }
        win.switchInventorySubtab?.('catalog');
      } else if (role === 'SUPERVISOR') {
        if (roleBadge) {
          roleBadge.textContent = 'ROL: SUPERVISORA';
          roleBadge.className = 'text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap';
        }
        progBtn?.classList.add('hidden');
        ownerBtn?.classList.add('hidden');
        auditBtn?.classList.remove('hidden');
        mobProgBtn?.classList.add('hidden');
        mobOwnerBtn?.classList.add('hidden');
        mobAuditBtn?.classList.remove('hidden');
        subCountBtn?.classList.remove('hidden');
        subRestockBtn?.classList.remove('hidden');
        subPricingBtn?.classList.add('hidden');
        if (invModeTag) {
          invModeTag.textContent = 'Conteo y Recepción';
          invModeTag.className = 'text-[9px] bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded font-black';
        }
        if (mobInvModeTag) mobInvModeTag.textContent = 'Conteo y Recepción';
        invAdminActions?.classList.remove('hidden');
        if (invRoleBanner) {
          invRoleBanner.textContent = '📋 Modo Supervisor: Realiza Conteo (L-V) y envía reporte al Dueño/Programador, ingresa mercadería (No elimina productos ni cambia precios)';
          invRoleBanner.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900';
        }
      } else if (role === 'DUENO') {
        if (roleBadge) {
          roleBadge.textContent = 'ROL: DUEÑO DE TIENDA';
          roleBadge.className = 'text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 whitespace-nowrap';
        }
        progBtn?.classList.add('hidden');
        ownerBtn?.classList.remove('hidden');
        auditBtn?.classList.remove('hidden');
        mobProgBtn?.classList.add('hidden');
        mobOwnerBtn?.classList.remove('hidden');
        mobAuditBtn?.classList.remove('hidden');
        subCountBtn?.classList.remove('hidden');
        subRestockBtn?.classList.remove('hidden');
        subPricingBtn?.classList.remove('hidden');
        if (invModeTag) {
          invModeTag.textContent = 'Gestión Dueño';
          invModeTag.className = 'text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-black';
        }
        if (mobInvModeTag) mobInvModeTag.textContent = 'Gestión Dueño';
        invAdminActions?.classList.remove('hidden');
        if (invRoleBanner) {
          invRoleBanner.textContent = '👑 Modo Dueño: Ajusta conteos de inventario, actualiza precios (Público/Mecánico) y elimina productos con Stock 0';
          invRoleBanner.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900';
        }
      } else if (role === 'PROGRAMADOR') {
        if (roleBadge) {
          roleBadge.textContent = 'ROL: PROGRAMADOR (MAESTRO)';
          roleBadge.className = 'text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-500 text-white whitespace-nowrap';
        }
        progBtn?.classList.remove('hidden');
        ownerBtn?.classList.remove('hidden');
        auditBtn?.classList.remove('hidden');
        mobProgBtn?.classList.remove('hidden');
        mobOwnerBtn?.classList.remove('hidden');
        mobAuditBtn?.classList.remove('hidden');
        subCountBtn?.classList.remove('hidden');
        subRestockBtn?.classList.remove('hidden');
        subPricingBtn?.classList.remove('hidden');
        if (invModeTag) {
          invModeTag.textContent = 'Control Maestro';
          invModeTag.className = 'text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-black';
        }
        if (mobInvModeTag) mobInvModeTag.textContent = 'Control Maestro';
        invAdminActions?.classList.remove('hidden');
        if (invRoleBanner) {
          invRoleBanner.textContent = '⚡ Modo Programador: Permiso maestro total (elimina productos aún con stock, ajusta inventarios, precios y resuelve tickets de Caja)';
          invRoleBanner.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800';
        }
      }
      win.updateNotificationBadges();
    };

    win.switchModule = (modName: string, navigateUrl = true) => {
      const role = this.auth.currentUser.role;
      if (modName === 'audit' && role === 'CAJERO') {
        this.auth.showToast('Acceso exclusivo para Supervisor, Dueño y Programador', 'warning');
        return;
      }
      if (modName === 'owner' && role !== 'DUENO' && role !== 'PROGRAMADOR') {
        this.auth.showToast('Acceso exclusivo para el Dueño de la Tienda y el Programador', 'warning');
        return;
      }
      if (modName === 'programmer' && role !== 'PROGRAMADOR') {
        this.auth.showToast('Acceso exclusivo para el rol Programador', 'warning');
        return;
      }

      if (navigateUrl) {
        window.history.replaceState(null, '', `/sistema/${modName}`);
      }

      ['pos', 'inventory', 'quotes', 'audit', 'owner', 'programmer'].forEach(m => {
        document.querySelectorAll(`#module-${m}`).forEach(sec => sec.classList.add('hidden'));
        const btn = document.getElementById(`mod-btn-${m}`);
        if (btn) {
          if (m === 'programmer') {
            btn.className = (role === 'PROGRAMADOR' ? '' : 'hidden ') + 'px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-indigo-300 hover:text-white bg-indigo-950/60 border border-indigo-500/30 flex items-center gap-1.5 shrink-0 whitespace-nowrap';
          } else if (m === 'owner') {
            btn.className = (role === 'DUENO' || role === 'PROGRAMADOR' ? '' : 'hidden ') + 'px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-emerald-300 hover:text-white bg-emerald-950/60 border border-emerald-500/30 flex items-center gap-1.5 shrink-0 whitespace-nowrap';
          } else if (m === 'audit') {
            btn.className = (role !== 'CAJERO' ? '' : 'hidden ') + 'px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-amber-300 hover:text-white bg-amber-950/50 border border-amber-500/30 flex items-center gap-1.5 shrink-0 whitespace-nowrap';
          } else {
            btn.className = 'px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1.5 shrink-0 whitespace-nowrap';
          }
        }
      });

      document.querySelectorAll(`#module-${modName}`).forEach(sec => sec.classList.remove('hidden'));
      const activeBtn = document.getElementById(`mod-btn-${modName}`);
      if (activeBtn) {
        activeBtn.className = 'px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold bg-[#d96b27] text-white flex items-center gap-1.5 shadow shrink-0 whitespace-nowrap';
      }

      if (modName === 'inventory') win.renderInventoryModule?.();
      if (modName === 'quotes') win.renderQuotesModule?.();
      if (modName === 'audit') win.renderAuditModule?.();
      if (modName === 'owner') win.renderOwnerModule?.();
      if (modName === 'programmer') win.renderProgrammerModule?.();
    };
  }
}
