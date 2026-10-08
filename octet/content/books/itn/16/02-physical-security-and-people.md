+++
title = "Physical security and people"
summary = "Locks, power and people matter as much as configuration."
links = ["itn/16/01-threats-and-vulnerabilities", "itn/16/04-reconnaissance-and-access-attacks", "itn/16/06-defense-in-depth"]
+++

The best-hardened router in the world is no use if someone can walk into the closet and unplug it, or plug in a console cable and reset the password. And the strongest password policy fails if a caller convinces an employee to read the password aloud. This page covers the two parts of security that no command can reach: the room the equipment sits in, and the people who use it.

## Four classes of physical threat

Physical threats are easier to plan for when you sort them.

| Class | What goes wrong | Examples |
| --- | --- | --- |
| Hardware | Equipment is stolen or damaged | A laptop taken from a desk, a switch kicked loose, a drive pulled from a server |
| Environmental | The room is outside safe limits | Heat from a failed air conditioner, humidity, flooding, dust |
| Electrical | Power is bad or missing | Voltage spikes, brownouts (a drop in voltage), a full outage, noise on the line |
| Maintenance | Equipment is poorly looked after | Rough handling, unlabeled cables, no spare parts, no one who knows how to replace a failed unit |

Notice that none of these needs an attacker. A hot room destroys a switch as surely as a thief takes it. That is why physical security is partly about the building and partly about housekeeping.

```question
prompt = "A wiring closet has no cooling and a switch shuts itself down every afternoon. Which class of physical threat is this?"
options = ["Hardware", "Environmental", "Electrical", "Maintenance"]
answer = 1
why = "The cause is the temperature of the room, which is an environmental condition. Hardware threats are theft or physical damage to the device itself."
```

## Controlling who gets in

Anyone who can touch a device can usually defeat its software protections. A console cable and a reboot are enough to recover or replace a password on many devices. So the first layer is keeping people away from the equipment.

- **Locked rooms.** Wiring closets and server rooms stay locked. Keys or codes go only to people who need them.
- **Badge readers.** A card or code system records who opened the door and when, which a plain key cannot do.
- **Logs and cameras.** Entry logs and video make it possible to find out afterwards what happened. They also deter casual misuse.
- **A mantrap.** Two doors, with a small space between them. The second door opens only after the first has closed, so one person must pass at a time. It stops *tailgating*, where an unauthorized person follows an authorized one through an open door.

Smaller measures count too: cable locks on laptops, racks with locking doors, and no unused wall jacks left live in public areas.

## Power protection

Electrical threats get their own tools. A *surge protector* absorbs voltage spikes before they reach the equipment. A *UPS* (uninterruptible power supply) holds a battery that takes over when mains power drops or fails. A UPS does two jobs: it keeps devices running through a brownout, and it gives them time to shut down in order during a longer outage. It is not a generator. Batteries run for minutes, not hours, so a UPS is the bridge to a clean shutdown or to a generator.

```question
prompt = "Which measure best reduces damage from a brownout and a sudden power loss in a server room?"
options = ["A mantrap on the door", "A UPS", "Entry logs", "Cable locks on racks"]
answer = 1
why = "A UPS supplies battery power when the mains voltage sags or disappears. The other measures control access, not power."
```

## People are the other half

Attackers know that tricking a person is often cheaper than breaking a machine. *Social engineering* is manipulating people into giving up access or information, such as a caller who claims to be from the help desk and asks for a password, or an email that imitates a manager. It targets habits like helpfulness and fear of getting into trouble. You will meet the individual techniques, such as phishing and tailgating, on [a later page](itn/16/04-reconnaissance-and-access-attacks).

No firewall reads the mind of the person who types the password into the wrong site. So a security program includes people as well as technology:

- A written *security policy*: what is allowed, who is responsible, what to do after an incident.
- *User awareness*: everyone knows the common tricks and who to tell when something looks wrong.
- Regular *training*, repeated because people forget and attackers change tactics.
- *Phishing simulations*: the organization sends harmless fake phishing emails and measures who clicks. The goal is learning, not punishment, and the results show where more training is needed.

```trap
Treating people as the weak link and blaming them after an incident does not work. A culture where reporting a mistake is safe finds problems sooner. An employee who clicked and says so within minutes is worth more than one who hides it.
```

This is also why the layered approach in [defense in depth](itn/16/06-defense-in-depth) assumes that any single control, including training, will sometimes fail.

```recall
front = "Name the four classes of physical threat."
back = "Hardware, environmental, electrical and maintenance."
```

```recall
front = "What does a mantrap prevent?"
back = "Tailgating. Two interlocked doors let only one person through at a time."
```

```recall
front = "What does a UPS do?"
back = "It supplies battery power during a brownout or outage, so equipment keeps running or shuts down cleanly."
```
