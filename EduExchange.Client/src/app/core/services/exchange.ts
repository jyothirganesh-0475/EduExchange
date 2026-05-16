import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ExchangeRequest {
  requestId:   number;
  bookId:      number;
  requesterId: number;
  status:      string;
  message?:    string;
  book?:       { title: string; author: string; ownerId: number; };
  requester?:  { username: string; };
}

@Injectable({ providedIn: 'root' })
export class ExchangeService {
  private http = inject(HttpClient);
  private url  = `${environment.apiUrl}/exchange`;

  getAll(): Observable<ExchangeRequest[]> {
    return this.http.get<ExchangeRequest[]>(this.url);
  }

  // ← No userId in URL — server reads from JWT
  getSent(): Observable<ExchangeRequest[]> {
    return this.http.get<ExchangeRequest[]>(`${this.url}/sent`);
  }

  // ← No userId in URL — server reads from JWT
  getReceived(): Observable<ExchangeRequest[]> {
    return this.http.get<ExchangeRequest[]>(`${this.url}/received`);
  }

  create(request: Partial<ExchangeRequest>): Observable<ExchangeRequest> {
    return this.http.post<ExchangeRequest>(this.url, request);
  }

  updateStatus(id: number, status: string): Observable<ExchangeRequest> {
    return this.http.put<ExchangeRequest>(`${this.url}/${id}`, { status });
  }
}