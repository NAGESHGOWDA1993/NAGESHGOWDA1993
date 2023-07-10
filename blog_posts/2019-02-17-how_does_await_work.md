START_META
DATE: 2019-02-17
TITLE: How does await work?
END_META

## How does the C# compiler convert

```c#
var z = 1;
var a = await A(z);
var b = await B(a);
var c = await C(b);
```

into

```c#
var z = 1;
var c = A(z)
    .ContinueWith(t => 
        B(t.Result)
            .ContinueWith(t2 => C(t2.Result))
            .Unwrap()
            .Result
    ).Result;
```

The sample above breaks down into several sections,  either side of the asynchronous calls as shown below.

![continue-with.PMG]({{site.baseurl}}/images/async_await/continue-with.png)

which we can then write as a function with using a `switch` statement

```c#
void MoveNext()
{
    switch state
    {
        case 0:
            var z = 1;
            a = A(z).GetAwaiter().Result;
            state++;
            break;

        case 1:
            b = B(a).GetAwaiter().Result;
            state++;
            break;

        case 2:
            c = C(b).GetAwaiter().Result;
            SetResult(c);
            break;        
    }
}
```

We do however need to maintain state between these calls (`a`, `b`, `c` and `index`) which means we need to wrap our `MoveNext` method in a new class (struct).

```c#
struct GeneratedCode : IAsyncStateMachine
{
    private int a;
    private int b;
    private int c;
    private int state;

    void MoveNext()
    {
        switch state
        {
            case 0:
                var z = 1;
                a = A(z).GetAwaiter().Result;
                state++;
                break;

            case 1:
                b = B(a).GetAwaiter().Result;
                state++;
                break;

            case 2:
                c = C(b).GetAwaiter().Result;
                SetResult(c);
                break;        
        }
    }
}
```

Note - the actual code which C# generates is unsurprising more complex than the above and also includes error handing!


## Stack Traces

```c#
static async Task Main(string[] args)
{
    try
    {
        await A(1);
    }
    catch (Exception ex)
    {
        Console.WriteLine(ex.TargetSite);
    }
}

private static async Task<int> A(int a)
{
    throw new NotImplementedException();
}
```       

The exception caught by the example program above shows that occurred in the generated `MoveNext` method.  The stack trace itself has no mention of the MoveNext method.

## Generated IL
You can also see the generate class if you look at the IL for our example program



## Performance

There is a slight performance overhead as additional code is generated,  this is around 400bytes in size. 


## References
https://weblogs.asp.net/dixin/understanding-c-sharp-async-await-1-compilation