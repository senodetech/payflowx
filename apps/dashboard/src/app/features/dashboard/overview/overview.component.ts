import { Component, ElementRef, inject, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AppStore } from '../../../core/store/app.store';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css',
})
export class OverviewComponent implements OnInit, AfterViewInit {
  public store = inject(AppStore);
  private http = inject(HttpClient);
  
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chartInstance: Chart | null = null;

  ngOnInit() {
    this.fetchLedgerBalances();
    this.fetchPayments();
  }

  ngAfterViewInit() {
    // We delay slightly to ensure DOM data is loaded
    setTimeout(() => this.initChart(), 200);
  }

  fetchLedgerBalances() {
    this.http.get<any[]>('http://localhost:3000/api/v1/ledger/balances').subscribe({
      next: (res) => {
        this.store.setBalances(res);
      },
    });
  }

  fetchPayments() {
    this.http.get<any[]>('http://localhost:3000/api/v1/payments').subscribe({
      next: (res) => {
        this.store.setPayments(res);
        this.updateChart();
      },
    });
  }

  getBalance(type: string): number {
    const acc = this.store.balances().find((b) => b.type === type);
    return acc ? parseFloat(acc.balance) : 0;
  }

  private initChart() {
    if (!this.chartCanvas) return;
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'],
        datasets: [
          {
            label: 'Settled Transactions ($)',
            data: [0, 0, 0, 0, 0, 0, 0],
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.05)',
            fill: true,
            tension: 0.4,
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: { grid: { color: '#f1f5f9' }, ticks: { color: '#64748b' } },
          x: { grid: { display: false }, ticks: { color: '#64748b' } },
        },
      },
    });

    this.updateChart();
  }

  private updateChart() {
    if (!this.chartInstance) return;
    const payments = this.store.payments();
    
    // Group payments or calculate a simple aggregate distribution for visualization
    const succeeded = payments.filter((p) => p.status === 'SUCCEEDED');
    
    // Let's create a mockup trend based on actual succeeded payment values
    const dataPoints = succeeded.map((p) => p.amount);
    if (dataPoints.length > 0) {
      // Pad to have at least 7 data points
      const chartData = [...dataPoints, 0, 0, 0, 0, 0, 0].slice(0, 7).reverse();
      this.chartInstance.data.datasets[0].data = chartData;
      this.chartInstance.update();
    }
  }
}
