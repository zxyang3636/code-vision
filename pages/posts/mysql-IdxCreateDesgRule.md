---
title: MySQL - 索引的创建与设计原则
categories: 数据库
hidden: true
tags:
  - MySQL
  - 后端
  - 数据库
  - Java
---

## 索引的创建与设计原则


### 索引声明与使用

#### 索引的分类

MySQL的索引包括普通索引、唯一性索引、全文索引、单列索引、多列索引和空间索引等。

- 从 `功能逻辑` 上说，索引主要有 4 种，分别是普通索引、唯一索引、主键索引、全文索引。
- 按照 `物理实现方式` ，索引可以分为 2 种：聚簇索引和非聚簇索引。
- 按照 `作用字段个数` 进行划分，分成单列索引和联合索引。



1. 普通索引

    在创建普通索引时，不附加任何限制条件，只是用于提高查询效率。这类索引可以创建在`任何数据类型中`，其值是否唯一和非空，要由字段本身的完整性约束条件决定。建立索引以后，可以通过索引进行查询。例如，在表`student`的字段`name`上建立一个普通索引，查询记录时就可以根据该索引进行查询。

2. 唯一性索引

    使用`UNIQUE参数`可以设置索引为唯一性索引，在创建唯一性索引时，限制该索引的值必须是唯一的，但允许有空值。在一张数据表里`可以有多个`唯一索引。
    例如，在表student的字段email中创建唯一性索引，那么字段email的值就必须是唯一的。通过唯一性索引，可以更快速地确定某条记录。

3. 主键索引

    主键索引就是一种`特殊的唯一性索引`，在唯一索引的基础上增加了不为空的约束，也就是`NOT NULL+UNIQUE`，一张表里`最多只有一个`主键索引。

   ` Why？`这是由主键索引的物理实现方式决定的，因为数据存储在文件中只能按照一种顺序进行存储。


4. 单列索引

    在表中的单个字段上创建索引。单列索引只根据该字段进行索引。单列索引可以是普通索引，也可以是唯一性索引，还可以是全文索引。只要保证该索引只对应一个字段即可。一个表可以**有多个**单列索引。

5. 多列 (组合、联合) 索引

    多列索引是在表的**多个字段组合**上创建一个索引。该索引指向创建时对应的多个字段，可以通过这几个字段进行查询，但是只有查询条件中使用了这些字段中的第一个字段时才会被使用。例如，在表中的字段 id、name 和 gender 上建立一个多列索引 `idx_id_name_gender`，只有在查询条件中使用了字段 id 时该索引才会被使用。使用组合索引时遵循 **最左前缀集合**。

6. 全文检索
全文索引 (也称全文检索) 是目前**搜索引擎**使用的一种关键技术。它能够利用【`分词技术`】等多种算法智能分析出文本文字中关键词的频率和重要性，然后按照一定的算法规则智能地筛选出我们想要的搜索结果。全文索引非常适合大型数据集，对于小的数据集，它的用处比较小。

使用参数 `FULLTEXT` 可以设置索引为全文索引。在定义索引的列上支持值的全文查找，允许在这些索引列中插入重复值和空值。全文索引只能创建在 `CHAR`、 `VARCHAR` 或 `TEXT` 类型及其系列类型的字段上，**查询数据量较大的字符串类型的字段时，使用全文索引可以提高查询速度**。例如，表 `student` 的字段 `information` 是 `TEXT` 类型，该字段包含了很多文字信息。在字段 `information`上建立全文索引后，可以提高查询字段 information的速度。

全文索引典型的有两种类型：自然语言的全文索引和布尔全文索引。

- 自然语言搜索引擎将计算每一个文档对象和查询的相关度。这里，相关度是基于匹配的关键词的个数，以及关键词在文档中出现的次数。**在整个索引中出现次数越少的词语，匹配时的相关度就越高**。相反，非常常见的单词将不会被搜索，如果一个词语的在超过 50% 的记录中都出现了，那么自然语言的搜索将不会搜索这类词语。

