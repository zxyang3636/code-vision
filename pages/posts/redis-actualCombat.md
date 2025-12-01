---
title: Redis - 实战
categories: 数据库
tags:
  - Redis
  - 后端
  - 数据库
  - NoSQL
---


## 短信登录




### 基于Session实现登录的流程

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/20251125234650839.png)

**发送验证码：**

用户在提交手机号后，会校验手机号是否合法，如果不合法，则要求用户重新输入手机号。

如果手机号合法，后台此时生成对应的验证码，同时将验证码进行保存，然后再通过短信的方式将验证码发送给用户

**短信验证码登录、注册：**

​ 用户将验证码和手机号进行输入，后台从session中拿到当前验证码，然后和用户输入的验证码进行校验，如果不一致，则无法通过校验，如果一致，则后台根据手机号查询用户，如果用户不存在，则为用户创建账号信息，保存到数据库，无论是否存在，都会将用户信息保存到session中，方便后续获得当前登录信息

**校验登录状态**:

用户在请求时候，会从cookie中携带JsessionId到后台，后台通过JsessionId从session中拿到用户信息，如果没有session信息，则进行拦截，如果有session信息，则将用户信息保存到threadLocal中，并且放行。


**发送验证码**
```java
@Service
@Slf4j
public class UserInfoServiceImpl extends ServiceImpl<UserInfoMapper, UserInfo> implements IUserInfoService {

    @Override
    public Result sendCode(String phone, HttpSession session) {
        if (RegexUtils.isPhoneInvalid(phone)) {
            return Result.fail("手机号格式错误");
        }
        // 生成验证码
        String code = RandomUtil.randomNumbers(6);
        // 保存验证码
        session.setAttribute("code", code);
        // 发送验证码
        log.info("发送的验证码：{}", code);
        return Result.ok();
    }
}
```

**登录**
```java
    @Override
    public Result login(LoginFormDTO loginForm, HttpSession session) {
        String code = loginForm.getCode();
        String phone = loginForm.getPhone();
        if (RegexUtils.isPhoneInvalid(phone)) {
            return Result.fail("手机号格式错误");
        }
        if (RegexUtils.isCodeInvalid(code)) {
            return Result.fail("手机号格式错误");
        }
        // 根据手机查用户
        Object cacheCode = session.getAttribute("code");
        if (cacheCode == null) {
            return Result.fail("请填写验证码");
        }
        if (!cacheCode.equals(code)) {
            return Result.fail("验证码错误");
        }
        // 用户是否存在
        User user = lambdaQuery().eq(User::getPhone, phone).one();
        // 不存在，注册
        if (user == null) {
            user = User.builder()
                    .phone(phone)
                    .nickName(USER_NICK_NAME_PREFIX + RandomUtil.randomString(6))
                    .build();
            save(user);
        }
        // 存在，写到session
        session.setAttribute("user", BeanUtil.copyProperties(user, UserDTO.class));
        return Result.ok();
    }
```
:::tip
这里不需要返回登录凭证，session的原理是基于cookie,每一个session都会有一个唯一的sessionID，在访问tomcat时，这个session就已经写到cookie当中了，以后的每次请求都会带着sessionID
:::




**登录验证功能**
```java [LoginInterceptor.java]
public class LoginInterceptor implements HandlerInterceptor {


    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        HttpSession session = request.getSession();
        Object user = session.getAttribute("user");
        if (ObjectUtil.isEmpty(user)) {
            response.setStatus(401);
            return false;
        }
        // 保存threadLocal
        UserHolder.saveUser((UserDTO) user);
        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        HandlerInterceptor.super.postHandle(request, response, handler, modelAndView);
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        UserHolder.removeUser();
    }
}
```

```java [MvcConfig.java]
@Configuration
public class MvcConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new LoginInterceptor())
                .excludePathPatterns(
                        "/user/code",
                        "/user/login",
                        "/blog/hot",
                        "/shop/**",
                        "/shot-type/**",
                        "/voucher/**"
                );
    }
}
```





### 集群的Session共享问题

session共享问题：多台Tomcat并不共享session存储空间，当请求切换到不同tomcat服务时导致数据丢失的问题。

