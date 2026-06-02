import { supabase } from './supabaseClient.js';
import { dbGetAll, dbPut } from './learnDb.js';

// 将本地 IndexedDB 数据结构转换为云端数据库字段
function localToCloud(store, item, userId) {
  const base = { user_id: userId };
  const nowISO = new Date(item.updatedAt || Date.now()).toISOString();

  switch (store) {
    case 'progress':
      return {
        ...base,
        id: item.id,
        done: !!item.done,
        updated_at: nowISO
      };
    case 'drillStat':
      return {
        ...base,
        qid: item.qid,
        total: item.total || 0,
        correct: item.correct || 0,
        wrong: item.wrong || 0,
        last_correct: item.lastCorrect ?? null,
        updated_at: nowISO
      };
    case 'wrongBook': {
      // 排除 qid 和 updatedAt 放入 details
      const { qid, updatedAt, ...rest } = item;
      return {
        ...base,
        qid,
        details: rest,
        updated_at: nowISO
      };
    }
    case 'petState': {
      const { id, updatedAt, ...rest } = item;
      return {
        ...base,
        id: id || 'pet_state',
        state: rest,
        updated_at: nowISO
      };
    }
    case 'petEvents': {
      const { id, updatedAt, ...rest } = item;
      return {
        ...base,
        id,
        event: rest,
        updated_at: nowISO
      };
    }
    case 'quizRecord':
      return {
        ...base,
        module_id: item.moduleId || '',
        doc_idx: item.docIdx ?? null,
        score: item.score || 0,
        total: item.total || 0,
        pct: item.pct || 0,
        time: item.time || Date.now()
      };
    default:
      return null;
  }
}

// 将云端数据库结构转换为本地 IndexedDB 格式
function cloudToLocal(store, item) {
  const updatedAt = item.updated_at ? new Date(item.updated_at).getTime() : Date.now();

  switch (store) {
    case 'progress':
      return {
        id: item.id,
        done: item.done,
        updatedAt
      };
    case 'drillStat':
      return {
        qid: item.qid,
        total: item.total,
        correct: item.correct,
        wrong: item.wrong,
        lastCorrect: item.last_correct,
        updatedAt
      };
    case 'wrongBook':
      return {
        qid: item.qid,
        ...item.details,
        updatedAt
      };
    case 'petState':
      return {
        id: item.id,
        ...item.state,
        updatedAt
      };
    case 'petEvents':
      return {
        id: item.id,
        ...item.event,
        updatedAt
      };
    case 'quizRecord':
      return {
        // 本地不保存云端的自增 ID，避免和本地冲突。本地写入时 IndexedDB 会分配自己的自增 ID
        moduleId: item.module_id,
        docIdx: item.doc_idx,
        score: item.score,
        total: item.total,
        pct: item.pct,
        time: Number(item.time)
      };
    default:
      return null;
  }
}

/**
 * 获取本地 IndexedDB 所有表的数据
 */
async function getLocalData(db) {
  return {
    progress: await dbGetAll(db, 'progress'),
    drillStat: await dbGetAll(db, 'drillStat'),
    wrongBook: await dbGetAll(db, 'wrongBook'),
    petState: await dbGetAll(db, 'petState'),
    petEvents: await dbGetAll(db, 'petEvents'),
    quizRecord: await dbGetAll(db, 'quizRecord'),
  };
}

/**
 * 拉取云端 Supabase 当前用户的全部数据
 */
async function getCloudData(userId) {
  const [
    rProgress,
    rDrillStat,
    rWrongBook,
    rPetState,
    rPetEvents,
    rQuizRecord
  ] = await Promise.all([
    supabase.from('user_progress').select('*').eq('user_id', userId),
    supabase.from('drill_stats').select('*').eq('user_id', userId),
    supabase.from('wrong_book').select('*').eq('user_id', userId),
    supabase.from('pet_state').select('*').eq('user_id', userId),
    supabase.from('pet_events').select('*').eq('user_id', userId),
    supabase.from('quiz_records').select('*').eq('user_id', userId),
  ]);

  // 错误检查
  const err = rProgress.error || rDrillStat.error || rWrongBook.error || rPetState.error || rPetEvents.error || rQuizRecord.error;
  if (err) {
    console.error('拉取云端数据失败:', err);
    throw new Error(err.message || '拉取云端数据失败');
  }

  return {
    progress: rProgress.data || [],
    drillStat: rDrillStat.data || [],
    wrongBook: rWrongBook.data || [],
    petState: rPetState.data || [],
    petEvents: rPetEvents.data || [],
    quizRecord: rQuizRecord.data || [],
  };
}

/**
 * 双向手动同步主函数
 * @param {IDBDatabase} db 本地 IndexedDB 实例
 * @param {string} userId 当前登录的 Supabase 用户 UUID
 */
