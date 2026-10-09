+++
title = "JSON"
summary = "Objects, arrays and values: reading and writing the format most network APIs use."
links = ["field/11/06-yaml-and-xml", "field/11/08-reading-an-api-exchange", "ensa/14/03-reading-json"]
+++

*JSON* (JavaScript Object Notation) is the data format you will see most in network APIs. It is plain text, it is easy for people to read and it is easy for programs to parse. Controllers return it, scripts send it and tools like `curl` print it. Reading JSON comfortably is the most useful single skill in this chapter, and the CCNA blueprint names it directly.

## Objects

An *object* is a set of key-value pairs inside curly braces. The *key* is a name in double quotes, a colon follows, then the *value*. Pairs are separated by commas.

```text
{
  "hostname": "SW-FLOOR2",
  "managementIp": "10.10.2.5",
  "portCount": 48
}
```

That object has three key-value pairs. The keys name the facts, so the program asks for `hostname` and gets `SW-FLOOR2`. Order inside an object has no meaning.

## Arrays

An *array* is an ordered list of values inside square brackets, separated by commas.

```text
["Gi1/0/1", "Gi1/0/2", "Gi1/0/3"]
```

Arrays keep their order, and you reach an item by its position. Programmers count from zero, so the first item is position 0. Values in an array can be of any type, and often they are objects, which gives you a list of records.

## Value types

A value can be one of six kinds:

| Type | Example | Notes |
| --- | --- | --- |
| String | `"SW-FLOOR2"` | Always double quotes |
| Number | `48`, `3.5` | No quotes. A quoted `"48"` is a string, not a number |
| Boolean | `true`, `false` | Lowercase, no quotes |
| Null | `null` | Means "no value" |
| Object | `{ ... }` | Nested key-value pairs |
| Array | `[ ... ]` | Nested list |

```recall
front = "List the six JSON value types."
back = "String, number, true/false (boolean), null, object and array."
```

## Rules that catch people out

- **Keys and strings use double quotes only.** `'hostname'` with single quotes is invalid JSON.
- **No trailing comma.** A comma after the last pair or item is an error.
- **No comments.** JSON has no comment syntax. Anything like `// note` makes the file invalid.
- **Whitespace does not matter.** Indentation and line breaks are for people. The same data on one line is identical to the program.

```trap
Copying JSON from an example and adding a helpful comment or a final comma is the fastest way to get a 400 Bad Request. Validate the body before you send it.
```

## Reading a nested example

Real responses nest objects inside arrays inside objects. Read from the outside in.

```text
{
  "hostname": "SW-FLOOR2",
  "reachable": true,
  "managementIp": "10.10.2.5",
  "interfaces": [
    {
      "name": "GigabitEthernet1/0/1",
      "status": "up",
      "vlan": 10
    },
    {
      "name": "GigabitEthernet1/0/2",
      "status": "down",
      "vlan": null
    }
  ]
}
```

The outer braces are one object describing a device. Its `interfaces` key holds an array. That array holds two objects, one per interface.

To reach one value, follow a path. The status of the second interface is: top object, key `interfaces`, array position 1, key `status`. Programmers write that as `interfaces[1].status`, and the answer is `"down"`. The VLAN of the first interface is `interfaces[0].vlan`, which is `10`. The second interface's `vlan` is `null`: the key exists, but it has no value.

```question
prompt = "In the device example above, what does interfaces[0].name return?"
options = ["\"GigabitEthernet1/0/2\"", "\"GigabitEthernet1/0/1\"", "\"up\"", "The whole interfaces array"]
answer = 1
why = "Array positions start at 0, so [0] is the first object in interfaces, and .name is its name key."
```

## Counting parts

A quick exercise often asked: how many objects, arrays and key-value pairs are in a sample?

```text
{
  "site": "HQ",
  "switches": [
    { "name": "SW1", "ports": 24 },
    { "name": "SW2", "ports": 48 }
  ]
}
```

- Objects: 3 (the outer one and the two inside the array).
- Arrays: 1 (`switches`).
- Key-value pairs: 6 (`site` and `switches` in the outer object, plus `name` and `ports` in each of the two switch objects).

```question
prompt = "How many key-value pairs does this contain? {\"a\": 1, \"b\": {\"c\": 2, \"d\": [3, 4]}}"
options = ["2", "3", "4", "5"]
answer = 2
why = "The outer object has a and b. The inner object has c and d. That is four pairs. The array [3, 4] holds values, not pairs."
```

## Spotting invalid JSON

```text
{
  'hostname': "SW-FLOOR2",
  "ports": 48,
  "uplinks": ["Gi1/1/1", "Gi1/1/2",],
  // main closet
}
```

This fails in four places: single quotes around `hostname`, a trailing comma inside the array, a comment, and a trailing comma after the last pair. A parser stops at the first one and reports an error with a line number, so fix and retry. A one-line check from a shell is `python3 -m json.tool file.json`, which prints the tidy version or the error.

```question
prompt = "Which is valid JSON?"
options = ["{\"vlan\": 10,}", "{vlan: 10}", "{\"vlan\": 10}", "{'vlan': 10}"]
answer = 2
why = "Only the third has a double-quoted key and no trailing comma. The others have a trailing comma, an unquoted key and single quotes."
```

```recall
front = "Four rules that make JSON invalid when broken?"
back = "Keys and strings in double quotes only; no trailing commas; no comments; braces and brackets must match."
```

```recall
front = "How do you write the path to the status of the second item in an interfaces array?"
back = "interfaces[1].status, because array positions start at 0."
```
