START_META
DATE: 2019-01-26
TITLE: Async and Await in C# - Part 1
END_META

## Overview

I've been asked a couple of times recently about async/await in C# as some developers feel they don't understand it enough to use it in production code.

## ConfigureAwait

The easiest way to demonstrate this is by writing an application which has a UI.   Create a new Windows Forms project and then add a form with a button and a few labels.  (As shown below)

![winform.PMG]({{site.baseurl}}/images/async_await/winform.PNG)


Behind the button's click event add the following the code and run the program.

```c#
private async void button1_Click(object sender, EventArgs e)
{
    var httpClient = new HttpClient();

    var originalThreadID = Thread.CurrentThread.ManagedThreadId;

    var html = await httpClient.GetStringAsync("https://www.bbc.com");

    var newThreadID = Thread.CurrentThread.ManagedThreadId;

    lblThreadIDs.Text = $"was {originalThreadID} now {newThreadID}";
    lblData.Text = html.Substring(0, 11);
}
```
Things to note
*   The function signature is __async void__.  This is ok as it's an event handler.
*   The values of __originalThreadID__ and __newThreadID__ are the same. 
*   The program runs as expected and displays some html.

The default value for __ConfigureAwait__ is __True__ this means that program should continue on the same thread after calling __await__.

Change line to 26 as below

```c#
var html = await httpClient.GetStringAsync("https://www.bbc.com")
                           .ConfigureAwait(false);
```                                       
put a breakpoint on what was line 30 (lblThreadIDs.Text = ...) and re-run your program.

You should now have different values for originalThreadID and newThreadID.

Continuing running your program (past the breakpoint) and boom!! - we have a crash.

![error.PMG]({{site.baseurl}}/images/async_await/error.PNG)

The reason for this is that the user interface can only be updated from the UI thread,  and our program is no longer on the UI thread.

## SynchronizationContexts
Strictly speaking we should be referring to the __SynchronizationContext__ rather than the UI thread however we will skip over that for now!  

### The inverse
Although __ConfigureAwait(true)__ means your program will be on the same thread either side of the await call,  __ConfigureAwait(false)__ doesn't mean that the threads will be different.  If the awaited call doesn't create a new thread then the caller will continue on the existing thread. 

This can be shown by creating the following function

```c#
public Task<string> DoVeryLittle()
{
    return Task.FromResult("Hello World");
}
```
and calling that instead of the __GetStringAsync__

```c#
var html = await DoVeryLittle().ConfigureAwait(false);
```

### Final Note
The recommendation is to set __ConfigureAwait(false)__ on all await calls,  this is especially true when you are writing a class library. This is because if you have a synchronous caller of your code ( i.e. one which uses .Wait() and/or .Result ) and you haven't set ConfigureAwait(false) then it is possible for a deadlock to occur and your code to hang.
  
### References
[Async and Await, All the Things Your Mother Never Told You – James Clancey](https://www.youtube.com/watch?v=jgxJbshvCXQ)

[#: Why you should use ConfigureAwait(false) in your library code](https://medium.com/bynder-tech/c-why-you-should-use-configureawait-false-in-your-library-code-d7837dce3d7f)

[Async/Await - Best Practices in Asynchronous Programming](https://msdn.microsoft.com/en-us/magazine/jj991977.aspx)
