+++
title = "DNS"
summary = "DNS turns names into addresses through a hierarchy of servers."
links = ["itn/15/03-web-http-https", "itn/15/04-email-protocols", "itn/15/06-dhcp", "itn/14/05-port-numbers"]
+++

People remember `www.example.com`. Routers forward packets to addresses such as `203.0.113.10`. Something has to translate between the two, and it has to do it for billions of names without one giant list on one machine. That service is the *Domain Name System* (DNS). Almost every connection you make starts with a DNS lookup, so when DNS breaks, the network seems to be down even though it is not.

## The hierarchy

DNS is a tree. No single server knows every name. Each level knows who to ask next.

- **Root:** at the top. Root servers know which servers handle each top-level domain.
- **Top-level domains (TLDs):** `.com`, `.org`, `.net`, and country codes such as `.cm` or `.fr`.
- **Second-level domains:** the name an organization registers, such as `example` in `example.com`. The organization runs, or rents, servers that know the details of its own names, such as `www`.

Reading a name from right to left walks down the tree: `www` is inside `example`, which is inside `.com`.

## How a lookup works

Your device is configured with the address of a DNS server, often given out by DHCP. Applications ask that server, called a *resolver*, and the resolver does the work.

1. The host asks its resolver for the address of `www.example.com`.
2. If the resolver already has the answer in its *cache*, it replies at once.
3. If not, it asks a root server, which points it to the `.com` servers.
4. A `.com` server points it to the servers for `example.com`.
5. Those servers give the address. The resolver caches it and returns it to the host.

Each record carries a *time to live* (TTL), the number of seconds it may be cached. Caching is what keeps DNS fast and keeps the root servers from drowning in requests. The cost is that a changed address can take until the old TTL runs out to reach everyone.

## Record types

A DNS server stores *resource records*. The type says what the answer is.

| Type | Holds | Example use |
| --- | --- | --- |
| A | An IPv4 address | `www.example.com` to 203.0.113.10 |
| AAAA | An IPv6 address | `www.example.com` to 2001:db8::10 |
| NS | The name server for a domain | Who answers for `example.com` |
| MX | The mail server for a domain | Where to deliver mail for `@example.com` |

```question
prompt = "A mail server wants to deliver a message to someone at example.org. Which record type does it ask DNS for?"
options = ["A", "NS", "PTR", "MX"]
answer = 3
why = "An MX record names the mail exchanger for the domain. The server then looks up that name's A or AAAA record for its address."
```

DNS uses UDP and TCP port 53. Ordinary queries are small and use UDP. TCP is used when an answer is too large for one UDP message and for transfers of zone data between servers.

## Looking up a name

`nslookup` asks the configured server and prints what comes back.

```console PC1
C:\> nslookup www.example.com
Server:  dns1.example.net
Address:  192.168.1.1

Non-authoritative answer:
Name:    www.example.com
Addresses:  2001:db8::10
          203.0.113.10
```

`Server` and `Address` show which resolver answered. `Non-authoritative answer` means the reply came from the resolver's cache or from a server that does not own the domain. `Name` and `Addresses` hold the result.

Windows keeps its own cache too:

```console PC1
C:\> ipconfig /displaydns
C:\> ipconfig /flushdns
Successfully flushed the DNS Resolver Cache.
```

`/displaydns` lists the records the PC remembers. `/flushdns` clears them, which helps after a name has been changed and the old address keeps coming back.

```trap
If you can ping an address but cannot reach the same site by name, the network works and DNS is the problem. Check the DNS server setting before you check cables.
```

```question
prompt = "A host can ping 203.0.113.10 but cannot ping www.example.com. What is the most likely fault?"
options = ["The default gateway is wrong", "Name resolution is failing", "The switch port is down", "The subnet mask is wrong"]
answer = 1
why = "Reaching the address shows that routing and the link work. Failing only by name points to DNS."
```

```recall
front = "What are the four record types to know, and what does each hold?"
back = "A is an IPv4 address, AAAA is an IPv6 address, NS is a domain's name server, MX is a domain's mail server."
```

```recall
front = "What port does DNS use, and over which transports?"
back = "Port 53, over UDP for ordinary queries and TCP for large answers and zone transfers."
```

```recall
front = "What does a Windows PC's ipconfig /flushdns do?"
back = "It clears the local DNS resolver cache."
```
