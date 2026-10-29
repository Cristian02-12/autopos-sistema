import { Component, AfterViewInit, inject } from '@angular/core';
import { Auth } from '../../../core/services/auth';
import { Inventario } from '../../../core/services/inventario';

@Component({
  imports: [],
  standalone: true,
  selector: 'app-tabla-stock',
  styleUrl: './tabla-stock.css',
  templateUrl: './tabla-stock.html',
})
export class TablaStock implements AfterViewInit {
  private auth = inject(Auth);
  private inv = inject(Inventario);

  ngAfterViewInit(): void {
    const win = window as any;

    win.setInvStatusSegment = (segment: string) => {
      this.inv.activeInvStatusSegment = segment;
      win.renderInventoryModule();
    };

    win.resetInventoryFilters = () => {
      this.inv.activeInvStatusSegment = 'ALL';
      (document.getElementById('inv-filter-input') as HTMLInputElement).value = '';
      (document.getElementById('inv-filter-category') as HTMLSelectElement).value = '';
      (document.getElementById('inv-filter-brand') as HTMLSelectElement).value = '';
      (document.getElementById('inv-filter-location') as HTMLSelectElement).value = '';
      (document.getElementById('inv-filter-sort') as HTMLSelectElement).value = 'DEFAULT';
      win.renderInventoryModule();
    };

    win.renderInventoryModule = () => {
      const list = this.inv.productsDB;
      document.getElementById('seg-count-ALL')!.textContent = String(list.length);
      document.getElementById('seg-count-IN_STOCK')!.textContent = String(list.filter(p => p.stock > p.minStock).length);
      document.getElementById('seg-count-LOW_STOCK')!.textContent = String(list.filter(p => p.stock > 0 && p.stock <= p.minStock).length);
      document.getElementById('seg-count-OUT_OF_STOCK')!.textContent = String(list.filter(p => p.stock === 0).length);

      ['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'].forEach(seg => {
        const btn = document.getElementById(`seg-btn-${seg}`);
        if (!btn) return;
        if (seg === this.inv.activeInvStatusSegment) {
          btn.classList.add('ring-4', 'ring-amber-400/60', 'scale-[1.01]');
        } else {
          btn.classList.remove('ring-4', 'ring-amber-400/60', 'scale-[1.01]');
        }
      });

      const q = ((document.getElementById('inv-filter-input') as HTMLInputElement)?.value || '').toLowerCase();
      const catFilter = (document.getElementById('inv-filter-category') as HTMLSelectElement)?.value || '';
      const brandFilter = (document.getElementById('inv-filter-brand') as HTMLSelectElement)?.value || '';
      const locFilter = (document.getElementById('inv-filter-location') as HTMLSelectElement)?.value || '';
      const sortMode = (document.getElementById('inv-filter-sort') as HTMLSelectElement)?.value || 'DEFAULT';

      const seg = this.inv.activeInvStatusSegment;
      const filtered = list.filter(p => {
        if (seg === 'IN_STOCK' && !(p.stock > p.minStock)) return false;
        if (seg === 'LOW_STOCK' && !(p.stock > 0 && p.stock <= p.minStock)) return false;
        if (seg === 'OUT_OF_STOCK' && p.stock !== 0) return false;
        if (catFilter && p.category !== catFilter) return false;
        if (brandFilter && !p.brand.toLowerCase().includes(brandFilter.toLowerCase())) return false;
        if (locFilter && !p.location.toLowerCase().includes(locFilter.toLowerCase())) return false;
        if (q && !`${p.barcode} ${p.sku} ${p.oem} ${p.name} ${p.vehicles} ${p.category}`.toLowerCase().includes(q)) return false;
        return true;
      });

      if (sortMode === 'STOCK_ASC') filtered.sort((a, b) => a.stock - b.stock);
      if (sortMode === 'STOCK_DESC') filtered.sort((a, b) => b.stock - a.stock);
      if (sortMode === 'PRICE_ASC') filtered.sort((a, b) => a.price - b.price);
      if (sortMode === 'PRICE_DESC') filtered.sort((a, b) => b.price - a.price);

      const tbody = document.getElementById('inv-module-tbody');
      if (!tbody) return;
      const isOwner = this.auth.currentUser.role === 'DUENO';
      const isProgrammer = this.auth.currentUser.role === 'PROGRAMADOR';

      tbody.innerHTML = filtered
        .map(p => {
          const mechPrice = p.mechanicPrice || Math.round(p.price * 0.85 * 100) / 100;
          const statusBadge = p.stock === 0
            ? `<span class="bg-rose-100 text-rose-700 font-extrabold px-2.5 py-1 rounded-full text-[11px] inline-block">🔴 Agotado (0 uds)</span>`
            : p.stock <= p.minStock
              ? `<span class="bg-amber-100 text-amber-800 font-extrabold px-2.5 py-1 rounded-full text-[11px] inline-block">🟡 Bajas Unidades (${p.stock} uds)</span>`
              : `<span class="bg-emerald-100 text-emerald-700 font-extrabold px-2.5 py-1 rounded-full text-[11px] inline-block">🟢 Con Stock (${p.stock} uds)</span>`;

          let deleteActionHtml = '';
          if (isOwner) {
            const canOwnerDelete = p.stock === 0;
            deleteActionHtml = `
              <button onclick="deleteInventoryItem(${p.id})" 
                      class="px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-all ${canOwnerDelete ? 'bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border-rose-200' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'}" 
                      title="${canOwnerDelete ? 'Stock en 0: Permitido eliminar' : 'El Dueño solo puede eliminar productos cuando su Stock es 0'}">
                  <i class="fa-solid fa-trash"></i>
              </button>`;
          } else if (isProgrammer) {
            deleteActionHtml = `
              <button onclick="deleteInventoryItem(${p.id})" 
                      class="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-[11px] shadow-sm" 
                      title="Eliminación Maestra de Programador (incluso con stock)">
                  <i class="fa-solid fa-trash"></i> Maestro
              </button>`;
          }

          return `
            <tr class="hover:bg-slate-50">
                <td class="py-3 px-4">
                    ${statusBadge}
                    <span class="block text-[10px] text-slate-400 mt-0.5">Mínimo: ${p.minStock} uds</span>
                </td>
                <td class="py-3 px-4 font-mono-code">
                    <span class="font-bold text-slate-900 block">Barra: ${p.barcode}</span>
                    <span class="text-[11px] text-indigo-600 font-bold">SKU: ${p.sku} | OEM: ${p.oem}</span>
                </td>
                <td class="py-3 px-4">
                    <span class="font-bold text-slate-900 block">${p.name}</span>
                    <span class="text-[10px] font-extrabold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">${p.category || 'General'}</span>
                    <span class="text-[11px] text-slate-500 ml-1">• ${p.brand}</span>
                </td>
                <td class="py-3 px-4 text-slate-600">${p.vehicles}</td>
                <td class="py-3 px-4 font-semibold text-slate-700"><i class="fa-solid fa-location-dot text-amber-500 mr-1"></i>${p.location}</td>
                <td class="py-3 px-4 text-right font-mono-code">
                    <span class="font-black text-slate-900 block">Público: S/ ${p.price.toFixed(2)}</span>
                    <span class="text-[11px] font-bold text-amber-700">Mecánico: S/ ${mechPrice.toFixed(2)}</span>
                </td>
                <td class="py-3 px-4 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                        <button onclick="addProductToPosCart(${p.id}); switchModule('pos');" class="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[11px]">Enviar a Caja</button>
                        ${deleteActionHtml}
                    </div>
                </td>
            </tr>
          `;
        })
        .join('');
    };

    win.deleteInventoryItem = (id: number) => {
      const role = this.auth.currentUser.role;
      if (role !== 'DUENO' && role !== 'PROGRAMADOR') {
        this.auth.showToast('Acceso denegado: Solo el Dueño y el Programador pueden dar de baja productos.', 'warning');
        return;
      }
      const prod = this.inv.productsDB.find(p => p.id === id);
      if (!prod) return;

      if (role === 'DUENO' && prod.stock > 0) {
        this.auth.showToast(`⚠️ No se puede eliminar "${prod.name}" porque aún tiene ${prod.stock} unidades en Stock. Para que el Dueño lo elimine debe tener Stock 0.`, 'warning');
        return;
      }

      this.inv.productsDB = this.inv.productsDB.filter(p => p.id !== id);
      win.renderInventoryModule();
      this.auth.showToast(`✅ Producto "${prod.name}" eliminado definitivamente del sistema.`, 'success');
    };
  }
}
