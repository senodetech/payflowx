import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppStore } from '../../core/store/app.store';

@Component({
  selector: 'app-webhooks-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './webhooks-manager.component.html',
  styleUrl: './webhooks-manager.component.css',
})
export class WebhooksManagerComponent implements OnInit {
  public store = inject(AppStore);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  isSubmitting = false;
  errorMessage = '';

  webhookForm = this.fb.group({
    url: ['', [Validators.required, Validators.pattern(/https?:\/\/.+/)]],
  });

  ngOnInit() {
    this.fetchEndpoints();
    this.fetchLogs();
  }

  fetchEndpoints() {
    this.http.get<any[]>('http://localhost:3000/api/v1/webhooks/endpoints').subscribe({
      next: (res) => {
        this.store.setWebhooks(res);
      },
    });
  }

  fetchLogs() {
    this.http.get<any[]>('http://localhost:3000/api/v1/webhooks/logs').subscribe({
      next: (res) => {
        this.store.setWebhookLogs(res);
      },
    });
  }

  onCreateEndpoint() {
    if (this.webhookForm.invalid) return;
    this.isSubmitting = true;
    this.errorMessage = '';

    const payload = {
      url: this.webhookForm.value.url,
      enabledEvents: ['payment.succeeded', 'refund.succeeded'],
    };

    this.http.post<any>('http://localhost:3000/api/v1/webhooks/endpoints', payload).subscribe({
      next: () => {
        this.webhookForm.reset();
        this.fetchEndpoints();
        this.isSubmitting = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Could not register endpoint URL.';
        this.isSubmitting = false;
      },
    });
  }
}
