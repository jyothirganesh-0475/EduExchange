import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton-card.component.html',
  styleUrl: './skeleton-card.component.scss'
})
export class SkeletonCardComponent {
  /** Number of skeleton cards to render in the grid */
  @Input() count = 6;

  /** Visual variant: 'card' (image+text), 'row' (horizontal row) */
  @Input() variant: 'card' | 'row' = 'card';

  get items(): number[] {
    return Array.from({ length: this.count });
  }
}