export async function syncLocalAndCloud(db, userId) {
  if (!supabase || !userId) {
    throw new Error('Supabase 未初始化或用户未登录');
  }

  console.log('--- 开始进行云端与本地同步 ---');

  // 1. 获取本地和云端数据
  const local = await getLocalData(db);
  const cloud = await getCloudData(userId);

  const toUpload = {
    progress: [],
    drillStat: [],
    wrongBook: [],
    petState: [],
    petEvents: [],
    quizRecord: []
  };

  const toDownload = {
    progress: [],
    drillStat: [],
    wrongBook: [],
    petState: [],
    petEvents: [],
    quizRecord: []
  };

  // 2. 双向比对：针对有更新时间戳的五个表 (通过主键比对)
  const syncableStores = [
    { store: 'progress', pk: 'id', cloudTable: 'user_progress' },
    { store: 'drillStat', pk: 'qid', cloudTable: 'drill_stats' },
    { store: 'wrongBook', pk: 'qid', cloudTable: 'wrong_book' },
    { store: 'petState', pk: 'id', cloudTable: 'pet_state' },
    { store: 'petEvents', pk: 'id', cloudTable: 'pet_events' }
  ];

  for (const { store, pk } of syncableStores) {
    const localMap = new Map(local[store].map(item => [item[pk], item]));
    const cloudMap = new Map(cloud[store].map(item => [item[pk], item]));

    // 收集所有出现过的 ID
    const allKeys = new Set([...localMap.keys(), ...cloudMap.keys()]);

    for (const key of allKeys) {
      const localItem = localMap.get(key);
      const cloudItem = cloudMap.get(key);

      if (localItem && !cloudItem) {
        // 本地有，云端无 -> 上传
        toUpload[store].push(localToCloud(store, localItem, userId));
      } else if (!localItem && cloudItem) {
        // 云端有，本地无 -> 下载
        toDownload[store].push(cloudToLocal(store, cloudItem));
      } else if (localItem && cloudItem) {
        // 两端都有 -> 比较时间戳
        const localTime = localItem.updatedAt || 0;
        const cloudTime = cloudItem.updated_at ? new Date(cloudItem.updated_at).getTime() : 0;

        if (localTime > cloudTime) {
          // 本地较新 -> 上传
          toUpload[store].push(localToCloud(store, localItem, userId));
        } else if (cloudTime > localTime) {
          // 云端较新 -> 下载
          toDownload[store].push(cloudToLocal(store, cloudItem));
        }
      }
    }
  }

  // 3. 针对 quizRecord 表 (答题历史只增不改，通过 time 字段查重合并)
  const localQuizTimes = new Set(local.quizRecord.map(item => Number(item.time)));
  const cloudQuizTimes = new Set(cloud.quizRecord.map(item => Number(item.time)));

  // 本地有但云端没有的记录 -> 上传
  for (const item of local.quizRecord) {
    if (!cloudQuizTimes.has(Number(item.time))) {
      toUpload.quizRecord.push(localToCloud('quizRecord', item, userId));
    }
  }
  // 云端有但本地没有的记录 -> 下载
  for (const item of cloud.quizRecord) {
    if (!localQuizTimes.has(Number(item.time))) {
      toDownload.quizRecord.push(cloudToLocal('quizRecord', item));
    }
  }

  // 4. 执行写入
  // 4.1 下载并写入本地 IndexedDB
  let downloadCount = 0;
  for (const store of ['progress', 'drillStat', 'wrongBook', 'petState', 'petEvents', 'quizRecord']) {
    const list = toDownload[store];
    if (list.length > 0) {
      downloadCount += list.length;
      for (const item of list) {
        await dbPut(db, store, item);
      }
    }
  }

  // 4.2 上传并写入 Supabase
  let uploadCount = 0;
  for (const store of ['progress', 'drillStat', 'wrongBook', 'petState', 'petEvents', 'quizRecord']) {
    const list = toUpload[store];
    if (list.length > 0) {
      uploadCount += list.length;
      const tableMap = {
        progress: 'user_progress',
        drillStat: 'drill_stats',
        wrongBook: 'wrong_book',
        petState: 'pet_state',
        petEvents: 'pet_events',
        quizRecord: 'quiz_records'
      };
      const tableName = tableMap[store];

      // 批量 upsert，quiz_records 因为没有联合主键但以 time 为准，但在 supabase 里面是自增 PK，
      // 所以 quiz_records 在 Supabase 侧只做单向 INSERT，或者由我们在建表时增加 time 与 user_id 的联合唯一约束
      if (store === 'quizRecord') {
        const { error } = await supabase.from(tableName).insert(list);
        if (error) {
          console.error(`上传 ${store} 失败:`, error);
          throw new Error(`同步上传失败: ${error.message}`);
        }
      } else {
        const { error } = await supabase.from(tableName).upsert(list);
        if (error) {
          console.error(`上传 ${store} 失败:`, error);
          throw new Error(`同步上传失败: ${error.message}`);
        }
      }
    }
  }

  console.log(`--- 同步完成！共上传 ${uploadCount} 条记录，下载 ${downloadCount} 条记录 ---`);
  return { uploadCount, downloadCount };
}
