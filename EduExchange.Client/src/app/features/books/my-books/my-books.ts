import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { BookService, Book } from '../../../core/services/book';
import { AuthService } from '../../../core/services/auth';
import { ToastService } from '../../../core/services/toast';
import { ErrorHandlerService } from '../../../core/services/error-handler';
import { AssetsTabsComponent } from '../../../shared/components/assets-tabs/assets-tabs';
import { SkeletonCardComponent } from '../../../shared/components/skeleton-card/skeleton-card.component';


@Component({
  selector: 'app-my-books',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatButtonModule, MatIconModule, MatCardModule,
    AssetsTabsComponent, SkeletonCardComponent
  ],
  templateUrl: './my-books.html',
  styleUrl: './my-books.scss'
})
export class MyBooksComponent implements OnInit {
  private bookService  = inject(BookService);
  private authService  = inject(AuthService);
  private toast        = inject(ToastService);
  private errorHandler = inject(ErrorHandlerService);
  private cdr          = inject(ChangeDetectorRef);

  books: Book[] = [];
  isLoading = true;

  ngOnInit() { this.loadMyBooks(); }

  loadMyBooks() {
    this.isLoading = true;
    const userId = this.authService.getUserId();
    this.bookService.getMyBooks(userId).subscribe({
      next: (data) => { this.books = data; this.isLoading = false; this.cdr.detectChanges(); },
      error: (err)  => { this.isLoading = false; this.errorHandler.handle(err, 'Failed to load your books.'); this.cdr.detectChanges(); }
    });
  }

  deleteBook(id: number) {
    if (!confirm('Remove this book listing?')) return;
    this.bookService.delete(id).subscribe({
      next: () => { this.toast.success('Book removed successfully.'); this.loadMyBooks(); },
      error: (err) => this.errorHandler.handle(err, 'Failed to delete book.')
    });
  }
}