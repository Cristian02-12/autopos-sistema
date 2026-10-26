import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CotizadorA4 } from './cotizador-a4';

describe('CotizadorA4', () => {
  let component: CotizadorA4;
  let fixture: ComponentFixture<CotizadorA4>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CotizadorA4],
    }).compileComponents();

    fixture = TestBed.createComponent(CotizadorA4);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