​ 每个tomcat中都有一份属于自己的session,假设用户第一次访问第一台tomcat，并且把自己的信息存放到第一台服务器的session中，但是第二次这个用户访问到了第二台tomcat，那么在第二台服务器上，肯定没有第一台服务器存放的session，所以此时 整个登录拦截功能就会出现问题。早期的方案是session拷贝，就是说虽然每个tomcat上都有不同的session，但是每当任意一台服务器的session修改时，都会同步给其他的Tomcat服务器的session，这样的话，就可以实现session的共享了

但是这种方案具有两个大问题

1、每台服务器中都有完整的一份session数据，内存空间浪费。

2、session拷贝数据时，可能会出现延迟，会出现数据不一致情况。

session的替代方案应该满足：数据共享、内存存储，key、value结构。基于以上特性可以选择使用Redis代替Session。



![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/20251126203451781.png)




### 基于Reids实现共享Session的登录

验证码保存：由于验证码只是简单的数字，故用String类型存储即可
后续用户要提交手机号和收到的验证码进行验证，可以将key
设置为"**phone:手机号**”的形式，既方便读取Redis中的验证
码，又保证了每个登录用户key的唯一性


用户保存：使用Hash结构将用户对象保存到Redis
以随机token为key存储用户数据，保证key的唯一性



![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/20251126205449356.png)

**发送验证码**
```java [UserServiceImpl.java]
    private final RedisTemplate<String, Object> redisTemplate;


    @Override
    public Result sendCode(String phone, HttpSession session) {
        if (RegexUtils.isPhoneInvalid(phone)) {
            return Result.fail("手机号格式错误");
        }
        // 生成验证码
        String code = RandomUtil.randomNumbers(6);
        // 保存到redis
        redisTemplate.opsForValue().set(RedisConstants.LOGIN_CODE_KEY + phone, code, RedisConstants.LOGIN_CODE_TTL, TimeUnit.MINUTES);

        // 发送验证码
        log.info("发送的验证码：{}", code);
        return Result.ok();
    }
```


**登录**
```java [UserServiceImpl.java]
    @Override
    public Result login(LoginFormDTO loginForm, HttpSession session) {
        String code = loginForm.getCode();
        String phone = loginForm.getPhone();
        if (RegexUtils.isPhoneInvalid(phone)) {
            return Result.fail("手机号格式错误");
        }
        if (RegexUtils.isCodeInvalid(code)) {
            return Result.fail("手机号格式错误");
        }
        // 根据手机查用户
        String cacheCode = (String) redisTemplate.opsForValue().get(RedisConstants.LOGIN_CODE_KEY + phone);
        if (cacheCode == null) {
            return Result.fail("请填写验证码");
        }
        if (!cacheCode.equals(code)) {
            return Result.fail("验证码错误");
        }
        // 用户是否存在
        User user = lambdaQuery().eq(User::getPhone, phone).one();
        // 不存在，注册
        if (user == null) {
            user = User.builder()
                    .phone(phone)
                    .nickName(USER_NICK_NAME_PREFIX + RandomUtil.randomString(6))
                    .build();
            save(user);
        }
        // 生成token （可换jwt）
        String token = UUID.randomUUID().toString(true);
        // 写到redis
        UserDTO userDTO = BeanUtil.copyProperties(user, UserDTO.class);
        Map<String, Object> userMap = BeanUtil.beanToMap(userDTO);
        String tokenKey = RedisConstants.LOGIN_USER_KEY + token;
        redisTemplate.opsForHash().putAll(tokenKey, userMap);
        redisTemplate.expire(tokenKey, 30, TimeUnit.MINUTES);
        // 返回token
        return Result.ok(token);
    }
```


**拦截器**
```java [LoginInterceptor.java]
@RequiredArgsConstructor
public class LoginInterceptor implements HandlerInterceptor {

    private final StringRedisTemplate stringRedisTemplate;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String token = request.getHeader("authorization");
        if (StrUtil.isBlank(token)) {
            response.setStatus(401);
            return false;
        }
        // 基于ToKEN获取redis中的用户
        Map<Object, Object> userMap = stringRedisTemplate.opsForHash().entries(LOGIN_USER_KEY + token);
        if (userMap.isEmpty()) {
            response.setStatus(401);
            return false;
        }
        UserDTO userDTO = BeanUtil.fillBeanWithMap(userMap, new UserDTO(), false);
        // 刷新token有效期 (token续期)
        stringRedisTemplate.expire(LOGIN_USER_KEY + token, 30, TimeUnit.MINUTES);
        // 保存threadLocal
        UserHolder.saveUser(userDTO);
        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        HandlerInterceptor.super.postHandle(request, response, handler, modelAndView);
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        UserHolder.removeUser();
    }
}
```


