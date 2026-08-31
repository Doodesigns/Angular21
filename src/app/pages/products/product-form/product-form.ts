import { Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../core/services/product';

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductForm {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly productId = this.route.snapshot.paramMap.get('id');
  readonly isEditMode = computed(() => this.productId !== null);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    category: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    discountPercentage: [0, [Validators.min(0), Validators.max(100)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    brand: [''],
  });

  constructor() {
    if (this.productId) {
      this.loading.set(true);
      this.productService.getById(Number(this.productId)).subscribe({
        next: (product) => {
          this.form.patchValue(product);
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set('Failed to load product.');
          this.loading.set(false);
        },
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    const value = this.form.getRawValue();

    const request$ = this.isEditMode()
      ? this.productService.update(Number(this.productId), value)
      : this.productService.create(value);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/products']);
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set('Failed to save product.');
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/products']);
  }
}
