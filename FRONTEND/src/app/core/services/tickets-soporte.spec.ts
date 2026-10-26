import { TestBed } from '@angular/core/testing';
import { TicketsSoporte } from './tickets-soporte';

describe('TicketsSoporte', () => {
  let service: TicketsSoporte;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TicketsSoporte);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
