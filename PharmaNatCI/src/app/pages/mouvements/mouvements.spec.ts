import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mouvements } from './mouvements';

describe('Mouvementts', () => {
  let component: Mouvements;
  let fixture: ComponentFixture<Mouvements>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mouvements],
    }).compileComponents();

    fixture = TestBed.createComponent(Mouvements);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
