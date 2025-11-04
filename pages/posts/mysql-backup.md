---
title: MySQL - 数据库备份与恢复
categories: 数据库
tags:
  - MySQL
  - 后端
  - 数据库
  - 数据库备份与恢复
---

在任何数据库环境中，总会有`不确定的意外`情况发生，比如例外的停电、计算机系统中的各种软硬件故障、人为破坏、管理员误操作等是不可避免的，这些情况可能会导致`数据的丢失`、`服务器瘫痪`等严重的后果。存在多个服务器时，会出现主从服务器之间的`数据同步问题`。

为了有效防止数据丢失，并将损失降到最低，应`定期`对MySQL数据库服务器做`备份`。如果数据库中的数据丢失或者出现错误，可以使用备份的数据`进行恢复`。主从服务器之间的数据同步问题可以通过复制功能实现。

## 物理备份与逻辑备份

**物理备份：** 备份数据文件，转储数据库物理文件到某一目录。物理备份恢复速度比较快，但占用空间比较大，MySQL中可以用 `xtrabackup` 工具来进行物理备份。

**逻辑备份：** 对数据库对象利用工具进行导出工作，汇总入备份文件内。逻辑备份恢复速度慢，但占用空间小，更灵活。MySQL 中常用的逻辑备份工具为 `mysqldump` 。逻辑备份就是 `备份sql语句` ，在恢复的 时候执行备份的sql语句实现数据库数据的重现。

## mysqldump实现逻辑备份

mysqldump是MySQL提供的一个非常有用的数据库备份工具。


### 备份一个数据库

mysqldump命令执行时，可以将数据库备份成一个`文本文件`，该文件中实际上包含多个`CREATE`和`INSERT`语句，使用这些语句可以重新创建表和插入数据。
- 查出需要备份的表的结构，在文本文件中生成一个CREATE语句
- 将表中的所有记录转换成一条INSERT语句。

基本语法
```bash
mysqldump –u 用户名称 –h 主机名称 –p密码 待备份的数据库名称[tbname, [tbname...]]> 备份文件名称.sql
```
>说明： 备份的文件并非一定要求后缀名为.sql，例如后缀名为.txt的文件也是可以的。

