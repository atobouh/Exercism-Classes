+++
title = "REST and HTTP"
summary = "A RESTful API uses HTTP verbs on URIs to create, read, update and delete resources."
links = ["ensa/14/04-apis", "ensa/14/03-reading-json", "ensa/14/08-check-yourself", "field/11/04-crud-and-http-verbs", "field/11/07-api-authentication"]
+++

REST treats everything a server offers as a *resource*: a device, an interface, a user. Each resource has an address. You act on it with a small set of HTTP verbs. Learn the verbs, the address format and the status codes that come back, and you can read the documentation of almost any REST API.

## REST design rules

*REST* (Representational State Transfer) is a set of design constraints, not a protocol. An API that follows them is called *RESTful*.

- **Client-server.** The client asks and the server answers, and each side can change independently.
- **Stateless.** Each request carries everything the server needs. The server does not remember earlier requests from you.
- **Cacheable.** A response can say whether it may be stored and reused, which reduces repeat requests.
- **Uniform interface.** Resources are named in a consistent way and handled with the same few operations.
- **Layered system.** The client cannot tell whether it talks to the final server or to something in between, such as a load balancer.
- **Code on demand** (optional). A server may send code, such as a script, for the client to run.

## Verbs and CRUD

Four operations, *CRUD*, cover what you do with data: create, read, update, delete. Each maps to an HTTP method.

| CRUD operation | HTTP method |
| --- | --- |
| Create | POST |
| Read | GET |
| Update | PUT or PATCH |
| Delete | DELETE |

`PUT` usually replaces a whole resource with the version you send, while `PATCH` changes only the fields you send.

## Reading a URI

Every resource has a *URI* (uniform resource identifier). Take this one:

```text
https://controller.example.com:443/api/v1/devices?type=switch#top
```

| Part | Value | Meaning |
| --- | --- | --- |
| Scheme (protocol) | `https` | How to talk to the server |
| Authority (host) | `controller.example.com:443` | Which server, with an optional port |
| Path | `/api/v1/devices` | The resource on that server |
| Query | `?type=switch` | Filters or options, as `name=value` pairs joined by `&` |
| Fragment | `#top` | A position inside the result, used by the client and not sent to the server |

Query parameters narrow a request. Some APIs also take an *API key* as a query parameter or a header, which identifies the caller.

## A request and its response

A request has four parts: the method, the URI, headers and an optional body. Headers carry details such as `Content-Type` (the format of the body you send), `Accept` (the format you want back) and `Authorization` (your credentials). The data format is usually JSON or XML, named in those headers.

```console client
$ curl -i -H "Accept: application/json" \
    "https://controller.example.com/api/v1/devices?type=switch"
HTTP/1.1 200 OK
Content-Type: application/json

{"devices": [{"hostname": "S1", "type": "switch"}]}
```

The response begins with a status line holding a three-digit code, then headers, then a body.

```question
prompt = "Which HTTP method is normally used to update an existing resource?"
options = ["GET", "POST", "DELETE", "PUT or PATCH"]
answer = 3
why = "PUT replaces a resource and PATCH changes part of it. GET only reads, POST creates, and DELETE removes."
```

## Status codes

| Code | Meaning |
| --- | --- |
| 200 OK | The request worked and the response has data |
| 201 Created | A new resource was made |
| 204 No Content | It worked and there is nothing to return |
| 400 Bad Request | The request was malformed |
| 401 Unauthorized | Credentials are missing or wrong |
| 403 Forbidden | You are known but not allowed to do this |
| 404 Not Found | The resource does not exist |
| 500 Internal Server Error | The server failed while handling a valid request |

Codes beginning 2 mean success, 4 means the client made a mistake, and 5 means the server did.

```trap
401 and 403 are easy to swap. A 401 means the server does not know who you are, so fix your credentials. A 403 means it knows exactly who you are and refuses anyway, so you need different permissions.
```

## Authentication in brief

Most APIs need to know who is calling. Common methods are basic authentication (a username and password), an API key, a bearer token sent in the `Authorization` header, and OAuth, a framework for granting limited access. The Field Guide chapter on [API authentication](field/11/07-api-authentication) covers them in depth.

```recall
front = "Which HTTP method maps to which CRUD operation?"
back = "POST creates, GET reads, PUT or PATCH updates, DELETE deletes."
```

```recall
front = "What do status codes 201, 401 and 404 mean?"
back = "201 Created, 401 Unauthorized (credentials missing or wrong), 404 Not Found."
```
