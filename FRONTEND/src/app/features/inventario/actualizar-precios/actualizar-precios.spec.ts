import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActualizarPrecios } from './actualizar-precios';

describe('ActualizarPrecios', () => {
  let component: ActualizarPrecios;
  let fixture: ComponentFixture<ActualizarPrecios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActualizarPrecios],
    }).compileComponents();

    fixture = TestBed.createComponent(ActualizarPrecios);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