```java [MvcConfig.java]
@Configuration
@RequiredArgsConstructor
public class MvcConfig implements WebMvcConfigurer {

    private final StringRedisTemplate stringRedisTemplate;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new LoginInterceptor(stringRedisTemplate))
                .excludePathPatterns(
                        "/user/code",
                        "/user/login",
                        "/blog/hot",
                        "/shop/**",
                        "/shot-type/**",
                        "/voucher/**"
                );
    }
}
```

**优化拦截器**

当前拦截器有个问题，如果用户访问的一直都是放行的路径，那么就不会进入到拦截器中，所以拦截器中的token续期就无效了，所以我们需要再加一个拦截器（拦截所有路径的）

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/20251126215158488.png)


```java [RefreshInterceptor.java]
@RequiredArgsConstructor
public class RefreshInterceptor implements HandlerInterceptor {

    private final StringRedisTemplate stringRedisTemplate;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String token = request.getHeader("authorization");
        if (StrUtil.isBlank(token)) {
            return true;
        }
        // 基于ToKEN获取redis中的用户
        Map<Object, Object> userMap = stringRedisTemplate.opsForHash().entries(LOGIN_USER_KEY + token);
        if (userMap.isEmpty()) {
            return true;
        }
        UserDTO userDTO = BeanUtil.fillBeanWithMap(userMap, new UserDTO(), false);
        // 刷新token有效期 (token续期)
        stringRedisTemplate.expire(LOGIN_USER_KEY + token, 30, TimeUnit.MINUTES);
        // 保存threadLocal
        UserHolder.saveUser(userDTO);
        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        HandlerInterceptor.super.postHandle(request, response, handler, modelAndView);
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        UserHolder.removeUser();
    }
}
```


```java [LoginInterceptor.java]
public class LoginInterceptor implements HandlerInterceptor {


    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        UserDTO user = UserHolder.getUser();
        if (user == null) {
            response.setStatus(401);
            return false;
        }
        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        HandlerInterceptor.super.postHandle(request, response, handler, modelAndView);
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        UserHolder.removeUser();
    }
}
```

```java [MvcConfig.java]
@Configuration
@RequiredArgsConstructor
public class MvcConfig implements WebMvcConfigurer {

    private final StringRedisTemplate stringRedisTemplate;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new LoginInterceptor())
                .excludePathPatterns(
                        "/user/code",
                        "/user/login",
                        "/blog/hot",
                        "/shop/**",
                        "/shot-type/**",
                        "/voucher/**"
                ).order(1);
        registry.addInterceptor(new RefreshInterceptor(stringRedisTemplate)).addPathPatterns("/**").order(0);   // 先执行
    }
}
```




## 商户查询缓存

### 缓存

缓存就是数据交换的缓冲区（cache），是存贮数据的临时地方，一般**读写性能较高**。

缓存数据存储于代码中,而代码运行在内存中,内存的读写性能远高于磁盘,缓存可以大大降低用户访问并发量带来的服务器读写压力，降低响应时间

实际开发中,会构筑多级缓存来使系统运行速度进一步提升,例如:本地缓存与redis中的缓存并发使用



![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/20251126221956887.png)


![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/20251126222310493.png)

缓存的成本：

- 数据一致性成本（需要保证缓存与数据库中数据的一致性）
- 代码维护成本
- 运维成本（为保证缓存高可用，需要搭建缓存集群，增加运维成本）
### 添加Redis缓存

**总体流程**
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/20251127210950929.png)

**业务流程**
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/20251127211013223.png)

操作思路：查询数据库之前先查询缓存，如果缓存数据存在，则直接从缓存中返回，如果缓存数据不存在，再查询数据库，然后将数据存入redis并将数据返回。

key设计为 “固定前缀+商铺id”的形式。


```java [ShopServiceImpl.java]
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public Result queryShopById(Long id) {
        String shopJson = (String) redisTemplate.opsForValue().get(RedisConstants.CACHE_SHOP_KEY + id);
        if (StrUtil.isNotBlank(shopJson)) {
            Shop shop = JSON.parseObject(shopJson, Shop.class);
            return Result.ok(shop);
        }

        Shop shop = getById(id);
        if (ObjectUtil.isEmpty(shop)) {
            return Result.ok();
        }
        redisTemplate.opsForValue().set(RedisConstants.CACHE_SHOP_KEY + id, JSON.toJSONString(shop));

        return Result.ok(shop);
    }
```

