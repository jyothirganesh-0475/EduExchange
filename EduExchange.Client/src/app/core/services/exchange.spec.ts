import { TestBed } from '@angular/core/testing';

import { Exchange } from './exchange';

describe('Exchange', () => {
  let service: Exchange;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Exchange);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
