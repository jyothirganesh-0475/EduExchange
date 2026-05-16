import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-assets-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="assets-tab-bar">
      <button class="assets-tab" [class.active]="activeTab === 'books'"
              (click)="navigate('/my-books')">
        <span class="tab-icon">📚</span> My Books
      </button>
      <button class="assets-tab" [class.active]="activeTab === 'notes'"
              (click)="navigate('/my-notes')">
        <span class="tab-icon">📝</span> My Notes
      </button>
      <button class="assets-tab" [class.active]="activeTab === 'items'"
              (click)="navigate('/my-items')">
        <span class="tab-icon">🎒</span> My Items
      </button>
    </div>
  `,
  styles: [`
    .assets-tab-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
      background: white;
      padding: 8px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(108,99,255,0.08);
      flex-wrap: wrap;
    }
    .assets-tab {
      flex: 1;
      min-width: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 16px;
      border: none;
      border-radius: 10px;
      background: transparent;
      color: #636e72;
      font-family: 'Poppins', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      .tab-icon { font-size: 16px; }
      &:hover:not(.active) { background: #f8f9ff; color: #6c63ff; }
      &.active {
        background: linear-gradient(135deg, #6c63ff, #a855f7);
        color: white;
        box-shadow: 0 4px 12px rgba(108,99,255,0.3);
      }
    }
    @media (max-width: 600px) {
      .assets-tab { font-size: 12px; padding: 8px 10px; }
    }
  `]
})
export class AssetsTabsComponent {
  @Input() activeTab: 'books' | 'notes' | 'items' = 'books';
  private router = inject(Router);
  navigate(route: string) { this.router.navigate([route]); }
}