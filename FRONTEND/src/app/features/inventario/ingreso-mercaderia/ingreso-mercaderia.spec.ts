import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IngresoMercaderia } from './ingreso-mercaderia';

describe('IngresoMercaderia', () => {
  let component: IngresoMercaderia;
  let fixture: ComponentFixture<IngresoMercaderia>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IngresoMercaderia],
    }).compileComponents();

    fixture = TestBed.createComponent(IngresoMercaderia);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
