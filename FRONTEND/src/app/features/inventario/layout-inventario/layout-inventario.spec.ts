import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LayoutInventario } from './layout-inventario';

describe('LayoutInventario', () => {
  let component: LayoutInventario;
  let fixture: ComponentFixture<LayoutInventario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutInventario],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutInventario);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
