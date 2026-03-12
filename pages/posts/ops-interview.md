---
title: 运维等 Interview
date: 2025-03-07
updated: 2025-03-07
categories: 面试指北
tags:
  - Java
  - 后端
  - 面经
---


## Docker

###



## Nginx

### nginx是什么？优势？

一个高性能的Web服务器和反向代理服务器

可以容易的做负载均衡，更好的面对高并发的场景。

### Nginx应用场景

- Http服务器 可以做网页静态服务器，托管 HTML、CSS、JavaScript、图片、视频等静态资源。
- 反向代理/负载均衡，当网站的访问量达到一定程度后，单台服务器不能满足用户的请求时，需要用多台服务器集群可以使用nginx做反向代理。并且多台服务器可以平均分担负载，不会因为某台服务器负载高宕机而某台服务器闲置的情况。

### 负载均衡策略
- 轮询

	每个请求按时间顺序逐一分配到不同的后端服务器

- 加权轮询

	指定轮询几率，用于后端服务器性能不均的情况。(权重/加权),权重越高分配的请求越多，权重越低，请求越少。

- ip_hash

  ip_hash 方式的负载均衡，可以使来自同一个 IP 的客户端固定访问一台 Web 服务器，从而就解决了 Session 共享问题。(己经淘汰)


### 正向代理？反向代理？

反向：是代理服务器端，隐藏真实服务器

正向：代理的是客户端(常见的vpn)



## Linux

### 如何查看进程

```bash
# 查看所有进程
ps -ef

# 查找特定进程
ps -ef | grep java

ps aux

ps aux | grep java

# 实时监控 动态显示系统中各进程的资源占用状况
top

kill 2868  # 杀掉2868编号的进程
kill -9 2868  # 强制杀死进程
```
**`ps aux`**：

- 列出所有进程的详细信息。`a` 表示显示所有用户的进程，`u` 表示以用户友好的格式显示，`x` 表示显示没有控制终端的进程。


### 端口占用排查

1. **`netstat -tulnp`**：
   - 显示监听端口的详细信息。`t` 表示 TCP，`u` 表示 UDP，`l` 表示监听状态，`n` 表示数字地址，`p` 表示显示进程信息。
2. **`lsof -i :port`**：
   - 查看指定端口的使用情况。例如，`lsof -i :8080` 查看端口 8080 的使用情况。
3. **`ss -tulnp`**：
   - 显示监听端口的详细信息。`ss` 命令类似于 `netstat`，但通常更快。


### 文件查看命令

1. cat - 查看整个文件
```bash
# 基本用法
cat filename.txt

# 显示行号
cat -n filename.txt

# 显示不可见字符（如换行、制表符）
cat -A filename.txt

# 合并多个文件
cat file1.txt file2.txt > merged.txt
```


2. less - 分页查看
```bash
# 查看文件
less filename.txt

# 查看时常用命令：
# 空格      - 下一页
# b         - 上一页
# 回车      - 下一行
# /关键词   - 搜索
# n         - 下一个搜索结果
# N         - 上一个搜索结果
# g         - 跳到文件开头
# G         - 跳到文件末尾
# q         - 退出

# 打开时跳到指定行
less +100 filename.txt

# 打开时搜索
less +/error filename.txt
```


3. more - 简单分页（较老）
```bash
more filename.txt
# 空格翻页，回车下一行，q退出
```

4. head - 查看文件开头
```bash
# 默认显示前10行
head filename.txt

# 显示前20行
head -20 filename.txt

# 显示前100个字节
head -c 100 filename.txt

# 查看多个文件
head -n 5 file1.txt file2.txt
```


5. tail - 查看文件结尾（最常用）
```bash
# 默认显示最后10行
tail filename.txt

# 显示最后20行
tail -20 filename.txt

# 实时跟踪文件更新（查看日志神器）
tail -f access.log

tail -n 20 -f 2.txt   # 动态查看后20行内容

# 多文件实时监控
tail -f log1.log log2.log
```


### 解压与压缩

```bash
# 打包：
tar –cvf  xxx.tar 要打包的件
# 打包并且压缩：
tar –czvf xxx.tar.gz 要压缩的文件
```

```bash
# 解压到user/aaa目录中
tar -xzvf xxx.tar.gz -C /usr/aaa
```




```
字母	含义	英文	说明
c	创建	create	 创建一个新的归档文件
z	gzip	zip	     通过 gzip 压缩/解压
v	详细	verbose	 显示处理的文件列表
f	文件	file	   指定归档文件名

# 可以理解为：
c = Create（创建）
z = gZip（压缩）
v = Verbose（啰嗦模式，显示详情）
f = File（文件名）
```


### 如何分配权限？

Linux 权限检查遵循 “所有者 > 所属组 > 其他人” 的严格优先级

Linux 中每个文件/目录都有权限身份：

| 身份 | 说明 |
|:----:|------|
| **u** (user) | 文件所有者 |
| **g** (group) | 文件所属组 |
| **o** (other) | 其他人 |
| **a** (all) | 所有身份 |

每种身份有三种权限：
| 权限 | 字符 | 数字 | 对文件的意义 | 对目录的意义 |
|:----:|:----:|:----:|--------------|--------------|
| **读** | r | 4 | 查看文件内容 | 列出目录内容（ls） |
| **写** | w | 2 | 修改文件内容 | 在目录中创建/删除文件 |
| **执行** | x | 1 | 运行文件（脚本/程序） | 进入目录（cd） |

**数字法**

数字表示法使用三位数字来表示权限，每一位数字代表一组权限：

- **4**：读取权限。
- **2**：写入权限。
- **1**：执行权限。

格式：`chmod [所有者权限][组权限][其他人权限] 文件名`

```bash
# 给 script.sh 设置权限：所有者(rwx=7), 组(rx=5), 其他(rx=5)
chmod 755 script.sh

# 给 config.ini 设置权限：所有者(rw=6), 组(r=4), 其他(r=4)
chmod 644 config.ini
```




**符号法**

符号表示法使用符号来表示要更改的权限：

- **u**：所有者。
- **g**：所属组。
- **o**：其他用户。
- **a**：所有用户（等同于 ugo）。
- **+**：添加权限。
- **-**：移除权限。
- **=**：设置权限（清除现有权限并设置新权限）。

```bash
# 给所有者添加执行权限
chmod u+x script.sh

# 移除其他人的写权限
chmod o-w file.txt

# 让所有人都能读
chmod a+r file.txt

# 让其他人 (others) 只有 读 (r) 权限
chmod o=r test.txt
```



### 环境变量配置

```bash
# 查看所有环境变量
env
printenv

# 查看单个变量
echo $变量名
echo $HOME
```


**临时设置（当前会话有效）**
```bash
# 设置变量（当前终端有效）
export MY_VAR="hello"

# 取消变量
unset MY_VAR
```


**永久配置（用户级别）**

1. 修改 ~/.bashrc（推荐，仅当前用户）

```bash
# 编辑配置文件
vim ~/.bashrc

# 在文件末尾添加
export MY_APP_HOME=/home/user/myapp

# 添加自定义别名
alias ll='ls -la'
alias gs='git status'

# 生效配置
source ~/.bashrc
# 或
. ~/.bashrc
```


**系统级配置（所有用户）**

1. 修改 /etc/profile（影响所有用户）
2. 修改 /etc/environment（纯变量定义）
