
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
console.log('Type of getRxStorageDexie:', typeof getRxStorageDexie);
if (typeof getRxStorageDexie !== 'function') {
    console.error('FAIL: getRxStorageDexie is not a function');
    process.exit(1);
} else {
    console.log('SUCCESS: getRxStorageDexie is a function');
}
