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






### 缓存更新策略






### 缓存穿透






### 缓存雪崩






### 缓存击穿






### 缓存工具封装









## 优惠券秒杀





## 达人探店





## 好友关注





## 附近的商户





## 用户签到





## UV统计