MySQL数据库从`3.23.23`版开始支持全文索引，但`MySQL5.6.4`以前`只有Myisam支持`，5.6.4版本以后`innodb才支持`，但是官方版本不支持`中文分词`，需要第三方分词插件。在5.7.6版本，MySQL内置了`ngram全文解析器`，用来支持亚洲语种的分词。测试或使用全文索引时，要先看一下自己的MySQL版本、存储引擎和数据类型是否支持全文索引。

随着大数据时代的到来，关系型数据库应对全文索引的需求已力不从心，逐渐被`solr`、`ElasticSearch`等专门的搜索引擎所替代。

7. 补充：空间索引

    使用参数`SPATIAL`可以设置索引为空间索引。空间索引只能建立在空间数据类型上，这样可以提高系统获取空间数据的效率。MySQL中的空间数据类型包括`GEOMETRY`、`POINT`、`LINESTRING`和`POLYGON`等。目前只有MyISAM存储引擎支持空间检索，而且索引的字段不能为空值。对于初学者来说，这类索引很少会用到。

**小结：不同的存储引擎支持的索引类型也不一样**

- InnoDB：支持 B-tree、Full-text 等索引，不支持 Hash 索引；
- MyISAM： 支持 B-tree、Full-text 等索引，不支持 Hash 索引；
- Memory：支持 B-tree、Hash 等 索引，不支持 Full-text 索引；
- NDB：支持 Hash 索引，不支持 B-tree、Full-text 等索引；
- Archive：不支持 B-tree、Hash、Full-text 等索引；


#### 创建索引

MySQL支持多种方法在单个或多个列上创建索引：在创建表的定义语句 CREATE TABLE 中指定索引列，使用 ALTER TABLE 语句在存在的表上创建索引，或者使用 CREATE INDEX 语句在已存在的表上添加索引。

##### 创建表的时候创建索引

使用CREATE TABLE创建表时，除了可以定义列的数据类型外，还可以定义主键约束、外键约束或者唯一性约束，而不论创建哪种约束，在定义约束的同时相当于在指定列上创建了一个索引。


举例：
```sql
CREATE TABLE dept
(
    dept_id   BIGINT PRIMARY KEY AUTO_INCREMENT,
    dept_name VARCHAR(20)
);

# 隐式的方式创建索引。在声明有主键约束、唯一性约束、外键约束的字段上，会自动的添加相关的索引
CREATE TABLE emp
(
    emp_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    emp_name VARCHAR(20) UNIQUE,
    dept_id  BIGINT,
    CONSTRAINT emp_dept_id_fk FOREIGN KEY (dept_id) REFERENCES dept (dept_id)
);
```

但是，如果显式创建表时创建索引的话，基本语法格式如下：
```sql
CREATE TABLE table_name [col_name data_type]
[UNIQUE | FULLTEXT | SPATIAL] [INDEX | KEY] [index_name] (col_name [length]) [ASC | DESC]
```

- UNIQUE 、 FULLTEXT 和 SPATIAL 为可选参数，分别表示唯一索引、全文索引和空间索引；
- INDEX 与 KEY 为同义词，两者的作用相同，用来指定创建索引；
- index_name 指定索引的名称，为可选参数，如果不指定，那么MySQL默认col_name为索引名；
- col_name 为需要创建索引的字段列，该列必须从数据表中定义的多个列中选择；
- length 为可选参数，表示索引的长度，只有字符串类型的字段才能指定索引长度；
- ASC 或 DESC 指定升序或者降序的索引值存储。



1. 创建普通索引

```sql
# 显示创建索引
CREATE TABLE book
(
    book_id          INT,
    book_name        VARCHAR(100),
    authors          VARCHAR(100),
    info             VARCHAR(100),
    comment          VARCHAR(100),
    year_publication YEAR,
    # 声明索引
    INDEX idx_bname (book_name)
);

```