首页查询做缓存：

**List做缓存**
```java [ShopTypeServiceImpl.java]
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public Result queryTypeList() {
        List<Object> shopTypeListCache = redisTemplate.opsForList().range("cache:shopType", 0L, -1L);
        if (!shopTypeListCache.isEmpty()) {
            return Result.ok(shopTypeListCache);
        }
        List<ShopType> typeList = lambdaQuery()
                .orderByAsc(ShopType::getSort)
                .list();
        if (typeList.isEmpty()) {
            return Result.ok();
        }
        redisTemplate.opsForList().rightPushAll("cache:shopType", typeList.toArray());
        return Result.ok(typeList);
    }
```
:::info
`typeList.toArray()` 变成 `ShopType[]` 数组，`rightPushAll(ShopType[] array)` 会把数组中的每一个元素逐个写入 Redis;

如果是`redisTemplate.opsForList().rightPushAll("cache:shopType", typeList);`

 `rightPushAll(Collection<?> c)` 会把整个集合当作一个元素推入 Redis 列表，得到的将会是(这样是不对的)
 ```json
[
  [ShopType1, ShopType2, ShopType3 ...]
]
 ```
:::



### 缓存更新策略

|          | **内存淘汰**                                                                 | **超时剔除**                                                                                         | **主动更新**                                                                 |
|----------|------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------|
| **说明** | 不用自己维护，利用Redis的内存淘汰机制，当内存不足时自动淘汰部分数据。下次查询时更新缓存。 | 给缓存数据添加TTL时间，到期后自动删除缓存。下次查询时更新缓存。       | 编写业务逻辑，在修改数据库的同时，更新缓存。                                     |
| **一致性** | 差                        | 一般                          | 好                                                                           |
| **维护成本** | 无                       | 低                          | 高                         |
|          | 淘汰哪部分数据和淘汰的时机无法确定，如果旧数据一直为被淘汰，会造成数据的不一致                     | 一致性的强弱取决于所设置TTL的长短，同时如果在所设置的更新时间内发生数据更新，还是会造成数据的不一致           | 更新可控性高，但需要编写额外业务逻辑                                           |

可以根据业务场景选择更新策略：

- 低一致性需求：使用内存淘汰机制。如店铺类型的查询缓存
- 高一致性需求：主动更新，并以超时剔除为兜底方案。如店铺详情查询的缓存。


**主动更新**策略主要有三种：Cache Aside模式、Read/Write Through模式、Write Behind Cahing模式。

- Cache Aside(缓存旁路模式)：由缓存调用者，在更新数据库的同时更新缓存。（代码复杂，但可人为控制）
- Read/Write Through(读写穿透模式)：缓存与数据库整合为一个服务，由服务来维护一致性。调用者调用该服务，无需关心缓存一致性问题。（维护服务复杂，无现成服务）
- Write Behind Caching(写回模式)：调用者只操作缓存，由其它线程异步的将缓存数据持久化到数据库，保证**最终一致**。（维护异步任务复杂，在异步进程修改数据库前，难以保证一致性，若服务器宕机，内存中的Redis数据将丢失 ）

综合考虑，在企业中使用最多的策略是：Cache Aside。由调用者自己更新缓存。

---

操作缓存和数据库时有三个问题需要考虑：

1. 删除缓存还是更新缓存？

- 更新缓存：每次更新数据库都要更新缓存，无效的写操作多。
- 删除缓存：更新数据库时让缓存失效，查询时再更新缓存。

删除缓存，意思就是说，更新数据库以后直接将缓存中的旧数据直接删除了，等下一次查询在往缓存中存储，这种方式是更加合适的。

如果是更新缓存，假如我们往数据库进行了100次更新，那么redis就需要进行100次更新，如果这100次期间并没有人来访问，就会造成写多读少的问题。而删除缓存，则是直接删除缓存，等什么时候有人来访问，再来写入缓存，这样就不会造成写多读少的问题。

---

2. 如何保证缓存与数据库的操作的同时成功或失败？

