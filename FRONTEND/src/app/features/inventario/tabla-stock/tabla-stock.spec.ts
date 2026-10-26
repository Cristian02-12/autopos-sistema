import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TablaStock } from './tabla-stock';

describe('TablaStock', () => {
  let component: TablaStock;
  let fixture: ComponentFixture<TablaStock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaStock],
    }).compileComponents();

    fixture = TestBed.createComponent(TablaStock);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
