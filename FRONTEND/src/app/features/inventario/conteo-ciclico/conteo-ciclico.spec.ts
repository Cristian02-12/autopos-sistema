import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConteoCiclico } from './conteo-ciclico';

describe('ConteoCiclico', () => {
  let component: ConteoCiclico;
  let fixture: ComponentFixture<ConteoCiclico>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConteoCiclico],
    }).compileComponents();

    fixture = TestBed.createComponent(ConteoCiclico);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
