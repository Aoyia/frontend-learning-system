const DB_NAME = 'learnDB';
const DB_VER = 3;

export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('progress')) d.createObjectStore('progress', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('quizRecord')) d.createObjectStore('quizRecord', { keyPath: 'id', autoIncrement: true });
      if (!d.objectStoreNames.contains('drillStat')) d.createObjectStore('drillStat', { keyPath: 'qid' });
      if (!d.objectStoreNames.contains('wrongBook')) d.createObjectStore('wrongBook', { keyPath: 'qid' });
      if (!d.objectStoreNames.contains('petState')) d.createObjectStore('petState', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('petEvents')) d.createObjectStore('petEvents', { keyPath: 'id' });
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

export function dbGetAll(db, store) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

export function dbPut(db, store, value, isSync = false) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (!value.updatedAt) {
      value.updatedAt = Date.now();
    }
  }
  if (!isSync) {
    const now = Date.now().toString();
    localStorage.setItem('local_db_dirty', 'true');
    localStorage.setItem('local_db_write_time', now);
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(value);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

export function dbDelete(db, store, key) {
  localStorage.setItem('local_db_dirty', 'true');
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(key);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}
