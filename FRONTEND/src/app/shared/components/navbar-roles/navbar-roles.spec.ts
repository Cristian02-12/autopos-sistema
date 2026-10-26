import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarRoles } from './navbar-roles';

describe('NavbarRoles', () => {
  let component: NavbarRoles;
  let fixture: ComponentFixture<NavbarRoles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarRoles],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarRoles);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
