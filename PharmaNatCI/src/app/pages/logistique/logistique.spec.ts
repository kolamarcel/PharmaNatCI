import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Logistique } from './logistique';

describe('Logistique', () => {
  let component: Logistique;
  let fixture: ComponentFixture<Logistique>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Logistique],
    }).compileComponents();

    fixture = TestBed.createComponent(Logistique);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
