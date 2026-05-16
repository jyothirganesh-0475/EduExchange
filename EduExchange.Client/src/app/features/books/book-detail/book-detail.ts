import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { BookService, Book } from '../../../core/services/book';
import { ExchangeService } from '../../../core/services/exchange';
import { AuthService } from '../../../core/services/auth';
import { ToastService } from '../../../core/services/toast';
import { ErrorHandlerService } from '../../../core/services/error-handler';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule
  ],
  templateUrl: './book-detail.html',
  styleUrl: './book-detail.scss'
})
export class BookDetailComponent implements OnInit {
  private route           = inject(ActivatedRoute);
  private router          = inject(Router);
  private bookService     = inject(BookService);
  private exchangeService = inject(ExchangeService);
  private authService     = inject(AuthService);
  private toast           = inject(ToastService);
  private errorHandler    = inject(ErrorHandlerService);
  private cdr             = inject(ChangeDetectorRef);

  book    : Book | null = null;
  isOwner : boolean     = false;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.bookService.getById(+id).subscribe({
        next: (data) => {
          this.book    = data;
          this.isOwner = data.ownerId === this.authService.getUserId();
          this.cdr.detectChanges();
        },
        error: (err) => this.errorHandler.handle(err, 'Failed to load book details.')
      });
    }
  }

  getImageUrl(imagePath: string): string {
    return this.bookService.getImageUrl(imagePath);
  }

  onImgError(event: any) {
    event.target.style.display = 'none';
  }

  // BUG FIX 5 — uses book.contactNumber dynamically, not hardcoded
  openWhatsApp() {
    if (!this.book?.contactNumber) {
      this.toast.error('No contact number available.');
      return;
    }
    const number = this.book.contactNumber.replace(/\D/g, '');
    const phone  = number.startsWith('91') ? number : `91${number}`;
    const msg    = encodeURIComponent(
      `Hi! I saw your book "${this.book.title}" on EduExchange and I'm interested in exchanging it.`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  }

  requestExchange() {
    if (this.isOwner) {
      this.toast.error('You cannot request your own book.');
      return;
    }
    if (!this.book) return;

    const request = {
      bookId:      this.book.bookId,
      requesterId: this.authService.getUserId(),
      message:     `I would like to exchange "${this.book.title}"`
    };
    this.exchangeService.create(request).subscribe({
      next: () => {
        this.toast.success('Exchange request sent successfully!');
        this.router.navigate(['/exchange']);
      },
      error: (err) => this.errorHandler.handle(err, 'Failed to send exchange request.')
    });
  }
}