import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { BookService, Book } from '../../../core/services/book';
import { AuthService } from '../../../core/services/auth';
import { ErrorHandlerService } from '../../../core/services/error-handler';

@Component({
  selector: 'app-books-search',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatButtonModule, MatInputModule,
    MatSelectModule, MatIconModule
  ],
  templateUrl: './books-search.html',
  styleUrl:    './books-search.scss'
})
export class BooksSearchComponent implements OnInit {
  private bookService  = inject(BookService);
  private authService  = inject(AuthService);
  private errorHandler = inject(ErrorHandlerService);
  private cdr          = inject(ChangeDetectorRef);

  allBooks : Book[] = [];
  books    : Book[] = [];

  searchQuery   = '';
  selectedLevel = '';
  levels        = ['School', 'Undergraduate', 'Masters', 'PhD'];
  userId        = this.authService.getUserId();

  page     = 1;
  pageSize = 8;

  get totalPages(): number { return Math.ceil(this.allBooks.length / this.pageSize) || 1; }
  get pages(): number[]    { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
  get startIndex(): number { return (this.page - 1) * this.pageSize; }
  get endIndex():   number { return this.page * this.pageSize; }

  ngOnInit() { this.loadBooks(); }

  loadBooks() {
    this.bookService.getAll(
      this.selectedLevel || undefined,
      this.searchQuery   || undefined,
      this.userId
    ).subscribe({
      next: data => {
        this.allBooks = data;
        this.page     = 1;
        this.updateSlice();
        this.cdr.detectChanges();
      },
      error: err => this.errorHandler.handle(err, 'Failed to load books.')
    });
  }

  updateSlice() {
    this.books = this.allBooks.slice(this.startIndex, this.endIndex);
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.updateSlice();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  prevPage() { this.goToPage(this.page - 1); }
  nextPage() { this.goToPage(this.page + 1); }

  onFilter() { this.loadBooks(); }

  clearFilters() {
    this.searchQuery   = '';
    this.selectedLevel = '';
    this.loadBooks();
  }

  getBookImageUrl(imagePath: string | undefined): string {
    return this.bookService.getImageUrl(imagePath);
  }
}