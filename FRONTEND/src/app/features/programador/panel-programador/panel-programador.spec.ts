import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PanelProgramador } from './panel-programador';

describe('PanelProgramador', () => {
  let component: PanelProgramador;
  let fixture: ComponentFixture<PanelProgramador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelProgramador],
    }).compileComponents();

    fixture = TestBed.createComponent(PanelProgramador);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
