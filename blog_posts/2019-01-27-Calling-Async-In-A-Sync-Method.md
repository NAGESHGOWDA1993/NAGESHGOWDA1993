START_META
DATE: 2019-01-27
TITLE: Calling an asynchronous method from a synchronous one
END_META


Although it's becoming less and less common,  there are times you will need to call an asynchronous from within a synchronous one.  For example when you are implementing an interface; within a constructor or writing a console application with an old version of c#.

Create a console app,  and start with the following code

```c#
static void Main(string[] args)
{
    if (File.Exists("Log.txt")) File.Delete("Log.txt");
    File.AppendAllText("Log.txt", "Main 1\r\n");
    AnAsyncOperation();
    File.AppendAllText("Log.txt", "Main 2\r\n");

    Console.WriteLine("Wait a couple of seconds and then press a key");
    Console.ReadKey(true);
}

public static async Task AnAsyncOperation()
{
    await Task.Run(() => Thread.Sleep(TimeSpan.FromSeconds(1)));
    File.AppendAllText("Log.txt", "AnAsyncOperation\r\n");
}
```

Run the program,  and within your __bin/debug__ folder the file __log.txt__ will be created.  This file should contain the following three lines,  note the lines are out of order.

```
Main 1
Main 2
AnOperationAsync
```

Now remove the __Console.ReadKey(true)__ line and run the program again.  Now your log file will contain just two lines

```
Main 1
Main 2
```

As you may have guessed,  the reason for this is that __AnAsyncOperation__ is an asynchronous method,  and we aren't awaiting for it to finish.  Our program is exiting before the 1 second delay has finished.

Ideally we would change our code as below

```c#
await AnAsyncOperation();
```

but we can't as we haven't marked our method as async.  ```static async Task Main(string[] args)```  (Let's assume we are using an old version of c# for now!)

You may be tempted to use the __.Wait()__ command,  change your program as below and run it again.

```c#
AnAsyncOperation().Wait();
```

As first it appears to correct the problem,  the log file now contains all three lines and they are in the correct order.  However now change your code to read

```c#
static void Main(string[] args)
{
    if (File.Exists("Log.txt")) File.Delete("Log.txt");
    File.AppendAllText("Log.txt", "Main 1\r\n");

    try
    {
        AnAsyncOperation().Wait();
    }
    catch (ApplicationException)
    {
        // That's ok
    }
    
    File.AppendAllText("Log.txt", "Main 2\r\n");
}

public static async Task AnAsyncOperation()
{
    throw new ApplicationException("Please bring the warp drive online before calling this method.");
}
```

Before running it,  guess what you think is going to happen.

Now run it,  you will find that the __ApplicationException__ isn't caught,  and the program crashes leaving just one line in the __log.txt__ file.  The problem is that thrown exception is actually of type __System.AggregateException__ containing our __ApplicationException__ as an inner exception.  Normally this isn't a problem as the __await__ keyword also handles the unwrapping of our exception for us.

![Wait_Error.PNG]({{site.baseurl}}/images/async_await/Wait_Error.PNG)


The answer is to use __GetAwaiter().GetResult()__ instead of __.Wait()__ or __.Result__.  i.e.

```c#
try
{
    AnAsyncOperation().GetAwaiter().GetResult();
}
```            

Run the program,  and you will now find that your exception is correctly caught.

### Rules
There are three rules for when you need to call an asynchronous method.

1.  Make the calling method asynchronous whenever you can<sup>#1</sup>.
2.  Never use __.Wait()__ or __.Result__  always use __GetAwaiter().GetResult()__  
3.  Never call an asynchronous method without awaiting it.

There is a minor exception to these rules which we will look at next time.

<sup>#1</sup>
As @kev_bite pointed out to me,  there are very few reasons not to make your method asynchronous in modern C#.  For example C# 7.1 supports asynchronous Main methods in console apps,  and you can use __IHttpAsyncHandler__ instead of __IHttpHandler__ in asp.net.

### References
[Correcting Common Mistakes When Using Async/Await in .NET - Brandon Minnick](https://www.youtube.com/watch?v=av5YNd4X3dY)






