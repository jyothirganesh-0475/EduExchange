import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { NotesService, Note } from '../../../core/services/notes';
import { AuthService } from '../../../core/services/auth';
import { ErrorHandlerService } from '../../../core/services/error-handler';
import { ToastService } from '../../../core/services/toast';

@Component({
  selector: 'app-notes-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatButtonModule, MatInputModule, MatSelectModule, MatIconModule
  ],
  templateUrl: './notes-list.html',
  styleUrl: './notes-list.scss'
})
export class NotesListComponent implements OnInit {
  private notesService = inject(NotesService);
  private authService  = inject(AuthService);
  private errorHandler = inject(ErrorHandlerService);
  private toast        = inject(ToastService);
  private cdr          = inject(ChangeDetectorRef);

  allNotes : Note[] = [];
  notes    : Note[] = [];

  searchQuery     = '';
  selectedLevel   = '';
  selectedSubject = '';
  levels   = ['School', 'Undergraduate', 'Masters', 'PhD'];
  subjects : string[] = [];

  page     = 1;
  pageSize = 9;

  get totalPages(): number { return Math.ceil(this.filtered.length / this.pageSize) || 1; }
  get pages(): number[]    { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
  get startIdx(): number   { return (this.page - 1) * this.pageSize; }


// Add this to handle the file icons in the template
  getFileIcon(path: string | undefined): string {
    if (!path) return 'insert_drive_file';
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'picture_as_pdf';
      case 'doc':
      case 'docx': return 'description';
      case 'ppt':
      case 'pptx': return 'slideshow';
      default: return 'insert_drive_file';
    }
  }

  // Add this to handle the dynamic badge colors
  getLevelColor(level: string | undefined): string {
    const colors: { [key: string]: string } = {
      'School': '#FF9800',        // Orange
      'Undergraduate': '#2196F3', // Blue
      'Masters': '#4CAF50',      // Green
      'PhD': '#9C27B0'           // Purple
    };
    return (level && colors[level]) ? colors[level] : '#607D8B';
  }
  get filtered(): Note[] {
    const q = this.searchQuery.toLowerCase();
    return this.allNotes.filter(n => {
      const matchSearch  = !q || n.title.toLowerCase().includes(q) ||
                           n.subject.toLowerCase().includes(q);
      const matchLevel   = !this.selectedLevel   || n.academicLevel === this.selectedLevel;
      const matchSubject = !this.selectedSubject || n.subject === this.selectedSubject;
      return matchSearch && matchLevel && matchSubject;
    });
  }

  ngOnInit() { this.loadNotes(); }

  loadNotes() {
    const userId = this.authService.getUserId();
    this.notesService.getAll().subscribe({
      next: data => {
        // Exclude current user's own notes — same as books excludeOwner
        this.allNotes = data.filter(n => n.uploaderId !== userId);
        this.subjects = [...new Set(data.map(n => n.subject).filter(Boolean))].sort();
        this.updateSlice();
        this.cdr.detectChanges();
      },
      error: err => this.errorHandler.handle(err, 'Failed to load notes.')
    });
  }

  onFilterChange() { this.page = 1; this.updateSlice(); }

  clearFilters() {
    this.searchQuery = '';
    this.selectedLevel = '';
    this.selectedSubject = '';
    this.page = 1;
    this.updateSlice();
  }

  updateSlice() {
    this.notes = this.filtered.slice(this.startIdx, this.startIdx + this.pageSize);
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.updateSlice();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  prevPage() { this.goToPage(this.page - 1); }
  nextPage() { this.goToPage(this.page + 1); }

  download(note: Note) { this.notesService.downloadNote(note); }
}