*命令查看索引*
```sql
# 方式1
SHOW CREATE TABLE book;

# 方式2
SHOW INDEX FROM book;
# Non_unique字段表示是否不是唯一约束，1true 0false 1表示非唯一的 0唯一的
```

2. 创建唯一索引
```sql
# 创建唯一索引
# 声明有唯一索引的字段，在添加数据时，要保证唯一性，但是可以添加null
CREATE TABLE book1
(
    book_id          INT,
    book_name        VARCHAR(100),
    authors          VARCHAR(100),
    info             VARCHAR(100),
    comment          VARCHAR(100),
    year_publication YEAR,
# 声明索引
    UNIQUE INDEX uk_idx_cmt (comment)
);

SHOW INDEX FROM book1;
```

3. 主键索引
```sql
# 主键索引
# 通过定义主键约束的方式定义主键索引
CREATE TABLE book2
(
    book_id          INT PRIMARY KEY,
    book_name        VARCHAR(100),
    authors          VARCHAR(100),
    info             VARCHAR(100),
    comment          VARCHAR(100),
    year_publication YEAR
);

show index from book2;

# 通过删除主键约束的方式删除主键索引
ALTER TABLE book2
    DROP PRIMARY KEY;

# 修改主键索引：必须先删除掉(drop)原索引，再新建(add)索引
```

4. 创建单列索引
```sql
# 创建单列索引
CREATE TABLE book3
(
    book_id          INT PRIMARY KEY,
    book_name        VARCHAR(100),
    authors          VARCHAR(100),
    info             VARCHAR(100),
    comment          VARCHAR(100),
    year_publication YEAR,
    UNIQUE INDEX idx_name (book_name)
);

show index from book3;
```


5. 创建组合索引
```sql
# 创建联合索引
CREATE TABLE book4
(
    book_id          INT PRIMARY KEY,
    book_name        VARCHAR(100),
    authors          VARCHAR(100),
    info             VARCHAR(100),
    comment          VARCHAR(100),
    year_publication YEAR,
    INDEX mul_bid_bname_info (book_id, book_name, info)
);
# Seq_in_index 是有序的，按照创建时指定的联合索引的顺序来的
show index from book4;
# 联合索引遵循 最左前缀原则，(带头大哥不能死，中间兄弟不能断)
```

6. 创建全文索引

FULLTEXT全文索引可以用于全文检索，并且只为 CHAR 、VARCHAR 和 TEXT 列创建索引。索引总是对整个列进行，不支持局部 (前缀) 索引。

举例1：创建表test4，在表中的info字段上建立全文索引，SQL语句如下：

```sql
CREATE TABLE test4(
id INT NOT NULL,
name CHAR(30) NOT NULL,
age INT NOT NULL,
info VARCHAR(255),
FULLTEXT INDEX futxt_idx_info(info(50))
) ENGINE=MyISAM;

# 该全文索引意味着只给每行info的前50个字符创建索引，那么在b+tree中，每页存储的数据将会更多

show index from test4;
# 由结果可以看到，info字段上已经成功建立了一个名为futxt_idx_info的FULLTEXT索引。
```
>mysql5.5只有myisam支持，innodb不支持; 在MySQL5.7及之后版本中可以不指定最后的ENGINE了，因为在此版本中InnoDB支持全文索引。


举例2：
```sql
CREATE TABLE articles (
id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
title VARCHAR (200),
body TEXT,
FULLTEXT index (title, body)
) ENGINE = INNODB;
```
创建了一个给title和body字段添加全文索引的表。

