import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotesList } from './notes-list';

describe('NotesList', () => {
  let component: NotesList;
  let fixture: ComponentFixture<NotesList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotesList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotesList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