- 单体系统：将缓存和数据库操作放在一个事务中。
- 分布式系统：利用TCC等分布式事务方案（如：使用MQ通知其他服务进行数据同步）。

--- 

3. 先操作缓存还是先操作数据库？（线程安全问题）

先删除缓存，再操作数据库。在多线程下可能会出现如下情况：
- 线程1执行写操作，首先删除缓存，准备更新数据库（耗时较长）
- 线程2查询数据，缓存未命中，读取数据库旧值并回填缓存。
- 线程1完成数据库更新
- 后序查询请求都会命中过期的缓存

从清空缓存到更新完数据库，整个过程耗时较长，其他线程很有可能在此期间读到数据库中的旧数据并写入缓存。缓存中存在旧数据，后续请求持续读到旧值，直到缓存过期或主动删除。

正常情况：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/20251128215550827.png)

异常情况：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/20251128215728981.png)


**先操作数据库，再删除缓存**。此时可能出现线程安全的情况如下：

- 线程1执行写操作，先更新数据库，此时尚未删除缓存
- 线程2查询数据，命中缓存中的旧数据，返回。
- 线程1删除缓存
- 后续请求查询缓存未命中，从数据库读取新值并回填缓存。

这种方法会造成短暂的数据不一致，但缓存删除后数据恢复一致。后续请求缓存新值，无长期问题。


正常情况：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/20251128220154940.png)

异常情况：
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/20251128220647333.png)

还有另一种可能的情况：
- 由于缓存过期或者首次查询，线程1查询缓存未命中，开始读取数据库v=10。
- 在线程1读取数据库的过程中，线程2更新数据库为v=20，并删除缓存。
- 线程2的删除缓存操作完成。
- 线程1将读取到的旧数据v=10写入缓存。

但是写入Redis缓存的用时很短，不太可能在此期间完成更新数据库和删除缓存的可能，发生数据不一致的可能很小。
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/20251128220610099.png)

综合来看，方案二出现不一致性问题概率更低；

---

缓存更新策略的最佳实践方案：

1、低一致性需求：使用Redis自带的内存淘汰机制

2、高一致性需求：主动更新（Cache Aside），并以超时剔除作为兜底方案

- 读操作：
    - 缓存命中则直接返回
    - 缓存未命中则查询数据库，并写入缓存，设定超时时间

- 写操作：
  - 先写数据库，然后再删除缓存
  - 要确保数据库与缓存操作的原子性



### 实现商铺缓存

查询这里增加时间
```java
redisTemplate.opsForValue().set(RedisConstants.CACHE_SHOP_KEY + id, JSON.toJSONString(shop), 30L, TimeUnit.MINUTES);
```
更新商品逻辑：
```java
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result updateShop(Shop shop) {
        Long id = shop.getId();
        if (id == null) {
            return Result.fail("id不能为空");
        }
        // 更新数据库
        updateById(shop);
        // 删除缓存
        redisTemplate.delete(RedisConstants.CACHE_SHOP_KEY + id);
        return Result.ok();
    }
```




### 缓存穿透

**缓存穿透**指客户端请求的数据在缓存中和数据库中都不存在，这样缓存永远不会生效，这些请求都会打到数据库。

常见解决方案有两种：


1. 缓存空对象

当我们发现请求的数据即不存在于缓存，也不存于与数据库时，将空值缓存到Redis，并设置过期时间，避免频繁查询数据库。

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/20251201214207173.png)


优点：

- 实现简单，维护⽅便

缺点：

- 额外的内存消耗；可能发生不一致问题（在TTL内真的有对应数据存入数据库中）

假如用户刚好请求了一个id，但是这个id的数据不存在，我们给缓存了个null，就在此时我们真的给这个id插入了一条数据，但是缓存中缓存的是null，出现了数据不一致的问题。

我们可以在新增数据的时候，我们主动把redis中的数据进行覆盖掉，也可以解决这个问题。


2. 布隆过滤


![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/20251201214639408.png)

- 优点：内存占用较少，没有多余key
- 缺点：
    - 实现复杂
    - 存在误判可能


**解决缓存穿透问题**

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/20251201215707349.png)

