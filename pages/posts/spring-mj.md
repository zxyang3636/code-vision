---
title: Spring/Spring Boot/SpringMVC
date: 2025-03-07
updated: 2025-03-07
categories: 面试指北
tags:
  - Spring
  - SpringBoot
  - 面经
---



## 谈谈你对 Spring 的理解，springmvc，springboot 之间关系？

1. **Sping**

- Spring 框架的基本概念：

Spring 是一个开源的 Java 企业应用开发框架，旨在简化 Java 开发，提高代码的可维护性和可扩展性。
它提供了控制反转（IoC）和面向切面编程（AOP）等特性，帮助解决了传统 Java 应用中的一些设计问题。

  - 控制反转（IoC）和依赖注入（DI）

IoC 是 Spring 的核心概念，控制反转 Inversion of Control：由 spring 框架创建对象，对象不由我 们创建。所有 bean(对象)交给 spring 容器管理，由 spring 创建、销毁、统一管理(不使用 new 创建)，解决了对象间的耦合(解耦)

DI 是 IoC 的一种具体实现，通过依赖注入，给对象定义的属性赋初值，的过程称为依赖注入

  - Spring AOP： 面向切面编程，通过 AOP 可以将横切关注点（如日志、事务）从主要的业务逻辑中分离出来。

2. **SpringMVC**： MVC 是 Spring 框架的一个模块，专门用于构建 Web 应用程序。Spring MVC 遵循 Model-View-Controller（MVC）设计模式；我们都是使用 spring 来实现基于 Java 的 Web 应用程序的 MVC 模式，

3. **Spring Boot** 是 Spring 的子项目，用于简化 Spring 应用的开发和部署，它提供了自动化配置，可以减少开发者的配置工作，同时集成了嵌入式 Web 服务器，简化了应用的部署。

## @Transactional 失效场景

**一、错误的传播机制**

Spring 支持了 7 种传播机制，分别为：(默认的事务传播行为是 `PROPAGATION_REQUIRED`)

- `PROPAGATION_REQUIRED`：
  定义：如果当前存在事务，则加入该事务；如果当前没有事务，则创建一个新的事务。
  用途：这是最常见的传播行为，用于大部分需要事务的方法。
- `PROPAGATION_SUPPORTS`：
  定义：如果当前存在事务，则加入该事务；如果当前没有事务，则以非事务方式执行。
  用途：用于不需要强制事务的方法，但如果存在事务则加入。
- `PROPAGATION_MANDATORY`： man de te rui 强制性的
  定义：如果当前存在事务，则加入该事务；如果当前没有事务，则抛出异常。
  用途：用于必须在事务上下文中执行的方法。
- `PROPAGATION_REQUIRES_NEW`：
  定义：创建一个新的事务，如果当前存在事务，则将当前事务挂起。
  用途：用于需要在新事务中执行的操作，而不受现有事务的影响。
- `PROPAGATION_NOT_SUPPORTED`：
  定义：以非事务方式执行操作，如果当前存在事务，则将当前事务挂起。
  用途：用于不需要事务的操作，但可能存在于事务方法调用中。
- `PROPAGATION_NEVER`：
  定义：以非事务方式执行，如果当前存在事务，则抛出异常。
  用途：用于严格禁止在事务上下文中执行的操作。
- `PROPAGATION_NESTED`： nai si tei de 嵌套的
  定义：如果当前存在事务，则创建一个嵌套事务（如果支持）；如果当前没有事务，则创建一个新的事务。
  用途：用于需要嵌套事务支持的场景，允许在事务中开启新的事务，可以利用 savepoint 来实现。

上面不支持事务的传播机制为：`PROPAGATION_SUPPORTS`，`PROPAGATION_NOT_SUPPORTED`，`PROPAGATION_NEVER`。如果配置了这三种传播方式的话，在发生异常的时候，事务是不会回滚的。

1. **rollbackFor 属性设置错误**

默认情况下事务仅回滚运行时异常和 Error，不回滚受检异常（例如 IOException）。
因此如果方法中抛出了 IO 异常，默认情况下事务也会回滚失败。我们可以通过指定`@Transactional(rollbackFor = Exception.class)`的方式进行全异常捕获。

2. **异常被内部 catch**

当异常被内部捕获，如果不显式地设置事务回滚，事务管理器不会自动检测到异常，事务将不会回滚，并且最终会提交。