举例：使用root用户备份atguigu数据库：
```bash
# 若当前已经连接上主机了，即可省略-h参数
mysqldump -uroot -p atguigu>atguigu.sql #备份文件存储在当前目录下
```
```bash
mysqldump -uroot -p atguigudb1 > /var/lib/mysql/atguigu.sql #备份文件存储在指定目录下
```
备份文件剖析：
```bash
-- MySQL dump 10.13 Distrib 8.0.26, for Linux (x86_64)
--
-- Host: localhost Database: atguigu
-- ------------------------------------------------------
-- Server version 8.0.26

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `atguigu`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `atguigu` /*!40100 DEFAULT CHARACTER SET
utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `atguigu`;

--
-- Table structure for table `student`
--

DROP TABLE IF EXISTS `student`;
/*!40101 SET @saved_cs_client = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student` (
`studentno` int NOT NULL,
`name` varchar(20) DEFAULT NULL,
`class` varchar(20) DEFAULT NULL,
PRIMARY KEY (`studentno`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `student` VALUES (1,'张三_back','一班'),(3,'李四','一班'),(8,'王五','二班'),
(15,'赵六','二班'),(20,'钱七','>三班'),(22,'zhang3_update','1ban'),(24,'wang5','2ban');
/*!40000 ALTER TABLE `student` ENABLE KEYS */;
UNLOCK TABLES;
        .
        .
        .
        .
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
-- Dump completed on 2022-01-07 9:58:23
```

### 备份全部数据库

若想用mysqldump备份整个实例，可以使用 --all-databases 或 -A 参数：

```bash
mysqldump -uroot -p --all-databases > all_database.sql
mysqldump -uroot -p -A > all_database.sql
```

### 备份部分数据库

使用 `--databases` 或 `-B` 参数了，该参数后面跟数据库名称，多个数据库间用空格隔开。如果指定 databases参数，备份文件中会存在创建数据库的语句，如果不指定参数，则不存在。语法如下：
```bash
mysqldump –u user –h host –p --databases [数据库的名称1 [数据库的名称2...]] > 备份文件名称.sql
```
举例：
```bash
mysqldump -uroot -p --databases atguigu atguigu12 > part_database.sql
```
或
```bash
mysqldump -uroot -p -B atguigu atguigu12 > part_database.sql
```

### 备份部分表

比如，在表变更前做个备份。语法如下：
```bash
mysqldump –u user –h host –p 数据库的名称 [表名1 [表名2...]] > 备份文件名称.sql
```
举例：备份atguigu数据库下的book表
```bash
mysqldump -uroot -p atguigu book > book_backup.sql
```
book.sql文件内容如下
```sql
mysqldump -uroot -p atguigu book> book.sql^C
[root@node1 ~]# ls
kk kubekey kubekey-v1.1.1-linux-amd64.tar.gz README.md test1.sql two_database.sql
[root@node1 ~]# mysqldump -uroot -p atguigu book> book.sql
Enter password:
[root@node1 ~]# ls
book.sql kk kubekey kubekey-v1.1.1-linux-amd64.tar.gz README.md test1.sql
two_database.sql
[root@node1 ~]# vi book.sql
-- MySQL dump 10.13 Distrib 8.0.26, for Linux (x86_64)
--
-- Host: localhost Database: atguigu
-- ------------------------------------------------------
-- Server version 8.0.26

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `book`
--

DROP TABLE IF EXISTS `book`;
/*!40101 SET @saved_cs_client = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book` (
`bookid` int unsigned NOT NULL AUTO_INCREMENT,
`card` int unsigned NOT NULL,
`test` varchar(255) COLLATE utf8_bin DEFAULT NULL,
PRIMARY KEY (`bookid`),
KEY `Y` (`card`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb3 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `book`
--

LOCK TABLES `book` WRITE;
/*!40000 ALTER TABLE `book` DISABLE KEYS */;
INSERT INTO `book` VALUES (1,9,NULL),(2,10,NULL),(3,4,NULL),(4,8,NULL),(5,7,NULL),
(6,10,NULL),(7,11,NULL),(8,3,NULL),(9,1,NULL),(10,17,NULL),(11,19,NULL),(12,4,NULL),
(13,1,NULL),(14,14,NULL),(15,5,NULL),(16,5,NULL),(17,8,NULL),(18,3,NULL),(19,12,NULL),
(20,11,NULL),(21,9,NULL),(22,20,NULL),(23,13,NULL),(24,3,NULL),(25,18,NULL),
(26,20,NULL),(27,5,NULL),(28,6,NULL),(29,15,NULL),(30,15,NULL),(31,12,NULL),
(32,11,NULL),(33,20,NULL),(34,5,NULL),(35,4,NULL),(36,6,NULL),(37,17,NULL),
(38,5,NULL),(39,16,NULL),(40,6,NULL),(41,18,NULL),(42,12,NULL),(43,6,NULL),
(44,12,NULL),(45,2,NULL),(46,12,NULL),(47,15,NULL),(48,17,NULL),(49,2,NULL),
(50,16,NULL),(51,13,NULL),(52,17,NULL),(53,7,NULL),(54,2,NULL),(55,9,NULL),
(56,1,NULL),(57,14,NULL),(58,7,NULL),(59,15,NULL),(60,12,NULL),(61,13,NULL),
(62,8,NULL),(63,2,NULL),(64,6,NULL),(65,2,NULL),(66,12,NULL),(67,12,NULL),(68,4,NULL),
(69,5,NULL),(70,10,NULL),(71,16,NULL),(72,8,NULL),(73,14,NULL),(74,5,NULL),
(75,4,NULL),(76,3,NULL),(77,2,NULL),(78,2,NULL),(79,2,NULL),(80,3,NULL),(81,8,NULL),
(82,14,NULL),(83,5,NULL),(84,4,NULL),(85,2,NULL),(86,20,NULL),(87,12,NULL),
(88,1,NULL),(89,8,NULL),(90,18,NULL),(91,3,NULL),(92,3,NULL),(93,6,NULL),(94,1,NULL),
(95,4,NULL),(96,17,NULL),(97,15,NULL),(98,1,NULL),(99,20,NULL),(100,15,NULL);
/*!40000 ALTER TABLE `book` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
```
可以看到，book文件和备份的库文件类似。不同的是，book文件只包含book表的DROP、CREATE和 INSERT语句。

备份多张表使用下面的命令，比如备份book和account表：

```bash
#备份多张表
mysqldump -uroot -p atguigu book account > 2_tables_bak.sql
```

### 备份单表的部分数据

有些时候一张表的数据量很大，我们只需要部分数据。这时就可以使用 `--where` 选项了。where后面附带需要满足的条件。

举例：备份student表中id小于10的数据：
```bash
mysqldump -uroot -p atguigu student --where="id < 10 " > student_part_id10_bak.sql
```
内容如下所示，insert语句只有id小于10的部分
```sql
LOCK TABLES `student` WRITE;
/*!40000 ALTER TABLE `student` DISABLE KEYS */;
INSERT INTO `student` VALUES (1,100002,'JugxTY',157,280),(2,100003,'QyUcCJ',251,277),
(3,100004,'lATUPp',80,404),(4,100005,'BmFsXI',240,171),(5,100006,'mkpSwJ',388,476),
(6,100007,'ujMgwN',259,124),(7,100008,'HBJTqX',429,168),(8,100009,'dvQSQA',61,504),
(9,100010,'HljpVJ',234,185);
```

### 排除某些表的备份

如果我们想备份某个库，但是某些表数据量很大或者与业务关联不大，这个时候可以考虑排除掉这些表，同样的，选项 `--ignore-table` 可以完成这个功能。
```bash
mysqldump -uroot -p atguigu --ignore-table=atguigu.student > no_stu_bak.sql
```
通过如下指定判定文件中没有student表结构：
```bash
grep "student" no_stu_bak.sql
# 我们发现并没有该表结构，因为我们使用了 --ignore-table 选项排除掉了。
```


### 只备份结构或只备份数据

只备份结构的话可以使用 `--no-data` 简写为 `-d` 选项；只备份数据可以使用 `--no-create-info` 简写为 `-t`选项。

- 只备份结构
```bash
mysqldump -uroot -p atguigu --no-data > atguigu_no_data_bak.sql
#使用grep命令，没有找到insert相关语句，表示没有数据备份。
[root@node1 ~]# grep "INSERT" atguigu_no_data_bak.sql
[root@node1 ~]#
```

- 只备份数据
```bash
mysqldump -uroot -p atguigu --no-create-info > atguigu_no_create_info_bak.sql
#使用grep命令，没有找到create相关语句，表示没有数据结构。
[root@node1 ~]# grep "CREATE" atguigu_no_create_info_bak.sql
[root@node1 ~]#
```


### 备份中包含存储过程、函数、事件

mysqldump备份默认是不包含存储过程，自定义函数及事件的。可以使用 `--routines` 或 `-R` 选项来备份存储过程及函数，使用 `--events` 或 `-E` 参数来备份事件。

举例：备份整个atguigu库，包含存储过程及事件：

- 使用下面的SQL可以查看当前库有哪些存储过程或者函数
```bash
mysql> SELECT SPECIFIC_NAME,ROUTINE_TYPE ,ROUTINE_SCHEMA FROM
information_schema.Routines WHERE ROUTINE_SCHEMA="atguigu";
+---------------+--------------+----------------+
| SPECIFIC_NAME | ROUTINE_TYPE | ROUTINE_SCHEMA |
+---------------+--------------+----------------+
| rand_num      | FUNCTION     | atguigu        |
| rand_string   | FUNCTION     | atguigu        |
| BatchInsert   | PROCEDURE    | atguigu        |
| insert_class  | PROCEDURE    | atguigu        |
| insert_order  | PROCEDURE    | atguigu        |
| insert_stu    | PROCEDURE    | atguigu        |
| insert_user   | PROCEDURE    | atguigu        |
| ts_insert     | PROCEDURE    | atguigu        |
+---------------+--------------+----------------+
9 rows in set (0.02 sec)
```

下面备份atguigu库的数据，函数以及存储过程。
```bash
mysqldump -uroot -p -R -E --databases atguigu > fun_atguigu_bak.sql
```
查询备份文件中是否存在函数，如下所示，可以看到确实包含了函数。
```bash
grep -C 5 "rand_num" fun_atguigu_bak.sql
--
--
-- Dumping routines for database 'atguigu'
--
/*!50003 DROP FUNCTION IF EXISTS `rand_num` */;
/*!50003 SET @saved_cs_client = @@character_set_client */ ;
/*!50003 SET @saved_cs_results = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode = @@sql_mode */ ;
/*!50003 SET sql_mode =
'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISIO
N_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`%` FUNCTION `rand_num`(from_num BIGINT ,to_num BIGINT) RETURNS
bigint
BEGIN
DECLARE i BIGINT DEFAULT 0;
SET i = FLOOR(from_num +RAND()*(to_num - from_num+1)) ;
RETURN i;
END ;;
--
BEGIN
DECLARE i INT DEFAULT 0;
    SET autocommit = 0;
    REPEAT
    SET i = i + 1;
    INSERT INTO class ( classname,address,monitor ) VALUES
    (rand_string(8),rand_string(10),rand_num());
    UNTIL i = max_num
    END REPEAT;
    COMMIT;
END ;;
DELIMITER ;
--
BEGIN
DECLARE i INT DEFAULT 0;
    SET autocommit = 0; #设置手动提交事务
    REPEAT #循环
    SET i = i + 1; #赋值
    INSERT INTO order_test (order_id, trans_id ) VALUES
    (rand_num(1,7000000),rand_num(100000000000000000,700000000000000000));
    UNTIL i = max_num
    END REPEAT;
    COMMIT; #提交事务
END ;;
DELIMITER ;
--
BEGIN
DECLARE i INT DEFAULT 0;
    SET autocommit = 0; #设置手动提交事务
    REPEAT #循环
    SET i = i + 1; #赋值
    INSERT INTO student (stuno, name ,age ,classId ) VALUES
    ((START+i),rand_string(6),rand_num(),rand_num());
    UNTIL i = max_num
    END REPEAT;
    COMMIT; #提交事务
END ;;
DELIMITER ;
--
BEGIN
DECLARE i INT DEFAULT 0;
    SET autocommit = 0;
    REPEAT
    SET i = i + 1;
    INSERT INTO `user` ( name,age,sex ) VALUES ("atguigu",rand_num(1,20),"male");
    UNTIL i = max_num
    END REPEAT;
    COMMIT;
END ;;
DELIMITER ;
```

### mysqldump常用选项

mysqldump其他常用选项如下：

```bash
--add-drop-database：在每个CREATE DATABASE语句前添加DROP DATABASE语句。

--add-drop-tables：在每个CREATE TABLE语句前添加DROP TABLE语句。

--add-locking：用LOCK TABLES和UNLOCK TABLES语句引用每个表转储。重载转储文件时插入得更快。

--all-database, -A：转储所有数据库中的所有表。与使用--database选项相同，在命令行中命名所有数据库。

--comment[=0|1]：如果设置为0，禁止转储文件中的其他信息，例如程序版本、服务器版本和主机。--skip-comments与--comments=0的结果相同。默认值为1，即包括额外信息。

--compact：产生少量输出。该选项禁用注释并启用--skip-add-drop-tables、--no-set-names、--skip-disable-keys和--skip-add-locking选项。

--compatible=name：产生与其他数据库系统或旧的MySQL服务器更兼容的输出，值可以为ansi、MySQL323、MySQL40、postgresql、oracle、mssql、db2、maxdb、no_key_options、no_table_options或者no_field_options。

--complete_insert, -c：使用包括列名的完整的INSERT语句。

--debug[=debug_options], -#[debug_options]：写调试日志。

--delete，-D：导入文本文件前清空表。

--default-character-set=charset：使用charsets默认字符集。如果没有指定，就使用utf8。

--delete--master-logs：在主复制服务器上，完成转储操作后删除二进制日志。该选项自动启用-master-data。

--extended-insert，-e：使用包括几个VALUES列表的多行INSERT语法。这样使得转储文件更小，重载文件时可以加速插入。

--flush-logs，-F：开始转储前刷新MySQL服务器日志文件。该选项要求RELOAD权限。

--force，-f：在表转储过程中，即使出现SQL错误也继续。

--lock-all-tables，-x：对所有数据库中的所有表加锁。在整体转储过程中通过全局锁定来实现。该选项自动关闭--single-transaction和--lock-tables。

--lock-tables，-l：开始转储前锁定所有表。用READ LOCAL锁定表以允许并行插入MyISAM表。对于事务表（例如InnoDB和BDB），--single-transaction是一个更好的选项，因为它根本不需要锁定表。

--no-create-db，-n：该选项禁用CREATE DATABASE /*!32312 IF NOT EXIST*/db_name语句，如果给出--database或--all-database选项，就包含到输出中。

--no-create-info，-t：只导出数据，而不添加CREATE TABLE语句。

--no-data，-d：不写表的任何行信息，只转储表的结构。

--opt：该选项是速记，它可以快速进行转储操作并产生一个能很快装入MySQL服务器的转储文件。该选项默认开启，但可以用--skip-opt禁用。

--password[=password]，-p[password]：当连接服务器时使用的密码。

-port=port_num，-P port_num：用于连接的TCP/IP端口号。

--protocol={TCP|SOCKET|PIPE|MEMORY}：使用的连接协议。

--replace，-r –replace和--ignore：控制替换或复制唯一键值已有记录的输入记录的处理。如果指定--replace，新行替换有相同的唯一键值的已有行；如果指定--ignore，复制已有的唯一键值的输入行被跳过。如果不指定这两个选项，当发现一个复制键值时会出现一个错误，并且忽视文本文件的剩余部分。

--silent，-s：沉默模式。只有出现错误时才输出。

--socket=path，-S path：当连接localhost时使用的套接字文件（为默认主机）。

--user=user_name，-u user_name：当连接服务器时MySQL使用的用户名。

--verbose，-v：冗长模式，打印出程序操作的详细信息。

--xml，-X：产生XML输出。
```

运行帮助命令 `mysqldump --help` ，可以获得特定版本的完整选项列表。

:::tip
提示 如果运行mysqldump没有--quick或--opt选项，mysqldump在转储结果前将整个结果集装入内存。如果转储大数据库可能会出现问题，该选项默认启用，但可以用--skip-opt禁用。如果使用最新版本的mysqldump程序备份数据，并用于恢复到比较旧版本的MySQL服务器中，则不要使用--opt 或-e选项。
:::


## mysql命令恢复数据

使用mysqldump命令将数据库中的数据备份成一个文本文件。需要恢复时，可以使用`mysql命令`来恢复备份的数据。

mysql命令可以执行备份文件中的`CREATE语句`和`INSERT语句`。通过CREATE语句来创建数据库和表。通过INSERT语句来插入备份的数据。

基本语法：
```bash
# 这个指令就相当于读取mysqldump生成的sql文件
mysql -uroot -p [dbname] < backup.sql
```
其中，dbname参数表示数据库名称。该参数是可选参数，可以指定数据库名，也可以不指定。指定数据库名时，表示还原该数据库下的表。此时需要确保MySQL服务器中已经创建了该名的数据库。不指定数据库名，表示还原文件中所有的数据库。此时sql文件中包含有CREATE DATABASE语句，不需要MySQL服务器中已存在的这些数据库。




### 单库备份中恢复单库
使用root用户，将之前练习中备份的atguigu.sql文件中的备份导入数据库中，命令如下：

如果备份文件中包含了创建数据库的语句，则恢复的时候不需要指定数据库名称，如下所示
```bash
# 如果已经存在数据库了，使用该命令即可
mysql -uroot -p < atguigu.sql
```
否则需要指定数据库名称，如下所示
```bash
# 如果还没有数据库，使用该命令
mysql -uroot -p atguigu4 < atguigu.sql
```


### 全量备份恢复
如果我们现在有昨天的全量备份，现在想整个恢复，则可以这样操作：


```bash
mysql –u root –p < all.sql

```
执行完后，MySQL数据库中就已经恢复了all.sql文件中的所有数据库。

:::tip
补充:

如果使用`--all-databases`参数备份了所有的数据库，那么恢复时不需要指定数据库。对应的sql文件包含有
CREATE DATABASE语句，可通过该语句创建数据库。创建数据库后，可以执行sql文件中的USE语句选择数据库，再创建表并插入记录。
:::

### 从全量备份中恢复单库

可能有这样的需求，比如说我们只想恢复某一个库，但是我们有的是整个实例的备份，这个时候我们可以从全量备份中分离出单个库的备份。

举例：

```bash
# 表示从all_database.sql文件中分离出atguigu库的备份，并保存到atguigu.sql文件中
sed -n '/^-- Current Database: `atguigu`/,/^-- Current Database: `/p' all_database.sql > atguigu.sql
# 分离完成后我们再导入atguigu.sql即可恢复单个库
mysql -uroot -p < atguigu.sql
```
> 如果没有看到恢复的数据库或者数据，我们需要重新登录`mysql -uroot -p`



### 从单库备份中恢复单表

这个需求还是比较常见的。比如说我们知道哪个表误操作了，那么就可以用单表恢复的方式来恢复。

举例：我们有atguigu整库的备份，但是由于class表误操作，需要单独恢复出这张表。

```bash
# 把atguigu.sql数据库文件中的class表的CREATE语句(表结构)分离出来，保存到class_structure.sql文件中
cat atguigu.sql | sed -e '/./{H;$!d;}' -e 'x;/CREATE TABLE `class`/!d;q' > class_structure.sql
# 把atguigu.sql数据库文件中的class表的insert语句(表数据)分离出来，保存到class_data.sql文件中
cat atguigu.sql | grep --ignore-case 'insert into `class`' > class_data.sql
#用shell语法分离出创建表的语句及插入数据的语句后 再依次导出即可完成恢复

use atguigu;
mysql> source class_structure.sql;
# 或
mysql> source /var/lib/mysql/backup/class_structure.sql
Query OK, 0 rows affected, 1 warning (0.00 sec)

mysql> source class_data.sql;
Query OK, 1 row affected (0.01 sec)
```


## 物理备份：直接复制整个数据库

直接将MySQL中的数据库文件复制出来。这种方法最简单，速度也最快。MySQL的数据库目录位置不一 定相同：
- 在Windows平台下，MySQL 8.0存放数据库的目录通常默认为 “` C:\ProgramData\MySQL\MySQL Server 8.0\Data `”或者其他用户自定义目录；
- 在Linux平台下，数据库目录位置通常为`/var/lib/mysql/`；
- 在MAC OSX平台下，数据库目录位置通常为“`/usr/local/mysql/data`”

但为了保证备份的一致性。需要保证：
- 方式1：备份前，将服务器停止。
- 方式2：备份前，对相关表执行 `FLUSH TABLES WITH READ LOCK` 操作。这样当复制数据库目录中 的文件时，允许其他客户继续查询表。同时，FLUSH TABLES语句来确保开始备份前将所有激活的索 引页写入硬盘。

这种方式方便、快速，但不是最好的备份方法，因为实际情况可能 不允许停止MySQL服务器 或者 锁住表 ，而且这种方法 **对InnoDB存储引擎的表不适用**。对于MyISAM存储引擎的表，这样备份和还原很方便，但是还原时最好是相同版本的MySQL数据库，否则可能会存在文件类型不同的情况。

注意，物理备份完毕后，执行 UNLOCK TABLES 来结算其他客户对表的修改行为。

>说明： 在MySQL版本号中，第一个数字表示主版本号，主版本号相同的MySQL数据库文件格式相同。

此外，还可以考虑使用相关工具实现备份。比如， `MySQLhotcopy` 工具。MySQLhotcopy是一个Perl脚本，它使用LOCK TABLES、FLUSH TABLES和cp或scp来快速备份数据库。它是备份数据库或单个表最快的途径，但它只能运行在数据库目录所在的机器上，并且只能备份MyISAM类型的表。多用于mysql5.5之前。

## 物理备份：直接复制到数据库目录

步骤:
1) 演示删除备份的数据库中指定表的数据
2) 将备份的数据库数据拷贝到数据目录下,并重启MySQL服务器
3) 查询相关表的数据是否恢复。需要使用下面的 chown 操作。

要求:
- 必须确保备份数据的数据库和待恢复的数据库服务器的主版本号相同。
- 因为只有MySQL数据库主版本号相同时,才能保证这两个MySQL数据库文件类型是相同的。
- 这种方式对 MyISAM类型的表比较有效 ,*对于InnoDB类型的表则不可用*。
- 因为InnoDB表的表空间不能直接复制。
- 在Linux操作系统下,复制到数据库目录后,一定要将数据库的用户和组变成mysql,命令如下:
```bash
chown -R mysql.mysql /var/lib/mysql/dbname
```
其中，两个mysql分别表示组和用户；“-R”参数可以改变文件夹下的所有子文件的用户和组；“dbname”参数表示数据库目录。

:::info
提示 Linux操作系统下的权限设置非常严格。通常情况下，MySQL数据库只有root用户和mysql用户 组下的mysql用户才可以访问，因此将数据库目录复制到指定文件夹后，一定要使用chown命令将 文件夹的用户组变为mysql，将用户变为mysql。
:::

**物理备份步骤**
```sql
mysql> create database atguigudb5;
Query OK, 1 row affected (0.01 sec)

mysql> use atguigudb5;
Database changed
mysql> create table test1(id int)engine=myisam;
Query OK, 0 rows affected (0.01 sec)

mysql> insert into test1 values(1),(2),(3);
Query OK, 3 rows affected (0.00 sec)
Records: 3  Duplicates: 0  Warnings: 0

mysql> select * from test1;
+----+
| id |
+----+
|  1 |
|  2 |
|  3 |
+----+
3 rows in set (0.00 sec)

mysql> flush tables with read lock;
Query OK, 0 rows affected (0.00 sec)

-- 此时不可以删除，防止备份之前表数据的不一致性
mysql> delte from test1;
ERROR 1223 (HY000): Can't execute the query because you have a conflicting read lock

```

在mysql外部操作
```bash
# 在mysql目录下 var/lib/mysql/ 进行复制
cp -r atguigudb5 ./backup/

```

进入mysql中
```bash
mysql> unlock tables;
Query OK, 0 rows affected (0.00 sec)
```

至此备份就完成了；



**恢复数据**
```bash
# 模拟数据损毁了
mysql> delete from test1;
Query OK, 3 rows affected (0.00 sec)

mysql> select * from test1;
Empty set (0.00 sec)

mysql>
```

进入到mysql目录下
```bash
# 模拟真实删除
rm -rf atguigudb5
# 从备份的文件中移动到数据库目录下
mv  ./backup/atguigudb5 ./

# 重启mysql服务器
systemctl restart mysqld
```

重新进入mysql
```bash
mysql> select * from test1;
ERROR 2013 (HY000): Lost connection to MySQL server during query
No connection. Trying to reconnect...
Connection id:    8
Current database: atguigudb5

ERROR 1036 (HY000): Table 'test1' is read only
mysql> quit
Bye
[root@atguigu05 ~]# mysql -uroot -p
Enter password: 
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 9
Server version: 8.0.25 MySQL Community Server - GPL

Copyright (c) 2000, 2021, Oracle and/or its affiliates.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

mysql> use atguigudb5;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed

mysql> select * from test1;
ERROR 1036 (HY000): Table 'test1' is read only # 这里是说权限是不够的


```

在linux下执行
```bash
# 因为这个文件目录不是之前那个了，这是新的文件目录，这个目录必须要让mysql的用户有权限访问
chown -R mysql.mysql /var/lib/mysql/atguigudb5

# 此时再回到mysql中就能执行了
mysql> select * from test1;
+----+
| id |
+----+  
|  1 |
|  2 |
|  3 |
+----+
3 rows in set (0.01 sec)

```

物理层面的恢复就完成了。