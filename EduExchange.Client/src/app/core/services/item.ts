import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Item {
  itemId:         number;
  name:           string;
  description?:   string;
  itemType:       string;
  condition?:     string;
  status:         string;
  imagePath?:     string;
  contactNumber?: string;
  ownerId:        number;
  createdAt?:     string;
  owner?:         { username: string; };
}

export interface ItemRequest {
  itemRequestId: number;
  itemId:        number;
  requesterId:   number;
  status:        string;
  message?:      string;
  createdAt?:    string;
  item?:         Item & { owner?: { username: string } };
  requester?:    { username: string; };
}

@Injectable({ providedIn: 'root' })
export class ItemService {
  private http = inject(HttpClient);
  private url  = `${environment.apiUrl}/items`;

  getAll(type?: string, search?: string, excludeOwner?: number): Observable<Item[]> {
    let params = new HttpParams();
    if (type)         params = params.set('type', type);
    if (search)       params = params.set('search', search);
    if (excludeOwner) params = params.set('excludeOwner', excludeOwner.toString());
    return this.http.get<Item[]>(this.url, { params });
  }

  getMyItems(ownerId: number): Observable<Item[]> {
    return this.http.get<Item[]>(`${this.url}/myitems/${ownerId}`);
  }

  getById(id: number): Observable<Item> {
    return this.http.get<Item>(`${this.url}/${id}`);
  }

  create(formData: FormData): Observable<Item> {
    return this.http.post<Item>(this.url, formData);
  }

  update(id: number, data: FormData | Partial<Item>): Observable<Item> {
    return this.http.put<Item>(`${this.url}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  createRequest(data: { itemId: number;  message?: string }): Observable<ItemRequest> {
    return this.http.post<ItemRequest>(`${this.url}/requests`, data);
  }

  getSentRequests(userId: number): Observable<ItemRequest[]> {
    return this.http.get<ItemRequest[]>(`${this.url}/requests/sent/${userId}`);
  }

  getReceivedRequests(userId: number): Observable<ItemRequest[]> {
    return this.http.get<ItemRequest[]>(`${this.url}/requests/received/${userId}`);
  }

  updateRequest(requestId: number, data: { status: string }): Observable<ItemRequest> {
    return this.http.put<ItemRequest>(`${this.url}/requests/${requestId}`, data);
  }

  getImageUrl(imagePath: string | null): string {
    if (!imagePath) return 'assets/default-item.svg';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://'))
      return imagePath;
    return `${environment.apiBase}/${imagePath}`;
  }
}