import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { NotesService } from '../../../core/services/notes';
import { AuthService } from '../../../core/services/auth';
import { ToastService } from '../../../core/services/toast';
import { ErrorHandlerService } from '../../../core/services/error-handler';
import { environment } from '../../../../environments/environment';

interface Category { categoryId: number; categoryName: string; }

@Component({
  selector: 'app-upload-note',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatCardModule, MatButtonModule,
    MatInputModule, MatSelectModule, MatIconModule
  ],
  templateUrl: './upload-note.html',
  styleUrl: './upload-note.scss'
})
export class UploadNoteComponent implements OnInit {
  private notesService = inject(NotesService);
  private authService  = inject(AuthService);
  private router       = inject(Router);
  private toast        = inject(ToastService);
  private errorHandler = inject(ErrorHandlerService);
  private http         = inject(HttpClient);

  // uploaderId removed — server reads from JWT
  note = {
    title:         '',
    subject:       '',
    academicLevel: '',
    categoryId:    0
  };

  categories  : Category[] = [];
  selectedFile: File | null = null;
  levels = ['School', 'Undergraduate', 'Masters', 'PhD'];

  ngOnInit() {
    this.http.get<Category[]>(`${environment.apiUrl}/categories`).subscribe({
      next: (cats) => {
        this.categories = cats;
        if (cats.length > 0) this.note.categoryId = cats[0].categoryId;
      },
      error: () => this.toast.error('Failed to load categories.')
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  upload() {
    if (!this.note.title) {
      this.toast.error('Please enter a title!');
      return;
    }
    if (!this.selectedFile) {
      this.toast.error('Please select a PDF file!');
      return;
    }
    if (!this.note.categoryId) {
      this.toast.error('Please select a category!');
      return;
    }

    const formData = new FormData();
    formData.append('title',         this.note.title);
    formData.append('subject',       this.note.subject);
    formData.append('academicLevel', this.note.academicLevel);
    formData.append('categoryId',    this.note.categoryId.toString());
    formData.append('file',          this.selectedFile);
    // uploaderId NOT appended — server reads from JWT

    this.notesService.upload(formData).subscribe({
      next: () => {
        this.toast.success('Note uploaded successfully!');
        this.router.navigate(['/notes']);
      },
      error: (err) => this.errorHandler.handle(err, 'Upload failed! Please try again.')
    });
  }
}