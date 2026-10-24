import type { Category } from '../../../data/domains/category/category';
import type { StoreDocument } from '../../../data/store/types';

export type CategoryRef = Pick<StoreDocument<Category>, 'id' | 'type' | 'active'>;
