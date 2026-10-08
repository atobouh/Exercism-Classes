+++
title = "Reading JSON"
summary = "Objects, arrays, keys and values: the parts of JSON-encoded data and how to read a nested example."
links = ["ensa/14/02-data-formats", "ensa/14/05-rest", "field/11/05-json"]
+++

Most network APIs answer in JSON, so being able to read it is the most practical skill in this chapter. The format has only a few parts. Once you can name them, a long reply from a controller stops looking like noise and becomes a map you can follow.

## The building blocks

A JSON document is built from two containers and a few simple values.

An *object* is an unordered set of *key-value pairs* inside braces. The key is always a string in double quotes. A colon separates it from its value. Commas separate the pairs.

```text
{ "name": "S1", "model": "C9200", "uptime_days": 41 }
```

An *array* is an ordered list in square brackets, with values separated by commas.

```text
["GigabitEthernet1/0/1", "GigabitEthernet1/0/2"]
```

A value can be one of six types:

| Type | Example | Note |
| --- | --- | --- |
| String | `"S1"` | Always double quotes |
| Number | `41` or `2.5` | No quotes |
| Boolean | `true` or `false` | Lowercase, no quotes |
| Null | `null` | Means no value |
| Object | `{ "a": 1 }` | Can nest |
| Array | `[1, 2]` | Can nest |

Because objects and arrays are themselves values, they can hold each other to any depth.

## A nested example

This document describes a switch and two of its interfaces.

```text
{
  "device": "S1",
  "location": "Floor 2",
  "interfaces": [
    {
      "name": "GigabitEthernet1/0/1",
      "ip_address": "192.168.10.1",
      "enabled": true
    },
    {
      "name": "GigabitEthernet1/0/2",
      "ip_address": "192.168.20.1",
      "enabled": false
    }
  ]
}
```

The outermost braces form one object with three keys: `device`, `location` and `interfaces`. The first two hold strings. The value of `interfaces` is an array, and each item in that array is an object with its own three keys.

## Reading a value by path

To find a single value, walk down from the outside, one step per level. To find the IP address of the second interface:

1. Start at the top object and take the key `interfaces`. You are now at the array.
2. Take the second item. Arrays count from zero in most programming languages, so that is position 1.
3. In that object, take the key `ip_address`.

The answer is `192.168.20.1`. Programmers write this path as `interfaces[1].ip_address`, using a dot for a key and brackets for a position.

```question
prompt = "In the sample above, what is the value of `enabled` for GigabitEthernet1/0/1?"
options = ["false", "\"true\"", "true", "null"]
answer = 2
why = "The first object in the interfaces array has `enabled` set to the boolean true, written without quotes. `\"true\"` in quotes would be a string, and false belongs to the second interface."
```

```question
prompt = "Which path reaches the name `GigabitEthernet1/0/2` in the sample above?"
options = ["device.interfaces.name", "interfaces[0].name", "interfaces[1].name", "interfaces.name[1]"]
answer = 2
why = "interfaces is an array, and GigabitEthernet1/0/2 is its second item, which sits at position 1. Position 0 is the first interface."
```

## The rules that trip people up

JSON is strict. A program that expects it will reject a document with even a small flaw.

- Keys and string values use **double quotes**. Single quotes are not valid.
- Every key is quoted. `{ name: "S1" }` is not JSON.
- Pairs and array items are separated by commas, and there is **no comma after the last one**.
- Booleans and null are lowercase and unquoted.
- Comments are not allowed.

```trap
This is invalid JSON: `{ 'name': 'S1', }`. It uses single quotes and has a trailing comma. A strict parser stops at the first error and returns nothing, so a missing comma can fail a whole API call.
```

When a reply looks wrong, check the punctuation before you suspect the data. Many editors and online checkers will point to the exact line that breaks the rules. Reading the structure first, braces for objects, brackets for arrays, makes the content far easier to follow.

```recall
front = "What are the two containers in JSON, and what delimits each?"
back = "An object (key-value pairs in braces) and an array (an ordered list in square brackets)."
```

```recall
front = "Name three common JSON syntax errors."
back = "Single quotes instead of double quotes, a missing comma between items, and unquoted keys. A trailing comma after the last item is also invalid."
```
