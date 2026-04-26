import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableauDeBoard } from './tableau-de-board';

describe('TableauDeBoard', () => {
  let component: TableauDeBoard;
  let fixture: ComponentFixture<TableauDeBoard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableauDeBoard],
    }).compileComponents();

    fixture = TestBed.createComponent(TableauDeBoard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
