import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExchangeList } from './exchange-list';

describe('ExchangeList', () => {
  let component: ExchangeList;
  let fixture: ComponentFixture<ExchangeList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExchangeList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExchangeList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