解决：
显式设置回滚：`TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();`

或者重新抛出异常

---

3. **内部调用（自调用）**

- `this.method()`调用是直接的对象方法调用，不经过Spring代理
- `Spring AOP`只能拦截外部调用，内部调用绕过了代理机制


**解决方案**
  1. 注入自己（获取代理对象）
  2. 方案2：使用`AopContext.currentProxy()`
  3. 方案3：将事务方法抽取到另一个Service

---

4. **嵌套事务**

如果一个被`@Transactional` 标注的方法直接调用另一个被`@Transactional` 标注的方法，事务不会嵌套。

要解决这个问题，可以使用`@Transactional(propagation = Propagation.REQUIRED)`

**二、代理不生效**

1. 将注解标注在接口方法上

`@Transactional` 是支持标注在方法与类上的。一旦标注在接口上，对应接口实现类的代理方式如果是 `CGLIB`，将通过生成子类的方式生成目标类的代理，将无法解析到`@Transactional`，从而事务失效。

2. 被 `final、static` 关键字修饰的类或方法

`CGLIB `是通过生成目标类子类的方式生成代理类的，被 `final`、`static` 修饰后，无法继承父类与父类的方法。

3. 类方法内部调用

事务的管理是通过代理执行的方式生效的，如果是方法内部调用，将不会走代理逻辑，也就调用不到了。

4. 当前类没有被 Spring 管理

这个没什么好说的，都没有被 `Spring` 管理成为 `IOC` 容器中的一个 `bean`，更别说被事务切面代理到了。

**三、框架或底层不支持的功能**

1. 非 public 修饰的方法

不支持非 public 修饰的方法进行事务管理。因为Spring事务基于AOP代理实现，只有通过代理对象调用的public方法才能被拦截

2. 多线程调用,异步方法

异步方法在不同的线程中执行，
事务是基于`ThreadLocal`的，不同线程间无法共享事务上下文

3. 数据库本身不支持事务

比如 `Mysql` 的 `Myisam` 存储引擎是不支持事务的，只有 `innodb` 存储引擎才支持。
这个问题出现的概率极其小，因为 `Mysql5` 之后默认情况下是使用 `innodb` 存储引擎了。

4. 未开启事务

这个也是一个比较麻瓜的问题，在 `Springboot` 项目中已经不存在了，已经有 `DataSourceTransactionManagerAutoConfiguration` 默认开启了事务管理。
但是在 MVC 项目中还需要在 applicationContext.xml 文件中，手动配置事务相关参数。如果忘了配置，事务肯定是不会生效的。



## SpringIOC注入有哪几种方式？

1. 构造器注入 (Constructor Injection)  通过构造函数传入依赖
```java
@Component
public class UserService {
    private final UserRepository userRepository;

    // 显式定义构造函数
    @Autowired // Spring 4.3+ 如果只有一个构造函数，此注解可省略
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}
```
或

`@RequiredArgsConstructor` 是 Lombok 库提供的一个注解，它属于 构造器注入 (Constructor Injection) 的一种自动化实现方式。
```java
@Component
@RequiredArgsConstructor // Lombok 会自动生成上面的构造函数
public class UserService {
    private final UserRepository userRepository;      // 1. 是 final -> 会被包含
    private final EmailService emailService;          // 2. 是 final -> 会被包含
    private String config;                            // 3. 既不是 final 也不是 @NonNull -> 被忽略
    @NonNull private Logger logger;                   // 4. 有 @NonNull -> 会被包含
}
```
2. Setter 注入 (Setter Injection) 通过 setter 方法传入依赖
```java
@Component
public class UserService {
    private UserRepository userRepository;

    @Autowired
    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}
```
3. 字段注入 (Field Injection)  直接注入类的字段(@Autowired, @Resource)
```java
@Component
public class UserService {
    @Autowired // 直接打在字段上
    private UserRepository userRepository;
}
```
4. 方法注入 (@Lookup)

Spring 为了解决 单例 Bean 需要每次获取新的原型 Bean 这一特殊生命周期冲突而提供的

:::tip
场景描述
- Bean A：默认是 单例 (Singleton)（Spring 默认作用域），整个应用生命周期只有一个实例。
- Bean B：设置为 原型 (Prototype)，每次请求都需要一个新的实例。
- 需求：A 需要依赖 B。

SingletonBean 内部持有的 PrototypeBean 永远都是同一个实例，失去了“原型”的意义（不再是每次获取都新建）。
:::


