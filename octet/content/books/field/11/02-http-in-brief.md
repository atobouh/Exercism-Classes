+++
title = "HTTP in brief"
summary = "The request and response that every REST call is built from."
links = ["itn/15/03-web-http-https", "field/11/03-rest-principles", "field/11/07-api-authentication"]
+++

Every REST call is an HTTP conversation: one request goes out, one response comes back. If you can read both halves, you can read any API exchange, whatever the vendor. This page takes them apart piece by piece. For the wider picture of web traffic, see [web, HTTP and HTTPS](itn/15/03-web-http-https).

## The request

A *request* has four parts:

1. A **method**, the action to take (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
2. A **URI**, the thing to act on.
3. **Headers**, lines of extra information about the request.
4. An optional **body**, the data you send, used when you create or change something.

```console client
$ curl -i -X GET "https://198.51.100.10/api/v1/devices?family=Switches" \
    -H "Accept: application/json" -H "Authorization: Bearer abc123"
```

On the wire, the first lines of that request look like this:

```text
GET /api/v1/devices?family=Switches HTTP/1.1
Host: 198.51.100.10
Accept: application/json
Authorization: Bearer abc123
```

The first line holds the method, the path with its query string, and the HTTP version. A blank line ends the headers. A `GET` has no body, so nothing follows.

## Reading a URI

A *URI* (uniform resource identifier) names a resource. In API work you almost always see a full URL. Take this one apart:

```text
https://controller.example.com:443/dna/intent/api/v1/network-device?family=Switches
```

| Part | Value | Meaning |
| --- | --- | --- |
| Scheme | `https` | The protocol. HTTPS is HTTP inside TLS encryption |
| Host | `controller.example.com` | The server, by name or IP address |
| Port | `443` | Optional when it is the default (80 for HTTP, 443 for HTTPS) |
| Path | `/dna/intent/api/v1/network-device` | Which resource on the server |
| Query string | `?family=Switches` | Filters or options, as `key=value` pairs joined with `&` |

The path is the noun of the call. The query string narrows it: it asks for the devices whose family is Switches, not all of them. Characters such as spaces must be percent-encoded in a URL, so a space becomes `%20`.

```question
prompt = "In the URL https://10.1.1.5:8443/api/v1/sites?limit=10, what is /api/v1/sites?"
options = ["The host", "The path", "The query string", "The scheme"]
answer = 1
why = "The path comes after the host and port and before the question mark. The part starting at ? is the query string."
```

## Headers that matter

Headers are `Name: value` lines. Three do most of the work in API calls:

| Header | Sent by | Purpose |
| --- | --- | --- |
| `Content-Type` | Whoever sends a body | Format of the body being sent, such as `application/json` |
| `Accept` | Client | Format the client wants back |
| `Authorization` | Client | Proof of identity, such as a bearer token (see [API authentication](field/11/07-api-authentication)) |

When you send JSON in a `POST`, set `Content-Type: application/json`. If you leave it out, many servers reject the body or misread it.

## The response

A *response* has a **status line** (version, status code, short reason phrase), **headers** and usually a **body**.

```console client
$ curl -i https://198.51.100.10/api/v1/devices/42 -H "Authorization: Bearer abc123"
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 71

{"id": 42, "hostname": "SW-FLOOR2", "managementIp": "10.10.2.5"}
```

The status code is the first thing to read. It tells you whether the call worked before you look at the body.

## Status code classes

The first digit gives the class:

| Class | Meaning | Example |
| --- | --- | --- |
| 1xx | Informational, still working | 100 Continue |
| 2xx | Success | 200 OK |
| 3xx | Redirect, look elsewhere | 301 Moved Permanently |
| 4xx | Client error, your request is wrong | 404 Not Found |
| 5xx | Server error, the server failed | 500 Internal Server Error |

The codes you will see daily:

| Code | Name | Typical cause |
| --- | --- | --- |
| 200 | OK | The request worked and the body holds the result |
| 201 | Created | A `POST` made a new resource |
| 204 | No Content | It worked, and there is nothing to return |
| 400 | Bad Request | Malformed body or missing parameter |
| 401 | Unauthorized | Missing, bad or expired credentials |
| 403 | Forbidden | Known user, but not permitted to do this |
| 404 | Not Found | No such path or resource |
| 500 | Internal Server Error | The server hit a fault |

```key
4xx means fix your request. 5xx means the server has the problem. 401 means "who are you?" and 403 means "I know who you are, and the answer is no."
```

```question
prompt = "A call returns 401 Unauthorized. What should you check first?"
options = ["Whether the user's role allows this action", "Whether the token or password is present, correct and not expired", "Whether the server has run out of memory", "Whether the path has a typo"]
answer = 1
why = "401 means the server could not establish who you are. A role problem is 403, a typo in the path is 404 and a server fault is 5xx."
```

```recall
front = "What is the difference between HTTP 401 and 403?"
back = "401: not authenticated (missing, bad or expired credentials). 403: authenticated, but not allowed to do that."
```

```recall
front = "Name the four parts of an HTTP request."
back = "Method, URI, headers and an optional body."
```

```recall
front = "What does the status code class 4xx mean, and 5xx?"
back = "4xx: client error, the request is wrong. 5xx: server error, the server failed."
```
