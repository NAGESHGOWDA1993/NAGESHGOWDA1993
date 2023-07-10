START_META
DATE: 2019-01-28
TITLE: Extracting values from a task.
END_META


Consider the following code

```c#
static async Task Main(string[] args)
{
    if (File.Exists("Log.txt")) File.Delete("Log.txt");

    File.AppendAllText("Log.txt", "Main 1\r\n");
    var task = AnAsyncOperation();

    File.AppendAllText("Log.txt", "Main 2\r\n");
    Thread.Sleep(TimeSpan.FromSeconds(1));

    File.AppendAllText("Log.txt", "Main 3\r\n");
    await task;

    File.AppendAllText("Log.txt", "Main 4\r\n");
}

public static async Task AnAsyncOperation()
{
    throw new ApplicationException("An unexpected exception.");
}
```

Do you think the entry __Main 3__ gets written to the log file,  or will the exception be throw before that line of code gets reached?

As you should have just found, the exception isn't thrown until you _await_ t.   

You can think of the __await__ keyword working as follows.   Assume that Task<T> is a box which contains 'Either' our result (of type T) or an exception.  We need to get the value out of the box,  but we can't access it's value directly.  We can however give it a function which will be called once the task is complete.  To allow for the fact that the task might have faulted (error-ed) we supply it with two functions. 

__await__ could then be written as

```c#
t.ExtractValue (  
            ((System.AggregateException ae) => throw ae.innerException),
            ((T result) => return result )
       );
```

These functions are then only called once the task has completed (either successfully or with a fault).  

Note,  this is a way of thinking about it,  rather than how it is actually implemented.