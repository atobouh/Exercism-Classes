+++
title = "REST principles"
summary = "What makes an API RESTful: resources, URIs and stateless requests."
links = ["field/11/02-http-in-brief", "field/11/04-crud-and-http-verbs", "field/10/03-northbound-and-southbound-apis", "ensa/14/05-rest"]
+++

Say a controller manages 500 switches. You want one way to list them, one way to look at a single switch, and one way to remove one. If each of those had its own invented URL scheme and rules, every API would need its own manual. *REST* gives API designers a shared set of habits, so a person who has used one REST API can guess most of how the next one works.

## REST is a style, not a protocol

*REST* stands for representational state transfer. It is an architectural style, a set of design constraints, not a protocol with a header format. You cannot capture a "REST packet". In practice nearly all REST APIs run over HTTP, which is why you learned [HTTP in brief](field/11/02-http-in-brief) first. An API that follows the style well is called *RESTful*.

## Resources and URIs

The core idea is the *resource*: any thing the API exposes, such as a device, a site, a VLAN or a user. Each resource has a URI. Designers use plural nouns, and the path reads like a filing cabinet:

| URI | What it names |
| --- | --- |
| `/devices` | The *collection* of all devices |
| `/devices/42` | One *member*: the device whose id is 42 |
| `/devices/42/interfaces` | The interfaces that belong to device 42 |
| `/sites` | The collection of sites |

The URI names the thing. The HTTP method says what to do with it. That split matters: the paths hold nouns (`/devices`), and the verbs come from the method, so you will not see `/getDevices` or `/deleteDevice` in a clean REST design. The next page, [CRUD and HTTP verbs](field/11/04-crud-and-http-verbs), covers the methods.

```question
prompt = "Which URI names ONE member of a collection in a RESTful design?"
options = ["/devices", "/devices/42", "/getDevice?id=42", "/devices/list"]
answer = 1
why = "A path ending in a collection name and an id names one member. /devices is the whole collection, and the other two put an action in the path instead of using an HTTP method."
```

## The constraints, in plain words

REST lists a handful of constraints. You do not need to recite them, but you should recognize what each one means in daily use.

| Constraint | In plain words |
| --- | --- |
| Client-server | The client asks and the server answers. Each side can change without breaking the other |
| Stateless | The server keeps no memory of earlier requests. Each request carries everything needed to handle it |
| Cacheable | A response can say whether it may be reused, so repeated reads can be served faster |
| Uniform interface | Resources are named by URIs and handled by a small, fixed set of methods |
| Layered system | There can be proxies, load balancers or gateways in between, and the client cannot tell |
| Code on demand | Optional: the server can send code (such as JavaScript) for the client to run |

## Stateless, and why you send a token every time

*Stateless* is the constraint that surprises people most. A web server that remembers you from one request to the next holds a *session*. A stateless REST server does not. Request number two arrives as a stranger.

This is why every call carries credentials. Once you log in and get a token, you send that token in a header with every request. The server can then answer any request on its own, which lets a controller put a load balancer in front of several server instances: any instance can handle any call, because none of them rely on remembered conversation.

```trap
Stateless does not mean the server stores nothing. The data (devices, sites, users) is stored. What the server does not keep is memory of your previous requests. Whatever it needs to know about you arrives with each request.
```

## Representations

When you ask for `/devices/42`, you do not get the device itself. You get a *representation* of it: a document that describes its current state. The same resource can have several representations, and the client chooses with the `Accept` header:

```console client
$ curl -s https://198.51.100.10/api/v1/devices/42 -H "Accept: application/json"
{"id": 42, "hostname": "SW-FLOOR2"}

$ curl -s https://198.51.100.10/api/v1/devices/42 -H "Accept: application/xml"
<device><id>42</id><hostname>SW-FLOOR2</hostname></device>
```

Same resource, same URI, two formats. Most network APIs default to JSON. NETCONF uses XML. You will compare the formats on [YAML and XML](field/11/06-yaml-and-xml).

## REST compared with SOAP

*SOAP* is an older style for web services. Every message is an XML envelope sent to a single endpoint, and the action is named inside the message. REST spreads actions across many URIs and uses the HTTP method for the verb, with lighter messages (often JSON). SOAP is heavier and stricter. REST won most new API work, which is why the exam and the Cisco controllers talk about it.

```exam
Exams like the CCNA often ask what REST is (an architectural style, not a protocol), what stateless means, and which part of a call names the resource (the URI) and which names the action (the HTTP method).
```

```recall
front = "What does 'stateless' mean for a REST server?"
back = "It keeps no memory of earlier requests. Every request must carry everything needed, such as the auth token."
```

```recall
front = "In a RESTful design, what do the URI and the HTTP method each tell the server?"
back = "The URI names the resource (a noun like /devices/42). The method says the action to take (GET, POST, PUT, DELETE)."
```
