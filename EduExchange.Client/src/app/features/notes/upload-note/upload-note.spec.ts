import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadNote } from './upload-note';

describe('UploadNote', () => {
  let component: UploadNote;
  let fixture: ComponentFixture<UploadNote>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadNote]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadNote);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
