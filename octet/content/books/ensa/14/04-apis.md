+++
title = "APIs"
summary = "An API is a contract that lets one program ask another for data or actions."
links = ["ensa/14/05-rest", "ensa/14/03-reading-json", "ensa/13/07-sdn-architecture", "field/11/01-why-machines-need-apis"]
+++

In a restaurant you do not walk into the kitchen to cook your own meal. You read a menu, tell the waiter what you want, and a plate comes back. The menu lists what you may ask for, and the waiter carries the request and the answer. You never need to know how the kitchen is laid out.

An *API* (application programming interface) plays the waiter's part between two programs. It defines what one program may ask of another, how to phrase the request, and what shape the answer takes. The program asking is the *client*. The program answering is the *server*. As long as the contract holds, either side can change its inner workings without breaking the other.

## Why networks care

A controller such as Cisco Catalyst Center holds a list of every device it manages. A script that needs that list does not log in and scrape a screen. It sends a request to the controller's API and gets structured data back, ready to read. The same pattern lets one tool open a trouble ticket, another read an interface counter and a third change a policy.

The [SDN pages](ensa/13/07-sdn-architecture) described northbound and southbound APIs. The ideas below apply to any API, whatever direction it faces.

## Who may use an API

APIs are grouped by who is allowed to call them.

- An *open* (or *public*) API is available to any developer. Access may require registering for a key, but the provider wants outsiders to use it. A weather service is a typical example.
- An *internal* (or *private*) API is for use inside one organization. Its staff and their own applications use it, and outsiders cannot reach it.
- A *partner* API is shared with specific business partners. Access is restricted and usually governed by an agreement, such as a supplier that lets approved customers check stock levels.

```question
prompt = "A parts supplier lets only its contracted distributors query live stock through a web interface. Which type of API is this?"
options = ["Open (public)", "Internal (private)", "Partner", "Local"]
answer = 2
why = "Access is limited to business partners under an agreement, which is a partner API. An internal API stays inside the company, and an open API is available to anyone."
```

## Web service types

Many APIs run over the web, using HTTP to carry requests. A *web service* API follows one of several styles. They differ in message format and in how strict the rules are.

| Type | Data format | Notes |
| --- | --- | --- |
| SOAP | XML | Rigid structure with an envelope around each message. Mostly found in older enterprise software |
| REST | Usually JSON, XML also possible | Uses HTTP methods on resources. The most common style for new APIs |
| XML-RPC | XML | Calls a remote procedure, with the call and its arguments written in XML |
| JSON-RPC | JSON | The same idea as XML-RPC, using JSON, which is lighter |

*SOAP* (Simple Object Access Protocol) defines exactly how a message is wrapped, so it is formal but heavy. *REST* (Representational State Transfer) is a set of design rules rather than a protocol, and the [next page](ensa/14/05-rest) covers it. The two *RPC* (remote procedure call) styles work differently from REST: the client names a function it wants run on the server and passes the arguments, and the server returns the result.

## Why REST is the common choice

REST dominates for network devices and controllers for practical reasons:

- It runs over HTTP, so any language, tool or browser that speaks HTTP can use it.
- Its messages are usually JSON, which is compact and maps naturally onto data structures in nearly every language.
- The pattern is uniform. Once you know how to read, create, change and delete one resource, you know the shape of all of them.
- The server does not hold session state between requests, which suits scripts that make many independent calls.

```key
An API is a contract between a client program and a server program. The type depends on who may call it (open, internal or partner), and the style depends on how messages are built (SOAP, REST, XML-RPC or JSON-RPC).
```

## The contract in practice

To get a feel for the contract, imagine a client asking a controller for its devices. The client names a resource and a verb, and the server replies with data. Nothing in that exchange depends on how the controller stores devices. That separation is the point of an API, and the next page shows the real mechanics.

```recall
front = "Name the four web service API styles."
back = "SOAP, REST, XML-RPC and JSON-RPC."
```

```recall
front = "What is the difference between an internal API and a partner API?"
back = "An internal (private) API is used only inside one organization. A partner API is shared with selected outside business partners."
```
