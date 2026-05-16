import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookDetailComponent } from './book-detail';

describe('BookDetail', () => {
  let component: BookDetailComponent;
  let fixture: ComponentFixture<BookDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
