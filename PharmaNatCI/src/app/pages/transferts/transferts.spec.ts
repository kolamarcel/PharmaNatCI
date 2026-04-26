import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Transferts } from './transferts';

describe('Transferts', () => {
  let component: Transferts;
  let fixture: ComponentFixture<Transferts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Transferts],
    }).compileComponents();

    fixture = TestBed.createComponent(Transferts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
