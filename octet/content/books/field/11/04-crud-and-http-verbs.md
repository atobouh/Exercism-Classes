+++
title = "CRUD and HTTP verbs"
summary = "Create, read, update and delete, and the HTTP method that does each."
links = ["field/11/03-rest-principles", "field/11/02-http-in-brief", "field/11/08-reading-an-api-exchange", "ensa/14/05-rest"]
+++

Almost everything you do to data falls into four actions: make a new item, look at an item, change an item, remove an item. Software people shorten that to *CRUD*: Create, Read, Update, Delete. REST APIs map each action to an HTTP method (also called a *verb*), so the same four methods work on devices, sites, users and VLANs alike.

## The mapping

| CRUD action | HTTP method | Typical use |
| --- | --- | --- |
| Create | `POST` | Add a new resource to a collection |
| Read | `GET` | Fetch a resource or a list |
| Update | `PUT` or `PATCH` | Change an existing resource |
| Delete | `DELETE` | Remove a resource |

`POST` goes to the collection (`/sites`), because the server decides the new item's id. `GET`, `PUT`, `PATCH` and `DELETE` on one item go to its own URI (`/sites/7`).

## PUT versus PATCH

Both update, but they differ in how much you send.

- `PUT` **replaces** the whole resource. You send the complete new version. Fields you leave out may be reset or removed.
- `PATCH` **changes part** of it. You send only the fields that change.

Say a user record has a name, an email and a role. To change only the role, `PATCH` with `{"role": "operator"}` leaves the name and email alone. A `PUT` with just the role could wipe the name and email on a strict server. Not every API supports `PATCH`, so read its documentation.

```question
prompt = "A site resource has name, address and timezone. You need to fix only the timezone. Which call is the best fit?"
options = ["POST /sites with the new timezone", "PATCH /sites/7 with only the timezone", "DELETE /sites/7, then POST it again", "GET /sites/7 with the timezone in the URL"]
answer = 1
why = "PATCH changes part of an existing resource. POST would create a second site, and deleting then recreating loses the id and anything attached to it."
```

## Safe and idempotent

Two properties explain why the methods are not interchangeable:

- A *safe* method changes nothing on the server. `GET` is safe, so you can call it as often as you like.
- An *idempotent* method gives the same end result whether you call it once or ten times. `GET`, `PUT` and `DELETE` are idempotent. Deleting device 42 twice leaves the same world as deleting it once (the second call may return 404, but nothing new is lost).
- `POST` is neither. Each `POST` to `/sites` can create another site.

This matters when a network hiccup makes you unsure whether a call arrived. Retrying a `PUT` or `DELETE` is harmless. Retrying a `POST` may create a duplicate.

| Method | Safe | Idempotent |
| --- | --- | --- |
| GET | Yes | Yes |
| PUT | No | Yes |
| PATCH | No | Not guaranteed |
| DELETE | No | Yes |
| POST | No | No |

## The full table

| CRUD action | HTTP verb | Idempotent | Typical success code |
| --- | --- | --- | --- |
| Create | POST | No | 201 Created |
| Read | GET | Yes | 200 OK |
| Update (replace) | PUT | Yes | 200 OK or 204 No Content |
| Update (partial) | PATCH | Not guaranteed | 200 OK or 204 No Content |
| Delete | DELETE | Yes | 200 OK or 204 No Content |

```recall
front = "Which HTTP method replaces a whole resource, and which changes only part of it?"
back = "PUT replaces the whole resource. PATCH changes part of it."
```

## Examples against a controller

Here are the four actions on a made-up controller. A controller's real paths differ, but the shape is the same.

```console client
$ curl -s -X GET https://198.51.100.10/api/v1/devices -H "Authorization: Bearer abc123"
{"response": [{"id": 42, "hostname": "SW-FLOOR2"}, {"id": 43, "hostname": "SW-FLOOR3"}]}

$ curl -s -X POST https://198.51.100.10/api/v1/sites -H "Authorization: Bearer abc123" \
    -H "Content-Type: application/json" -d '{"name": "Branch-West", "timezone": "UTC"}'
{"id": 7, "name": "Branch-West", "timezone": "UTC"}

$ curl -s -X PATCH https://198.51.100.10/api/v1/devices/42 -H "Authorization: Bearer abc123" \
    -H "Content-Type: application/json" -d '{"hostname": "SW-FLOOR2-A"}'

$ curl -s -X DELETE https://198.51.100.10/api/v1/users/15 -H "Authorization: Bearer abc123"
```

The first lists devices (Read). The second adds a site (Create) and the server returns the new site with the id it chose. The third renames a device (Update) and the fourth removes a user (Delete). The last two print nothing in the body, because the server answered `204 No Content`, which is a success with nothing to show.

```command
prompt = "Which HTTP method creates a new resource in a collection? Type it in capitals."
mode = "client$"
answer = ["POST"]
why = "POST sends a new item to a collection URI, and the server creates it and normally returns 201 Created."
```

## A common misconception

Many APIs also use `POST` for things that are not creation: "run this command", "start a discovery", "sync this device". That works, and you will see it. But in CRUD terms, `POST` maps to Create, and that is what exams ask. If a question says "which method creates a resource", the answer is `POST` even though real APIs bend the rule.

```trap
Do not answer "PUT" for create just because PUT can also create in some APIs. In the standard CRUD mapping, Create is POST and Update is PUT or PATCH.
```

```question
prompt = "Which method is neither safe nor idempotent, so a blind retry might create a duplicate?"
options = ["GET", "PUT", "DELETE", "POST"]
answer = 3
why = "POST makes a new resource each time it succeeds. GET is safe, and PUT and DELETE are idempotent."
```

```recall
front = "Map CRUD to HTTP methods."
back = "Create: POST. Read: GET. Update: PUT or PATCH. Delete: DELETE."
```

```recall
front = "What does 'idempotent' mean, and which of GET, POST, PUT, DELETE are idempotent?"
back = "Repeating the call gives the same end result as doing it once. GET, PUT and DELETE are. POST is not."
```

```recall
front = "What status code usually answers a successful POST that created something?"
back = "201 Created."
```
