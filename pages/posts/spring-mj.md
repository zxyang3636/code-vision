---
title: Spring面经
date: 2025-03-07
updated: 2025-03-07
categories: 面试指北
tags:
  - Spring
  - SpringBoot
  - 面经
---


# Spring

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
