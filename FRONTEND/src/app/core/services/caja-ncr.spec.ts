import { TestBed } from '@angular/core/testing';
import { CajaNcr } from './caja-ncr';

describe('CajaNcr', () => {
  let service: CajaNcr;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CajaNcr);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
