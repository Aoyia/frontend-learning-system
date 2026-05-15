---
title: 关系型数据库与 SQL
category: 后端基础
tags:
  - backend
  - database
  - sql
  - mysql
  - postgres
  - sqlite
difficulty: medium
status: draft
created: 2026-04-28
updated: 2026-04-28
---

# 关系型数据库与 SQL

## 1. 它属于哪个知识板块？

```txt
后端基础
→ 数据存储
→ 关系型数据库
→ 表 / SQL / 索引 / 事务
```

==这一站要回答的不是"会写 SQL"，而是"**当一个接口要持久化数据时，数据真正落在哪里、是怎么组织的、为什么有时快有时慢**"。==

## 2. 陌生技术出现后的学习顺序

### 2.1 它解决什么问题？

==**关系型数据库**解决的是“**数据要长期保存、要被多次查询、要保证一致性、要支持并发写**”的问题。==

前端工程师写代码常用 `localStorage`、变量、JSON 文件存数据，但这些都解决不了：多个用户同时修改、断电后还在、按各种条件快速查询、数据量上百万还能用。

==所以关系型数据库的核心**不是 SQL 语法**，而是把数据组织成**表（行 + 列）**、用 **主键 / 外键** 表达关系、用 **索引** 加速查询、用 **事务** 保证多步操作要么全成功要么全失败。==

### 2.2 核心流程

```txt
建库 / 建表（定义字段类型、主键、约束）
→ 给查询会用的列加索引
→ INSERT 写入新行
→ SELECT 查询（按条件 / 排序 / 翻页 / 关联）
→ UPDATE / DELETE 修改与删除
→ 多步操作放进事务，保证原子性
→ 监控慢查询 / 调整索引 / 必要时重构表
```

### 2.3 关键词清单

1. database / schema：库 / 模式，逻辑命名空间。一个 MySQL / Postgres 实例下可以有多个库。
2. table / row / column：表是结构（行的集合），row 是一条记录，column 是字段。
3. data type：常见类型 INT、BIGINT、VARCHAR(n)、TEXT、DATETIME、TIMESTAMP、DECIMAL、BOOLEAN、JSON。
4. primary key：主键，唯一标识一行，常用自增 ID 或 UUID。
5. foreign key：外键，指向另一张表的主键，表达"属于"关系。
6. unique / not null / default：列级约束，分别保证唯一、非空、默认值。
7. index：索引，加速按某列查询。常见 B+ 树索引；联合索引按"最左前缀"匹配。
8. SELECT / WHERE / ORDER BY / LIMIT / OFFSET：查询主干。
9. JOIN：连表查询，常见 INNER / LEFT / RIGHT。
10. GROUP BY / HAVING：聚合分组与聚合后过滤。
11. transaction：事务，由 BEGIN / COMMIT / ROLLBACK 包起来的一组语句，要么全成要么全失败。
12. ACID：原子性 / 一致性 / 隔离性 / 持久性，关系库的基本承诺。
13. isolation level：事务隔离级别，从低到高有 READ UNCOMMITTED、READ COMMITTED、REPEATABLE READ、SERIALIZABLE，决定并发时能看到别人未提交 / 已提交 / 重复读到的数据。
14. EXPLAIN：查看 SQL 的执行计划，是判断"为什么慢"的核心工具。
15. N+1 problem：在循环里一条条查，导致查询数爆炸；典型 ORM 反模式。
16. ORM：对象关系映射，例如 Prisma、TypeORM、Drizzle、Sequelize，把表映射成对象。

### 2.4 一句面试版

==关系型数据库把数据组织成**表 + 行 + 列**，通过**主键 / 外键**表达关系，通过**索引**加速查询，通过**事务和隔离级别**保证一致性；中级开发的关键能力是**会用 EXPLAIN 看执行计划、会判断 N+1、会按查询模式设计索引**，而不是只会写 SELECT。==

### 2.5 最小 demo / 最小案例

#### 用 SQLite 在本地无依赖跑通

```bash
brew install sqlite
sqlite3 demo.db
```

建表：

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
```

写入与查询：

```sql
INSERT INTO users (email, name) VALUES ('a@x.com', 'Alice');
INSERT INTO posts (user_id, title) VALUES (1, 'hello');

SELECT u.name, p.title
FROM users u
JOIN posts p ON p.user_id = u.id
WHERE u.email = 'a@x.com';
```

事务：

```sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

如果中间任意一步失败，可以 `ROLLBACK`，让所有改动回滚。

### 2.6 前端类比：你已经会的那部分

