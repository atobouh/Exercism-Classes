+++
title = "Predictive AI"
summary = "Learning what normal looks like, so the network can warn before users notice."
links = ["field/13/02-how-machines-learn", "field/13/04-generative-ai", "field/10/06-catalyst-center", "ensa/10/05-snmp", "ensa/10/06-syslog"]
+++

Most outages announce themselves before they happen: error counters creep up, a wireless client's signal dips, a link fills a little more each week. The trouble is that nobody is watching every counter on every device. *Predictive AI* watches them all, learns what is normal, and tells you when something drifts, ideally before users open a ticket.

## Baselining

A *baseline* is a learned picture of normal. Instead of one fixed threshold for the whole network, the system learns a separate normal for each site, each device and each time of day. A Monday 9 a.m. spike at headquarters is routine. The same spike at a closed branch is a story.

The data comes from the sources you already know: counters and interface stats polled over SNMP, event messages sent to syslog, and streaming telemetry from the devices. The model is only as good as what it is fed, which is why the earlier page on data quality matters.

```console
Router# show interfaces GigabitEthernet0/0/1 | include rate|errors
  5 minute input rate 412000 bits/sec, 187 packets/sec
  5 minute output rate 389000 bits/sec, 171 packets/sec
     0 input errors, 0 CRC, 0 frame, 0 overrun, 0 ignored
```

Output like this, collected every few minutes for months, is the raw material of a baseline.

## Anomaly detection

*Anomaly detection* flags a departure from the baseline. A good example is wireless onboarding. If clients at one site normally join the network with a 2 percent failure rate and today it is 18 percent, a learned model can raise that at once, and can often say that only that site is affected and that the failures cluster on one access point or one authentication server. A fixed global threshold would miss it, because the network-wide average barely moves.

```question
prompt = "A global alarm triggers when network-wide client failures exceed 15 percent. One small site now fails 40 percent of joins, but the network-wide figure is 3 percent. Why does a per-site learned baseline help?"
options = ["It raises the global threshold automatically", "It compares each site to its own normal, so the local problem stands out", "It stops clients from failing to join", "It removes the need for any monitoring data"]
answer = 1
why = "The small site's failures are hidden in the network-wide average. A per-site baseline judges each site against its own history."
```

## Forecasting

*Forecasting* extends a trend forward. If a campus uplink grew from 40 to 55 percent over six months, a model can estimate when it will pass a safe limit. That turns capacity planning from a yearly guess into an early, dated warning: order the upgrade now, not after the slow-down. Wireless planning works the same way, predicting when an area will have more clients than its access points handle well.

## Predicting failures

Hardware often degrades before it dies. A fiber transceiver's received light level may fall for weeks, or a link may show a slow rise in CRC errors. A model trained on many devices learns which early patterns tended to precede a failure and raises a flag while there is still time to schedule a replacement.

## Where you meet it

Vendors build this into their management platforms. Controllers such as Cisco Catalyst Center, and cloud-managed platforms such as Meraki, include AI-driven assurance that baselines clients and devices, scores their health and points toward likely causes. Some services also monitor paths across the internet, including links you do not own, and warn when a provider's route degrades. The exact feature names change often, so learn the idea rather than the product label.

## Reactive versus proactive

| | Reactive operations | Proactive operations |
| --- | --- | --- |
| Trigger | A user complains or a device goes down | A trend or anomaly is detected |
| Question | What broke? | What is about to break? |
| Alerts | Fixed thresholds | Learned baselines, forecasts |
| Fix timing | After the impact | Often before the impact |

```question
prompt = "Which statement describes proactive operations?"
options = ["Engineers investigate after users report an outage", "A forecast shows a link will saturate in a month and an upgrade is scheduled now", "A fixed alarm fires at 90 percent utilization", "A router is rebooted whenever a ticket is opened"]
answer = 1
why = "Proactive means acting on a prediction before the impact. The other options all wait for a failure or a fixed trigger."
```

## Limits

Predictive AI is not an oracle.

- **False positives.** An unusual but harmless event raises an alert. Too many and people start ignoring them.
- **Enough history.** A new site or a newly deployed device has no past to learn from, so early results are weak.
- **Changing networks.** A planned change can look like an anomaly until the baseline catches up.
- **Judgment still needed.** The system says "this is unusual". A person decides whether it matters and what to do.

```key
Predictive AI learns normal per site, device and time, flags departures and forecasts trends. It moves operations from reacting to failures toward acting on warnings, but a person still judges each alert.
```

```recall
front = "What is a baseline in AI-driven operations?"
back = "A learned picture of normal behavior for each site, device and time of day, used to spot departures."
```

```recall
front = "Name two things predictive AI does with network data."
back = "Detects anomalies (departures from the baseline) and forecasts trends such as when a link will saturate."
```

```recall
front = "Give two limits of predictive AI."
back = "False positives, and needing enough history. Its alerts also still need a person to judge them."
```
