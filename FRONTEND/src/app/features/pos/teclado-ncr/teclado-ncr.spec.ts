import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TecladoNcr } from './teclado-ncr';

describe('TecladoNcr', () => {
  let component: TecladoNcr;
  let fixture: ComponentFixture<TecladoNcr>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TecladoNcr],
    }).compileComponents();

    fixture = TestBed.createComponent(TecladoNcr);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
