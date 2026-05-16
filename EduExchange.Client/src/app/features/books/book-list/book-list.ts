import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { BookService, Book } from '../../../core/services/book';
import { NotesService, Note } from '../../../core/services/notes';
import { ItemService, Item } from '../../../core/services/item';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatButtonModule, MatInputModule,
    MatSelectModule, MatCardModule, MatIconModule
  ],
  templateUrl: './book-list.html',
  styleUrl: './book-list.scss'
})
export class BookListComponent implements OnInit {
  private bookService  = inject(BookService);
  private notesService = inject(NotesService);
  private itemService  = inject(ItemService);
  private authService  = inject(AuthService);
  private cdr          = inject(ChangeDetectorRef);
  private route        = inject(ActivatedRoute);

  // ── Mode Control ──────────────────────────────────────────────────────────
  isBooksMode = false; 
  activeFilter: 'all' | 'books' | 'notes' | 'items' = 'all';

  // ── Data Arrays ───────────────────────────────────────────────────────────
  allBooks: Book[] = [];
  allNotes: Note[] = [];
  allItems: Item[] = [];
  
  books: Book[] = []; // Paginated slice
  notes: Note[] = []; // Paginated slice
  items: Item[] = []; // Paginated slice

  // ── Filters ───────────────────────────────────────────────────────────────
  searchQuery   = '';
  selectedLevel = '';
  levels        = ['School', 'Undergraduate', 'Masters', 'PhD'];

  // ── Pagination ────────────────────────────────────────────────────────────
  booksPage = 1; booksPageSize = 6;
  notesPage = 1; notesPageSize = 6;
  itemsPage = 1; itemsPageSize = 6;

  // ── Getters ───────────────────────────────────────────────────────────────
  get booksTotalPages(): number { return Math.ceil(this.allBooks.length / this.booksPageSize) || 1; }
  get notesTotalPages(): number { return Math.ceil(this.allNotes.length / this.notesPageSize) || 1; }
  get itemsTotalPages(): number { return Math.ceil(this.allItems.length / this.itemsPageSize) || 1; }
  
  get booksPages(): number[] { return Array.from({ length: this.booksTotalPages }, (_, i) => i + 1); }
  get notesPages(): number[] { return Array.from({ length: this.notesTotalPages }, (_, i) => i + 1); }
  get itemsPages(): number[] { return Array.from({ length: this.itemsTotalPages }, (_, i) => i + 1); }

  get showBooks(): boolean { return this.activeFilter === 'all' || this.activeFilter === 'books'; }
  get showNotes(): boolean { return this.activeFilter === 'all' || this.activeFilter === 'notes'; }
  get showItems(): boolean { return this.activeFilter === 'all' || this.activeFilter === 'items'; }

  ngOnInit() {
    // Listen to route data to determine mode
    this.route.data.subscribe(data => {
      this.isBooksMode = data['mode'] === 'books';
      
      // If we are in "Books" mode, lock the filter to 'books'
      // If we are in "Discover" mode, default to 'all'
      this.activeFilter = this.isBooksMode ? 'books' : 'all';
      
      this.loadAll();
    });
  }

  loadAll() {
    const userId = this.authService.getUserId();

    // 1. Load Books
    if (this.showBooks) {
      this.bookService.getAll(this.selectedLevel, this.searchQuery, userId)
        .subscribe(data => {
          this.allBooks = data;
          this.booksPage = 1;
          this.updateBooksSlice();
          this.cdr.detectChanges();
        });
    }

    // 2. Load Notes (Only if not in strict Books mode)
    if (!this.isBooksMode && this.showNotes) {
      this.notesService.getAll().subscribe(data => {
        // Filter out user's own notes if applicable
        this.allNotes = data.filter(n => n.uploaderId !== userId);
        this.notesPage = 1;
        this.updateNotesSlice();
        this.cdr.detectChanges();
      });
    } else if (this.isBooksMode) {
      this.allNotes = [];
    }

    // 3. Load Items (Only if not in strict Books mode)
    if (!this.isBooksMode && this.showItems) {
      this.itemService.getAll(undefined, this.searchQuery, userId)
        .subscribe(data => {
          this.allItems = data;
          this.itemsPage = 1;
          this.updateItemsSlice();
          this.cdr.detectChanges();
        });
    } else if (this.isBooksMode) {
      this.allItems = [];
    }
  }

  setFilter(filter: 'all' | 'books' | 'notes' | 'items') {
    this.activeFilter = filter;
    this.loadAll(); 
    this.cdr.detectChanges();
  }

  onSearch() {
    this.loadAll();
  }

  // ── Pagination Logic ──────────────────────────────────────────────────────
  updateBooksSlice() {
    const start = (this.booksPage - 1) * this.booksPageSize;
    this.books = this.allBooks.slice(start, start + this.booksPageSize);
  }

  updateNotesSlice() {
    const start = (this.notesPage - 1) * this.notesPageSize;
    this.notes = this.allNotes.slice(start, start + this.notesPageSize);
  }

  updateItemsSlice() {
    const start = (this.itemsPage - 1) * this.itemsPageSize;
    this.items = this.allItems.slice(start, start + this.itemsPageSize);
  }

  goToBooksPage(p: number) {
    if (p < 1 || p > this.booksTotalPages) return;
    this.booksPage = p;
    this.updateBooksSlice();
  }

  goToNotesPage(p: number) {
    if (p < 1 || p > this.notesTotalPages) return;
    this.notesPage = p;
    this.updateNotesSlice();
  }

  goToItemsPage(p: number) {
    if (p < 1 || p > this.itemsTotalPages) return;
    this.itemsPage = p;
    this.updateItemsSlice();
  }

  // ── Asset Path Helpers ────────────────────────────────────────────────────
  getBookImageUrl(imagePath: string | undefined): string {
    return this.bookService.getImageUrl(imagePath);
  }

  getItemImageUrl(imagePath: string | undefined): string {
    return this.itemService.getImageUrl(imagePath ?? null);
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'Scientific Calculator': '🧮',
      'Casio Calculator':      '🔢',
      'Drafter':               '📐',
      'Geometric Box':         '📏',
      'Compass Set':           '🧭',
      'Lab Equipment':         '🔬',
      'Other':                 '📦'
    };
    return icons[type] || '📦';
  }

  downloadNote(note: Note) {
    this.notesService.downloadNote(note);
  }
}