## spring常用注解有哪些？

```java
1、自定义类(自己写的类，要放到 spring 容器中)
@Controller controller 层
@Service service 层
@Repository 数据访问层
@Component 其他组件

2、自定义操作
@Scope 单例或多例
@PostConstruct. 标注在方法上，初始化对象后调用 同init-method属性
@PreDestroy 标注在方法上，对象销毁时调用  同destroy-method属性

3、注入相关的注解
@Autowired 注入一个对象
@Qualifier 注入类型，有多个对象符合标准，就用此注解区分

@Value 给属性注入值

4、代替 xml 文件
@Configuration---代替 xml 的
@ComponentScan----扫描包
@Bean----把第三方的类，可以在方法中生成，放到 spring 容器中
@PropertySource(classpath:xxx.properties)，读取 properties 文件
@Import，导入其他配置文件
@Conditional 注解的作用是为 Bean 的装载提供了一个条件判断。
```


## springmvc中的常用注解有哪些？
```java
@RequestMapping

@RestController

@RequestParam

@RequestBody

@ResponseBody

@PathVariable

@RequestHeader

@ControllerAdvice
```


## @Resource和@Autowired的区别

1. @Autowired和@Qualifier是spring提供的注解，@Resource是jdk提供的注解
2. @Autowired默认按类型注入，从IOC容器中找与之属性类型匹配的对象注入。特殊情况下一个接口下有多个实现类，会注入失败，可以根据 `@Qualifier` 注解来指定具体的 Bean。
@Resource先按名称注入,名称不存在时,再按类型注入, 指定了名称注入，找不到抛出异常
3. @Autowired只有一个属性required，默认值为true，为true时，找不到就抛异常，为false时，找不到就赋值为null

@Resource有两个常用属性name、type，注入时分4种情况：

