import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin, Subscription } from 'rxjs';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ExchangeService, ExchangeRequest } from '../../../core/services/exchange';
import { ItemService, ItemRequest } from '../../../core/services/item';
import { AuthService } from '../../../core/services/auth';
import { ToastService } from '../../../core/services/toast';
import { ErrorHandlerService } from '../../../core/services/error-handler';
import { NotificationService } from '../../../core/services/notification';

export interface UnifiedRequest {
  id:         number;
  type:       'book' | 'item';
  title:      string;
  requester?: string;
  message?:   string;
  status:     string;
  raw:        ExchangeRequest | ItemRequest;
}

@Component({
  selector: 'app-exchange-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, RouterModule],
  templateUrl: './exchange-list.html',
  styleUrl: './exchange-list.scss'
})
export class ExchangeListComponent implements OnInit, OnDestroy {
  private exchangeService = inject(ExchangeService);
  private itemService     = inject(ItemService);
  private authService     = inject(AuthService);
  private toast           = inject(ToastService);
  private errorHandler    = inject(ErrorHandlerService);
  private cdr             = inject(ChangeDetectorRef);
  private notifService    = inject(NotificationService);
  private route           = inject(ActivatedRoute);

  userId!: number;

  sentRequests     : UnifiedRequest[] = [];
  receivedRequests : UnifiedRequest[] = [];
  allRequests      : UnifiedRequest[] = [];
  isLoading  = true;
  activeTab  = 'all';

  private querySub : Subscription | null = null;

  ngOnInit() {
    this.userId = this.authService.getUserId();

    // Subscribe to queryParams so tab updates every time
    // even when navigating to the same route
    this.querySub = this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      this.activeTab = (tab === 'sent' || tab === 'received') ? tab : 'all';
      this.cdr.detectChanges();
    });

    this.loadAll();
  }

  ngOnDestroy() {
    this.querySub?.unsubscribe();
  }

  loadAll() {
    this.isLoading = true;

    forkJoin({
      bookSent:     this.exchangeService.getSent(),
      bookReceived: this.exchangeService.getReceived(),
      bookAll:      this.exchangeService.getAll(),
      itemSent:     this.itemService.getSentRequests(this.userId),
      itemReceived: this.itemService.getReceivedRequests(this.userId)
    }).subscribe({
      next: ({ bookSent, bookReceived, bookAll, itemSent, itemReceived }) => {
        this.sentRequests = [
          ...bookSent.map(r    => this.toUnified(r, 'book')),
          ...itemSent.map(r    => this.toUnifiedItem(r))
        ].sort((a, b) => b.id - a.id);

        this.receivedRequests = [
          ...bookReceived.map(r => this.toUnified(r, 'book')),
          ...itemReceived.map(r => this.toUnifiedItem(r))
        ].sort((a, b) => b.id - a.id);

        this.allRequests = [
          ...bookAll.map(r      => this.toUnified(r, 'book')),
          ...itemSent.map(r     => this.toUnifiedItem(r)),
          ...itemReceived.map(r => this.toUnifiedItem(r))
        ]
        .filter((v, i, arr) =>
          arr.findIndex(x => x.type === v.type && x.id === v.id) === i
        )
        .sort((a, b) => b.id - a.id);

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.errorHandler.handle(err, 'Failed to load requests.');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private toUnified(r: ExchangeRequest, type: 'book'): UnifiedRequest {
    return {
      id:        r.requestId,
      type,
      title:     r.book?.title || '—',
      requester: r.requester?.username,
      message:   r.message,
      status:    r.status,
      raw:       r
    };
  }

  private toUnifiedItem(r: ItemRequest): UnifiedRequest {
    return {
      id:        r.itemRequestId,
      type:      'item',
      title:     r.item?.name || '—',
      requester: r.requester?.username,
      message:   r.message,
      status:    r.status,
      raw:       r
    };
  }

  updateStatus(req: UnifiedRequest, status: string) {
    const label = status === 'Approved' ? 'approved' :
                  status === 'Rejected' ? 'rejected' : 'completed';

    if (req.type === 'book') {
      const r = req.raw as ExchangeRequest;
      this.exchangeService.updateStatus(r.requestId, status).subscribe({
        next: () => {
          this.toast.success(`Request ${label}!`);
          this.notifService.refresh();
          this.loadAll();
        },
        error: (err: any) => this.errorHandler.handle(err, 'Failed to update.')
      });
    } else {
      const r = req.raw as ItemRequest;
      this.itemService.updateRequest(r.itemRequestId, { status }).subscribe({
        next: () => {
          this.toast.success(`Request ${label}!`);
          this.notifService.refresh();
          this.loadAll();
        },
        error: (err: any) => this.errorHandler.handle(err, 'Failed to update.')
      });
    }
  }

  getBadgeClass(status: string): string {
    const map: Record<string, string> = {
      'Pending':   'badge-pending',
      'Approved':  'badge-approved',
      'Rejected':  'badge-rejected',
      'Completed': 'badge-completed'
    };
    return map[status] || 'badge-pending';
  }

  bookCount(list: UnifiedRequest[]): number {
    return list.filter(r => r.type === 'book').length;
  }

  itemCount(list: UnifiedRequest[]): number {
    return list.filter(r => r.type === 'item').length;
  }
}