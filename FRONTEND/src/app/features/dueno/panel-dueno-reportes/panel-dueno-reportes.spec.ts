import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PanelDuenoReportes } from './panel-dueno-reportes';

describe('PanelDuenoReportes', () => {
  let component: PanelDuenoReportes;
  let fixture: ComponentFixture<PanelDuenoReportes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelDuenoReportes],
    }).compileComponents();

    fixture = TestBed.createComponent(PanelDuenoReportes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
