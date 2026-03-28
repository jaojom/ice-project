import { truncateAll, testPool } from './testDb';

beforeEach(async () => {
  await truncateAll();
});

afterAll(async () => {
  await testPool.end();
});
