import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ItemService, Item, ItemRequest } from '../../../core/services/item';
import { AuthService } from '../../../core/services/auth';
import { ToastService } from '../../../core/services/toast';
import { AssetsTabsComponent } from '../../../shared/components/assets-tabs/assets-tabs';
import { SkeletonCardComponent } from '../../../shared/components/skeleton-card/skeleton-card.component';

@Component({
  selector: 'app-my-items',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    AssetsTabsComponent, SkeletonCardComponent
  ],
  templateUrl: './my-items.html',
  styleUrl:    './my-items.scss'
})
export class MyItemsComponent implements OnInit {
  private itemService = inject(ItemService);
  private authService = inject(AuthService);
  private toast       = inject(ToastService);

  myItems          : Item[]        = [];
  receivedRequests : ItemRequest[] = [];
  sentRequests     : ItemRequest[] = [];
  isLoading = true;

  get pendingReceivedCount(): number {
    return this.receivedRequests.filter(r => r.status === 'Pending').length;
  }

  private userId = this.authService.getUserId();

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.isLoading = true;
    this.itemService.getMyItems(this.userId).subscribe({
      next: items => { this.myItems = items; this.isLoading = false; },
      error: () => { this.toast.error('Failed to load your items.'); this.isLoading = false; }
    });
    this.itemService.getReceivedRequests(this.userId).subscribe({
      next: reqs => this.receivedRequests = reqs,
      error: () => {}
    });
    this.itemService.getSentRequests(this.userId).subscribe({
      next: reqs => this.sentRequests = reqs,
      error: () => {}
    });
  }

  deleteItem(itemId: number) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    this.itemService.delete(itemId).subscribe({
      next: () => { this.toast.success('Item deleted.'); this.loadAll(); },
      error: () => this.toast.error('Failed to delete item.')
    });
  }

  updateRequestStatus(requestId: number, status: string) {
    this.itemService.updateRequest(requestId, { status }).subscribe({
      next: () => { this.toast.success(`Request ${status.toLowerCase()}.`); this.loadAll(); },
      error: () => this.toast.error('Failed to update request.')
    });
  }

  getImageUrl(imagePath: string | null | undefined): string {
    return this.itemService.getImageUrl(imagePath ?? null);
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'Scientific Calculator': '🧮', 'Casio Calculator': '🔢',
      'Drafter': '📐', 'Geometric Box': '📏',
      'Compass Set': '🧭', 'Lab Equipment': '🔬', 'Other': '📦'
    };
    return icons[type] || '📦';
  }

  getBadgeClass(status: string): string {
    const map: Record<string, string> = {
      'Pending': 'badge-pending', 'Approved': 'badge-approved',
      'Rejected': 'badge-rejected', 'Completed': 'badge-completed'
    };
    return map[status] || 'badge-pending';
  }

  onImgError(event: Event) {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}