+++
title = "Reaching the CLI"
summary = "You reach a switch through its console port, or over the network with SSH or Telnet."
links = ["itn/02/03-command-modes", "srwe/01/05-ssh-instead-of-telnet", "itn/16/08-enabling-ssh"]
+++

Before you can type a single command, you need a way in. A switch has no screen and no keyboard, so you borrow those from a computer. There are two kinds of path. You can run a cable from your laptop straight to the switch, or you can reach it across the network from anywhere that can route to it.

The difference matters most on the day something goes wrong. If the network is down, a path that runs over the network is down too. So every network engineer knows both, and knows which one still works when the other doesn't.

```diagram
caption = "Out-of-band: a console cable from the laptop. In-band: SSH from a PC across the network to the switch's IP address."
nodes = [
  { id = "Laptop", kind = "laptop", x = 0, y = 0, label = "Terminal emulator" },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "Admin PC", kind = "pc", x = 0, y = 1, label = "SSH client" },
]
links = [
  { a = "Laptop", b = "S1", label = "console cable", style = "dashed", b_label = "Console" },
  { a = "Admin PC", b = "S1", label = "network", b_label = "F0/5" },
]
```

## The console port

Every Cisco switch and router has a *console port*, a management port that leads straight to the CLI. It is *out-of-band* access: your keystrokes travel on their own cable, not over the network the switch is carrying. That gives it two jobs nothing else can do:

- **First setup.** A new switch has no IP address, so nothing can reach it over the network. The console needs no address at all.
- **Recovery.** When a bad change cuts off remote access, or the network is down, the console still works.

The classic console cable is a *rollover cable*: RJ-45 at the switch end, a 9-pin serial connector at the computer end. Laptops rarely have serial ports now, so you add a USB-to-serial adapter. Many newer switches, including the Catalyst 9200 and 9300, also have a USB console port. It takes an ordinary USB cable but may need a driver on your computer.

The console is a physical port, so anyone standing at the rack can use it. That is why it gets a password in [naming and securing the switch](itn/02/05-naming-and-securing-the-switch), and why switches belong in locked rooms.

## Terminal emulator settings

The cable alone shows nothing. You also need a *terminal emulator*, a program that turns your computer into a text terminal for the switch. Common ones are PuTTY and Tera Term (free), and SecureCRT (commercial). On macOS and Linux, `screen` works too.

Pick the serial port that the adapter created (COM3 on Windows, for example), then set the line to match the switch:

| Setting | Value |
| --- | --- |
| Speed (baud rate) | 9600 |
| Data bits | 8 |
| Parity | None |
| Stop bits | 1 |
| Flow control | None |

People shorten this to "9600 8N1, no flow control". If the speed is wrong, you see either nothing or a screen of random symbols. Fix the speed before you suspect the cable.

```recall
front = "What terminal emulator settings does a Cisco console port expect by default?"
back = "9600 baud, 8 data bits, no parity, 1 stop bit, no flow control (9600 8N1)."
```

Press Enter and the switch answers. A switch with no saved configuration offers a setup wizard first. Answer `no` and you land at the prompt:

```console Switch
         --- System Configuration Dialog ---

Would you like to enter the initial configuration dialog? [yes/no]: no

Press RETURN to get started!

Switch>
```

## SSH: the way in for every day

Once the switch has an IP address, you can reach it over the network. That is *in-band* access: management traffic shares the same cables and switches as everyone else's traffic. You can manage a switch in another building, or a hundred switches, without walking anywhere.

*SSH* (Secure Shell) is the method to use. It encrypts the whole session, including the password you type, so someone capturing traffic sees only noise. It runs over TCP port 22. An SSH client is built into Windows, macOS and Linux (`ssh admin@192.168.1.2`), and PuTTY and SecureCRT speak it too.

SSH needs some setup on the switch: an IP address, a hostname and domain name, an encryption key and a user account. You configure it in [enabling SSH](itn/16/08-enabling-ssh), once the basics in this chapter are in place.

## Telnet: the way not to

*Telnet* also gives you a remote CLI, over TCP port 23. It is older than SSH and sends everything in clear text. Your username, your password and every command you type cross the network readable by anyone who captures the packets. Telnet still appears in labs and on old gear, but on a real network you should turn it off and use SSH.

```trap
Telnet and SSH show you the same prompt, so the session feels the same. The difference is invisible: with Telnet, the password you just typed crossed the network in plain text.
```

## The AUX port

Some routers, including the ISR 4000 series, have an *AUX* (auxiliary) port next to the console. It was meant for a dial-up modem, so an engineer could phone in to a remote router when its network link was down. It is out-of-band like the console, but it is a legacy feature, and switches do not have one.

## Comparing the four

| Method | Path | Encrypted | Needs an IP address on the device |
| --- | --- | --- | --- |
| Console | Out-of-band, local cable | No (it is a private cable) | No |
| SSH | In-band, over the network | Yes | Yes |
| Telnet | In-band, over the network | No, clear text | Yes |
| AUX | Out-of-band, through a modem | No | No |

```question
prompt = "A switch has just come out of the box and has no IP address. Which method can you use to configure it?"
options = ["SSH", "Telnet", "The console port", "A web browser pointed at the switch"]
answer = 2
why = "SSH, Telnet and a web GUI all reach the switch by its IP address, which it does not have yet. The console is a direct cable and needs no address."
```

```question
prompt = "Why is SSH preferred over Telnet for remote management?"
options = ["SSH works without an IP address", "SSH encrypts the session, including passwords", "SSH is faster on slow links", "Telnet cannot reach devices on other networks"]
answer = 1
why = "Both run over the network and need an IP address. The difference is that Telnet sends everything in clear text, while SSH encrypts it."
```

```recall
front = "What is the difference between in-band and out-of-band management?"
back = "In-band travels over the production network (SSH, Telnet) and needs an IP address. Out-of-band uses a separate path such as the console cable."
```

```recall
front = "Which TCP ports do SSH and Telnet use?"
back = "SSH uses TCP 22. Telnet uses TCP 23."
```
