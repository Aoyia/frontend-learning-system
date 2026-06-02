import { useEffect, useState } from 'react';
import { dbGetAll, openDB } from '../storage/learnDb.js';
import { PET_STATE_ID, createDefaultPetState } from '../utils/pet.js';

export function useLearningDb() {
  const [db, setDb] = useState(null);
  const [progressCache, setProgressCache] = useState({});
  const [drillStatCache, setDrillStatCache] = useState({});
  const [wrongBookCache, setWrongBookCache] = useState({});
  const [petState, setPetState] = useState(() => createDefaultPetState());
  const [petEvents, setPetEvents] = useState([]);

  useEffect(() => {
    let alive = true;
    openDB().then(async database => {
      if (!alive) return;
      const progress = await dbGetAll(database, 'progress');
      const stats = await dbGetAll(database, 'drillStat');
      const wrongBook = await dbGetAll(database, 'wrongBook');
      const savedPetState = await dbGetAll(database, 'petState');
      const savedPetEvents = await dbGetAll(database, 'petEvents');
      if (!alive) return;
      setDb(database);
      setProgressCache(Object.fromEntries(progress.map(r => [r.id, r.done])));
      setDrillStatCache(Object.fromEntries(stats.map(r => [r.qid, r])));
      setWrongBookCache(Object.fromEntries(wrongBook.filter(r => !r.isDeleted).map(r => [r.qid, r])));
      setPetState(savedPetState.find(r => r.id === PET_STATE_ID) || createDefaultPetState());
      setPetEvents(savedPetEvents.sort((a, b) => (b.time || 0) - (a.time || 0)).slice(0, 12));
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
    petState,
    setPetState,
    petEvents,
    setPetEvents,
  };
}
