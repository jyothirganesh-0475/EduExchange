import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { ItemService, Item } from '../../../core/services/item';
import { AuthService } from '../../../core/services/auth';
import { ErrorHandlerService } from '../../../core/services/error-handler';

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatButtonModule, MatInputModule,
    MatSelectModule, MatIconModule
  ],
  templateUrl: './item-list.html',
  styleUrl: './item-list.scss'
})
export class ItemListComponent implements OnInit {
  private itemService  = inject(ItemService);
  private authService  = inject(AuthService);
  private errorHandler = inject(ErrorHandlerService);
  private cdr          = inject(ChangeDetectorRef);

  allItems : Item[] = [];
  items    : Item[] = [];

  searchTerm   = '';
  selectedType = '';
  userId       = this.authService.getUserId();

  itemTypes = ['Scientific Calculator', 'Casio Calculator', 'Drafter',
               'Geometric Box', 'Compass Set', 'Lab Equipment', 'Other'];

  page     = 1;
  pageSize = 8;

  get totalPages(): number { return Math.ceil(this.allItems.length / this.pageSize) || 1; }
  get pages(): number[]    { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
  get startIndex(): number { return (this.page - 1) * this.pageSize; }
  get endIndex():   number { return this.page * this.pageSize; }

  ngOnInit() { this.loadItems(); }

  loadItems() {
    this.itemService.getAll(
      this.selectedType || undefined,
      this.searchTerm   || undefined,
      this.userId
    ).subscribe({
      next: (data) => {
        this.allItems = data;
        this.page     = 1;
        this.updateSlice();
        this.cdr.detectChanges();
      },
      error: (err) => this.errorHandler.handle(err, 'Failed to load items.')
    });
  }

  updateSlice() {
    this.items = this.allItems.slice(this.startIndex, this.endIndex);
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.updateSlice();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  prevPage() { this.goToPage(this.page - 1); }
  nextPage() { this.goToPage(this.page + 1); }

  onFilter()  { this.loadItems(); }

  clearFilters() {
    this.searchTerm   = '';
    this.selectedType = '';
    this.loadItems();
  }

  getTypeIcon(type: string): string {
    const icons: any = {
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
}