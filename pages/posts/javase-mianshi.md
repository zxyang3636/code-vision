---
title: Java SE面经
date: 2025-03-07
updated: 2025-03-07
categories: 面试指北
tags:
  - Java
  - 后端
  - 面经
---

# 面试指北

## Java 基础

### **==**和**equals**的区别是什么？

- ==既可以比较基本数据类型,也可以比较引用数据类型
- ==在比较基本数据类型时, 比较的是值, 在比较引用数据类型时, 比较对象的地址
- equals 只能比较引用数据类型, 比较对象中的内容是否相同, 在没有重写的情况下也是比较对象的地址

### String str="i" 与 String str=new String("i") 一样吗？

- String str="i"会将其分配到常量池中，常量池中没有重复的元素，如果常量池中存在 i，就将 i 的地址赋给变量，如果没有就创建一个再赋给变量。

- 字符串字面量，通常存储在 JVM 的字符串常量池中。常量池中没有重复的元素，如果字符串常量池中已经存在相同的字符串（例如，之前已经使用过 "i"），则不会创建新的对象，而是直接引用池中的现有对象。如果没有就创建一个再赋给变量。

- String str=new String(“i”)会将对象分配到堆中，即使内存一样，还是会重新创建一个新的对象。

### 接口和抽象类有什么区别？

- 声明方法的存在而不去实现它的类叫抽象类。接口是抽象类的变体，接口中的所有方法都是抽象的。

- 接口可以被多个类实现，而一个类只能继承一个抽象类。

- 接口中的成员变量默认为 public static final 类型，而抽象类中的成员变量可以是 public、protected、private 等各种类型。

- 接口不能包含抽象构造方法和抽象静态方法，而抽象类可以有构造方法。

- 接口中的方法只有声明，没有具体实现，实现接口的类需要提供具体的实现。
  抽象类中的方法可以有具体的实现，子类可以直接继承并使用。抽象类的子类必须为父类中的所有抽象方法提供实现，否则它自己也是抽象类
- jdk1.8 之后，接口可以使用 default 关键字，实现类是默认实现的，那个实现类需要使用，再具体实现就可以
- 抽象类与接口都不能被实例化，但是可以指向具体的子类的实例

### String 有哪些常用方法？

1. equals
2. contains
3. trim
4. getBytes
5. toUpperCase
6. toLowerCase
7. replace
8. indexOf
9. substring
10. startWith

### 什么是反射？

> 反射就是动态加载对象，并对对象进行剖析，通过 class、constructor、field、method 四个方法，获取一个类的各个组成部分。

> 对于任意一个类，都能够知道这个类的所有属性和方法；对于任意一个对象，都能够调用它的任意一个方法，这种动态获取信息以及动态调用对象方法的功能称为 Java 反射机制。

### 反射获取实例对象的方式

1. 使用 Class 类的静态方法 forName()

使用 Class.forName()

2. 通过的类的 class 属性获得该类的 Class 实例

类名.Class

3. 利用对象调用 getClass()方法获得对象的 Class 实例

对象.getClass()

4. 基本数据类型封装，可以用 TYPE 属性获得对应数据类型的 Class 实例

封装类.TYPE

### JDK 代理与 CGLIB 代理的区别

- 使用 JDK 代理的委托类对象必须基于接口，目标类必须实现至少一个接口；使用 CGLib 代理的委托对象不需要实现接口
- CGLib 通过生成目标类的子类来实现代理， 有一些限制不能代理 final 类、不能代理 final 方法
- CGLib 第一次加载较慢，因为需要生成子类
- JDK 代理是 Java 原生支持不需要依赖, CGLib 通过继承方式代理 需要依赖 jar 包
  :::info
  Spring 会根据情况自动选择代理方式：
  1. 如果目标类实现了接口，默认使用 JDK 动态代理
  2. 如果目标类没有实现接口，使用 CGLib
     :::

**JDK 代理**
:::tip
JDK 内置的 Proxy 动态代理通过反射机制在运行时动态地创建代理类。被代理的类必须实现接口，未实现接口则没办法完成动态代理。JDK 代理的核心是`Proxy`类和`InvocationHandler`接口。`Proxy`类通过调用其静态方法`newProxyInstance()`来返回代理对象，而`InvocationHandler`接口中的`invoke`方法则使用反射在目标对象上调用方法并传入参数。
:::

**CGLIB 代理**
:::tip
CGLIB 在运行时动态生成被代理类的子类，并重写父类中的方法来实现代理功能。cglib 可以在运行时动态生成字节码，cglib 继承被代理的类，重写方法，织入通知，动态生成字节码并运行，通过 `MethodInterceptor` 接口来实现方法调用的拦截，重写 intercept，在调用方法的前后织入横切内容。

