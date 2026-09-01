import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppStore } from '../../core/store/app.store';

@Component({
  selector: 'app-payments-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payments-list.component.html',
  styleUrl: './payments-list.component.css',
})
export class PaymentsListComponent implements OnInit {
  public store = inject(AppStore);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  showCreateModal = false;
  isSubmitting = false;
  errorMessage = '';

  showRefundModal = false;
  isRefundSubmitting = false;
  refundErrorMessage = '';
  selectedPayment: any = null;

  paymentForm = this.fb.group({
    amount: [100.0, [Validators.required, Validators.min(1)]],
    currency: ['USD', [Validators.required, Validators.maxLength(3)]],
    cardNumber: ['4242424242424242', [Validators.required]],
    cardExpiry: ['12/28', [Validators.required]],
    cardCvc: ['123', [Validators.required]],
  });

  refundForm = this.fb.group({
    amount: [0.0, [Validators.required, Validators.min(0.1)]],
    reason: ['Customer request', [Validators.required]],
  });

  ngOnInit() {
    this.fetchPayments();
  }

  fetchPayments() {
    this.http.get<any[]>('http://localhost:3000/api/v1/payments').subscribe({
      next: (res) => {
        this.store.setPayments(res);
      },
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'SUCCEEDED':
        return 'bg-green-50 text-green-700 border border-green-200';
      case 'FAILED':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'PROCESSING':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'CANCELED':
        return 'bg-slate-100 text-slate-600 border border-slate-200';
      default:
        return 'bg-slate-50 text-slate-500';
    }
  }

  onCreatePayment() {
    if (this.paymentForm.invalid) return;
    this.isSubmitting = true;
    this.errorMessage = '';

    const val = this.paymentForm.value;
    
    const payload = {
      amount: val.amount,
      currency: val.currency,
      paymentMethod: {
        type: 'card',
        card: {
          number: val.cardNumber,
          expiryMonth: 12,
          expiryYear: 2028,
          cvc: val.cardCvc,
        },
      },
    };

    this.http.get<any[]>('http://localhost:3000/api/v1/keys').subscribe({
      next: (keys) => {
        if (keys.length === 0) {
          this.http.post<any>('http://localhost:3000/api/v1/keys/rotate', {}).subscribe({
            next: (newKey) => {
              this.dispatchCharge(newKey.secretKey, payload);
            },
            error: () => {
              this.errorMessage = 'Could not generate API Keys to execute charge.';
              this.isSubmitting = false;
            }
          });
        } else {
          const storedSecret = localStorage.getItem('secretKey');
          if (storedSecret) {
            this.dispatchCharge(storedSecret, payload);
          } else {
            this.http.post<any>('http://localhost:3000/api/v1/keys/rotate', {}).subscribe({
              next: (rotated) => {
                localStorage.setItem('secretKey', rotated.secretKey);
                this.dispatchCharge(rotated.secretKey, payload);
              },
              error: () => {
                this.errorMessage = 'No active API Secret Key in cache. Rolled a new key but failed.';
                this.isSubmitting = false;
              }
            });
          }
        }
      },
    });
  }

  private dispatchCharge(secretKey: string, payload: any) {
    this.http.post<any>('http://localhost:3000/api/v1/payments', payload, {
      headers: { Authorization: `Bearer ${secretKey}` }
    }).subscribe({
      next: () => {
        this.fetchPayments();
        this.showCreateModal = false;
        this.isSubmitting = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Charge declined by payment gateway.';
        this.isSubmitting = false;
      }
    });
  }

  openRefundModal(payment: any) {
    this.selectedPayment = payment;
    this.refundForm.patchValue({
      amount: payment.amount,
    });
    this.showRefundModal = true;
    this.refundErrorMessage = '';
  }

  onRefund() {
    if (this.refundForm.invalid) return;
    this.isRefundSubmitting = true;
    this.refundErrorMessage = '';

    const secretKey = localStorage.getItem('secretKey');
    if (!secretKey) {
      this.refundErrorMessage = 'No API secret key found in session to verify transaction.';
      this.isRefundSubmitting = false;
      return;
    }

    const payload = {
      paymentIntentId: this.selectedPayment.id,
      amount: this.refundForm.value.amount,
      reason: this.refundForm.value.reason,
    };

    this.http.post<any>('http://localhost:3000/api/v1/refunds', payload, {
      headers: { Authorization: `Bearer ${secretKey}` }
    }).subscribe({
      next: () => {
        this.fetchPayments();
        this.showRefundModal = false;
        this.isRefundSubmitting = false;
        window.location.reload();
      },
      error: (err) => {
        this.refundErrorMessage = err.error?.message || 'Refund failed.';
        this.isRefundSubmitting = false;
      }
    });
  }
}
