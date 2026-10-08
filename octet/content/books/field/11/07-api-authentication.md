+++
title = "API authentication"
summary = "Basic auth, API keys, bearer tokens and OAuth, and how to keep them safe."
links = ["field/11/02-http-in-brief", "field/11/03-rest-principles", "field/11/08-reading-an-api-exchange", "field/10/06-catalyst-center", "field/07/05-radius-and-tacacs"]
+++

An API that anyone can call is an API that anyone can misuse. A controller can reconfigure a whole campus, so it must know who is asking before it answers. *Authentication* is the step where the caller proves identity. Because REST is [stateless](field/11/03-rest-principles), the proof has to travel with every request. The ways of doing that differ in what is sent, how long it lasts and what happens if someone steals it.

## Basic authentication

With *basic authentication* the client sends a username and password with each request, in the `Authorization` header. The two are joined as `username:password` and encoded with Base64.

```console client
$ echo -n 'admin:Cisco123!' | base64
YWRtaW46Q2lzY28xMjMh

$ curl -s https://198.51.100.10/api/v1/devices -H "Authorization: Basic YWRtaW46Q2lzY28xMjMh"
```

`curl -u admin:Cisco123!` builds that same header for you.

```trap
Base64 is an encoding, not encryption. Anyone who sees the header can reverse it in one command. Basic authentication is only acceptable inside HTTPS, where TLS encrypts the whole request, header included. Over plain HTTP it hands the password to every device on the path.
```

## API keys

An *API key* is a long random string issued to a user or an application. The client sends it in a header with each request, often one named `X-API-Key` or something vendor-specific.

```text
GET /api/v1/networks HTTP/1.1
Host: dashboard.example.com
X-API-Key: 8d3f0c91a7e24b5c9a1d6e7f
```

Some APIs also accept the key as a query parameter (`?api_key=...`). That works, but it is less safe, because URLs end up in server logs, browser history and proxy logs. Prefer the header.

A key has no built-in expiry, so it lives until someone revokes it. That makes it convenient for scripts and costly if it leaks.

## Token-based authentication

With *token authentication* the client logs in once with a username and password. The server returns a *token*, a string that stands for that login. The client then sends the token with every later request and does not send the password again.

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

The word *bearer* means that whoever holds the token is treated as the user, so it must be guarded like a password. Tokens are valid for a limited time, often minutes to hours. When one expires, the server answers 401 and the client logs in again for a fresh one. Short life is the safety feature: a stolen token stops working soon.

Vendors differ in the header name. Many use `Authorization: Bearer <token>`. Cisco Catalyst Center uses its own header, `X-Auth-Token`.

### The Catalyst Center example

On [Catalyst Center](field/10/06-catalyst-center), you get a token with a `POST` that carries basic authentication, and you use the token on later calls:

```console client
$ curl -s -X POST https://198.51.100.10/dna/system/api/v1/auth/token \
    -u admin:Cisco123! -H "Content-Type: application/json"
{"Token": "eyJhbGciOiJSUzI1NiIs..."}

$ curl -s https://198.51.100.10/dna/intent/api/v1/network-device \
    -H "X-Auth-Token: eyJhbGciOiJSUzI1NiIs..."
```

So one API can use two schemes: basic authentication only at the front door to obtain the token, and the token for everything else. You will walk through this on [Reading an API exchange](field/11/08-reading-an-api-exchange).

```question
prompt = "A script gets a token from a controller at 09:00 and uses it for every call. At 10:30 every call starts returning 401. What is the most likely reason?"
options = ["The token expired and the script must request a new one", "The controller changed from REST to SOAP", "The HTTP method must be changed to PUT", "Base64 stopped working"]
answer = 0
why = "Tokens have a limited lifetime. A 401 on calls that worked earlier points to an expired token, so the script should log in again."
```

## OAuth 2.0

*OAuth 2.0* is an authorization framework built for the case where one application needs limited access to your data held by another, without ever seeing your password. The familiar example is "sign in with" a large account provider.

The pieces:

- The user owns the data and approves the access.
- An *authorization server* checks the user and issues an *access token*.
- The token carries *scopes*, which spell out what it may do, such as read-only access to inventory.
- The application sends the access token to the API, which accepts or rejects it.
- A *refresh token* lets the application get a new access token after the first expires, without asking the user again.

For network work, OAuth shows up in cloud and SaaS management APIs and in integrations between products. The main idea to hold: the application gets a scoped, expiring token and never the password.

## Comparing the four

| Method | What is sent | Expiry | Typical use |
| --- | --- | --- | --- |
| Basic | Base64 of `user:password` on every call | None (password lasts until changed) | Getting a token, quick tests, simple devices |
| API key | One long secret string in a header | Until revoked | Scripts and services against cloud dashboards |
| Token (bearer) | Token from a login, in a header | Minutes to hours | Controllers such as Catalyst Center |
| OAuth 2.0 | Scoped access token, refreshed with a refresh token | Short, renewable | Third-party access, SaaS and cloud |

```question
prompt = "Which scheme lets a third-party application act on your behalf with limited scope, without ever receiving your password?"
options = ["Basic authentication", "A shared API key", "OAuth 2.0", "Base64 encoding"]
answer = 2
why = "OAuth 2.0 issues scoped, expiring access tokens. Basic authentication sends the password itself, and a shared API key carries full power with no scope or expiry."
```

## Keeping credentials safe

- **Always use HTTPS.** Without TLS, every scheme above exposes its secret.
- **Give the least privilege.** Create a read-only account for scripts that only read inventory.
- **Rotate keys and passwords** on a schedule and when a person leaves.
- **Never hard-code secrets in a script.** A password pasted into a file ends up in version control. Read it from an environment variable or a secrets manager.
- **Do not log full headers.** A debug log containing `Authorization` has just stored your credentials.

```exam
Exams like the CCNA often ask you to match an authentication type to its description: basic (username and password), API key (a secret string), token (obtained by logging in, then sent each time) and OAuth (delegated, scoped access). The newer exam blueprint lists authentication types by name.
```

```recall
front = "Why is HTTP basic authentication unsafe without HTTPS?"
back = "The credentials are only Base64-encoded, which is reversible by anyone. TLS from HTTPS is what protects them."
```

```recall
front = "How does token authentication work?"
back = "Log in once, receive a token that expires, then send it in a header (Authorization: Bearer, or X-Auth-Token on Catalyst Center) with every request."
```

```recall
front = "What is a scope in OAuth 2.0?"
back = "A limit on what an access token may do, such as read-only access to inventory."
```