举例3：
```sql
CREATE TABLE `papers` (
`id` int(10) unsigned NOT NULL AUTO_INCREMENT,
`title` varchar(200) DEFAULT NULL,
`content` text,
PRIMARY KEY (`id`),
FULLTEXT KEY `title` (`title`,`content`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
```
不同于like方式的的查询：
```sql
SELECT * FROM papers WHERE content LIKE ‘%查询字符串%’;
```
全文索引用match+against方式查询：
```sql
SELECT * FROM papers WHERE MATCH(title,content) AGAINST (‘查询字符串’);
```
明显的提高查询效率。
>注意点
>   1. 使用全文索引前，搞清楚版本支持情况；
>   2. 全文索引比 like + % 快 N 倍，但是可能存在精度问题；
>   3. 如果需要全文索引的是大量数据，建议先添加数据，再创建索引。



7. 创建空间索引
空间索引创建中，要求空间类型的字段必须为 非空 。

举例：创建表test5，在空间类型为GEOMETRY的字段上创建空间索引，SQL语句如下：

```sql
CREATE TABLE test5(
geo GEOMETRY NOT NULL,
SPATIAL INDEX spa_idx_geo(geo)
) ENGINE=MyISAM;

SHOW INDEX FROM test5
```
可以看到，test5表的geo字段上创建了名称为`spa_idx_geo`的空间索引。注意创建时指定空间类型字段值的非空约束，并且表的存储引擎为**MyISAM**。


##### 在已经存在的表上创建索引

在已经存在的表中创建索引可以使用ALTER TABLE语句或者CREATE INDEX语句。

1. 使用ALTER TABLE语句创建索引 ALTER TABLE语句创建索引的基本语法如下：
```sql
ALTER TABLE table_name ADD [UNIQUE | FULLTEXT | SPATIAL] [INDEX | KEY]
[index_name] (col_name[length],...) [ASC | DESC]
```

2. 使用CREATE INDEX创建索引 CREATE INDEX语句可以在已经存在的表上添加索引，在MySQL中， CREATE INDEX被映射到一个ALTER TABLE语句上，基本语法结构为：
```sql
CREATE [UNIQUE | FULLTEXT | SPATIAL] INDEX index_name
ON table_name (col_name[length],...) [ASC | DESC]
```

示例
```sql
alter table 表名 add index 索引名 (字段名(长度))
ALTER TABLE book5
    ADD INDEX idx_cmt (comment);

ALTER TABLE book5
    ADD UNIQUE INDEX uk_idx_bname (book_name);


ALTER TABLE book5
    ADD INDEX mul_bid_bname_info (book_id, book_name, info);

CREATE INDEX idx_cmt ON book5(comment);
```

#### 删除索引

1. 使用ALTER TABLE删除索引 ALTER TABLE删除索引的基本语法格式如下：
```sql
ALTER TABLE table_name DROP INDEX index_name;
```
2. 使用DROP INDEX语句删除索引 DROP INDEX删除索引的基本语法格式如下：
```sql
DROP INDEX index_name ON table_name;
```

:::tip
删除表中的列时，如果要删除的列为索引的组成部分，则该列也会从索引中删除。如果组成索引的所有列都被删除，则整个索引将被删除。

添加AUTO_INCREMENT约束字段的唯一索引不能删除，AUTO_INCREMENT要么有主键约束要么有唯一约束；
:::

```sql
# 索引的删除
ALTER TABLE book5
    DROP index idx_cmt;

DROP INDEX uk_idx_bname ON book5;
```

### MySQL8.0索引新特性

#### 1. 支持降序索引

    降序索引以降序存储键值。虽然在语法上，从MySQL 4版本开始就已经支持降序索引的语法了，但实际上DESC定义是被忽略的，直到MySQL 8.x版本才开始真正支持降序索引 (仅限于InnoDB存储引擎)。

    MySQL在8.0版本之前创建的仍然是升序索引，使用时进行反向扫描，这大大降低了数据库的效率。在某些场景下，降序索引意义重大。例如，如果一个查询，需要对多个列进行排序，且顺序要求不一致，那么使用降序索引将会避免数据库使用额外的文件排序操作，从而提高性能。

    举例：分别在MySQL 5.7版本和MySQL 8.0版本中创建数据表ts1，结果如下：
