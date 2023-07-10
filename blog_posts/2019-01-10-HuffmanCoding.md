START_META
DATE: 2019-01-10
TITLE: Huffman Coding
END_META


Following a conversation with David Turner after the [YorkCodeDojo](https://meetup.com/YorkCodeDojo) on Wednesday night I thought I would have a go at implementing Huffman encoding using C#

As I couldn't remember the finer details (University was a long time ago),  it was off to Wikipedia to look it up. https://en.wikipedia.org/wiki/Huffman_coding

My first step was to order the letters by the frequency in which they occured in the source text.  At this point I got a bit sidetracked as I wondered if using Linq would be a lot slower than writing a manual loop.

I now have a nice reuseable timing function :-)

```c#
internal static T Time<T>(Func<T> function)
{
    var sw = new Stopwatch();
    sw.Start();
    var result = function();
    sw.Stop();

    Console.WriteLine($"{sw.Elapsed.TotalMilliseconds}ms");

    return result;
}
```
(It turns out for this size of text there is no difference in performance)


The Linq code is 

```c#
static IEnumerable<LeafNode> OrderLettersByFrequencyUsingLinq(IEnumerable<char> fileText)
{
    return fileText.GroupBy(c => c)
                    .Select(grp => new LeafNode(grp.Key, grp.Count()))
                    .OrderBy(grp => grp.Weight);
}
```

Once you have the letters sorted into frequency order,  you can build a tree using two queues.

There are two types of nodes in the tree
1.  LeafNodes which are the nodes which represent a letter and it's original weight.  
2.  CombinedNodes which combine two nodes together.

Both __LeafNodes__ and __CombinedNodes__ implement a __INode__ interface.


I started off with a helper function which returns the lowest two values from the queues.

```c#
private static INode GetLowestItem(Queue<LeafNode> leafQueue, Queue<CombinedNode> combinedQueue)
{
    if (leafQueue.Count() == 0)
        return combinedQueue.Dequeue();
    else if (combinedQueue.Count() == 0)
        return leafQueue.Dequeue();
    else if (leafQueue.Peek().Weight < combinedQueue.Peek().Weight)
        return leafQueue.Dequeue();
    else
        return combinedQueue.Dequeue();
}
```

Which then makes building the tree straight forward.  We keep combining nodes until only 1 node remains.
```c#
private static CombinedNode BuildTree(IEnumerable<LeafNode> lettersByFrequency)
{
    var leafQueue = new Queue<LeafNode>();
    var combinedQueue = new Queue<CombinedNode>();

    foreach (var item in lettersByFrequency)
        leafQueue.Enqueue(item);

    while (leafQueue.Count() + combinedQueue.Count() > 1)
    {
        var lhs = GetLowestItem(leafQueue, combinedQueue);
        var rhs = GetLowestItem(leafQueue, combinedQueue);
        var combinedNode = new CombinedNode(lhs, rhs);
        combinedQueue.Enqueue(combinedNode);
    }
    return combinedQueue.Dequeue();
}
```

Once we have the tree we can recurse down it to generate the unique code for each letter
```c#
private static void DisplayTree(INode node, string parentValue = "")
{
    if (node is LeafNode leafNode)
        Console.WriteLine($"{leafNode.Key} is {parentValue}");

    if (node is CombinedNode combinedNode)
    {
        DisplayTree(combinedNode.LHS, parentValue + "0");
        DisplayTree(combinedNode.RHS, parentValue + "1");
    }
}
```


To decode the message is quite fun.  First of all you must build a tree with the same structure as you used to encode it.  There is a bit in the article about the best way to transmit that. You then start at the beginning of the encoded text and walk the tree based on the current 0 or 1 value.  Once you reach a leaf node, you output the character and return to the top of the tree.

```c#
private static string DecodeText(CombinedNode tree, string encodedText)
{
    var result = "";
    var offset = 0;
    INode currentNode = tree;
    while (offset < encodedText.Length)
    {
        if (currentNode is CombinedNode combinedNode)
        {
            if (encodedText[offset] == '0')
                currentNode = combinedNode.LHS;
            else
                currentNode = combinedNode.RHS;
        }

        if (currentNode is LeafNode leafNode)
        {
            result += leafNode.Key;
            currentNode = tree;
        }

        offset++;
    }
    return result;
}

```

The complete code is available on [github](https://github.com/DavidBetteridge/HuffmanCoding) 
