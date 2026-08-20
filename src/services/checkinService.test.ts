import test from 'node:test';
import assert from 'node:assert/strict';

import { matchesCustomerLookup } from './checkinService';

test('matchesCustomerLookup supports legacy primaryStoreId and formatted phone', () => {
  const customer = {
    businessId: 'biz001',
    primaryStoreId: 'store001',
    phone: '7145552001',
  };

  const result = matchesCustomerLookup(customer, {
    businessId: 'biz001',
    storeId: 'store001',
    phone: '(714) 555-2001',
  });

  assert.equal(result, true);
});
