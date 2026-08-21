process.env.DATABASE_URL = "file:./test.db";
process.env.AUTH_MODE = "dev-bypass";
process.env.AUTH_SECRET = "test-secret-test-secret-test-secret-xx";
process.env.STORAGE_ADAPTER = "mock";
process.env.MOCK_STORAGE_DIR = "./.mock-storage-test";
process.env.MOCK_FAILURE_RATE = "0";
process.env.MOCK_TRACKER_LOCK_RATE = "0";