```java [ShopServiceImpl.java]
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public Result queryShopById(Long id) {
        String shopJson = (String) redisTemplate.opsForValue().get(RedisConstants.CACHE_SHOP_KEY + id);
        if (StrUtil.isNotBlank(shopJson)) {
            Shop shop = JSON.parseObject(shopJson, Shop.class);
            return Result.ok(shop);
        }
        // 命中的是否是空值
        if (shopJson != null) {
            return Result.fail("店铺不存在");
        }
        Shop shop = getById(id);
        if (ObjectUtil.isEmpty(shop)) {
            // 缓存空值到redis
            redisTemplate.opsForValue().set(RedisConstants.CACHE_SHOP_KEY + id, "", 2L, TimeUnit.MINUTES);
            return Result.fail("店铺不存在");
        }
        redisTemplate.opsForValue().set(RedisConstants.CACHE_SHOP_KEY + id, JSON.toJSONString(shop), 30L, TimeUnit.MINUTES);

        return Result.ok(shop);
    }
```

**总结**

缓存穿透产生的原因是什么？

- 用户请求的数据在缓存中和数据库中都不存在，不断发起这样的请求，给数据库带来巨大压力

缓存穿透的解决方案有哪些？

- 缓存 null 值
- 布隆过滤
- 增强 id 的复杂度，避免被猜测 id 规律
- 做好数据的基础格式校验
- 加强用户权限校验
- 做好热点参数的限流






### 缓存雪崩

缓存雪崩是指在同⼀时段 **⼤量的缓存key同时失效** 或者 **Redis服务宕机**，导致⼤量请求到达数据库，带来巨⼤压⼒。

与缓存击穿的区别：雪崩是很多key，击穿是某一个key缓存。

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/20251201221150009.png)



常见的解决方案有：

- 由于设置缓存时采用了相同的过期时间，导致缓存在某一时刻同时失效。因此**给不同的Key在原本TTL的基础上添加随机值**，这样KEY的过期时间不同，不会大量KEY同时过期
- 利用Redis集群提高服务的可用性，避免缓存服务宕机
- 给缓存业务添加降级限流策略（服务降级、快速失败等）
- 给业务添加多级缓存，比如先查询本地缓存，本地缓存未命中再查询Redis，Redis未命中再查询数据库。




### 缓存击穿

**缓存击穿问题**也叫热点Key问题，就是⼀个被 **⾼并发访问** 并且 **缓存重建业务较复杂** 的key突然失效了，⽆数的请求访问会在瞬间给数据库带来巨⼤的冲击。

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/20251201222938789.png)

解决方案：

- 互斥锁：给重建缓存逻辑加锁，避免多线程同时进行

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/20251201223154715.png)

当线程1发现缓存过期并尝试重建缓存时，首先获取互斥锁，再查询数据库并写入缓存，之后释放锁。在重建过程中，有其他线程也发现缓存过期并尝试重建时，会获取互斥锁失败，休眠一会再尝试查询缓存和获取锁的操作，直到查询到新的缓存数据时直接返回。


- 逻辑过期：热点key不要设置过期时间，通过逻辑过期字段标识是否过期。
![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/20251201223611034.png)

当一个线程发现缓存已经过期时，获取互斥锁进行缓存重建，与前一种方案不同的是，缓存重建时会创建新的线程去完成，重建完成后释放互斥锁，自己直接返回过期数据。在重建缓存过程中，有新线程发现缓存过期并尝试重建时，会获取锁失败，此时直接返回过期数据。


**对比**

| 解决方案 | 优点 | 缺点 |
|---------|------|------|
| **互斥锁** | • 没有额外的内存消耗<br>• 保证一致性<br>• 实现简单 | • 线程需要等待，性能受影响<br>• 可能有死锁风险 |
| **逻辑过期** | • 线程无需等待，性能较好 | • 不保证一致性<br>• 有额外内存消耗<br>• 实现复杂 |


- 互斥锁不需要保存逻辑过期时间，没有额外的内存消耗，而逻辑过期需要额外维护一个逻辑过期时间，有额外的内存消耗。

互斥锁能够保证数据的强一致性，但由于锁的存在会降低并发性能；逻辑过期的方式优先保障高可用，性能好，但存在数据不一致情况。根据项目的实际需要选择合适的解决方案



---

**利用互斥锁解决店铺详情查询的缓存击穿问题**

需求：修改根据id查询商铺的业务，基于互斥锁方式来解决缓存击穿问题