```sql
CREATE TABLE ts1(a int,b int,index idx_a_b(a,b desc));
```

在MySQL 5.7版本中查看数据表ts1的结构，结果如下:

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-07-22_23-14-05.png)

从结果可以看出，索引仍然是默认的升序

在MySQL 8.0版本中查看数据表ts1的结构，结果如下：

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/Snipaste_2025-07-22_23-14-45.png)

从结果可以看出，索引已经是降序了。下面继续测试降序索引在执行计划中的表现。

分别在MySQL 5.7版本和MySQL 8.0版本的数据表ts1中插入800条随机数据，执行语句如下：
```sql
DELIMITER //
CREATE PROCEDURE ts_insert()
BEGIN
	DECLARE i INT DEFAULT 1;
	WHILE i < 800
	DO
		insert into ts1 select rand()*80000, rand()*80000;
		SET i = i+1;
	END WHILE;
	commit;
END //
DELIMITER;

# 调用
CALL ts_insert();
```
在MySQL 5.7版本中查看数据表ts1的执行计划，结果如下:
```sql
EXPLAIN SELECT * FROM ts1 ORDER BY a, b DESC LIMIT 5;
```
在MySQL 8.0版本中查看数据表 ts1 的执行计划。

从结果可以看出，修改后MySQL 5.7 的执行计划要明显好于MySQL 8.0。


#### 2. 隐藏索引


在MySQL 5.7版本及之前，只能通过显式的方式删除索引。此时，如果发展删除索引后出现错误，又只能通过显式创建索引的方式将删除的索引创建回来。如果数据表中的数据量非常大，或者数据表本身比较 大，这种操作就会消耗系统过多的资源，操作成本非常高。

从MySQL 8.x开始支持 隐藏索引（invisible indexes） ，只需要将待删除的索引设置为隐藏索引，使 查询优化器不再使用这个索引（即使使用force index（强制使用索引），优化器也不会使用该索引）， 确认将索引设置为隐藏索引后系统不受任何响应，就可以彻底删除索引。 这种通过先将索引设置为隐藏索引，再删除索引的方式就是软删除。

同时，如果你想验证某个索引删除之后的 查询性能影响，就可以暂时先隐藏该索引。

:::warning
主键不能被设置为隐藏索引。当表中没有显式主键时，表中第一个唯一非空索引会成为隐式主键，也不能设置为隐藏索引。
:::

索引默认是可见的，在使用CREATE TABLE, CREATE INDEX 或者 ALTER TABLE 等语句时可以通过 VISIBLE 或者 INVISIBLE 关键词设置索引的可见性。


1. 创建表时直接创建

在MySQL中创建隐藏索引通过SQL语句INVISIBLE来实现，其语法形式如下：
```sql
CREATE TABLE tablename(
propname1 type1[CONSTRAINT1],
propname2 type2[CONSTRAINT2],
……
propnamen typen,
INDEX [indexname](propname1 [(length)]) INVISIBLE
);
```
上述语句比普通索引多了一个关键字INVISIBLE，用来标记索引为不可见索引。

示例：
```sql
# 隐藏索引（创建表时隐藏索引）
CREATE TABLE book6
(
    book_id          INT PRIMARY KEY,
    book_name        VARCHAR(100),
    authors          VARCHAR(100),
    info             VARCHAR(100),
    comment          VARCHAR(100),
    year_publication YEAR,
    INDEX idx_cmt (comment) INVISIBLE
);
```

2. 在已经存在的表上创建

可以为已经存在的表设置隐藏索引，其语法形式如下：
```sql
CREATE INDEX indexname
ON tablename(propname[(length)]) INVISIBLE;
```
示例：
```sql
CREATE INDEX idx_year_pub ON book6 (year_publication) INVISIBLE;
```

