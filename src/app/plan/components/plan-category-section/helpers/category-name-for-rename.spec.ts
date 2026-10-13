import { describe, expect, it } from 'vitest';
import type { Category } from '../../../../../data/domains/category/category';
import type { StoreDocument } from '../../../../../data/store/types';
import { categoryNameForRename } from './category-name-for-rename';

function categoryDoc(id: string, name: string): StoreDocument<Category> {
  return {
    id,
    name,
    type: 'income',
    sortOrder: 0,
    active: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
  };
}

describe('categoryNameForRename', () => {
  const active = [categoryDoc('cat-1', 'Salary')];

  it('returns empty-or-invalid when the typed name is blank', () => {
    expect(categoryNameForRename('cat-1', '   ', active)).toEqual({
      status: 'empty-or-invalid',
    });
  });

  it('returns unchanged when the typed name matches the category', () => {
    expect(categoryNameForRename('cat-1', 'Salary', active)).toEqual({
      status: 'unchanged',
    });
  });

  it('returns ok with the trimmed name when it differs', () => {
    expect(categoryNameForRename('cat-1', ' Bonus ', active)).toEqual({
      status: 'ok',
      categoryName: 'Bonus',
    });
  });
});
