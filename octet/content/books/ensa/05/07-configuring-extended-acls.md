+++
title = "Configuring extended ACLs"
summary = "Build numbered and named extended ACLs that enforce the chapter's policy, and place them near the source."
links = ["ensa/05/06-extended-acl-syntax", "ensa/05/04-editing-acls", "ensa/04/08-acl-placement", "ensa/04/07-standard-and-extended"]
+++

You know what an extended entry looks like. Now put entries together into lists that carry out policy rules 3 and 4, and attach them to the right interface. The method is the one from the standard ACL pages: write the list, apply it, check it. What is new is that an extended ACL belongs next to the traffic's source, so it goes on R1, not R2.

## Rule 3: staff may not Telnet to the file server

The staff LAN is 192.168.10.0/24, and the file server is 192.168.30.10. Telnet is TCP port 23. The rule also says everything else from the staff LAN is allowed, so the list needs a deny for the exception and a permit for the rest.

```console R1
R1(config)# ip access-list extended STAFF-IN
R1(config-ext-nacl)# deny tcp 192.168.10.0 0.0.0.255 host 192.168.30.10 eq telnet
R1(config-ext-nacl)# permit ip any any
R1(config-ext-nacl)# exit
```

`ip access-list extended STAFF-IN` creates the list and puts you in `config-ext-nacl` mode. The `host` keyword is shorthand for a wildcard of 0.0.0.0, so the deny covers exactly the file server. `permit ip any any` then lets every other packet through. Without it, the implicit deny would drop everything the staff send, not only the Telnet.

The numbered equivalent is the same two entries typed in global mode, with a number from 100 to 199.

```console R1
R1(config)# access-list 101 deny tcp 192.168.10.0 0.0.0.255 host 192.168.30.10 eq telnet
R1(config)# access-list 101 permit ip any any
```

Both versions behave identically. Add a `remark` line to either kind when the purpose isn't obvious from the entries. The rest of this chapter writes named lists, and you can edit either kind by [sequence number](ensa/05/04-editing-acls).

## Narrowing a rule

Sometimes a rule is aimed at one machine. If only the admin PC were barred from Telnet to the server, the source becomes a host.

```console R1
R1(config-ext-nacl)# deny tcp host 192.168.10.10 host 192.168.30.10 eq 23
```

Notice how little changed: `host` replaced the network and its wildcard. A narrower entry matches fewer packets, so keep it above the broader entries it overlaps. If the whole-LAN deny stood first, the host entry would be dead weight.

```command
prompt = "In config-ext-nacl mode, deny Telnet (use the name `telnet`) from the whole staff LAN 192.168.10.0/24 to the file server 192.168.30.10."
mode = "R1(config-ext-nacl)#"
answer = ["deny tcp 192.168.10.0 0.0.0.255 host 192.168.30.10 eq telnet", "deny tcp 192.168.10.0 0.0.0.255 host 192.168.30.10 eq 23"]
why = "The source is the LAN with its wildcard, the destination is a single host, and Telnet is TCP port 23."
```

## Applying it near the source

Rule 3 concerns traffic that starts on the staff LAN. Following the [placement rule](ensa/04/08-acl-placement), an extended ACL goes as close to the source as possible, so that unwanted packets die before they cross the network. On R1 that is G0/0/0, the interface the staff LAN hangs from, and the direction is inbound: packets arriving from the LAN, before R1 routes them.

```console R1
R1(config)# interface g0/0/0
R1(config-if)# ip access-group STAFF-IN in
R1(config-if)# end
```

```question
prompt = "STAFF-IN could have gone outbound on R1 S0/1/0 toward R2. Why is it applied inbound on the LAN interface instead?"
options = ["Outbound ACLs cannot match TCP ports", "Inbound on the LAN stops unwanted packets before R1 spends effort routing them or sends them across the serial link", "Inbound ACLs also filter traffic that R1 itself generates", "An extended ACL can only be applied inbound"]
answer = 1
why = "Both directions can match ports. Placing the ACL where the traffic enters the router drops it at once. An ACL on the serial link would also filter traffic from the guest LAN."
```

## Rule 4: guests browse the web and look up names

Guests get a short whitelist: HTTP, HTTPS and DNS to anywhere, and nothing else. The policy has one more twist. The sign-in PC at 192.168.20.5 must still reach the file server (rule 2's exception), and R1 sees that traffic first, so GUEST-IN has to allow it as well.

```console R1
R1(config)# ip access-list extended GUEST-IN
R1(config-ext-nacl)# permit ip host 192.168.20.5 host 192.168.30.10
R1(config-ext-nacl)# permit tcp 192.168.20.0 0.0.0.255 any eq www
R1(config-ext-nacl)# permit tcp 192.168.20.0 0.0.0.255 any eq 443
R1(config-ext-nacl)# permit udp 192.168.20.0 0.0.0.255 any eq domain
R1(config-ext-nacl)# exit
R1(config)# interface g0/0/1
R1(config-if)# ip access-group GUEST-IN in
R1(config-if)# end
```

There is no `permit ip any any` here, on purpose. The implicit deny at the bottom blocks everything the guests are not given, and that is the policy.

This list does not make R2's `GUEST-FILTER` redundant. A guest can still send a web request to a server in the server LAN: GUEST-IN lets it leave R1, because it is TCP port 80 to "any" destination. R2's list drops it on the way into the server LAN. The two ACLs do different jobs at different points, so keep both.

```trap
An inbound ACL on a LAN interface also filters the broadcasts that hosts send when they start up. If R1 is the DHCP server or relay for the guest LAN, the implicit deny drops the clients' DHCP requests and nobody gets an address. Add `permit udp any eq bootpc any eq bootps` to GUEST-IN before relying on it.
```

## Checking what you built

Look at the lists, then at the interfaces.

```console R1
R1# show access-lists
Extended IP access list GUEST-IN
    10 permit ip host 192.168.20.5 host 192.168.30.10
    20 permit tcp 192.168.20.0 0.0.0.255 any eq www
    30 permit tcp 192.168.20.0 0.0.0.255 any eq 443
    40 permit udp 192.168.20.0 0.0.0.255 any eq domain
Extended IP access list STAFF-IN
    10 deny tcp 192.168.10.0 0.0.0.255 host 192.168.30.10 eq telnet
    20 permit ip any any
```

Test with real traffic before trusting the output: a Telnet attempt from a staff PC to 192.168.30.10 should fail, while a browser to a web server should work. The [verification page](ensa/05/09-verifying-acls) covers the commands and what the counters should say.

```recall
front = "Where, and in which direction, do you apply an extended ACL that stops the staff LAN from reaching a server?"
back = "Close to the source: inbound on the router interface that faces the staff LAN."
```

```recall
front = "Which final entry makes an extended ACL block only the traffic you named?"
back = "permit ip any any, so that everything not denied above is allowed instead of falling to the implicit deny."
```

```recall
front = "How do you write the 'one host' form of an extended ACE source?"
back = "With the host keyword, such as host 192.168.10.10, which equals the address with wildcard 0.0.0.0."
```
