import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { NotesService, Note } from '../../../core/services/notes';
import { AuthService } from '../../../core/services/auth';
import { ErrorHandlerService } from '../../../core/services/error-handler';
import { ToastService } from '../../../core/services/toast';
import { AssetsTabsComponent } from '../../../shared/components/assets-tabs/assets-tabs';

@Component({
  selector: 'app-my-notes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatButtonModule, MatInputModule, MatIconModule,
    AssetsTabsComponent
  ],
  templateUrl: './my-notes.html',
  styleUrl:    './my-notes.scss'
})
export class MyNotesComponent implements OnInit {
  private notesService = inject(NotesService);
  private authService  = inject(AuthService);
  private errorHandler = inject(ErrorHandlerService);
  private toast        = inject(ToastService);
  private cdr          = inject(ChangeDetectorRef);

  myNotes : Note[] = [];

  ngOnInit() { this.loadMyNotes(); }

  loadMyNotes() {
    const userId = this.authService.getUserId();
    this.notesService.getMyNotes(userId).subscribe({
      next: data => {
        this.myNotes = data;
        this.cdr.detectChanges();
      },
      error: err => this.errorHandler.handle(err, 'Failed to load your notes.')
    });
  }

  download(note: Note) {
    this.notesService.downloadNote(note);
  }

  deleteNote(id: number) {
    if (!confirm('Delete this note?')) return;
    this.notesService.delete(id).subscribe({
      next: () => {
        this.toast.success('Note deleted.');
        this.loadMyNotes();
      },
      error: err => this.errorHandler.handle(err, 'Failed to delete note.')
    });
  }

  getFileIcon(filePath: string): string {
    const ext = filePath?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf')  return 'picture_as_pdf';
    if (ext === 'docx' || ext === 'doc') return 'article';
    if (ext === 'pptx' || ext === 'ppt') return 'slideshow';
    return 'description';
  }

  getLevelColor(level: string): string {
    const colors: Record<string, string> = {
      'School':        '#43e97b',
      'Undergraduate': '#6c63ff',
      'Masters':       '#f093fb',
      'PhD':           '#f5576c'
    };
    return colors[level] || '#6c63ff';
  }
}