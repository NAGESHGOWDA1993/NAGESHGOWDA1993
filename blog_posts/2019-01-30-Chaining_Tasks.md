START_META
DATE: 2019-01-30
TITLE: Chaining Tasks
END_META


The __await__ keyword makes it very easy for us to call multiple async methods from within a single method.  For example

```c#
static async Task Main(string[] args)
{
    if (File.Exists("Log.txt")) File.Delete("Log.txt");

    File.AppendAllText("Log.txt", "Start\r\n");

    var a = await A(1);
    var b = await B(a);
    var c = await C(b);


    File.AppendAllText("Log.txt", $"C is {c}\r\n");
}

public static async Task<int> A(int value)
{
    await File.AppendAllTextAsync("Log.txt", "Method A\r\n");
    return value + 1;
}

public static async Task<int> B(int value)
{
    await File.AppendAllTextAsync("Log.txt", "Method B\r\n");
    return value + 1;
}

public static async Task<int> C(int value)
{
    await File.AppendAllTextAsync("Log.txt", "Method C\r\n");
    return value + 1;
}
```        

When the program runs,  'c' will end up with a value of 4.

But can we do this without the magic of the __await__ keyword?  We can - there is a method on __Task__ called __ContinueWith__ which takes a function which gets called once the Task has been evaluated.  However because neither the original call (for example 'A') or the second call (for example 'B') have been completed at this point,  __ContinueWith__ has to return a Task<Task<int>>.  This task within a task is then handled by the __Unwrap__ method.

This allows us to rewrite our main method as follows:

```c#
static void Main(string[] args)
{
    if (File.Exists("Log.txt")) File.Delete("Log.txt");

    File.AppendAllText("Log.txt", "Start\r\n");

    var c = (A(1)
            .ContinueWith(t => B(t.Result))
            .Unwrap())
            .ContinueWith(t => C(t.Result))
            .Unwrap()
            .Result
            ;

    File.AppendAllText("Log.txt", $"C is {c}\r\n");
}
```        

Note - I'm using __.Result__ instead of __GetAwaiter().GetResult()__ purely to make the example easier to read.

We can also move the brackets around so that the method reads

```c#
var c = A(1)
    .ContinueWith(t => 
        B(t.Result)
            .ContinueWith(t2 => C(t2.Result))
            .Unwrap()
            .Result
    ).Result;

```
and this also returns the same results.

If we write the __.ContinueWith__ method as simply '·' then we are saying that (A·B)·C is the same as A·(B·C).  ie. __ContinueWith__ is associative.


---

Can we create our own Task<T> object without calling an asynchronous method?  Yes - __Task__ comes with a static method called __FromResult__.  For example

```c#
Task<int> myTask = Task.FromResult(123);
var anotherTask = Task.FromResult("Hello World");
```

This means we can turn any value of type T into a Task<T>.

----

Can we modify the value inside of a Task<T> whilst keeping it a Task<T>?

For example we can turn the string within a Task<string> into uppercase

```c#
public static Task<string> ToUpperCase(Task<string> task)
{
    return task.ContinueWith(
        t =>
        {
            var unwrapped = t.Result;
            var inUpperCase = unwrapped.ToUpper();
            return inUpperCase;
        }
        );
}
```        

this is much easier with async/await

```c#
public async static Task<string> ToUpperCase(Task<string> task)
{
    return (await task).ToUpper();
}
```

In both cases we have preserved the important property of a Task,  in that it's asynchronous.

---

We have just seen that we can go from Task<T> to Task<T>  but can we go from Task of T to Task of S?

The following example shows us going from Task<string> to Task<int>

```c#
public static Task<int> StringLength(Task<string> task)
{
    return task.ContinueWith(
        t => 
        {
            var unwrapped = t.Result;
            var result = unwrapped.Length;
            return result;
        }
        );
}
```        

We can make this more generic by creating function which takes in a function to be applied to the unwrapped value.

```c#
public static async Task<T> Map<S, T>(Task<S> task, Func<S, T> fn)
{
    var unwrapped = await task;
    var result = fn(unwrapped);
    return result;
}
```

This can be called as follows
```c#
var myTask = Task.FromResult("Hello World");
var length = Map(myTask, (s => s.Length));
Console.WriteLine(length.Result);
```

---

Imagine that you have a Task of int which contains the ID of our best customer.  You then use our __Map__ function in order replace that with the details of our customer

```c#
var highestValueCustomerIDTask = Task.FromResult(1);
var customerTask = Map(highestValueCustomerIDTask, s => LoadCustomer(s));
```

where __LoadCustomer__ has the signature of

```c#
public Task<Customer> LoadCustomer(int customerID)
```

Ideally __customerTask__ would be of type Task<Customer>.  However,  because LoadCustomer itself returns a task,  it means that customerTask is now of type Task of Task of Customer.  

We change the signature of the __Map__ function to do exactly what we need,  ie taking in a function from S to Task<T> rather than a function from S to T

```c#
public static async Task<T> Map2<S, T>(Task<S> task, Func<S, Task<T>> fn)
```
the only change we need to make to it's implementation is to unwrap the result a second time before returning the result.

The function now looks like

```c#
public static async Task<T> Bind<S, T>(Task<S> task, Func<S, Task<T>> fn)
{
    var unwrapped = await task;
    var result = fn(unwrapped);
    return await result;
}
```

we normally call this type of function __Bind__



### References

https://ericlippert.com/2013/02/28/monads-part-three/