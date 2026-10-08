+++
title = "The web: HTTP and HTTPS"
summary = "A browser requests a page with HTTP. HTTPS wraps the same exchange in encryption."
links = ["itn/15/05-dns", "itn/14/05-port-numbers", "itn/14/06-the-three-way-handshake", "itn/15/01-where-applications-meet-the-network"]
+++

Every page you open starts with a browser asking a web server for a file. The rules for that conversation are the *Hypertext Transfer Protocol* (HTTP). Its secure form, HTTPS, carries the same messages inside an encrypted channel. Knowing what the browser sends, to which port and in what order helps when a page will not load and you need to decide whether the problem is the name, the connection or the server.

## Reading a URL

A *URL* (uniform resource locator) tells the browser what to fetch and how.

```console
https://www.example.com/shop/boots.html
```

- **Protocol:** `https://` says which protocol to use. `http://` is the unencrypted version.
- **Server name:** `www.example.com` is the server to contact. DNS turns it into an IP address.
- **Path and resource:** `/shop/boots.html` names the file on that server. If the path is missing, the server sends a default page.

## From Enter key to page

The browser cannot send anything until it has an address for the name. Then it needs a transport connection.

| Step | What happens |
| --- | --- |
| 1 | You type or click a URL. The browser splits it into protocol, name and path. |
| 2 | The browser asks DNS for the IP address of the server name. |
| 3 | The browser opens a TCP connection to that address: port 80 for HTTP, port 443 for HTTPS. |
| 4 | With HTTPS, client and server set up encryption (TLS) before any request is sent. |
| 5 | The browser sends a request for the resource. |
| 6 | The server sends a response with the file. |
| 7 | The browser renders the page. If it needs more files (images, scripts), it requests each one the same way. |

```question
prompt = "A user opens https://www.example.com. Which destination port does the browser's TCP connection use?"
options = ["TCP 80", "TCP 25", "TCP 443", "UDP 53"]
answer = 2
why = "HTTPS uses TCP port 443. Port 80 is for plain HTTP. DNS lookups use port 53, and that happens before this connection."
```

## Requests and responses

HTTP is a *request-response* protocol. The client sends a request and the server answers with a response. The request says what the client wants done, using a *method*:

| Method | Meaning | Typical use |
| --- | --- | --- |
| GET | Retrieve a resource | Loading a page or an image |
| POST | Send data to the server to process | Submitting a login form or an order |
| PUT | Upload a resource to the server | Storing a file or replacing a record |

A request for a page looks like this on the wire:

```console
GET /shop/boots.html HTTP/1.1
Host: www.example.com
```

Every response starts with a status code. Codes in the 200s mean success, 300s mean the resource has moved, 400s mean the client made an error, and 500s mean the server failed.

| Code | Meaning |
| --- | --- |
| 200 | OK, the response holds the resource |
| 301, 302 | The resource has moved, go to the new address |
| 404 | Not found: the server is up but has no such resource |
| 500 | Internal server error |

A 404 tells you something useful: the whole path to the server works. Only the resource is missing.

## Stateless and in clear text

HTTP is *stateless*. The server treats each request as a new one and does not remember the one before. Sites that need to remember you (a shopping basket, a login) add that memory on top, usually with small pieces of data the browser sends back with each request.

Plain HTTP also sends everything as readable text. Anyone who can capture the traffic, on shared Wi-Fi for example, can read the pages, form data and passwords.

## HTTPS

HTTPS is HTTP carried inside *TLS* (Transport Layer Security). TLS adds two things:

- **Encryption.** Captured traffic is unreadable without the keys.
- **Server authentication.** The server proves its identity with a certificate, so you know you reached the real `www.example.com`.

The methods, status codes and pages are unchanged. Only the channel is protected. The padlock in a browser means the connection is encrypted and the certificate checks out. It does not mean the site is trustworthy.

```trap
HTTPS protects data on the way. It does not tell you the site is honest or safe, and it does not hide which server you contacted.
```

```recall
front = "Which ports do HTTP and HTTPS use?"
back = "HTTP uses TCP 80. HTTPS uses TCP 443."
```

```recall
front = "What do the HTTP methods GET, POST and PUT do?"
back = "GET retrieves a resource, POST sends data to the server to process, and PUT uploads a resource."
```

```recall
front = "What does HTTP status 404 mean?"
back = "Not found. The server was reached but has no resource at that path."
```

```recall
front = "What does HTTPS add to HTTP?"
back = "TLS encryption and server authentication by certificate."
```