![](https://zzyang.oss-cn-hangzhou.aliyuncs.com/img/20251201233027840.png)

我们可以利用setnx来实现互斥锁，setnx添加成功则返回1，添加失败则返回0；释放锁可以利用 `del xxx`来释放锁，当然我们使用setnx要注意**给key设置过期时间**，避免程序出现问题，导致锁永远无法释放，一般设置个10s足够了，业务重建缓存时间顶天1s不到；

**实现思路：**

进行查询之后，如果从缓存没有查询到数据，则进行互斥锁的获取（构建缓存）

1. 若获取锁成功，则再次检测redis缓存是否存在，做DoubleCheck，如果存在则无需重建缓存，如果不存在则查询数据库重建缓存。
- 对于第一次获取就得到互斥锁的线程而言，再次检测redis缓存，结果还是不存在，然后重建缓存。
- 对于上次获得锁失败的线程而言，本次获取锁成功，说明已经有线程完成缓存重建，再次查询缓存即可获得数据，不用再执行重建缓存操作。

2. 若没有获取到互斥锁，则自旋等待一段时间后再次尝试获取锁，获取成功则回到 第1步；

```java
    @Override
    public Result queryShopById(Long id) {
        String shopJson = (String) redisTemplate.opsForValue().get(RedisConstants.CACHE_SHOP_KEY + id);
        if (StrUtil.isNotBlank(shopJson)) {
            Shop shop = JSON.parseObject(shopJson, Shop.class);
            return Result.ok(shop);
        }
        // 命中的是否是空值
        if (shopJson != null) {
            return Result.fail("店铺不存在");
        }
        // 实现缓存重建
        // 获取互斥锁
        String lockKey = "lock:shop:" + id;
        boolean isLocked = tryLock(lockKey);
        // 是否获取成功
        if (!isLocked) {
            // 失败-休眠重试
            ThreadUtil.sleep(50);
            return queryShopById(id);  // 递归重试
        }
        // Double-Check：第二次检查缓存
        shopJson = (String) redisTemplate.opsForValue().get(RedisConstants.CACHE_SHOP_KEY + id);
        if (StrUtil.isNotBlank(shopJson)) {
            Shop shop = JSON.parseObject(shopJson, Shop.class);
            return Result.ok(shop);
        }
        if (shopJson != null) {
            return Result.fail("店铺不存在");
        }
        // 缓存仍未命中，查数据库
        Shop shop = getById(id);
        if (ObjectUtil.isEmpty(shop)) {
            // 缓存空值到redis,防止穿透
            redisTemplate.opsForValue().set(RedisConstants.CACHE_SHOP_KEY + id, "", 2L, TimeUnit.MINUTES);
            return Result.fail("店铺不存在");
        }
        redisTemplate.opsForValue().set(RedisConstants.CACHE_SHOP_KEY + id, JSON.toJSONString(shop), 30L, TimeUnit.MINUTES);
        // 释放互斥锁
        unLock(lockKey);
        return Result.ok(shop);
    }


    private boolean tryLock(String key) {
        // 只有当 key 不存在时，才会设置 value，并返回 true; 如果 key 已经存在，则不会进行任何修改，并返回 false。
        Boolean flag = redisTemplate.opsForValue().setIfAbsent(key, "1", 10L, TimeUnit.SECONDS);
        return BooleanUtil.isTrue(flag);    // isTrue:只有当flag是true才是true，flag为false和null都返回false(避免拆箱操作报空指针)
    }

    private void unLock(String key) {
        redisTemplate.delete(key);
    }
```

:::tip
**为什么需要 double check？**

当多个线程同时进入查询方法时，可能会发生：

1. A 线程发现缓存没有，去尝试加锁。

2. B 线程也发现缓存没有，但 A 拿到锁，B 没拿到锁。

3. B 休眠后继续重试，但此时 A 已经把最新数据写入缓存了。

4. 如果没有 double check，B 又会继续走完整流程 —— 白查数据库，造成竞争。

所以加锁之后必须再查一次缓存（第二次检查），避免重复构建缓存，减少数据库压力。


这样可以保证：

1. 如果别人已经重建缓存，我们不用再查数据库

2. 避免多线程重复重建缓存

3. 性能更优，更安全
:::



---

**基于逻辑过期方式解决缓存击穿问题**








### 缓存工具封装











## 优惠券秒杀





## 达人探店





## 好友关注





## 附近的商户





## 用户签到





## UV统计