3. 通过ALTER TABLE语句创建

语法形式如下：
```sql
ALTER TABLE tablename
ADD INDEX indexname (propname [(length)]) INVISIBLE;
```
示例：
```sql
ALTER TABLE book6
    ADD UNIQUE INDEX uk_idx_bname (book_name) INVISIBLE;
```


4. 切换索引可见状态

已存在的索引可通过如下语句切换可见状态：
```sql
ALTER TABLE tablename ALTER INDEX index_name INVISIBLE; #切换成隐藏索引
ALTER TABLE tablename ALTER INDEX index_name VISIBLE; #切换成非隐藏索引
```

如果将index_cname索引切换成可见状态，通过explain查看执行计划，发现优化器选择了index_cname索引。

:::tip
当索引被隐藏时，它的内容仍然是和正常索引一样实时更新的。如果一个索引需要长期被隐藏，那么可以将其删除，因为索引的存在会影响插入、更新和删除的性能。
:::
通过设置隐藏索引的可见性可以查看索引对调优的帮助。


5. 使隐藏索引对查询优化器可见

在`MySQL 8.x`版本中，为索引提供了一种新的测试方式，可以通过查询优化器的一个开关 (`use_invisible_indexes`) 来打开某个设置，使隐藏索引对查询优化器可见。如果`use_invisible_indexes` 设置为`off (默认)`，优化器会忽略隐藏索引。如果设置为`on`，即使隐藏索引不可见，优化器在生成执行计 划时仍会考虑使用隐藏索引。

（1）在MySQL命令行执行如下命令查看查询优化器的开关设置。
```sql
select @@optimizer_switch \G
```
在输出的结果信息中找到如下属性配置。
```
use_invisible_indexes=off
```
此属性配置值为off，说明隐藏索引默认对查询优化器不可见。

（2）使隐藏索引对查询优化器可见，需要在MySQL命令行执行如下命令：
```sql
set session optimizer_switch="use_invisible_indexes=on";
```
SQL语句执行成功，再次查看查询优化器的开关设置。

```sql
mysql> select @@optimizer_switch \G
*************************** 1. row ***************************
@@optimizer_switch:
index_merge=on,index_merge_union=on,index_merge_sort_union=on,index_merge_
intersection=on,engine_condition_pushdown=on,index_condition_pushdown=on,mrr=on,mrr_co
st_based=on,block_nested_loop=on,batched_key_access=off,materialization=on,semijoin=on
,loosescan=on,firstmatch=on,duplicateweedout=on,subquery_materialization_cost_based=on
,use_index_extensions=on,condition_fanout_filter=on,derived_merge=on,use_invisible_ind
exes=on,skip_scan=on,hash_join=on
1 row in set (0.00 sec)
```
此时，在输出结果中可以看到如下属性配置。
```sql
use_invisible_indexes=on
```
`use_invisible_indexes`属性的值为`on`，说明此时隐藏索引对查询优化器可见。

（3）使用EXPLAIN查看以字段invisible_column作为查询条件时的索引使用情况。
```sql
explain select * from classes where cname = '高一2班';
```
查询优化器会使用隐藏索引来查询数据。

（4）如果需要使隐藏索引对查询优化器不可见，则只需要执行如下命令即可。
```sql
set session optimizer_switch="use_invisible_indexes=off";
```
再次查看查询优化器的开关设置。
```sql
select @@optimizer_switch \G
```
此时，use_invisible_indexes属性的值已经被设置为“off”。


### 索引的设计原则

#### 数据准备

