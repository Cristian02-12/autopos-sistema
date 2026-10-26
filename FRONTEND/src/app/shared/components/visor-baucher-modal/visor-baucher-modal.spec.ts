import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisorBaucherModal } from './visor-baucher-modal';

describe('VisorBaucherModal', () => {
  let component: VisorBaucherModal;
  let fixture: ComponentFixture<VisorBaucherModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisorBaucherModal],
    }).compileComponents();

    fixture = TestBed.createComponent(VisorBaucherModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
