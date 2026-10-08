+++
title = "Opening and closing a TCP session"
summary = "A session opens with SYN, SYN-ACK, ACK and closes with FIN and ACK from each side."
links = ["itn/14/03-the-tcp-header", "itn/14/05-port-numbers", "itn/14/07-sequence-and-acknowledgment", "itn/16/05-denial-of-service"]
+++

Before TCP sends a single byte of your data, the two hosts hold a short conversation about the conversation. It checks that the other side is there, that it is listening, and that both agree where the numbering starts. This is the *three-way handshake*. When the data is finished, a second exchange closes the session cleanly.

## Listening

A server program starts by opening a port and waiting, for example a web server on port 443. It is in the *listening* state, shown as LISTENING in `netstat -a`. It does not need to know who will call. Each client that connects gets its own session, identified by the [socket pair](itn/14/05-port-numbers), so one listening port can serve many clients at once.

## The three-way handshake

Three segments open a session. The client is 192.168.1.20 using source port 51234. The server is 203.0.113.10 listening on 443. Each side picks a random starting sequence number, its *initial sequence number* (ISN). The numbers below are examples.

1. **SYN.** The client sends a segment with SYN set and its ISN, 3,422,104,051. It says: I want a session, and I will number my bytes from here.
2. **SYN-ACK.** The server replies with both SYN and ACK set. It carries its own ISN, 1,876,400,002, and acknowledges the client's with 3,422,104,052. The SYN takes up one number, so the next byte it expects is the ISN plus 1.
3. **ACK.** The client sends a segment with ACK set and acknowledgment number 1,876,400,003. The session is open and data may flow.

| Step | From | Flags | Sequence | Acknowledgment |
| --- | --- | --- | --- | --- |
| 1 | Client | SYN | 3,422,104,051 | none |
| 2 | Server | SYN, ACK | 1,876,400,002 | 3,422,104,052 |
| 3 | Client | ACK | 3,422,104,052 | 1,876,400,003 |

Each step proves something. Step 1 shows the server that a client wants to talk. Step 2 shows the client that the server is alive, listening and reachable both ways. Step 3 shows the server that the client received the reply, so the path works in both directions and both sides know the other's starting number.

```question
prompt = "Which flags are set in the second segment of the TCP three-way handshake?"
options = ["SYN only", "ACK only", "SYN and ACK", "SYN and FIN"]
answer = 2
why = "The server's reply both acknowledges the client's SYN (ACK) and announces its own starting number (SYN)."
```

## Closing the session

A TCP session carries data in each direction independently, so each direction is closed on its own. That takes four segments.

1. The side that finishes first sends **FIN**.
2. The other side sends **ACK**. The first direction is now closed, though the second side may still have data to send.
3. When the second side is done, it sends its own **FIN**.
4. The first side answers with **ACK**.

Often the second side has nothing more to send, so steps 2 and 3 are combined into a single FIN-ACK segment. The result looks like three segments, but it is the same four-step logic. After the last ACK, the side that closed first typically waits a short time in TIME_WAIT before it frees the socket pair, so stray late segments from the old session cannot confuse a new one.

## Ending abruptly with RST

A session can also end without the polite exchange. A segment with **RST** set says: this session is over, drop everything. It is sent when something has gone wrong, for example when a client connects to a port where nothing is listening, or when a host receives a segment for a session it does not know about. A reset needs no reply.

```trap
A reset is not an error message that the user sees as a polite close. Data still in flight is thrown away. If a connection "resets" in the middle of a download, look for a firewall, a crashed server process or a timeout on the path.
```

## A preview of an attack

The handshake has a weakness. When a server receives a SYN, it reserves memory for a half-open session and waits for the final ACK. An attacker who sends thousands of SYN segments and never answers fills that memory, and real clients are refused. This is a *SYN flood*, one of the denial-of-service attacks in [chapter 16](itn/16/05-denial-of-service).

```question
prompt = "A server has received a SYN and sent a SYN-ACK. What is it now waiting for?"
options = ["A FIN from the client", "An ACK from the client", "Another SYN from the client", "A RST from the client"]
answer = 1
why = "The final ACK completes the handshake. Until it arrives the session is half open, which is what a SYN flood exploits."
```

```recall
front = "What are the three segments of the TCP handshake?"
back = "Client SYN, server SYN-ACK, client ACK."
```

```recall
front = "How is a TCP session closed normally, and what ends one abruptly?"
back = "FIN and ACK from each side (four steps, or three when the middle two are combined). RST ends a session abruptly."
```

```recall
front = "How does a SYN flood attack work?"
back = "The attacker sends many SYNs and never completes the handshake, so the server fills up with half-open sessions."
```