第1步：创建数据库、创建表
```sql
CREATE DATABASE atguigudb1;
USE atguigudb1;
#1.创建学生表和课程表
CREATE TABLE `student_info` (
`id` INT(11) NOT NULL AUTO_INCREMENT,
`student_id` INT NOT NULL ,
`name` VARCHAR(20) DEFAULT NULL,
`course_id` INT NOT NULL ,
`class_id` INT(11) DEFAULT NULL,
`create_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (`id`)
) ENGINE=INNODB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `course` (
`id` INT(11) NOT NULL AUTO_INCREMENT,
`course_id` INT NOT NULL ,
`course_name` VARCHAR(40) DEFAULT NULL,
PRIMARY KEY (`id`)
) ENGINE=INNODB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
```

第2步：创建模拟数据必需的存储函数
```sql
#函数1：创建随机产生字符串函数
DELIMITER //
CREATE FUNCTION rand_string(n INT)
	RETURNS VARCHAR(255) #该函数会返回一个字符串
BEGIN
	DECLARE chars_str VARCHAR(100) DEFAULT
'abcdefghijklmnopqrstuvwxyzABCDEFJHIJKLMNOPQRSTUVWXYZ';
	DECLARE return_str VARCHAR(255) DEFAULT '';
    DECLARE i INT DEFAULT 0;
    WHILE i < n DO
    	SET return_str =CONCAT(return_str,SUBSTRING(chars_str,FLOOR(1+RAND()*52),1));
    	SET i = i + 1;
    END WHILE;
    RETURN return_str;
END //
DELIMITER ;
```
```sql
#函数2：创建随机数函数
DELIMITER //
CREATE FUNCTION rand_num (from_num INT ,to_num INT) RETURNS INT(11)
BEGIN
DECLARE i INT DEFAULT 0;
SET i = FLOOR(from_num +RAND()*(to_num - from_num+1)) ;
RETURN i;
END //
DELIMITER ;
```
创建函数，假如报错：
```
This function has none of DETERMINISTIC......
```
由于开启过慢查询日志bin-log, 我们就必须为我们的function指定一个参数。

主从复制，主机会将写操作记录在bin-log日志中。从机读取bin-log日志，执行语句来同步数据。如果使 用函数来操作数据，会导致从机和主键操作时间不一致。所以，默认情况下，mysql不开启创建函数设置。

- 查看mysql是否允许创建函数：
```sql
show variables like 'log_bin_trust_function_creators';
```
- 命令开启：允许创建函数设置：
```sql
set global log_bin_trust_function_creators=1; # 不加global只是当前窗口有效。
```
- mysqld重启，上述参数又会消失。永久方法：

    - windows下：my.ini[mysqld]加上：
    ```
    log_bin_trust_function_creators=1
    ```
    - linux下：/etc/my.cnf下my.cnf[mysqld]加上：
    ```
    log_bin_trust_function_creators=1
    ```

第3步：创建插入模拟数据的存储过程
```sql
# 存储过程1：创建插入课程表存储过程
DELIMITER //
CREATE PROCEDURE insert_course( max_num INT )
BEGIN
DECLARE i INT DEFAULT 0;
SET autocommit = 0; #设置手动提交事务
REPEAT #循环
SET i = i + 1; #赋值
INSERT INTO course (course_id, course_name ) VALUES
(rand_num(10000,10100),rand_string(6));
UNTIL i = max_num
END REPEAT;
COMMIT; #提交事务
END //
DELIMITER ;
```

```sql
# 存储过程2：创建插入学生信息表存储过程
DELIMITER //
CREATE PROCEDURE insert_stu( max_num INT )
BEGIN
DECLARE i INT DEFAULT 0;
SET autocommit = 0; #设置手动提交事务
REPEAT #循环
SET i = i + 1; #赋值
INSERT INTO student_info (course_id, class_id ,student_id ,NAME ) VALUES
(rand_num(10000,10100),rand_num(10000,10200),rand_num(1,200000),rand_string(6));
UNTIL i = max_num
END REPEAT;
COMMIT; #提交事务
END //
DELIMITER ;
```

第4步：调用存储过程
```sql
CALL insert_course(100);
```
```sql
CALL insert_stu(1000000);
```

#### 适合创建索引的11种情况
