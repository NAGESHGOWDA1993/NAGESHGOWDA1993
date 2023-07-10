START_META
DATE: 2019-01-26
TITLE: Async and Await in C# - Part 2
END_META

Create a console app with the following code.  (You will need to set the language version to C# 7.1 or greater)

```c#
static async Task Main(string[] args)
{
    var sw = new Stopwatch();
    sw.Start();

    await ProcessWhichTakes2Seconds();

    Thread.Sleep(TimeSpan.FromSeconds(1));
    Console.WriteLine("Completed 1 second delay");

    sw.Stop();
    Console.WriteLine($"Time taken {Math.Round(sw.Elapsed.TotalSeconds, 2)}s");
    Console.ReadKey(true);
}

private static async Task ProcessWhichTakes2Seconds()
{
    await Task.Run(() => Thread.Sleep(TimeSpan.FromSeconds(2)));
    Console.WriteLine("Completed ProcessWhichTakes2Seconds");
}
```        

Read through the code and work out which you expect it to do.  Then run it.

You should see output along the lines of 
```
Completed ProcessWhichTakes2Seconds
Completed 1 second delay
Time taken 3.09s
```

Question - how can we speed this code up?

Try

```c#
static async Task Main(string[] args)
{
    var sw = new Stopwatch();
    sw.Start();

    var task = ProcessWhichTakes2Seconds();

    Thread.Sleep(TimeSpan.FromSeconds(1));
    Console.WriteLine("Completed 1 second delay");

    await task;

    sw.Stop();
    Console.WriteLine($"Time taken {Math.Round(sw.Elapsed.TotalSeconds, 2)}s");
    Console.ReadKey(true);
}
```        

