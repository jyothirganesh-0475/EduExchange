import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { BookService } from '../../../core/services/book';
import { AuthService } from '../../../core/services/auth';
import { ToastService } from '../../../core/services/toast';
import { ErrorHandlerService } from '../../../core/services/error-handler';
import { environment } from '../../../../environments/environment';

interface Category { categoryId: number; categoryName: string; }

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatCardModule, MatButtonModule, MatInputModule,
    MatSelectModule, MatIconModule
  ],
  templateUrl: './book-form.html',
  styleUrl: './book-form.scss'
})
export class BookFormComponent implements OnInit {
  private bookService  = inject(BookService);
  private authService  = inject(AuthService);
  private router       = inject(Router);
  private route        = inject(ActivatedRoute);
  private toast        = inject(ToastService);
  private errorHandler = inject(ErrorHandlerService);
  private http         = inject(HttpClient);

  isEditMode    = false;
  bookId        : number | null = null;
  selectedImage : File | null   = null;
  imagePreview  : string | null = null;
  isSubmitting  = false;

  categories : Category[] = [];

  // ownerId removed — server reads it from JWT
  book = {
    title:         '',
    author:        '',
    subject:       '',
    academicLevel: '',
    condition:     '',
    status:        'Available',
    contactNumber: '',
    categoryId:    0
  };

  levels     = ['School', 'Undergraduate', 'Masters', 'PhD'];
  conditions = ['New', 'Like New', 'Good', 'Acceptable'];

  ngOnInit() {
    this.http.get<Category[]>(`${environment.apiUrl}/categories`).subscribe({
      next: (cats: Category[]) => {
        this.categories = cats;
        if (!this.isEditMode && cats.length > 0)
          this.book.categoryId = cats[0].categoryId;
      },
      error: () => this.toast.error('Failed to load categories.')
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.bookId     = +id;
      this.bookService.getById(+id).subscribe({
        next: (data: any) => {
          // ownerId removed — not needed client-side
          this.book = {
            title:         data.title,
            author:        data.author,
            subject:       data.subject,
            academicLevel: data.academicLevel,
            condition:     data.condition,
            status:        data.status,
            contactNumber: data.contactNumber || '',
            categoryId:    data.categoryId
          };
          if (data.imagePath)
            this.imagePreview = this.bookService.getImageUrl(data.imagePath);
        },
        error: (err: any) => this.errorHandler.handle(err, 'Failed to load book.')
      });
    }
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.selectedImage = file;
    const reader = new FileReader();
    reader.onload = (e) => this.imagePreview = e.target?.result as string;
    reader.readAsDataURL(file);
  }

  removeImage() {
    this.selectedImage = null;
    this.imagePreview  = null;
  }

  submitBook() {
    if (!this.book.title || !this.book.author) {
      this.toast.error('Please fill in Title and Author!');
      return;
    }
    if (!this.book.contactNumber) {
      this.toast.error('Please enter a contact number!');
      return;
    }
    if (!this.book.categoryId) {
      this.toast.error('Please select a category!');
      return;
    }

    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('title',         this.book.title);
    formData.append('author',        this.book.author);
    formData.append('subject',       this.book.subject       || '');
    formData.append('academicLevel', this.book.academicLevel || '');
    formData.append('condition',     this.book.condition     || '');
    formData.append('status',        this.book.status);
    formData.append('contactNumber', this.book.contactNumber);
    formData.append('categoryId',    this.book.categoryId.toString());
    if (this.selectedImage)
      formData.append('image', this.selectedImage);

    if (this.isEditMode && this.bookId) {
      this.bookService.updateWithImage(this.bookId, formData).subscribe({
        next: () => {
          this.toast.success('Book updated successfully!');
          this.router.navigate(['/my-books']);
        },
        error: (err: any) => {
          this.errorHandler.handle(err, 'Failed to update book.');
          this.isSubmitting = false;
        }
      });
    } else {
      this.bookService.createWithImage(formData).subscribe({
        next: () => {
          this.toast.success('Book added successfully!');
          this.router.navigate(['/my-books']);
        },
        error: (err: any) => {
          this.errorHandler.handle(err, 'Failed to add book.');
          this.isSubmitting = false;
        }
      });
    }
  }
}