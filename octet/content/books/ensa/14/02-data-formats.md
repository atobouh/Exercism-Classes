+++
title = "JSON, YAML and XML"
summary = "Programs exchange structured data in a few common text formats, and you need to recognize all three."
links = ["ensa/14/03-reading-json", "ensa/13/07-sdn-architecture", "field/11/05-json", "field/11/06-yaml-and-xml"]
+++

When you run `show ip interface brief`, you read the answer by eye. A program cannot. It needs the same facts arranged by clear rules: this is the interface name, this is its address, this is whether it is up. Agreed text formats supply those rules. Three of them cover almost everything you will meet in network automation: JSON, YAML and XML.

All three are plain text. All three describe the same kinds of thing: named pieces of data, lists of items, and items nested inside other items. They differ in punctuation.

## One interface, three ways

Here is one interface written in each format.

```text
{
  "interface": {
    "name": "GigabitEthernet0/0/1",
    "ip_address": "192.0.2.10",
    "enabled": true,
    "vlans": [10, 20]
  }
}
```

The same data in YAML:

```text
---
interface:
  name: GigabitEthernet0/0/1
  ip_address: 192.0.2.10
  enabled: true
  vlans:
    - 10
    - 20
```

And in XML:

```text
<interface>
  <name>GigabitEthernet0/0/1</name>
  <ip_address>192.0.2.10</ip_address>
  <enabled>true</enabled>
  <vlans>
    <vlan>10</vlan>
    <vlan>20</vlan>
  </vlans>
</interface>
```

Read them against each other and the pattern appears. Each has a name for every value, a nested group for the interface, and a list of two VLANs.

## JSON

*JSON* (JavaScript Object Notation) wraps a group of named values in braces `{ }`. Each pair is a quoted key, a colon and a value, and pairs are separated by commas. A list goes in square brackets `[ ]`. Text values use double quotes. Numbers and the words `true`, `false` and `null` do not. JSON is the usual format for web APIs, so you will read it more than the other two. The [next page](ensa/14/03-reading-json) takes it apart in detail.

## YAML

*YAML* uses layout instead of punctuation. A key is followed by a colon and a space, then its value. Indentation shows nesting, and it must use spaces, never tabs. Items in a list each start with a dash and a space. There are no braces and quotes are usually optional. A file often starts with a line of three dashes (`---`), which marks the start of a document. YAML is pleasant to read, which is why configuration files, including Ansible playbooks, are written in it.

```trap
In YAML, indentation is syntax. A line indented one space too far, or too few, changes the structure or breaks the file entirely. Use spaces, keep the same number for each level, and never mix in tabs.
```

## XML

*XML* (Extensible Markup Language) wraps every value in a pair of tags: an opening tag such as `<name>` and a closing tag with a slash, `</name>`. Tags nest, and a tag can carry extra information as attributes, for example `<interface type="ethernet">`. XML is wordier than the others, but it is exact and well established. The NETCONF protocol from the [SDN chapter](ensa/13/07-sdn-architecture) sends its messages in XML.

## Comparing them

| Format | How structure is shown | Readability | Typical use |
| --- | --- | --- | --- |
| JSON | Braces, brackets, quotes and commas | Good, a little noisy | Web APIs, REST replies |
| YAML | Indentation and dashes | Best for people | Configuration files, playbooks |
| XML | Opening and closing tags | Wordy but precise | NETCONF, older web services |

## Telling them apart

You can identify a format from the first glance. Braces and quoted keys mean JSON. A lack of brackets, with indented `key: value` lines, means YAML. Angle brackets mean XML.

```question
prompt = "A sample begins like this: the first line is three dashes, then lines such as `hostname: S1` and, indented below `vlans:`, items starting with `- 10`. Which format is it?"
options = ["JSON", "YAML", "XML", "None, because it has no braces"]
answer = 1
why = "Indentation, `key: value` pairs and dash-prefixed list items are YAML. JSON would have braces and quoted keys, and XML would use angle-bracket tags."
```

```recall
front = "Which of JSON, YAML and XML does NETCONF use for its messages?"
back = "XML."
```

```recall
front = "How does YAML show a list item and nesting?"
back = "A list item starts with a dash and a space. Nesting is shown by indenting with spaces (never tabs)."
```
