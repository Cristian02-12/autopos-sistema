import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CatalogoEquivalencias } from './catalogo-equivalencias';

describe('CatalogoEquivalencias', () => {
  let component: CatalogoEquivalencias;
  let fixture: ComponentFixture<CatalogoEquivalencias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogoEquivalencias],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogoEquivalencias);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
