+++
title = "From policy to configuration"
summary = "A small company's security policy, written in plain words, that this chapter turns into working ACLs."
links = ["ensa/04/02-packet-filtering", "ensa/04/07-standard-and-extended", "ensa/04/08-acl-placement"]
+++

The last chapter explained what an access control list is and where it belongs. This chapter is about typing one into a router so that it does what the business asked for, no more and no less.

A security policy never arrives as a list of `permit` and `deny` lines. It arrives as sentences from a manager: "Guests shouldn't be able to see our servers." Your job is to turn each sentence into an ACL, choose the router, interface and direction for it, and then prove it works. You will do that for one small company, page by page, until every sentence of its policy is enforced.

## The network

The company has two routers. R1 serves the people: a staff LAN and a guest LAN for visitors. R2 serves the machines: a server LAN and the link to the internet. The two routers are joined by a serial link.

```diagram
caption = "The chapter's network: people behind R1, servers and the internet behind R2."
nodes = [
  { id = "Staff", kind = "pc", x = 0, y = 0, label = "Admin PC 192.168.10.10" },
  { id = "Guests", kind = "laptop", x = 0, y = 1, label = "Sign-in PC 192.168.20.5" },
  { id = "R1", kind = "router", x = 1, y = 0.5 },
  { id = "R2", kind = "router", x = 2, y = 0.5 },
  { id = "Server", kind = "server", x = 3, y = 0, label = "192.168.30.10" },
  { id = "ISP", kind = "internet", x = 3, y = 1 },
]
links = [
  { a = "Staff", b = "R1", b_label = "G0/0/0", label = "192.168.10.0/24" },
  { a = "Guests", b = "R1", b_label = "G0/0/1", label = "192.168.20.0/24" },
  { a = "R1", b = "R2", a_label = "S0/1/0", b_label = "S0/1/0", label = "10.1.1.0/30", style = "serial" },
  { a = "R2", b = "Server", a_label = "G0/0/0", label = "192.168.30.0/24" },
  { a = "R2", b = "ISP", a_label = "G0/0/1", label = "203.0.113.0/30" },
]
```

| Network | Where | Addresses |
| --- | --- | --- |
| Staff LAN | R1 G0/0/0 | 192.168.10.0/24, gateway .1, admin PC .10 |
| Guest LAN | R1 G0/0/1 | 192.168.20.0/24, gateway .1, sign-in PC .5 |
| R1 to R2 | S0/1/0 on both | 10.1.1.0/30, R1 is .1, R2 is .2 |
| Server LAN | R2 G0/0/0 | 192.168.30.0/24, gateway .1, file server .10 |
| Internet | R2 G0/0/1 | 203.0.113.0/30, R2 is .2, the ISP is .1 |

## The policy

Here is what the manager wrote, numbered so the later pages can refer to it.

1. Only the admin PC, 192.168.10.10, may open management sessions to R1 and R2, and only over SSH.
2. The guest LAN must not reach the server LAN. The one exception is the sign-in PC at 192.168.20.5, which saves visitor records on the file server.
3. Nobody on the staff LAN may Telnet to the file server. Telnet sends passwords in clear text. Everything else from the staff LAN is allowed.
4. Guests may browse the web (HTTP and HTTPS) and look up names (DNS). Nothing else.
5. From the internet, only replies to conversations that someone inside started may come in.

Read each sentence and ask two questions. What does the router need to see in a packet to recognize it? And where on the path is the best place to stop it?

## From sentence to ACL type

Rule 2 names only who the traffic comes from: the guest LAN, with one host excused. The destination is fixed by where you put the ACL. That makes it a job for a *standard ACL*, which matches only the source address.

Rule 3 is different. It names a source (the staff LAN), a destination (the file server) and an application (Telnet, TCP port 23). Only an *extended ACL* can see all three. Rules 4 and 5 need ports and TCP flags, so they are extended too.

Rule 1 is a special case. The traffic isn't passing through the router; it is aimed at the router itself. You filter it with a standard ACL attached to the router's remote login lines rather than to an interface.

```question
prompt = "Policy rule 2 says the guest LAN 192.168.20.0/24 must not reach the server LAN. You use a standard ACL. Where does it go?"
options = ["R1 G0/0/1, inbound", "R2 G0/0/0, outbound", "R1 S0/1/0, outbound", "R2 G0/0/1, inbound"]
answer = 1
why = "A standard ACL sees only the source, so it must sit next to the destination. On R1 it would block guests from the internet too; outbound on R2 G0/0/0 it stops only traffic heading into the server LAN."
```

## Where each rule will live

Chapter 4 gave the placement rules: [extended ACLs close to the source, standard ACLs close to the destination](ensa/04/08-acl-placement). Applied to this company, they give a plan you will build over the coming pages.

| Rule | ACL type | Router and interface | Direction | Page |
| --- | --- | --- | --- | --- |
| 1 | Standard | R1 and R2 VTY lines | In | Restricting remote management |
| 2 | Standard | R2 G0/0/0 | Out | Numbered and named standard ACLs |
| 3 | Extended | R1 G0/0/0 | In | Configuring extended ACLs |
| 4 | Extended | R1 G0/0/1 | In | Configuring extended ACLs |
| 5 | Extended | R2 G0/0/1 | In | Letting replies back in |

Notice that rules 3 and 4 stop traffic at the first router it meets. A Telnet attempt that will be dropped anyway shouldn't cross the serial link first.

## The workflow

Every ACL in this chapter goes through the same four steps.

1. **Write it.** Create the list of entries in global configuration mode. On its own, an ACL does nothing.
2. **Apply it.** Attach it to an interface with `ip access-group` and a direction, or to the VTY lines with `access-class`.
3. **Verify it.** Use `show` commands to check that the entries are what you meant and that the ACL sits on the right interface in the right direction.
4. **Test it.** Send real traffic, both traffic that should pass and traffic that should fail, and watch the match counters.

Step 4 is the one people skip, and it is the one that finds the mistakes.

```key
Writing an ACL and applying an ACL are two separate commands. An ACL that exists but isn't applied filters nothing, and an interface pointing at an ACL that doesn't exist filters nothing either.
```

## Two ways to write an ACL

IOS gives you two styles. A *numbered ACL* is built line by line with the global `access-list` command, and its number says what kind it is (1 to 99 for standard, 100 to 199 for extended). A *named ACL* is created with `ip access-list standard` or `ip access-list extended` followed by a name, which drops you into a small configuration mode of its own.

Both styles filter in exactly the same way. Names are easier to read and easier to edit, and you will see why on the next few pages. You start with the oldest form: numbered standard ACLs.

```recall
front = "What are the four steps for putting any ACL into service?"
back = "Write it, apply it (interface and direction, or VTY lines), verify it with show commands, then test it with real traffic."
```

```recall
front = "Which kind of IPv4 ACL can enforce 'nobody on the staff LAN may Telnet to the file server'?"
back = "An extended ACL, because the rule names a source, a destination and a TCP port (23)."
```

```recall
front = "What are the two styles of IPv4 ACL configuration on IOS?"
back = "Numbered, with the global access-list command, and named, with ip access-list standard or extended NAME."
```
