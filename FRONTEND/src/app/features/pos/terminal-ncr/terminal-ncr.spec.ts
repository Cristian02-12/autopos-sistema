import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TerminalNcr } from './terminal-ncr';

describe('TerminalNcr', () => {
  let component: TerminalNcr;
  let fixture: ComponentFixture<TerminalNcr>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TerminalNcr],
    }).compileComponents();

    fixture = TestBed.createComponent(TerminalNcr);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
