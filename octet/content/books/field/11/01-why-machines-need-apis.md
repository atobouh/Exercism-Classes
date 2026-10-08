+++
title = "Why machines need APIs"
summary = "Screen-scraping CLI output breaks; an API gives programs structured data and a stable contract."
links = ["field/10/03-northbound-and-southbound-apis", "field/10/06-catalyst-center", "field/12/01-configuration-at-scale", "ensa/14/04-apis"]
+++

Picture a script that logs in to 200 switches and checks which interfaces are down. It runs `show ip interface brief`, splits each line on spaces, and reads the fifth word as the status. It works for a year. Then an upgrade changes a column width, or an interface description contains a space, and the script quietly reports nonsense. Nobody changed the network. Someone changed how the text was laid out.

This chapter is about the fix: letting programs ask for data in a form made for programs. You will meet the web technologies behind it (HTTP, REST, JSON) and finish by reading a complete exchange with a network controller.

## The problem with screen scraping

The CLI is built for people. The output has headings, alignment, abbreviations and blank lines that help your eyes and hurt a program.

```console S1
S1# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
Vlan1                  192.168.1.2     YES manual up                    up
GigabitEthernet1/0/1   unassigned      YES unset  up                    up
GigabitEthernet1/0/2   unassigned      YES unset  down                  down
```

A person sees at once that Gi1/0/2 is down. A script has to guess: where does one column end, what if a status is `administratively down` (two words), what if a future release adds a column? Pulling values out of text like this is called *screen scraping*. It depends on a layout that nobody promised to keep.

Now compare the same fact delivered as structured data:

```text
{"name": "GigabitEthernet1/0/2", "status": "down", "protocol": "down"}
```

Each value has a label. The program asks for `status` by name and gets `down`. A new field can be added next to it and nothing breaks.

## What an API is

An *API* (application programming interface) is a defined way for one program to ask another for data or to make it do something. The word *defined* is the point. The provider publishes what you can ask for, how to ask, and what the answer will look like. As long as it keeps that promise, your code keeps working, even when the provider changes everything inside.

Two ideas make an API useful to network automation:

- **Structured data.** Answers come as labeled values (you will learn JSON, YAML and XML in this chapter), not as formatted text.
- **A contract.** The request format, the response format and the error codes are documented and versioned. That is why many URIs contain `/v1/`.

```key
Human-readable output is for eyes. Structured data is for programs. An API is the agreed doorway between a program and a system, with a documented request and a predictable answer.
```

## Where you meet network APIs

You will find APIs at three places:

| Where | Examples | Typical use |
| --- | --- | --- |
| Controllers | Catalyst Center, Meraki Dashboard, Catalyst SD-WAN Manager | Read inventory, push intent, pull health data for a whole network |
| Devices | RESTCONF and NETCONF on IOS XE | Read or change one device's configuration and state |
| Clouds | AWS, Azure, Google Cloud | Create networks, subnets and firewall rules as code |

Controllers matter most for the exam and for daily work. The [northbound API](field/10/03-northbound-and-southbound-apis) of a controller is what scripts and applications call, and the [Catalyst Center](field/10/06-catalyst-center) platform exposes nearly everything its web interface can do.

```question
prompt = "A script parses `show interfaces status` text by splitting each line on spaces. After an upgrade the output gains a column and the script reports wrong results. What is the root cause?"
options = ["The switch lost data in the upgrade", "The script depends on a text layout that was never a stable contract", "The script should use Telnet instead of SSH", "The script needs a faster connection to the switch"]
answer = 1
why = "The device still reports the right facts. Text output is meant for people, and nothing guarantees its columns stay put. An API guarantees field names."
```

## Web APIs ride on HTTP

Most modern network APIs are *web APIs*. They use HTTP (or HTTPS), the same protocol your browser uses to fetch pages. You can read about it in [web, HTTP and HTTPS](itn/15/03-web-http-https). Because of that, the tools that fetch a web page can also drive a network: `curl` on a command line, Postman on a desktop, the `requests` library in Python. A request goes to a URL, and the answer comes back with a status code and a body, usually in JSON.

That also means your existing knowledge carries over. TCP 443 must be open between you and the controller. DNS must resolve its name. A certificate must be trusted. When an API call fails, the first checks look much like any other connectivity problem.

```recall
front = "What is an API in one sentence?"
back = "A defined way for a program to ask another system for data or actions, with a documented request and response format."
```

## The plan for this chapter

1. [HTTP in brief](field/11/02-http-in-brief): the request and response every call is built from.
2. [REST principles](field/11/03-rest-principles): resources, URIs and stateless requests.
3. [CRUD and HTTP verbs](field/11/04-crud-and-http-verbs): which method creates, reads, updates and deletes.
4. [JSON](field/11/05-json) and then [YAML and XML](field/11/06-yaml-and-xml): the data formats.
5. [API authentication](field/11/07-api-authentication): proving who you are without sending a password every time.
6. [Reading an API exchange](field/11/08-reading-an-api-exchange): a full call, start to finish, and what to check when it fails.

```recall
front = "Why is scraping `show` command text fragile?"
back = "The layout is made for people and can change between releases. An API returns labeled fields under a documented contract."
```
