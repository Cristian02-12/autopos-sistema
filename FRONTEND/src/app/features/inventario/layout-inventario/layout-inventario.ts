import { Component, AfterViewInit, inject } from '@angular/core';
import { Auth } from '../../../core/services/auth';
import { Inventario } from '../../../core/services/inventario';
import { TablaStock } from '../tabla-stock/tabla-stock';
import { ConteoCiclico } from '../conteo-ciclico/conteo-ciclico';
import { IngresoMercaderia } from '../ingreso-mercaderia/ingreso-mercaderia';
import { ActualizarPrecios } from '../actualizar-precios/actualizar-precios';

@Component({
  imports: [TablaStock, ConteoCiclico, IngresoMercaderia, ActualizarPrecios],
  standalone: true,
  selector: 'app-layout-inventario',
  styleUrl: './layout-inventario.css',
  templateUrl: './layout-inventario.html',
})
export class LayoutInventario implements AfterViewInit {
  private auth = inject(Auth);
  private inv = inject(Inventario);

  ngAfterViewInit(): void {
    const win = window as any;

    win.switchInventorySubtab = (subtab: string) => {
      const role = this.auth.currentUser.role;
      if (subtab === 'pricing' && role !== 'DUENO' && role !== 'PROGRAMADOR') {
        this.auth.showToast('Solo el Dueño y el Programador pueden actualizar precios', 'warning');
        return;
      }
      if ((subtab === 'count' || subtab === 'restock') && role === 'CAJERO') {
        this.auth.showToast('Función reservada para Supervisor, Dueño y Programador', 'warning');
        return;
      }

      this.inv.activeInvSubtab = subtab;
      ['catalog', 'count', 'restock', 'pricing'].forEach(st => {
        document.getElementById(`inv-subview-${st}`)?.classList.add('hidden');
        const btn = document.getElementById(`inv-subtab-btn-${st}`);
        if (btn && !btn.classList.contains('hidden')) {
          btn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5';
        }
      });

      document.getElementById(`inv-subview-${subtab}`)?.classList.remove('hidden');
      const activeBtn = document.getElementById(`inv-subtab-btn-${subtab}`);
      if (activeBtn) {
        activeBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-black bg-slate-900 text-white shadow flex items-center gap-1.5';
      }

      if (subtab === 'catalog') win.renderInventoryModule?.();
      if (subtab === 'count') win.renderInventoryCountSubtab?.();
      if (subtab === 'restock') {
        win.renderRestockSearchResults?.();
        win.renderRestockHistory?.();
      }
      if (subtab === 'pricing') win.renderPricingSearchResults?.();
    };

    win.openNewProductModal = () => {
      if (this.auth.currentUser.role === 'CAJERO') {
        this.auth.showToast('Acceso denegado: El rol Cajero no puede ingresar nuevos productos', 'warning');
        return;
      }
      document.getElementById('new-product-modal')?.classList.remove('hidden');
    };

    win.closeNewProductModal = () => {
      document.getElementById('new-product-modal')?.classList.add('hidden');
    };

    win.saveNewProduct = (e: Event) => {
      e.preventDefault();
      const pubPrice = parseFloat((document.getElementById('np-price') as HTMLInputElement).value) || 0;
      const newProd = {
        id: Date.now(),
        barcode: (document.getElementById('np-barcode') as HTMLInputElement).value.trim(),
        sku: (document.getElementById('np-sku') as HTMLInputElement).value.trim().toUpperCase(),
        oem: (document.getElementById('np-oem') as HTMLInputElement).value.trim().toUpperCase(),
        category: 'Frenos y Discos',
        name: (document.getElementById('np-name') as HTMLInputElement).value.trim().toUpperCase(),
        brand: (document.getElementById('np-brand') as HTMLInputElement).value.trim(),
        location: (document.getElementById('np-location') as HTMLInputElement).value.trim(),
        vehicles: (document.getElementById('np-vehicles') as HTMLInputElement).value.trim(),
        price: pubPrice,
        mechanicPrice: Math.round(pubPrice * 0.85 * 100) / 100,
        stock: parseInt((document.getElementById('np-stock') as HTMLInputElement).value, 10) || 0,
        minStock: 3
      };
      this.inv.productsDB.unshift(newProd);
      win.closeNewProductModal();
      win.renderInventoryModule?.();
      this.auth.showToast(`Repuesto ${newProd.name} agregado al inventario`, 'success');
    };
  }
}
