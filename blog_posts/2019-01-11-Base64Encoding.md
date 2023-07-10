START_META
DATE: 2019-01-11
TITLE: Base64 Encoding
END_META



## Encoding

Following on from yesterday's Huffman coding,  I thought that I would write a Base64 encoder in C#.

At first glance this seems straight forward

1.  Convert each character in the input text into it's ASCII value
2.  Convert the ascii value into an 8 bit (octet) binary string (left pad with 0s as needed)
3.  Join all the binary strings together
4.  Chuck the long string into 6 bit (sextet) blocks
5.  Lookup the character which represents each block

This can almost be written in a single linq statement however....  the issue comes when the length of the long string does not divide evenly into 6.  For example the string "AB" would only produce 16 (2x8) bits and 16/6 has a reminder of 4.

In order to be able to pad out the final block, we have to work on the string in blocks of 3 octets (24bits or 4 sextets) at a time.

1.  Convert each character in the input text into it's ASCII value
2.  Convert the ascii value into an 8 bit (octet) binary string (left pad with 0s as needed)
3.  Join all the binary strings together
4.  Chuck the long string into 24 bit blocks (3 octets/4 sextets)
        If the length of the block is 8 characters pad the final sextet and append == to the result.
        If the length of the block is 16 characters pad the final sextet and append = to the result.
5.  Lookup the character which represents each sextet


Steps 1-3 are straight forward with the following Linq

```c#
var asBinary = string.Join("", text.Select(c => Convert.ToString(c, 2).PadLeft(8, '0')));
```

In order to work on the binary string in blocks of 3 octets we use a helper function.  This has to handle the case when the final block is less then 24 bits long.

```c#
private IEnumerable<string> ThreeOctets(string binaryText)
{
    var offset = 0;
    while (offset < binaryText.Length)
    {
        if (offset + 24 >= binaryText.Length)
            yield return binaryText.Substring(offset);
        else
            yield return binaryText.Substring(offset, 24);
        offset += 24;
    }
}
```

We use a switch statement to handle the three possible padding cases

```c#
var result = "";
foreach (var block in ThreeOctets(asBinary))
{
    switch (block.Length)
    {
        case 8:
            result += ConvertSextet(0, block) +
                      ConvertSextet(1, block) +
                        "==";
            break;
        case 16:
            result += ConvertSextet(0, block) +
                      ConvertSextet(1, block) +
                      ConvertSextet(2, block) +
                      "=";
            break;

        default:
            result += ConvertSextet(0, block) +
                      ConvertSextet(1, block) +
                      ConvertSextet(2, block) +
                      ConvertSextet(3, block);
            break;
    }
}
```

The __ConvertSextet__ function handles extracting the 6 bits which make up the sextet from the 24bit string.  It then converts the 6 bits into base10,  and uses that to look up it's matching character.  This function also has to take care to right-pad the sextet with zeros if the input block is too short. 

```c#
private string ConvertSextet(int sextetNumber, string block)
{
    var blockStart = sextetNumber * 6;
    if (blockStart + 6 >= block.Length)
        return Lookup(Convert.ToByte(block.Substring(blockStart).PadRight(6, '0'), 2)).ToString();
    else
        return Lookup(Convert.ToByte(block.Substring(blockStart, 6), 2)).ToString();
}
```

Finally we have the lookup function

```c#
private char Lookup(byte index)
{
    if (index <= 25)
        return (char)(index + 'A');
    else if (index <= 51)
        return (char)(index - 26 + 'a');
    else if (index <= 61)
        return (char)(index - 52 + '0');
    else if (index <= 62)
        return '+';
    else if (index <= 63)
        return '/';
    else
        return ' ';
}
```

## Decoding

To convert back from Base64 it's the same process but in reverse.  Again the complication is around handling any padding which was added by the encoding process.

We begin by writing a function which given an encoded character,  will look up it's value and return it as binary (6 bits).

```c#
private string LookupCharAsBinary(char c)
{
    var base10 = 0;

    if (c >= 'A' && c <= 'Z')
        base10 = c - 'A';
    else if (c >= 'a' && c <= 'z')
        base10 = c - 'a' + 26;
    else if (c >= '0' && c <= '9')
        base10 = c - '0' + 52;
    else if (c == '+')
        base10 = 62;
    else if (c == '/')
        base10 = 63;

    return Convert.ToString(base10, 2).PadLeft(6, '0');
}
```

The complete input string is converted into binary by looking at blocks of four character at a time.  This then allows us to undo any padding.

```c#
var asBinary = "";
foreach (var block in FourCharacters(encodedText))
{
    if (block.EndsWith("=="))
    {
        asBinary += LookupCharAsBinary(block[0]);
        asBinary += LookupCharAsBinary(block[1]).Substring(0, 2);
    }
    else if (block.EndsWith("="))
    {
        asBinary += LookupCharAsBinary(block[0]);
        asBinary += LookupCharAsBinary(block[1]);
        asBinary += LookupCharAsBinary(block[2]).Substring(0, 4);
    }
    else
    {
        asBinary += LookupCharAsBinary(block[0]);
        asBinary += LookupCharAsBinary(block[1]);
        asBinary += LookupCharAsBinary(block[2]);
        asBinary += LookupCharAsBinary(block[3]);
    }
}
```

Once we have our complete binary string,  we can walk along it an octet at a time converting it into an ASCII character.

```c#
var asText = "";
foreach (var octet in Octets(asBinary))
    asText += ((char)Convert.ToByte(octet, 2)).ToString();
```

The complete code with tests is available on [github](https://github.com/DavidBetteridge/Base64Encoder) 
