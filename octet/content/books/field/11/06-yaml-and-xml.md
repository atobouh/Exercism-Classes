+++
title = "YAML and XML"
summary = "The other two data formats you will meet, shown with the same data as JSON."
links = ["field/11/05-json", "field/12/03-ansible-architecture", "field/12/04-reading-a-playbook", "ensa/14/02-data-formats"]
+++

JSON is not the only format in network work. Ansible files are written in YAML, and NETCONF speaks XML. The three formats can hold the same information. What differs is how they mark where things start and end, and who each one is built for. If you can read JSON, you can read all three once you see the pattern.

## The same data three ways

Here is one interface as JSON, YAML and XML.

```text
{
  "interface": {
    "name": "GigabitEthernet1/0/1",
    "enabled": true,
    "vlans": [10, 20]
  }
}
```

```text
---
interface:
  name: GigabitEthernet1/0/1
  enabled: true
  vlans:
    - 10
    - 20
```

```text
<interface>
  <name>GigabitEthernet1/0/1</name>
  <enabled>true</enabled>
  <vlans>
    <vlan>10</vlan>
    <vlan>20</vlan>
  </vlans>
</interface>
```

The data is the same: an interface with a name, an enabled flag and two VLANs. Read each form for what it uses as punctuation.

## YAML

*YAML* uses indentation to show structure, and has almost no punctuation.

- `key: value` is a pair. The colon is followed by a space.
- Indentation shows nesting. Children are indented under their parent.
- `-` followed by a space starts a list item.
- `---` marks the start of a document.
- `#` starts a comment, which JSON cannot do.
- Strings usually need no quotes.

YAML is a superset of JSON in practice, so a JSON file is often valid YAML as well. It is the format of **Ansible** playbooks and inventories (see [Ansible architecture](field/12/03-ansible-architecture)), because people write and edit those by hand and a comment explaining a task is worth having.

```trap
YAML indentation must use spaces, never tabs. A tab character causes a parse error, and the message often points at a line that looks fine. Set your editor to insert spaces, and keep the same number (usually two) at each level.
```

## XML

*XML* (Extensible Markup Language) wraps every value in a named tag.

- An opening tag `<name>` and a closing tag `</name>` surround each value.
- Tags nest to show structure, and each opening tag needs its closing tag.
- An *attribute* sits inside the opening tag: `<interface type="ethernet">`.
- A *namespace* says which vocabulary a tag belongs to, written as an `xmlns` attribute. It prevents two models that both use the tag `<name>` from being confused.
- Comments look like `<!-- note -->`.

XML is wordier than the other two, but it is strict and can be checked against a schema. **NETCONF** uses XML messages to read and change device configuration, and the data models behind them are defined in a language called YANG.

```console client
$ curl -s https://198.51.100.10/restconf/data/ietf-interfaces:interfaces/interface=GigabitEthernet1%2F0%2F1 \
    -H "Accept: application/yang-data+xml" -u admin:Secret123
<interface xmlns="urn:ietf:params:xml:ns:yang:ietf-interfaces">
  <name>GigabitEthernet1/0/1</name>
  <enabled>true</enabled>
</interface>
```

That is RESTCONF asking an IOS XE switch for one interface and receiving XML. The `xmlns` attribute names the YANG model the tags come from. Change the `Accept` header to `application/yang-data+json` and the same call returns JSON.

```question
prompt = "Which format would you write by hand in an Ansible inventory?"
options = ["XML", "YAML", "SOAP", "HTML"]
answer = 1
why = "Ansible playbooks and inventories use YAML. NETCONF uses XML, and SOAP is a messaging style rather than a data format."
```

## Comparing the three

| | JSON | YAML | XML |
| --- | --- | --- | --- |
| Structure shown by | Braces and brackets | Indentation | Opening and closing tags |
| Readability | Good | Best for people | Bulky |
| Comments | No | Yes (`#`) | Yes (`<!-- -->`) |
| Typical use | REST API bodies | Ansible, config files | NETCONF, older web services |
| Common slip | Trailing comma | Tab in indentation | Missing closing tag |

None of them is better in general. Pick by who consumes the data: APIs speak JSON, people write YAML, and NETCONF requires XML.

```question
prompt = "A colleague's YAML file fails to parse, but every line looks correctly indented. What is a likely cause?"
options = ["A comment was added with #", "A line is indented with a tab character", "The file begins with ---", "A list item starts with a dash"]
answer = 1
why = "YAML forbids tabs for indentation, and a tab looks like spaces in many editors. Comments, document markers and dashes are all normal YAML."
```

```recall
front = "How does YAML show structure, and how does XML?"
back = "YAML: indentation (spaces only), with - for list items. XML: nested opening and closing tags."
```

```recall
front = "Which data format does each use: Ansible, NETCONF, most REST API bodies?"
back = "Ansible: YAML. NETCONF: XML. REST API bodies: usually JSON."
```
