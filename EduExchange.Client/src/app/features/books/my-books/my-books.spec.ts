import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyBooksComponent } from './my-books';

describe('MyBooks', () => {
  let component: MyBooksComponent;
  let fixture: ComponentFixture<MyBooksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyBooksComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyBooksComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
