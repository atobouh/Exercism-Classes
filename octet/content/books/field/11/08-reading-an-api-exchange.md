+++
title = "Reading an API exchange"
summary = "A full worked call to a controller, from token to JSON response, and what to check when it fails."
links = ["field/11/02-http-in-brief", "field/11/04-crud-and-http-verbs", "field/11/05-json", "field/11/07-api-authentication", "field/10/06-catalyst-center", "field/12/07-scripts-and-libraries", "field/14/07-tools-of-the-trade"]
+++

You now have every piece: HTTP requests, verbs, JSON and tokens. This page puts them in order by following one real-shaped task from start to finish. The task: get the list of devices from a Catalyst Center controller at `198.51.100.10` and print each hostname with its management address.

## Step 1: get a token

The login is a `POST` to the token path, with basic authentication.

```console client
$ curl -s -X POST https://198.51.100.10/dna/system/api/v1/auth/token \
    -u admin:Cisco123! -H "Content-Type: application/json"
{"Token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2..."}
```

The reply is a JSON object with one key, `Token`. Its value is a long string. Copy it: the next call needs it. (If your lab controller uses a self-signed certificate, `curl` refuses it. Adding `-k` skips the check for a throwaway lab. Never do that against a production system.)

## Step 2: list the devices

The device list is a `GET`, and the token goes in the `X-Auth-Token` header.

```console client
$ curl -s https://198.51.100.10/dna/intent/api/v1/network-device \
    -H "X-Auth-Token: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." \
    -H "Accept: application/json"
{
  "response": [
    {
      "hostname": "SW-FLOOR2.example.com",
      "managementIpAddress": "10.10.2.5",
      "family": "Switches and Hubs",
      "platformId": "C9300-48P",
      "softwareVersion": "17.9.4",
      "reachabilityStatus": "Reachable",
      "id": "f2b1c9e0-5d3a-4b7e-9c11-0a1b2c3d4e5f"
    },
    {
      "hostname": "R1.example.com",
      "managementIpAddress": "10.10.1.1",
      "family": "Routers",
      "platformId": "ISR4331/K9",
      "softwareVersion": "17.9.4",
      "reachabilityStatus": "Reachable",
      "id": "0c9d8e7f-6a5b-4c3d-8e2f-1a0b9c8d7e6f"
    }
  ],
  "version": "1.0"
}
```

Real responses carry many more fields per device. This one is shortened. To narrow it down, add a query string, such as `?family=Switches%20and%20Hubs`.

## Reading the response

Read it from the outside in, as on the [JSON](field/11/05-json) page:

1. The outer object has two keys, `response` and `version`.
2. `response` is an array, one object per device.
3. Each device object has `hostname`, `managementIpAddress` and more.

So the first hostname is at `response[0].hostname`, which is `SW-FLOOR2.example.com`, and the first management address is at `response[0].managementIpAddress`, which is `10.10.2.5`. The `id` is a unique device identifier, and later calls (such as getting one device's interfaces) use it in the path.

```question
prompt = "In the response above, which path returns the management IP address of the router R1?"
options = ["response[0].managementIpAddress", "response[1].managementIpAddress", "response.managementIpAddress", "version[1].managementIpAddress"]
answer = 1
why = "The router is the second object in the response array, so its position is 1. Position 0 is the switch."
```

## The same call in Python

The `requests` library turns the two steps into a few lines.

```text
import requests

base = "https://198.51.100.10"

reply = requests.post(base + "/dna/system/api/v1/auth/token",
                      auth=("admin", "Cisco123!"), verify="lab-ca.pem")
token = reply.json()["Token"]

reply = requests.get(base + "/dna/intent/api/v1/network-device",
                     headers={"X-Auth-Token": token}, verify="lab-ca.pem")

for device in reply.json()["response"]:
    print(device["hostname"], device["managementIpAddress"])
```

```console client
$ python3 list_devices.py
SW-FLOOR2.example.com 10.10.2.5
R1.example.com 10.10.1.1
```

`reply.json()` converts the JSON text into a Python dictionary and list, so `["response"]` is the array and `device["hostname"]` is a value. This is the dictionary-and-list model of JSON made real. In a real script, read the password from an environment variable, as covered in [API authentication](field/11/07-api-authentication). More script patterns are in [scripts and libraries](field/12/07-scripts-and-libraries).

```command
prompt = "List this controller's devices with curl by sending a GET. Type the method name only."
mode = "client$"
answer = ["GET"]
why = "Reading a collection is the Read in CRUD, and its HTTP method is GET."
```

## When it fails

Check the status code first. It points to the cause.

| Code | Likely cause | What to do |
| --- | --- | --- |
| 401 | Missing, wrong or expired token or password | Request a new token, and check the header name |
| 403 | Authenticated but not allowed | Check the account's role or permissions |
| 404 | Wrong path or a resource that does not exist | Compare the path with the API documentation, including the version |
| 400 | Bad body or parameter, such as invalid JSON | Validate the JSON and check required fields |
| 5xx | The server failed | Retry later and check the controller's health |

Beyond status codes: no response at all means a network problem, not an API problem. Check that you can reach TCP 443 on the controller, that its name resolves, and that its certificate is trusted.

```question
prompt = "A GET to the device list with a valid, fresh token returns 404 Not Found. What is the most likely cause?"
options = ["The token has expired", "The account is not allowed to read devices", "The path is wrong, for example a typo or the wrong API version", "The JSON body is invalid"]
answer = 2
why = "404 means the server found no resource at that path. An expired token gives 401, a permissions problem gives 403, and a GET has no body to be invalid."
```

## Tools

- **curl**: scriptable, installed nearly everywhere, ideal for one-off checks.
- **Postman**: a desktop tool where you build requests, save them and inspect responses visually.
- **Python with requests**: for repeatable work and anything with loops or logic.
- **The controller's API documentation**: usually a page on the controller itself, listing every path, parameter and example. Read it before guessing, and see also [tools of the trade](field/14/07-tools-of-the-trade).

## Check yourself

```question
prompt = "Which pair is correct?"
options = ["POST reads data, 200 means failure", "DELETE removes a resource, a successful empty reply is often 204", "PUT creates a collection, 404 means success", "GET changes data, 500 means the client erred"]
answer = 1
why = "DELETE removes, and 204 No Content is a normal success with no body. The other options each pair something with the wrong meaning."
```

```question
prompt = "Which two are true of a bearer token?"
options = ["It is sent in a header with each request", "It never expires", "Whoever holds it is treated as the user", "It is only used over plain HTTP"]
answer = [0, 2]
why = "A bearer token travels in a header and grants access to whoever presents it, so it must be protected. Tokens expire, and they should only travel over HTTPS."
```

```question
prompt = "This body is sent in a POST and the server replies 400: {\"name\": \"Branch-West\", \"timezone\": \"UTC\",}. What is wrong?"
options = ["Keys must use single quotes", "A trailing comma makes the JSON invalid", "POST cannot carry a body", "The timezone must be a number"]
answer = 1
why = "JSON forbids a comma after the last pair. The keys correctly use double quotes, POST can have a body and a timezone is a string."
```

```recall
front = "What are the two steps of a typical controller API call?"
back = "1. POST with basic auth to the token path to get a token. 2. Send the token in a header (X-Auth-Token on Catalyst Center) with each later request."
```

```recall
front = "A call returns 400, 401, 403 or 404. What does each tell you?"
back = "400: bad request body or parameter. 401: bad, missing or expired credentials. 403: authenticated but not allowed. 404: wrong path or no such resource."
```