| 你已经熟悉的（前端） | 数据库里对应的事 |
| --- | --- |
| TypeScript 的 `interface User { id, email }` | 表的 schema：列名 + 类型 + 是否可选 |
| `Array<User>` | `users` 表的所有行 |
| `users.find(u => u.id === 1)` | `SELECT * FROM users WHERE id = 1` |
| `users.filter(...).sort(...).slice(0, 20)` | `WHERE ... ORDER BY ... LIMIT 20` |
| `Map<key, value>` 的 O(1) 查询 | 索引让查询从全表扫描变成接近 O(log n) |
| 多个 setState 不能保证原子 | 多条 SQL 用事务包起来才能原子 |

### 2.7 常见坑怎么避

#### 没加索引导致全表扫描

```txt
现象：数据少时很快，上万行后接口慢到秒级
排查：EXPLAIN SELECT ... → 看到 "type: ALL" 或 "Seq Scan"
处理：给 WHERE / ORDER BY / JOIN 涉及的列加索引；联合索引注意最左前缀
```

#### N+1 查询

```ts
const users = await db.user.findMany()
for (const u of users) {
  u.posts = await db.post.findMany({ where: { userId: u.id } })
}
```

50 个 user 就有 51 次查询。改成一次 JOIN 或 ORM 的 `include`：

```ts
const users = await db.user.findMany({ include: { posts: true } })
```

#### 事务用错粒度

事务范围太大：长时间持有锁，并发性能塌方。
事务范围太小：原子性不到位，"扣钱成功但加积分失败"这类问题。
原则：**事务应该包住"业务上必须一起成功 / 失败"的最小一组操作**。

#### 隐式类型转换让索引失效

```sql
-- user_id 是整数列，但传了字符串
SELECT * FROM posts WHERE user_id = '1';
```

部分数据库会偷偷 cast，导致索引用不上。永远让查询参数和列类型对齐。

#### 用浮点数存金额

`DECIMAL(18, 2)` 或整数最小单位（分）。绝对不要用 `FLOAT` / `DOUBLE` 存钱。

### 2.8 选型怎么看？

| 方案 | 一句话定位 | 适合 |
| --- | --- | --- |
| SQLite | 单文件、零配置 | 学习、小工具、桌面 / 移动端嵌入 |
| MySQL | 老牌、生态广 | 大多数互联网业务默认选 |
| PostgreSQL | 功能强、SQL 标准好、JSON 与全文检索强 | 偏复杂查询、地理 / 数据分析、对类型要求高 |
| 云托管（RDS / Aurora / Neon / Supabase / PlanetScale） | 不用自己运维 | 创业项目、业务团队 |

入门用 SQLite 最快；线上用 MySQL 或 Postgres 都是好选择，不用纠结。

### 2.9 是否值得深入？

非常值得，是后端开发的根基。优先顺序：

1. 先掌握建表、CRUD、JOIN、GROUP BY 这些 SQL 主干。
2. 再掌握索引原理（B+ 树、最左前缀），会用 EXPLAIN 看执行计划。
3. 然后掌握事务与隔离级别，了解"幻读 / 不可重复读 / 脏读"分别在哪一档发生。
4. 接着掌握 ORM 的边界：什么时候用、什么时候要写原生 SQL。
5. 最后再深入慢查询治理、读写分离、分库分表、迁移与备份策略。

优先看官方资料：MDN SQL 入门、PostgreSQL Tutorial、MySQL Reference、SQLite docs。

## 3. 选择题自测

### Q1

主键的主要作用是什么？

A. 让 URL 更短
B. 唯一标识一行，常用于关联和快速定位
C. 让查询自动加索引
D. 替代 schema

答案：B

解析：主键提供"唯一标识"，并且会自动具备聚簇索引（多数引擎）。

### Q2

下面哪种情况最该首先怀疑"缺索引"？

A. 数据少时很快，数据上量后某接口变慢，EXPLAIN 显示全表扫描
B. 服务器主机名很长
C. 接口名字拼错
D. CSS 颜色不对

答案：A

解析：随数据量上涨变慢、EXPLAIN 显示全表扫描，是缺索引的经典信号。

### Q3

事务最核心的承诺是什么？

A. 让查询更快
B. 把多条语句变成"要么全成功，要么全失败"的原子单位
C. 替代日志
D. 自动加索引

答案：B

解析：事务的 ACID 中，原子性是日常最常被依赖的特性。

### Q4

下面哪种现象是经典的 N+1 问题？

A. 1 次查询 + N 次循环里的子查询
B. 1 个用户买了 N 件商品
C. 1 张表有 N 个字段
D. 1 个表有 N 个索引

答案：A

解析：N+1 = 1 次主查询 + N 次循环里的子查询，应改成 JOIN 或 ORM 的 include / preload。

### Q5

存储金额最稳妥的方式是？

A. FLOAT
B. DOUBLE
C. DECIMAL(18, 2) 或用整数存最小单位（分）
D. VARCHAR

答案：C

解析：浮点数无法精确表示十进制小数，金额必须用定点数或整数。
