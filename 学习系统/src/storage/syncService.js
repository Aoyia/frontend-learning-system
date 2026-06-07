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
 * 拉取云端 Supabase 当前用户的增量数据
 * @param {string} userId 用户ID
 * @param {number} lastCloudSyncTime 上一次同步的时间戳
 */
async function getCloudData(userId, lastCloudSyncTime = 0) {
  const lastCloudSyncISO = lastCloudSyncTime > 0 ? new Date(lastCloudSyncTime).toISOString() : null;

  const progressQuery = supabase.from('user_progress').select('*').eq('user_id', userId);
  const drillQuery = supabase.from('drill_stats').select('*').eq('user_id', userId);
  const wrongQuery = supabase.from('wrong_book').select('*').eq('user_id', userId);
  const petStateQuery = supabase.from('pet_state').select('*').eq('user_id', userId);
  const petEventsQuery = supabase.from('pet_events').select('*').eq('user_id', userId);
  const quizQuery = supabase.from('quiz_records').select('*').eq('user_id', userId);

  if (lastCloudSyncISO) {
    progressQuery.gt('updated_at', lastCloudSyncISO);
    drillQuery.gt('updated_at', lastCloudSyncISO);
    wrongQuery.gt('updated_at', lastCloudSyncISO);
    petStateQuery.gt('updated_at', lastCloudSyncISO);
    petEventsQuery.gt('updated_at', lastCloudSyncISO);
    quizQuery.gt('time', lastCloudSyncTime);
  }

  const [
    rProgress,
    rDrillStat,
    rWrongBook,
    rPetState,
    rPetEvents,
    rQuizRecord
  ] = await Promise.all([
    progressQuery,
    drillQuery,
    wrongQuery,
    petStateQuery,
    petEventsQuery,
    quizQuery
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
 * 双向手动/自动同步主函数（按需与增量优化版）
 * @param {IDBDatabase} db 本地 IndexedDB 实例
 * @param {string} userId 当前登录的 Supabase 用户 UUID
 */
export async function syncLocalAndCloud(db, userId) {
  if (!supabase || !userId) {
    throw new Error('Supabase 未初始化或用户未登录');
  }

  // [修复2] 使用 Web Locks API 实现跨标签页互斥锁，防止多实例并发同步
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return await navigator.locks.request('sync_local_and_cloud_lock', async () => {
      return await _executeSync(db, userId);
    });
  }

  // 降级：不支持 Web Locks 的旧浏览器直接执行
  return await _executeSync(db, userId);
}

/**
 * 同步核心执行函数（在互斥锁保护下运行）
 */
async function _executeSync(db, userId) {
  // 读取上次成功的云同步对齐时间戳及本地脏标记
  const lastCloudSyncTime = Number(localStorage.getItem('last_cloud_sync_time') || '0');
  const localDbDirty = localStorage.getItem('local_db_dirty') === 'true';

  // [修复1] 记录同步开始时刻的写入时间戳快照，用于同步结束时的条件清除
  const syncStartWriteTime = Number(localStorage.getItem('local_db_write_time') || '0');

  console.log('--- 开始进行云端与本地按需同步 ---');

  let needDownload = true; // 是否需要从云端下载增量
  let needUpload = localDbDirty; // 本地是否需要上传

  // 尝试通过全局单行状态表进行快速判定，过滤不需要同步的场景
  try {
    const { data: syncStatus, error: syncStatusErr } = await supabase
      .from('user_sync_status')
      .select('last_updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (syncStatusErr) {
      throw syncStatusErr;
    }

    if (syncStatus) {
      const cloudTime = new Date(syncStatus.last_updated_at).getTime();
      // 如果云端的最新更新时间落后于或等于本地上一次同步时间，说明云端自上次对齐以来无任何改动
      if (cloudTime <= lastCloudSyncTime) {
        needDownload = false;
      }
    } else {
      // 云端尚无此用户的同步状态记录，说明云端数据为空，无须下载
      needDownload = false;
    }
  } catch (err) {
    // 降级处理：如表不存在，打印警告，退化为普通增量检查（直接查询 6 张表过滤）
    console.warn('获取全局同步状态失败（可能未创建 user_sync_status 表，将退化为常规增量同步）。错误信息:', err.message);
  }

  // 快速通道：云端没有新更新，且本地没有产生过新成果，立即退出！
  if (!needDownload && !needUpload) {
    console.log('--- [快速通道] 本地无改动，云端无更新，跳过同步 ---');
    const timeStr = new Date().toLocaleString();
    localStorage.setItem('last_sync_time', timeStr);
    localStorage.setItem('last_sync_timestamp', Date.now().toString());
    return { uploadCount: 0, downloadCount: 0 };
  }

  // 1. 获取本地和云端数据
  const local = await getLocalData(db);
  // 如果 needDownload 为 false，我们可以直接返回空数组，免去向 Supabase 发起 6 张表拉取的开销
  const cloud = needDownload
    ? await getCloudData(userId, lastCloudSyncTime)
    : { progress: [], drillStat: [], wrongBook: [], petState: [], petEvents: [], quizRecord: [] };

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

  // 2. 双向比对：针对有更新时间戳的五个表
  const syncableStores = [
    { store: 'progress', pk: 'id' },
    { store: 'drillStat', pk: 'qid' },
    { store: 'wrongBook', pk: 'qid' },
    { store: 'petState', pk: 'id' },
    { store: 'petEvents', pk: 'id' }
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
        // 本地有，云端无。在增量查询模式下，云端只返回最近更改过的记录
        // 因此如果云端没返回且本地该数据是在上次对齐之后新改动的，才需要上传
        if (localItem.updatedAt > lastCloudSyncTime) {
          toUpload[store].push(localToCloud(store, localItem, userId));
        }
      } else if (!localItem && cloudItem) {
        // 云端有，本地无 -> 下载
        toDownload[store].push(cloudToLocal(store, cloudItem));
      } else if (localItem && cloudItem) {
        // 两端都有 -> 比较时间戳
        const localTime = localItem.updatedAt || 0;
        const cloudTime = cloudItem.updated_at ? new Date(cloudItem.updated_at).getTime() : 0;

        if (localTime > cloudTime) {
          toUpload[store].push(localToCloud(store, localItem, userId));
        } else if (cloudTime > localTime) {
          toDownload[store].push(cloudToLocal(store, cloudItem));
        }
      }
    }
  }

  // 3. 针对 quizRecord 表 (通过时间戳增量判定)
  const localQuizTimes = new Set(local.quizRecord.map(item => Number(item.time)));
  const cloudQuizTimes = new Set(cloud.quizRecord.map(item => Number(item.time)));

  // 本地在上次对齐后产生的新记录 -> 上传
  for (const item of local.quizRecord) {
    if (Number(item.time) > lastCloudSyncTime && !cloudQuizTimes.has(Number(item.time))) {
      toUpload.quizRecord.push(localToCloud('quizRecord', item, userId));
    }
  }
  // 云端新记录 -> 下载（按 time 去重，防止云端重复行污染本地）
  const seenQuizTimes = new Set(localQuizTimes);
  for (const item of cloud.quizRecord) {
    const t = Number(item.time);
    if (!seenQuizTimes.has(t)) {
      seenQuizTimes.add(t);
      toDownload.quizRecord.push(cloudToLocal('quizRecord', item));
    }
  }

  // 4. 执行写入
  // 4.1 下载并写入本地 IndexedDB（传入 isSync = true，防止触发 local_db_dirty）
  let downloadCount = 0;
  for (const store of ['progress', 'drillStat', 'wrongBook', 'petState', 'petEvents', 'quizRecord']) {
    const list = toDownload[store];
    if (list.length > 0) {
      downloadCount += list.length;
      for (const item of list) {
        await dbPut(db, store, item, true);
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

      if (store === 'quizRecord') {
        // [修复3] 使用 upsert + onConflict 防止重复 Insert（数据库侧需配合 (user_id, time) 联合唯一约束）
        const { error } = await supabase.from(tableName).upsert(list, { onConflict: 'user_id,time' });
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

  // 4.3 写入成功后，若有本地改动上传，则更新云端的全局更新版本戳
  // [修复4] user_sync_status 更新失败时抛出异常，防止 last_cloud_sync_time 错误推进
  if (uploadCount > 0) {
    const syncStatusData = {
      user_id: userId,
      last_updated_at: new Date().toISOString()
    };
    const { error: statusErr } = await supabase.from('user_sync_status').upsert(syncStatusData);
    if (statusErr) {
      console.error('更新云端全局同步状态表失败，回滚本次同步状态:', statusErr.message);
      throw new Error(`同步状态更新失败: ${statusErr.message}`);
    }
  }

  // 5. 更新本地同步状态和最后对齐时间戳
  const nowTimestamp = Date.now();
  localStorage.setItem('last_cloud_sync_time', nowTimestamp.toString());
  localStorage.setItem('last_sync_timestamp', nowTimestamp.toString());
  localStorage.setItem('last_sync_time', new Date(nowTimestamp).toLocaleString());

  // [修复1] 条件性清除脏标记：只有在同步期间没有产生新的写入，才将脏标记清除
  // 如果 syncStartWriteTime < 当前 local_db_write_time，说明同步期间有新写入，保留脏标记
  const currentWriteTime = Number(localStorage.getItem('local_db_write_time') || '0');
  if (currentWriteTime <= syncStartWriteTime) {
    localStorage.setItem('local_db_dirty', 'false');
  } else {
    console.log('[同步] 检测到同步期间有新数据写入，保留脏标记，等待下次同步上传。');
  }

  console.log(`--- 同步完成！共上传 ${uploadCount} 条记录，下载 ${downloadCount} 条记录 ---`);
  return { uploadCount, downloadCount };
}