使用 cglib 可以实现动态代理，即使被代理的类没有实现接口，但被代理的类必须不是 final 类。
:::
可以看看这篇文章
[为什么需要代理模式](https://www.cnblogs.com/best/p/5679656.html#_label0)

### throw 和 throws 的区别？

- **throw**：
  throw 语句用在方法体内，表示抛出异常，由方法体内的语句处理。
- throw 是具体向外抛出异常的动作，所以它抛出的是一个异常实例对象(任何 `Throwable` 类型的实例)，执行 throw 一定是抛出了某种异常。该语句后面的代码将不成执行
- **throws**：
  throws 语句是用在方法声明后面，表示如果抛出异常，由该方法的调用者来进行异常的处理。
- throws 主要是声明这个方法会抛出某种类型的异常(只能声明 `Exception` 类型及其子类的异常)，让它的使用者要知道需要捕获的异常的类型。throws 表示出现异常的一种可能性，并不一定会发生这种异常。

### final、finally、finalize 有什么区别？

- final 可以修饰类，变量，方法，修饰的类不能被继承，修饰的变量不能重新赋值，修饰的方法不能被重写
- finally 是异常处理语句结构的一部分，表示总是执行。常用于一些流的关闭。
- finalize 是 Object 类的一个方法，当对象被垃圾回收器（GC）回收之前，会调用此方法。Java 9 后标记为废弃（@Deprecated），不推荐使用。有更好的替代方案（AutoCloseable，try-with-resources ，Cleaner）

### 常见的异常类有哪些？

运行时异常：

- ArithmeticException（算术异常）
- ClassCastException （类转换异常）
- IllegalArgumentException （非法参数异常）
- IndexOutOfBoundsException （下标越界异常）
- NullPointerException （空指针异常）
- ArrayStoreException：试图将错误类型的对象存储到一个对象数组时抛出的异常；
- SecurityException （安全异常）

受检异常(编译时异常)：

- SQLException 提供有关数据库访问错误或其他错误的信息的异常。
- IOException 表示发生了某种 I / O 异常的信号。此类是由失败或中断的 I / O 操作产生的
- FileNotFoundException 当试图打开指定路径名表示的文件失败时，抛出此异常。
- ClassNotFoundException 找不到具有指定名称的类的定义。
- NoSuchMethodException：无法找到某一方法时，抛出；
- EOFException 当输入过程中意外到达文件或流的末尾时，抛出此异常。

:::tip
受检异常在编译时需要被处理，‌ 即要么使用 try-catch 块捕获，‌ 要么在方法签名中使用 throws 关键字声明可能抛出的异常
:::

### String、StringBuffer、StringBuilder 区别？

第一个：可变性
String 内部的 value 值是 final 修饰的，所以它是不可变类。所以每次修改 String 的值，都会产生一个新的对象。
StringBuffer 和 StringBuilder 是可变类，字符串的变更不会产生新的对象。

第二个：线程安全性
String 是不可变类，所以它是线程安全的。
StringBuffer 是线程安全的，因为它每个操作方法都加了 synchronized 同步关键字。
StringBuilder 不是线程安全的。
所以在多线程环境下对字符串进行操作，应该使用 StringBuffer，否则使用 StringBuilder

第三个：性能方面
String 的性能是最的低的，因为不可变意味着在做字符串拼接和修改的时候，需要重新创建新的对象以及分配内存。
其次是 StringBuffer 要比 String 性能高，因为它的可变性使得字符串可以直接被修改最后是
StringBuilder，它比 StringBuffer 的性能高，因为 StringBuffer 加了同步锁。

第四个：存储方面
String 存储在字符串常量池里面
StringBuffer 和 StringBuilder 存储在堆内存空间。

### 在 Java 中，什么时候用重载，什么时候用重写？

- 重载是多态的集中体现，要以统一的方式处理不同类型数据的时候，可以用重载

- 是建立在继承关系上的，子类在继承父类的基础上，增加新的功能，可以用重写

### 重写、重载规则？

方法重载的规则？

- 方法名一致，参数列表中参数的**顺序**，**类型**，**个数**不同。
- 重载与方法的**返回值**(返回类型)无关，存在于父类和子类，同类中。
- 可以抛出不同的**异常**。
- 可以有不同**修饰符**。

方法重写的规则？

- 参数列表、方法名、返回值类型必须完全一致，**构造方法**不能被重写；
- 声明为 **final** 的方法不能被重写；
- 声明为 **static** 的方法不存在重写(重写和多态联合才有意义);
- **访问权限**不能比父类更低;
- 重写之后的方法不能抛出更宽泛的**异常**
- 子类无法重写父类的私有**private**方法

### 实例化对象有哪几种方式

new

clone()

通过反射机制创建

序列化反序列化 将一个对象实例化后，进行序列化，再反序列化，也可以获得一个对象

### List 与 Set 区别

List,Set 都是继承自 Collection 接口

- List 特点：元素有放入顺序，元素可重复
  List: 和数组类似，List 可以动态增长，查找元素效率高，插入删除元素效率低，因为会引起其他元素位置改变。

- Set 特点：元素无放入顺序，元素不可重复，重复元素会覆盖掉，（元素虽然无放入顺序，但是元素在 set 中的位置是有该元素的 HashCode 决定的，其位置其实是固定的，加入 Set 的 Object 必须定义 equals()方法，Set 检索元素效率低下，删除和插入效率高，插入和删除不会引起元素位置改变。

另外 list 支持 for 循环，也就是通过下标来遍历，也可以用迭代器，但是 set 只能用迭代，因为他无序，无法用下标来取得想要的值。

### 说出 ArrayList，Vector， LinkedList 的存储性能和特性？

- `ArrayList` 和 `Vector` 都是使用数组方式存储数据，此数组元素数大于实际存储的数据以便增加和插入元素，它们都允许直接按序号索引元素，但是插入元素要涉及数组元素移动等内存操作，所以索引数据快而插入数据慢，Vector 由于使用了 `synchronized` 方法（线程安全），通常性能上较 ArrayList 差
- 而 LinkedList 使用双向链表实现存储，按序号索引数据需要进行前向或后向遍历，但是插入数据时只需要记录本项的前后项即可，所以插入速度较快。

### HashTable 和 HashMap 的区别？

- `HashTable` 线程安全，`HashMap` 非线程安全。`HashTable`由于其线程安全性，性能略低于 `HashMap`
- HashTable 使用数组加链表、HashMap 采用了数组+链表+红黑树
- HashMap 初始容量是 16、HashTable 初始容量是 11。
- HashTable 不允许 null 值(key 和 value 都不可以)，HashMap 允许 null 值(key 和 value 都可以)。
- 两者的遍历方式大同小异，HashTable 仅仅比 HashMap 多一个 elements 方法。

### ArrayList 源码分析？

`ArrayList` 是一种变长的集合类，基于定长数组实现，在构造 ArrayList 时，如果没有指定容量，那么内部会构造一个空数组，使用默认构造方法初始化出来的容量是 10，如果指定了容量，那么就构造出对应容量大小的数组,
在添加元素时，会先判断数组容量是否足够，如果不够则会扩容，扩容按原长度的 1.5 倍扩容，容量足够后，再把元素添加到数组中
在添加元素时，如果指定了下标，先检查下标是否越界，然后再确认数组容量是否足够，不够则扩容，然后再把新元索添加到 指定位置，如果该位置后面有元素则后移;

由于 ArrayList 底层基于数组实现，所以其可以保证在 O(1) 复杂度下完成随机查找操作。

ArrayList 是非线程安全类，并发环境下，多个线程同时访问同一个 ArrayList 集合时，如果两个或两个以上的线程修改了 ArrayList 集合，会引发不可预知的异常或错误，则必须手动保证该集合的同步性

删除和插入需要复制数组，性能差（可以使用 LinkindList），顺序添加很方便

### 你为什么重写 equals 时必须重写 hashCode 方法？

主要影响在基于哈希的集合类（HashMap, HashSet 等）

集合类（如 HashMap 和 HashSet）依赖 hashCode 和 equals 来实现高效的存储和查找功能：

HashMap 的工作流程：

1. 当插入一个键值对时，HashMap 会根据键的 hashCode 值计算出存储位置（桶的位置），确定数组下标。
2. 如果该位置已经有其他键存在，则通过 equals 方法比较这些键是否相等。
3. 如果相等，则覆盖旧值；如果不相等，则将新键值对添加到链表或红黑树中。

问题是如果你重写了 equals 方法但没有重写 hashCode 方法，可能会导致以下问题：
两个对象通过 equals 方法被认为是相等的，但它们的 hashCode 值不同，在 HashMap 中会被当作不同的 key。
这会导致 HashMap 或 HashSet 无法正确找到这些对象，因为它们被存储在了不同的桶中。集合类将无法正确工作。

总的来说目的就是：保证同一个对象。如果重写了 equals 方法，而没有重写 hashcode 方法，会出现 equals 相等的对象，hashcode 不相等的情况，重写 hashcode 方法就是为了避免这种情况的出现。保证了在使用 Hash 相关的集合类时能够正常工作。

hashCode() 的作用是获取哈希码，也称为散列码；它实际上是返回一个 int 整数。这个哈希码的作用是确定该对象在哈希表中的索引位置。如果两个对象相等，则 hashcode 一定也是相同的，如果两个对象相等,对两个对象分别调用 equals 方法都返回 true

如果两个对象有相同的 hashcode 值，它们也不一定是相等的。因此，equals 方法被覆盖过，则 hashCode 方法也必须被覆盖。hashCode()的默认行为是对堆上的对象产生独特值。如果没有重写 hashCode()，则该 class 的两个对象无论如何都不会相等(即使这两个对象指向相同的数据).
<br>
<br>

### HashSet 的底层实现是什么？

`HashSet` 的实现是依赖于 HashMap 的，HashSet 的值都是存储在 HashMap 中的。在 HashSet 的构造法中会初始化一个 HashMap 对象，HashSet 不允许值重复。
因此，HashSet 的值是作为 HashMap 的 key 存储在 HashMap 中的，当存储的值已经存在时返回 false。利用 `HashMap` 的键来保证 HashSet 中元素的唯一性
<br>
<br>

### HashSet 和 TreeSet 有什么区别？

- HashSet 是由一个 hash 表来实现的，因此，它的元素是无序的。add()，remove()，contains()方法的时间复杂度是 O(1)。
- TreeSet 是由一个树形的结构来实现的，它里面的元素是有序的。因此，add()，remove()，contains()方法的时间复杂度是 O(log n)。
  <br>
  <br>

### 说一下 HashMap 的实现原理？

首先，HashMap 基于 map 接口，元素以键值对方式存储，允许有 null 值，HashMap 是线程不安全的。

JDK1.7 中采用数组+链表的存储形式。
HashMap 采取 Entry 数组来存储 key-value，每一个键值对组成了一个 Entry 实体，Entry 类实际上是一个单向的链表结构，它具有 next 指针，指向下一个 Entry 实体，以此来解决 Hash 冲突的问题。

HashMap 实现一个内部类 Entry，重要的属性有 hash、key、value、next。

JDK1.8 中采用数组+链表+红黑树的存储形式。当链表长度超过阈值（8）时，数组长度超过 64 时，将链表转换为红黑树。在性能上进一步得到提升。 链表的查询速度不如红黑树快，红黑树查询速度快。

**扩容机制**

扩容发生在`HashMap`的元素数量超过了当前容量与负载因子（load factor）的乘积时，`HashMap`的默认负载因子是 0.75，这意味着当`HashMap`的元素数量达到容量的 75%时，就会触发扩容。

`HashMap`的扩容机制是其设计中非常关键的部分，主要目的是为了保持哈希表的性能，避免过多的哈希冲突。`HashMap`在 Java 中默认的初始容量是 16，这是一个 2 的幂次方。每次扩容时，新的容量会是当前容量的两倍，而且新的容量仍然是 2 的幂次方。

**为啥是 2 的幂次方？**

使用位运算代替取模运算，提高了效率。`HashMap`会使用位与运算（&）来代替取模运算（%），因为位与运算比取模运算快得多。

2 的幂次方的容量可以保证哈希值的低位尽可能多地参与计算，从而更均匀地分布键值对，减少哈希冲突。

<br>
<br>

### 如何去掉 list 集合中重复的元素

- 双重 for 循环去重

  使用两个 for 循环遍历集合所有元素，然后进行判断是否有相同元素

- HashSet 去重

  HashSet 可以去重，把 List 集合所有元素存入 HashSet 对象，接着把 List 集合元素全部清空，最后把 HashSet 对象元素全部添加至 List 集合中，这样就可以保证不出现重复元素

- Java8 中 Stream 提供了对 List 做简单去重的处理，通过调用 distinct 方法，可以实现对
  类型 Integer、Long、Char 等基本类型以及 String 类型的去重。需要注意的是，无法对自定义对象进行去重处理

<br>
<br>

### Comparable 和 Comparator 接口的区别？

- Comparable 接口只包含一个 compareTo()方法。这个方法用于比较当前对象与指定对象的顺序。返回值：负整数：当前对象小于指定对象。零：当前对象等于指定对象。正整数：当前对象大于指定对象。
- Comparator 接口包含 compare()和 equals()两个方法。

位置：

- Comparable(java.lang)在要比较的类上实现实现该接口。
- Comparator(java.util)在要比较的类外部实现该接口。

用法：

- Comparable 用法是在比较的类上实现该接口，重写 compareTo 方法，使用 `Collections.sort(list)`传入需要比较的对象集合
- Comparator 用法是可以在外部直接使用，使用`Collections.sort(list, comparator)`传入需要比较的集合与 Comparator 比较规则对象

应用场景：

- Comparable 只能定义一种排序规则,当一个类需要定义其自然排序规则时，可以实现 Comparable 接口。需要修改类的源码
- Comparator 可以定义多种排序规则，而无需修改类的源码。

:::tip

自然顺序是指按照元素的自然顺序（如数字 0 到 9，或字符'a'到'z'）进行排序。

对于 String 类，默认按字典顺序排序。
对于 Integer 类，默认按数值大小排序。

当一个类实现了 Comparable 接口时，它通过 compareTo 方法定义了自身的自然排序规则。这个规则是固定的，不能动态更改。
:::

<br>
<br>

### 集合数据排序的常用方法

1. 使用`Collections.sort`

   sort()方法有两个重载方法：一个参数和两个参数。如果只传入待排序的集合，则默认按照自然排序（升序）对集合中的数据进行排序；

   如果传入待排序的集合和一个比较器(Comparator)，则按照该比较器的排序规则对集合中的数据进行排序

   先对要排序的类实现 Comparable 接口，类中重写 compareTo()方法。在 main 函数中，调用 Collections 工具类.sort 方法，将要排序的集合传进去

   在 Collections.sort(list,Comparator) 直接传 Comparator 匿名函数

2. `List.sort()`使用 List 接口自带的 sort 方法，在 sort 中实现 Comparator 方法

   sort()方法只有一种使用方式，必须传入一个比较器作为参数才能使用

3. `Stream.sorted()`

   sorted()方法有两个重载方法：有参和无参。如果不传参数，则默认按照自然排序（升序）对集合中的数据进行排序；

   如果传入一个比较器作为参数，则按照该比较器的排序规则对集合中的数据进行排序

```java
// 自然序排序一个list
list.stream().sorted()

// 自然序逆序元素，使用Comparator 提供的reverseOrder() 方法
list.stream().sorted(Comparator.reverseOrder())
```

4. `Arrays.sort()`

   sort()方法有多个重载方法，其中入参分为两种：一个参数和两个参数。 该方法只能对数组进行排序，不能直接对集合排序，因此要将待排序的集合转成数组`Collections.toArray()`。

   如果只传入待排序的数组，则默认按照自然排序（升序）对数组中的数据进行排序；

   如果传入待排序的数组和一个比较器，则按照该比较器的排序规则对数组中的数据进行排序

5. 你可以使用有序集合，如 TreeSet 或 TreeMap，你也可以使用有顺序的的集合，如 list

<br>
<br>

### 集合实现交集并集

**实现交集（Intersection）指两个集合中都包含的元素。**

要实现两个集合的交集，你可以遍历一个集合，并检查元素是否存在于另一个集合中。如果存在，则将其添加到新的集合中。这里使用`retainAll`方法来实现交集。

```java
import java.util.HashSet;
import java.util.Set;

public class IntersectionExample {
    public static void main(String[] args) {
        Set<Integer> set1 = new HashSet<>();
        Set<Integer> set2 = new HashSet<>();

        // 添加元素到 set1
        set1.add(1);
        set1.add(2);
        set1.add(3);
        set1.add(4);

        // 添加元素到 set2
        set2.add(3);
        set2.add(4);
        set2.add(5);
        set2.add(6);

        // 使用 retainAll 方法计算交集
        set1.retainAll(set2);

        // 输出交集
        System.out.println("交集: " + set1);
    }
}
```

**实现并集（Union）两个集合都有的**

要实现两个集合的并集，你可以将一个集合的内容复制到另一个集合中，这样第二个集合将包含两个集合的所有元素。这里使用`addAll`方法来实现并集。

```java
import java.util.HashSet;
import java.util.Set;

public class UnionExample {
    public static void main(String[] args) {
        Set<Integer> set1 = new HashSet<>();
        Set<Integer> set2 = new HashSet<>();

        // 添加元素到 set1
        set1.add(1);
        set1.add(2);
        set1.add(3);
        set1.add(4);

        // 添加元素到 set2
        set2.add(3);
        set2.add(4);
        set2.add(5);
        set2.add(6);

        // 使用 addAll 方法计算并集
        set2.addAll(set1);

        // 输出并集
        System.out.println("并集: " + set2);
    }
}

```

<br>
<br>

### HashMap 遍历方式

```java
Map<String, Integer> map = new HashMap<>();
map.put("one", 1);
map.put("two", 2);
map.put("three", 3);

map.forEach((k, v) -> {
    System.out.println(k + " " + v);
});

map.entrySet().stream().forEach(entry -> {
    System.out.println(entry.getKey() + " " + entry.getValue());
});

Iterator<Map.Entry<String, Integer>> iterator = map.entrySet().iterator();
while (iterator.hasNext()) {
    Map.Entry<String, Integer> next = iterator.next();
    System.out.println(next.getKey() + " " + next.getValue());
}
```

```java
 Map<String, Integer> map = new HashMap<>();
map.put("Alice", 25);
map.put("Bob", 30);
map.put("Charlie", 35);

// 使用 entrySet 遍历键值对
for (Map.Entry<String, Integer> entry : map.entrySet()) {
    System.out.println("Key: " + entry.getKey() + ", Value: " + entry.getValue());
}
```

<br>
<br>

### 成员变量和局部变量的区别有哪些？

- 从**语法**形式上，看成员变量是属于类的，而局部变量是在方法中定义的变量或是方法的参数；成员变量可以被 public,private,static 等修饰符所修饰，而局部变量不能被访问控制修饰符及 static 所修饰；成员变量和局部变量都能被 final 所修饰；
- 从变量在内存中的**存储**方式来看，成员变量是对象的一部分，而对象存在于堆内存，局部变量存在于栈内存
- 从变量在内存中的**生存时间**上看，成员变量是对象的一部分，它随着对象的创建而存在，而局部变量随着方法的调用而自动消失。
- 成员变量如果没有被**赋初值**，则会自动以类型的默认值而赋值(一种情况例外被 final 修饰但没有被 static 修饰的成员变量必须显示地赋值); 而局部变量则不会自动赋值。

<br>
<br>

### 是否可以在 static 环境中访问非 static 变量？

static 变量在 Java 中是属于类的，它在所有的实例中的值是一样的。当类被 Java 虚拟机载入的时候，会对 static 变量进行初始化。(而非 static 变量（实例变量）是属于对象的，它们在对象被创建时才被分配内存) 如果你的代码尝试不用实例来访问非 static 的变量，编译器会报错，因为这些变量还没有被创建出来，还没有跟任何实例关联上。

<br>
<br>

## 并发编程

### 什么是线程安全？如何保证线程安全？

在多线程环境下，线程安全是指多个线程访问共享数据时，不会出现数据错误或不一致的情况。要保证线程安全，可以采用同步机制，比如使用 synchronized 关键字或 Lock 接口来保护共享数据的访问，或者使用线程安全的数据结构，比如 ConcurrentHashMap、CopyOnWriteArrayList。

或使用线程局部变量（ThreadLocal）

或使用原子类（Atomic Classes）如 AtomicInteger、AtomicLong 等

<br>
<br>

### 说说线程有几种创建方式？

1. 继承 Thread
2. 实现 Runnable
3. 实现 Callable
4. 使用线程池

- 定义一个类继承 Thread。
  重写 run() 方法，编写线程需要执行的任务。
  创建该类的实例并调用 start() 方法启动线程。

  不推荐使用，因为 Java 是单继承语言，继承 Thread 后无法再继承其他类。

```java
class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("线程运行：" + Thread.currentThread().getName());
    }
}

public class Main {
    public static void main(String[] args) {
        MyThread thread = new MyThread();
        thread.start(); // 启动线程
    }
}
```

- 定义一个类实现 Runnable 接口。
  实现 run() 方法，编写线程需要执行的任务。
  将该类的实例传递给 Thread 的构造器，并调用 start() 方法启动线程。

  更灵活，避免了单继承的限制。

```java
class MyRunnable implements Runnable {
    @Override
    public void run() {
        System.out.println("线程运行：" + Thread.currentThread().getName());
    }
}

public class Main {
    public static void main(String[] args) {
        Thread thread = new Thread(new MyRunnable());
        thread.start(); // 启动线程
    }
}
```

- 定义一个类实现 `Callable<V>` 接口，指定泛型类型 V 表示返回值类型。

  实现 call() 方法，编写线程需要执行的任务并返回结果。

  使用 FutureTask 包装 Callable 对象，并将 FutureTask 传递给 Thread 的构造器。

  调用 start() 方法启动线程，并通过 FutureTask.get() 获取返回值。

```java
import java.util.concurrent.Callable;
import java.util.concurrent.FutureTask;

class MyCallable implements Callable<Integer> {
    @Override
    public Integer call() throws Exception {
        System.out.println("线程运行：" + Thread.currentThread().getName());
        return 42; // 返回结果
    }
}

public class Main {
    public static void main(String[] args) throws Exception {
        FutureTask<Integer> futureTask = new FutureTask<>(new MyCallable());
        Thread thread = new Thread(futureTask);
        thread.start(); // 启动线程

        // 获取线程返回值
        Integer result = futureTask.get();
        System.out.println("线程返回值：" + result);
    }
}
```

- 使用 Executors 工具类创建线程池。
  提交任务（Runnable 或 Callable）到线程池中。
  线程池会自动分配线程执行任务。

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class Main {
    public static void main(String[] args) {
        ExecutorService executor = Executors.newFixedThreadPool(2); // 创建固定大小的线程池

        // 提交任务
        executor.submit(() -> {
            System.out.println("线程运行：" + Thread.currentThread().getName());
        });

        executor.shutdown(); // 关闭线程池
    }
}
```

<br>
<br>

### 进程与线程

进程是系统分配和调度资源的基本单位，每个进程都有自己的独立内存空间。

线程是进程中的一个执行单元，是进程中的一个可调度的实体。一个进程可以包含多个线程，这些线程共享进程的资源，如内存空间。

<br>
<br>

### 并行与并发

并行是指多个任务在同一时刻同时执行。

并发是指多个任务在一段时间内交替执行。

<br>
<br>

### 线程有几种状态？

- **NEW**新建状态：线程对象已经被创建，但是尚未启动。
- **RUNNABLE 就绪状态**(不停的抢 cpu 执行权):线程正在运行，或者准备好运行。
- **BLOCKED 阻塞状态**：无法获得锁对象，线程等待获得一个排他锁才能继续运行。
- **WAITING 等待状态**：线程等待另一个线程的动作（例如调用 notify() 方法）。
- **TIMED_WAITING 计时等待**：线程等待某个条件发生，或者等待的时间到了就会自动(返回)恢复。比如 sleep()方法
- **TERMINATED 结束状态**：线程已经终止。

<br>
<br>

### 谈谈你对 AQS 的理解

`AbstractQueuedSynchronizer`

AQS 是多线程同步器，它是 J.U.C 包中多个组件的底层实现，是许多同步工具类的基础，如 Lock、CountDownLatch、Semaphore 等都用到了 AQS.

从本质上来说，AQS 提供了两种锁机制，分别是排它锁和共享锁。

排它锁，就是存在多线程竞争同一共享资源时，同一时刻只允许一个线程访问该共享资源，也就是多个线程中只能有一个线程获得锁资源，比如 Lock 中的 ReentrantLock，重入锁实现就是用到了 AQS 中的排它锁功能。

共享锁也称为读锁，就是在同一时刻允许多个线程同时获得锁资源，比如 CountDownLatch 和 Semaphore 都是用到了 AQS 中的共享锁功能。

<br>
<br>

### 请谈谈 AQS 是怎么回事儿？

`AQS` 它是 `J.U.C` 这个包里面非常核心的一个抽象类，它为多线程访问共享资源提供了一个队列同步器。
在 J.U.C 这个包里面，很多组件都依赖 AQS 实现线程的同步和唤醒，比如 `Lock`、`Semaphore`、`CountDownLatch` 等等。
AQS 内部由两个核心部分组成：

- 一个 `volatile` 修饰的 state 变量，作为一个竞态条件
- 用双向链表结构维护的 FIFO 线程等待队列

它的具体工作原理是，多个线程通过对这个 state 共享变量进行修改来实现竞态条件，
竞争失败的线程加入到 `FIFO` 队列并且阻塞，抢占到竞态资源的线程释放之后，后续的线程按照 FIFO 顺序实现有序唤醒。

AQS 里面提供了两种资源共享方式，一种是独占资源，同一个时刻只能有一个线程获得竞态资源。
比如 ReentrantLock 就是使用这种方式实现排他锁。
另一种是共享资源，同一个时刻，多个线程可以同时获得竞态资源。
`CountDownLatch` 或者 `Semaphore` 就是使用共享资源的方式，实现同时唤醒多个线程。
<br>
<br>

### lock 和 synchronized 区别

- 从功能角度来看：Lock 和 Synchronized 都是 Java 中用来解决线程安全问题的工具。
- 从特性来看:Synchronized 是 Java 中的同步关键字; Lock 是 J.U.C 包中提供的接口，这个接口有很多实现类，其中就包括 ReentrantLock 重入锁。

1. **_锁的力度_**

Synchronized 可以通过两种方式来控制锁的粒度,一种是把 synchronized 关键字修饰在方法层面，另一种是修饰在代码块上，并且我们可以通过 Synchronized(锁定特定的对象)加锁对象的声明周期来控制锁的作用范围，比如锁对象是静态对象或者类对象，那么这个锁就是全局锁。
如果锁对象是普通实例对象，那这个锁的范围取决于这个实例的声明周期。

Lock 锁的粒度是通过它里面提供的 lock()和 unlock()方法决定的，包裹在这两个方法之间的代码能够保证线程安全性。而锁的作用域取决于 Lock 实例的生命周期。

2. **_灵活性与非阻塞竞争锁_**

Lock 比 Synchronized 的灵活性更高，Lock 可以自主决定什么时候加锁，什么时候释放锁，只需要调用 lock()和 unlock()这两个方法就行，同时 Lock 还提供了非阻塞的竞争锁方法 tryLock()方法，这个方法通过返回 true/false 来告诉当前线程是否已经有其他线程正在使用锁。

Synchronized 由于是关键字，所以它无法实现非阻塞竞争锁的方法，另外，Synchronized 锁的释放是被动的，就是当 Synchronized 同步代码块执行完以后或者代码出现异常时才会释放。

3. **_公平锁与非公平锁_**

Lock 提供了公平锁和非公平锁的机制，

公平锁是指线程竞争锁资源时，如果已经有其他线程正在排队等待锁释放，那么当前竞争锁资源的线程无法插队。

而非公平锁，就是不管是否有线程在排队等待锁，它都会尝试去竞争一次锁。

Synchronized 只提供了一种非公平锁的实现。

- 从**_性能方面_**来看，Synchronized 和 Lock 在性能方面相差不大，在实现上会有一些区别，Synchronized 引入了偏向锁、轻量级锁、重量级锁以及锁升级的方式来优化加锁的性能，而 Lock 中则用到了自旋锁的方式来实现性能优化。

<br>
<br>

### 怎么理解线程安全？说说你对原子性、可见性、有序性的理解？

在多线程环境下，线程安全是指多个线程访问共享数据时，不会出现数据错误或不一致的情况。

原子性、有序性、可见性是并发编程中非常重要的基础概念，JMM 的很多技术都是围绕着这三大特性展开。

- **原子性**：原子性指的是一个操作是不可分割、不可中断的，要么全部执行并且执行的过程不会被任何因素打断，要么就全不执行。
- **可见性**：可见性指的是一个线程修改了某一个共享变量的值时，其它线程能够立即知道这个修改。
- **有序性**：有序性指的是对于一个线程的执行代码，从前往后依次执行，单线程下可以认为程序是有序的，但是并发时有可能会发生指令重排。

<br>
<br>

### 原子性、可见性、有序性都应该怎么保证呢？

- 原子性：JMM 只能保证基本的原子性，如果要保证一个代码块的原子性，需要使用 synchronized。
- 可见性：Java 是利用 volatile 关键字来保证可见性的，除此之外，final 和 synchronized 也能保证可见性。
- 有序性：synchronized 或者 volatile 都可以保证多线程之间操作的有序性。
  <br>
  <br>

### 能谈一下 CAS 机制吗？悲观锁？乐观锁？

CAS 是 `compare and swap` 的缩写，即我们所说的比较交换。

CAS 是一种基于锁的操作，而且是乐观锁。在 java 中锁分为乐观锁和悲观锁。

**悲观锁**认为自己在使用数据的时候一定有别的线程来修改数据，因此在获取数据的时候会先加锁，确保数据不会被别的线程修改。Java 中，synchronized 关键字和 Lock 的实现类都是悲观锁。悲观锁是将资源锁住，等一个之前获得锁的线程释放锁之后，下一个线程才可以访问。

而**乐观锁**采取了一种宽泛的态度，乐观锁认为自己在使用数据时不会有别的线程修改数据，所以不会添加锁，只是在更新数据的时候去判断之前有没有别的线程更新了这个数据。如果这个数据没有被更新，当前线程将自己修改的数据成功写入。如果数据已经被其他线程更新，则根据不同的实现方式执行不同的操作，比如通过给更新记录加 version 来获取数据，性能较悲观锁有很大的提高。

CAS 操作包含三个操作数 —— 内存位置（V）、预期原值（A）和新值(B)。如果内存地址里面的值和 A 的值是一样的，那么就将内存里面的值更新成 B。CAS 是通过无限循环来获取数据的，若果在第一轮循环中，a 线程获取地址里面的值被 b 线程修改了，那么 a 线程需要自旋，到下次循环才有可能机会执行。

`java.util.concurrent.atomic`包下的类大多是使用 CAS 操作来实现的，比如`AtomicInteger,AtomicBoolean,AtomicLong`。

  <br>
  <br>

### **CAS 的问题**

**1、CAS 容易造成 ABA 问题**

ABA 问题指的是这样一个场景：线程 A 读取了一个值 A，然后线程 B 将这个值改为 B 再改回 A，这时线程 A 再次检查值时发现它依然是 A，CAS 操作认为没有变化，但实际上已经发生了改变，这可能导致数据的一致性问题。

- 解决方案: 可以使用版本号标识，每操作一次 version 加 1。在 CAS 操作时，除了检查值本身外，还要检查版本号是否发生变化。

- 在 java5 中，已经提供了 `AtomicStampedReference` 来解决问题。

**2、不能保证代码块的原子性**

CAS 机制所保证的只是一个变量的原子性操作，而不能保证整个代码块的原子性。

比如需要保证 3 个变量共同进行原子性的更新，就不得不使用 `synchronized` 了。

3. **循环时间长开销大**

CAS 操作如果长时间不成功，会导致其一直自旋，给 CPU 带来非常大的开销。

<br>
<br>

### volatile 关键字有什么用？它的实现原理是什么？

volatile 关键字有两个作用：

1. 可以保证在多线程环境下共享变量的可见性。

指当某一个线程对共享变量的修改，其他线程可以立刻看到修改之后的值。普通变量在多线程环境下可能会被缓存在线程的本地内存中（如 CPU 缓存），导致其他线程无法及时感知变量的变化。而 volatile 变量会强制将修改后的值刷新到主内存，并通知其他线程重新读取主内存中的最新值。

2. 通过增加内存屏障防止多个指令之间的重排序。

所谓重排序，就是指令的编写顺序和执行顺序不一致，在多线程环境下导致可见性问题。因为编译器或处理器为了优化性能，可能会对指令进行重排序。volatile 通过插入内存屏障（Memory Barrier）来防止这种重排序。

<br>
<br>

### **sleep 方法和 wait 方法有什么区别?**

- sleep() 方法可以在任何地方使用，而 wait() 方法只能在同步块或同步方法中使用。

- sleep() 方法不会释放锁，即使它在同步块或同步方法中使用。而 wait() 方法会释放锁。

- sleep()方法中断后可以继续执行，而 wait()方法中断后不会继续执行，除非再次被唤醒。

<br>
<br>

### wait 和 notify 这个为什么要在 synchronized 代码块中？

确保唤醒的线程是目标线程：notify 方法用于唤醒等待在该对象监视器上的其他线程，但只有处于等待状态的线程才能被唤醒。如果在调用 wait 方法时，线程不处于等待状态，那么调用 notify 方法将不会有任何效果。因此，需要将相关代码放在 synchronized 代码块中，以确保调用 wait 和 notify 方法的线程是等待状态的线程。

<br>
<br>

### 造成死锁原因？

_是多个线程涉及到多个锁，这些锁存在着交叉，所以可能会导致了一个锁依赖的闭环。_

**循环等待**

线程在获得了锁 A 并且没有释放的情况下去申请锁 B，这时，另一个线程已经获得了锁 B，在释放锁 B 之前又要先获得锁 A，因此闭环发生，陷入死锁循环。

<br>
<br>

### 避免死锁

**使用锁超时**：**使用 `tryLock()` 方法**（来自 `java.util.concurrent.locks.Lock` 接口）来尝试获取锁，如果在指定时间内未能获取锁，则放弃尝试，做其它事情，避免无限期等待。

**避免嵌套锁**：如果在一个线程中已经持有一个锁，然后尝试获取第二个锁，那么就有可能发生死锁。因此，应该尽量避免在持有锁的同时请求其他锁。

**锁顺序**：如果必须获取多个锁，那么要确保所有的线程都按照相同的顺序来获取锁。这样可以防止<span class="marker-evy">循环等待</span>条件的发生，这是死锁的一个必要条件。
