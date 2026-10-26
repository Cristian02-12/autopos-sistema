import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VentasDevoluciones } from './ventas-devoluciones';

describe('VentasDevoluciones', () => {
  let component: VentasDevoluciones;
  let fixture: ComponentFixture<VentasDevoluciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VentasDevoluciones],
    }).compileComponents();

    fixture = TestBed.createComponent(VentasDevoluciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