- 指定name和type：通过name找到唯一的bean，找不到抛出异常；如果type和字段类型不一致，也会抛出异常；
- 指定name：通过name找到唯一的bean，找不到抛出异常；
- 指定type：通过tpye找到唯一的bean，如果不唯一，则抛出异常；
- 都不指定：通过[字段名](https://zhida.zhihu.com/search?q=字段名)作为key去查找，找到则赋值；找不到则再通过字段类型去查找，如果不唯一，则抛出异常。


## 解释 Spring 支持的几种 bean 的作用域？


singleton单例模式 `@Scope("singleton")`
- spring容器中仅有一份对象，默认，Spring IoC 容器中只会存在一个共享的 Bean 实例，无论有多少个Bean 引用它，始终指向同一对象。该模式在多线程下是不安全的

prototype原型模式 `@Scope("prototype")`
- 每次通过容器获得该对象时创建新对象，每个 Bean 实例都有自己的属性和状态

request `@Scope("request")`
- 每次请求创建一份新对象，对不同的 Http 请求则会产生新的 Bean，而且该 bean 仅在当前 Http Request 内有效,当前 Http 请求结束，该 bean实例也将会被销毁。

session `@Scope("session")`
- 每次会话创建一次新对象，对不同的 Session 请求则会创建新的实例，该 bean 实例仅在当前 Session 内有效

globalsession
- web环境下与session相同，小程序开发才会有区别



## @PostConstruct使用注意事项

发生在依赖注入之后，可以在 `@PostConstruct` 方法中安全地使用所有已注入的 `@Autowired` 成员变量

- `@PostConstruct` 注解的方法必须是 public 的，并且不能有参数。
- 如果一个类中定义了多个 `@PostConstruct` 注解的方法，这些方法将按照它们在类中定义的顺序执行。
- `@PostConstruct` 注解的方法可以抛出异常，如果抛出异常，容器可能会将这个 Bean 标记为销毁状态。

:::info
场景 A：加载全局缓存，从数据库读取字典表、配置项加载到内存（Map/Redis），避免每次请求都查库。

场景 B：校验关键配置，检查某些必须的配置文件或环境变量是否存在
:::

## Spring bean 的生命周期？

spring bean的生命周期指的是从创建到销毁的整个过程。这个过程可以分为以下几个步骤，

1、实例化。Spring容器根据配置文件或注解创建一个bean定义，这个定义描述了bean的类依赖关系等，然后容器使用java反射机制创建一个bean的实例。

2、属性赋值。Spring容器将在bean实例化后通过调用set方法等方式来将属性赋值给bean，这个过程可以通过XML配置或注解来实现。

3、初始化。在bean的属性赋值完成后，Spring容器会调用bean的初始化方法，这个方法可以是自定义的，需要在bean的配置文件或注解中进行定义。如果使用了`@PostConstruct`或配置了`init-method`属性，Spring IoC 容器会寻找 Bean 上的所有 `@PostConstruct` 方法并调用它们。这些方法通常用来进行必要的初始化工作。

4、使用。bean初始化完成后就可以使用了，这个时候bean已经被完全构建并准备好被其他组件使用。

5、销毁。当bean不再需要使用时，spring容器会调用bean的销毁方法，如果使用了`@PreDestroy`，或者配置了`destory-method`属性，

会在这个阶段被调用。

总的来说，spring的生命周期包括实例化、属性赋值、初始化、使用和销毁等阶段。在这些阶段中，开发人员可以通过配置文件或注解来对bean的行为进行控制和定制，使得病的使用更加灵活和高效。同时，Spring框架提供了很多扩展点，可以让开发人员在病生命周期的不同阶段进行自定义处理，从而实现更加复杂的功能。



## 过滤器和拦截器有什么区别？

1. 运行顺序不同：过滤器是在Servlet容器接收到请求之后，但在Servlet被调用之前运行的；

   而拦截器则是在Servlet被调用之后，但在响应被发送到客户端之前运行的。

2. 配置方式不同：

   过滤器是在web.xml中进行配置；web.xml 文件中配置 `<filter>` 和 `<filter-mapping>`,`@WebFilter`

   而拦截器的配置则是在Spring的配置文件中进行配置，或者使用注解进行配置。实现接口HandlerInterceptor

3. Filter依赖于Servlet容器，而Interceptor不依赖于Servlet容器，是springmvc

4. Filter在过滤是只能对request和response进行操作，

   而interceptor可以对request、response、handler、modelAndView、exception进行操作。


## SpringBoot自动装配原理

Spring Boot的自动装配实际上是从`META-INF/spring.factories`文件中获取到对应的需要进行自动装配的类，并生成相应的Bean对象，然后将它们交给Spring容器进行管理

在Spring Boot项目中有一个注解`@SpringBootApplication`，这个注解是对三个注解进行了封装：`@SpringBootConfiguration`、`@EnableAutoConfiguration`、`@ComponentScan`

其中`@EnableAutoConfiguration`是实现自动化配置的核心注解。

该注解通过`@Import`注解导入`AutoConfigurationImportSelector`，这个类实现了一个导入器接口`ImportSelector`。在该接口中存在一个方法`selectImports`，

该方法的返回值是一个数组，数组中存储的就是要被导入到spring容器中的类的全类名。在`AutoConfigurationImportSelector`类中重写了这个方法,
该方法内部就是读取了项目的`classpath`路径下`META-INF/spring.factories`文件中的所配置的类的全类名。
在这些配置类中所定义的Bean会根据条件注解所指定的条件来决定是否需要将其导入到Spring容器中。



## SpringMVC执行流程

1.用户发起请求，请求先被 Servlet 拦截转发给 Spring MVC 框架

2.Spring MVC 里面的 DispatcherSerlvet 核心控制器，会接收到请求并转发给HandlerMapping

3.HandlerMapping 负责解析请求，根据请求信息和配置信息找到匹配的 Controller类，不过这里如果有配置拦截器，就会按照顺序执行拦                      截器里面的 preHandle方法

4.找到匹配的 Controller 以后，把请求参数传递给 Controller 里面的方法

5.Controller 中的方法执行完以后，会返回一个 ModeAndView，这里面会包括视图名称和需要传递给视图的模型数据

6.视图解析器根据名称找到视图，然后把数据模型填充到视图里面再渲染成 Html 内容返回给客户端



## Spring用到了哪些设计模式？

**创建型模式**：

1. 单例模式(Singleton)。Spring容器默认创建的bean都是单例的，保证系统中每个 bean 只有一个实例，减少系统开销。
2. 工厂模式(Factory)。Spring 使用工厂模式来创建对象,如 BeanFactory和ApplicationContext(`ClassPathXmlApplication`)都是工厂模式的实现。

**结构型模式**：

3. 适配器模式(Adapter)。SpringMVC中的HandlerAdapter就是一个适配器模式的实现，将不同类型的处理器适配到相同的处理流程中。
4. 代理模式(Proxy)。SpringAOP就是基于代理模式实现的，通过动态代理的方式在运行时为目标对象增加额外的功能。
5. 装饰器模式(Decorator)。Spring的AOP也可以通过装饰器模式来实现，可以在运行时动态地为目标对象增加额外的功能。

**行为型模式**：

- 模板方法模式(Template Method)。Spring使用模板方法模式来实现一些固定流程的操作，如JdbcTemplate就是一个典型的模板方法模式的实现。
- 观察者模式(Observer)。Spring事件机制使用观察者模式，将事件发布者和订阅者解耦，让系统更加灵活和可扩展。

- 策略模式(Strategy)。Spring的HandlerMapping就是基于策略模式实现的，根据请求的URL来选择不同的处理策略。


## SpringAOP

 Spring AOP 核心概念

 1. 切面 (Aspect)
- **定义**：在连接点上做的一系列行为，是**通知 (Advice)** 与 **切入点 (Pointcut)** 的整合。
- **本质**：AOP 的整体封装单元，代表了横切关注点（如日志、事务、安全等）。

---

 2. 切入点 (Pointcut)
- **定义**：由多个**连接点 (Joinpoint)** 组成，使用**切点表达式**进行表达。
- **作用**：筛选符合某种规则的连接点。
- **对象化**：将多个连接点用 `Pointcut` 对象表达出来（例如：指定某一层的某个类，或某一层的全部类）。

---

 3. 连接点 (Joinpoint)
- **定义**：程序执行过程中的特定位置，在 Spring AOP 中特指**目标方法**。
- **重点**：明确具体是**哪个方法**被拦截。

---

 4. 通知 (Advice)
- **定义**：需要加入的公共程序逻辑（即要添加的具体代码）。
- **通知类型**：

| 类型 | 注解 | 说明 |
| :--- | :--- | :--- |
| **前置通知** | `@Before` | 在目标方法执行**之前**执行。<br>例：`@Before("execution(* com.woniu.controller.*.*(..))")` |
| **后置通知** | `@After` | 在目标方法执行**之后**执行（无论是否异常），类似 `finally`。 |
| **返回通知** | `@AfterReturning` | 在目标方法**成功执行并返回结果后**执行。 |
| **环绕通知** | `@Around` | 包围目标方法，可控制方法是否执行、何时执行及修改返回值。 |
| **异常通知** | `@AfterThrowing` | 在目标方法**抛出异常后**执行。 |

---

 5. 关键接口与参数

 `org.aspectj.lang.JoinPoint`
- **描述**：封装了目标方法对象的信息（如方法签名、参数、代理对象等）。
- **适用范围**：可用于 **前置通知**、**后置通知**、**返回通知** 和 **异常通知** 的方法参数中。
- **限制**：**不能**用于环绕通知（环绕通知需使用其子接口）。

 `org.aspectj.lang.ProceedingJoinPoint`
- **描述**：`JoinPoint` 的子接口，**专用于 `@Around` (环绕通知)**。
- **核心方法**：`proceed()`
  - **作用**：继续执行被通知的目标方法。
  - **重要性**：
    1. 如果没有调用 `proceed()`，目标方法将**不会被执行**。
    2. 该方法**必须返回对象**（通常是目标方法的返回值）。
    3. 如果忽略返回值，后续对返回值的赋值或处理操作将不会生效。

 环绕通知示例代码
```java
@Around("execution(* com.woniu.service.*.*(..))")
public Object aroundAdvice(ProceedingJoinPoint pjp) throws Throwable {
    // 1. 前置逻辑
    System.out.println("环绕通知：方法执行前");

    // 2. 执行目标方法 (必须调用 proceed() 并接收返回值)
    Object result = pjp.proceed();

    // 3. 后置逻辑
    System.out.println("环绕通知：方法执行后");

    // 4. 返回结果 (必须返回，否则调用方获取不到值)
    return result;
}
```


## 如何理解Spring Boot中的Starter？

Spring Boot的自动配置功能会根据项目中加入的Starter自动配置相关的Bean

Starter 组件会把对应功能的所有jar包依赖全部导入进来，避免了开发者自己去引入依赖带来的麻烦。

维护对应的jar包的版本依赖，使得开发者可以不需要去关心这些版本冲突这种容易出错的细节。

Starter组件几乎完美的体现了Spring Boot里面约定优于配置的理念。
