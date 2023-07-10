START_META
DATE: 2019-01-31
TITLE: Calling an async method
END_META


## Overview

This post is a getting started guide to using async methods.  There should be enough information to get you started without understand how it all works!

## What is an asynchronous method
You can think of an asynchronous method as a function which will run on a different thread and completes executing sometime in the future.

As a result can't be directly returned from the method (as it hasn't completed yet) an object of type `Task` is returned.  When the method finally completes,  the task will contain the result of the function.

Most of the time you don't need to worry about writing code to run on a different thread, you just need to know how to call the provided methods.

There are a number of asynchronous methods provided by the base framework libraries,  for example
* HttpClient -> GetJsonAsync()
* SQLConnection -> OpenAsync() 
* System.IO.File -> WriteAllTextAsync()

## Identifying an asynchronous method
The best way to determine if a method is asynchronous is by it's return type.  An asynchronous method will return either a `Task` or a `Task<T>`.  For example a method called `GetCustomerAsync` might have a return type of `Task<Customer>` .

Another clue is the name of the function,  by convention they end with __Async__.  For example the asynchronous version of `DataReader.Read()` is called `ReadAsync()`.

Finally if you don't spot that the function is asynchronous then you will find you can't use the result returned by the function.

For example this synchronous version is fine  

```c#
var customer = GetCustomerByID(1);
Console.WriteLine(customer.BusinessName)
```

but this asynchronous version won't compile as customer is of type `Task<Customer>` not a just `Customer`,  and `BusinessName` isn't a property of `Task`.

```c#
var customer = GetCustomerByIDAsync(1);
Console.WriteLine(customer.BusinessName)
```

the correct code would be

```c#
var customer = await GetCustomerByIDAsync(1);
Console.WriteLine(customer.BusinessName)
```

## Calling an asynchronous method

As you may have spotted in the example above,  you have to place the keyword `await` in front of the method call.  If you try the following example however you will notice that it doesn't compile.

```c#
public void AddMessageToLogFile(string message)
{
    await System.IO.File.WriteAllTextAsync("Log.txt", message);
}
```

this is because in order to use the `await` keyword you have to add the word `async` to the function signature.

```c#
//Don't do this!
public async void AddMessageToLogFile(string message)
{
    await System.IO.File.WriteAllTextAsync("Log.txt", message);
}
```

The code will compile but is still wrong.  With one exception,  whenever you have an `async` method you must return `Task` rather than `void`.  Likewise you should return `Task<T>` rather than just T.  ie `Task<string>` not just `string`

Our correct code then looks like this

```c#
public async Task AddMessageToLogFile(string message)
{
    await System.IO.File.WriteAllTextAsync("Log.txt", message);
}
```

(There is a more efficient way of writing this method but we will ignore that for now)


## Calling an asynchronous method which calls an asynchronous method

If you now try to use call `AddMessageToLogFile` method you will find that the same rules apply.  We have to prefix the call with `await` and change the function to `async Task`.  For example

```c#
public async Task<decimal> CalculateGrossValue(decimal netValue, decimal taxValue)
{
    var grossValue = netValue + taxValue;
    await AddMessageToLogFile($"Gross Value is {grossValue}");
    return grossValue;
}
```

and then you make the same change to the functions which call `CalculateGrossValue` and so on until you reach the entry point of you code.

Don't worry if this seems a pain at first,  you soon get used to it!

## A real world example

Here is a real-world example of calling a SQL Server stored procedure.  Note that the `await` is used in three different places within the code.

```c#
public async Task<List<Customer>> AllCustomers(string connectionString)
{
    var results = new List<Customer>();
    using (var cn = new SqlConnection(connectionString))
    {
        await cn.OpenAsync();

        using (var cmd = new SqlCommand())
        {
            cmd.Connection = cn;
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            cmd.CommandText = "dbo.usp_AllCustomers";

            using (var dr = await cmd.ExecuteReaderAsync())
            {
                while (await dr.ReadAsync())
                {
                    results.Add(new Customer()
                    {
                        Name = (string)dr["Name"]
                    });
                }
            }
        }
    }
    return results;
}
```



