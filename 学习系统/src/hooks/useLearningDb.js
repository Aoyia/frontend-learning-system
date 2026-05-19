import { useEffect, useState } from 'react';
import { dbGetAll, openDB } from '../storage/learnDb.js';

export function useLearningDb() {
  const [db, setDb] = useState(null);
  const [progressCache, setProgressCache] = useState({});
  const [drillStatCache, setDrillStatCache] = useState({});
  const [wrongBookCache, setWrongBookCache] = useState({});

  useEffect(() => {
    let alive = true;
    openDB().then(async database => {
      if (!alive) return;
      const progress = await dbGetAll(database, 'progress');
      const stats = await dbGetAll(database, 'drillStat');
      const wrongBook = await dbGetAll(database, 'wrongBook');
      if (!alive) return;
      setDb(database);
      setProgressCache(Object.fromEntries(progress.map(r => [r.id, r.done])));
      setDrillStatCache(Object.fromEntries(stats.map(r => [r.qid, r])));
      setWrongBookCache(Object.fromEntries(wrongBook.map(r => [r.qid, r])));
    });
    return () => { alive = false; };
  }, []);

  return {
    db,
    progressCache,
    setProgressCache,
    drillStatCache,
    setDrillStatCache,
    wrongBookCache,
    setWrongBookCache,
  };
}
