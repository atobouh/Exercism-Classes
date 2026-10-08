# CCNA 200-301 Outline: Exam Blueprint, NetAcad CCNA v7 Modules, and Gap Analysis

Research reference compiled 2026-10-08. Source keys like [S1] point to the **Sources** list at the end.
Notes on confidence: **(official)** means taken from a Cisco or NetAcad document. **(3rd-party)** means a study-site or blog source. **(uncertain)** means unverified or conflicting.

> **Version status, as of 2026-10-08.** CCNA 200-301 **v1.1** is the current exam. Cisco's Learning Network says: "Last date to test for v1.1 is February 2, 2027. First date to test for v2.0 is February 3, 2027." [S9][S10] The v2.0 blueprint was published on 2026-05-20 (3rd-party date [S25]). Section 1.6 has a short v2.0 summary. The rest of this file covers v1.1, as requested.

---

## 1. Cisco CCNA 200-301 v1.1 exam topics

v1.1 went live on **2024-08-20**. The last v1.0 test date was 2024-08-19 [S3][S5].

### 1.1 Exam format facts

| Item | Fact | Source |
|---|---|---|
| Exam name / code | Implementing and Administering Cisco Solutions (200-301 CCNA) v1.1 | [S6] (official) |
| Duration | 120 minutes | [S1][S6] (official) |
| Cost | US$300, or Cisco Learning Credits. A voucher costs $300 and is valid for 365 days. "Exam Safeguard Plus" (a second attempt within 90 days) costs $450 | [S6][S7] (official) |
| Languages | English, Japanese | [S6][S9] (official) |
| Delivery | Pearson VUE, at a test center or online proctored | [S7] (official) |
| Question count | **Not published by Cisco.** Third-party sources say about 100–120. Candidate reports vary (e.g., 88–105) | [S14] (3rd-party, uncertain) |
| Question types | Cisco's page says "performance-based questions, multiple choice, and drag-and-drop". Cisco's exam tutorial lists multiple-choice single answer, multiple-choice multiple answer, drag-and-drop, fill-in-the-blank, testlet, simlet, and simulation | [S9][S11] (official); [S13] |
| Item types explained | **Simulation**: you configure simulated devices in the CLI and are graded on the result. **Simlet**: you run `show` commands on a simulated network, then answer MC sub-questions. **Testlet**: you get a scenario or exhibit with several MC sub-questions and no CLI | [S13] (3rd-party) |
| Navigation | **No going back.** You cannot review, flag, or return to a question after you click Next. Inside a testlet or simlet you can move between its sub-questions | [S12] (CLN moderator); [S13] |
| Adaptive? | No. The exam is fixed-form | [S13] (3rd-party) |
| Passing score | **Not published.** "Cisco does not publish exam passing scores because exam questions and passing scores are subject to change." Results are pass/fail; failing score reports show the sections to study | [S8] (official). Figures like "~800–850/1000" come only from forums (uncertain) |
| Results | Usually online within 48 hours | [S7][S9] (official) |
| Retake | Wait 5 calendar days after a failed attempt. After passing, wait 180 days before retaking the same exam | [S8] (official) |
| Validity | The certification is valid for 3 years. Renew with CE credits or exams | [S7] (official) |
| Prerequisites | None | [S7] (official) |

### 1.2 Domains and weights (unchanged from v1.0)

| Domain | Weight |
|---|---|
| 1.0 Network Fundamentals | 20% |
| 2.0 Network Access | 20% |
| 3.0 IP Connectivity | 25% |
| 4.0 IP Services | 10% |
| 5.0 Security Fundamentals | 15% |
| 6.0 Automation and Programmability | 10% |

Source: [S1] (official PDF). [S5] confirms the weights did not change.

### 1.3 Full v1.1 topic list (wording from Cisco's v1.1 PDF [S1])

**1.0 Network Fundamentals (20%)**
- 1.1 Explain the role and function of network components
  - 1.1.a Routers
  - 1.1.b Layer 2 and Layer 3 switches
  - 1.1.c Next-generation firewalls and IPS
  - 1.1.d Access points
  - 1.1.e Controllers
  - 1.1.f Endpoints
  - 1.1.g Servers
  - 1.1.h PoE
- 1.2 Describe characteristics of network topology architectures
  - 1.2.a Two-tier
  - 1.2.b Three-tier
  - 1.2.c Spine-leaf
  - 1.2.d WAN
  - 1.2.e Small office/home office (SOHO)
  - 1.2.f On-premises and cloud
- 1.3 Compare physical interface and cabling types
  - 1.3.a Single-mode fiber, multimode fiber, copper
  - 1.3.b Connections (Ethernet shared media and point-to-point)
- 1.4 Identify interface and cable issues (collisions, errors, mismatch duplex, and/or speed)
- 1.5 Compare TCP to UDP
- 1.6 Configure and verify IPv4 addressing and subnetting
- 1.7 Describe private IPv4 addressing
- 1.8 Configure and verify IPv6 addressing and prefix
- 1.9 Describe IPv6 address types
  - 1.9.a Unicast (global, unique local, and link local)
  - 1.9.b Anycast
  - 1.9.c Multicast
  - 1.9.d Modified EUI 64
- 1.10 Verify IP parameters for Client OS (Windows, Mac OS, Linux)
- 1.11 Describe wireless principles
  - 1.11.a Nonoverlapping Wi-Fi channels
  - 1.11.b SSID
  - 1.11.c RF
  - 1.11.d Encryption
- 1.12 Explain virtualization fundamentals (server virtualization, containers, and VRFs)
- 1.13 Describe switching concepts
  - 1.13.a MAC learning and aging
  - 1.13.b Frame switching
  - 1.13.c Frame flooding
  - 1.13.d MAC address table

**2.0 Network Access (20%)**
- 2.1 Configure and verify VLANs (normal range) spanning multiple switches
  - 2.1.a Access ports (data and voice)
  - 2.1.b Default VLAN
  - 2.1.c InterVLAN connectivity
- 2.2 Configure and verify interswitch connectivity
  - 2.2.a Trunk ports
  - 2.2.b 802.1Q
  - 2.2.c Native VLAN
- 2.3 Configure and verify Layer 2 discovery protocols (Cisco Discovery Protocol and LLDP)
- 2.4 Configure and verify (Layer 2/Layer 3) EtherChannel (LACP)
- 2.5 Interpret basic operations of Rapid PVST+ Spanning Tree Protocol
  - 2.5.a Root port, root bridge (primary/secondary), and other port names
  - 2.5.b Port states and roles
  - 2.5.c PortFast
  - 2.5.d Root guard, loop guard, BPDU filter, and BPDU guard
- 2.6 Describe Cisco Wireless Architectures and AP modes
- 2.7 Describe physical infrastructure connections of WLAN components (AP, WLC, access/trunk ports, and LAG)
- 2.8 Describe network device management access (Telnet, SSH, HTTP, HTTPS, console, TACACS+/RADIUS, and cloud managed)
- 2.9 Interpret the wireless LAN GUI configuration for client connectivity, such as WLAN creation, security settings, QoS profiles, and advanced settings

**3.0 IP Connectivity (25%)**
- 3.1 Interpret the components of routing table
  - 3.1.a Routing protocol code
  - 3.1.b Prefix
  - 3.1.c Network mask
  - 3.1.d Next hop
  - 3.1.e Administrative distance
  - 3.1.f Metric
  - 3.1.g Gateway of last resort
- 3.2 Determine how a router makes a forwarding decision by default
  - 3.2.a Longest prefix match
  - 3.2.b Administrative distance
  - 3.2.c Routing protocol metric
- 3.3 Configure and verify IPv4 and IPv6 static routing
  - 3.3.a Default route
  - 3.3.b Network route
  - 3.3.c Host route
  - 3.3.d Floating static
- 3.4 Configure and verify single area OSPFv2
  - 3.4.a Neighbor adjacencies
  - 3.4.b Point-to-point
  - 3.4.c Broadcast (DR/BDR selection)
  - 3.4.d Router ID
- 3.5 Describe the purpose, functions, and concepts of first hop redundancy protocols

**4.0 IP Services (10%)**
- 4.1 Configure and verify inside source NAT using static and pools
- 4.2 Configure and verify NTP operating in a client and server mode
- 4.3 Explain the role of DHCP and DNS within the network
- 4.4 Explain the function of SNMP in network operations
- 4.5 Describe the use of syslog features, including facilities and severity levels
- 4.6 Configure and verify DHCP client and relay
- 4.7 Explain the forwarding per-hop behavior (PHB) for QoS such as classification, marking, queuing, congestion, policing, and shaping
- 4.8 Configure network devices for remote access using SSH
- 4.9 Describe the capabilities and functions of TFTP/FTP in the network

**5.0 Security Fundamentals (15%)**
- 5.1 Define key security concepts (threats, vulnerabilities, exploits, and mitigation techniques)
- 5.2 Describe security program elements (user awareness, training, and physical access control)
- 5.3 Configure and verify device access control using local passwords
- 5.4 Describe security password policy elements, such as management, complexity, and password alternatives (multifactor authentication, certificates, and biometrics)
- 5.5 Describe IPsec remote access and site-to-site VPNs
- 5.6 Configure and verify access control lists
- 5.7 Configure and verify Layer 2 security features (DHCP snooping, dynamic ARP inspection, and port security)
- 5.8 Compare authentication, authorization, and accounting concepts
- 5.9 Describe wireless security protocols (WPA, WPA2, and WPA3)
- 5.10 Configure and verify WLAN within the GUI using WPA2 PSK

**6.0 Automation and Programmability (10%)**
- 6.1 Explain how automation impacts network management
- 6.2 Compare traditional networks with controller-based networking
- 6.3 Describe controller-based, software defined architecture (overlay, underlay, and fabric)
  - 6.3.a Separation of control plane and data plane
  - 6.3.b Northbound and Southbound APIs
- 6.4 Explain AI (generative and predictive) and machine learning in network operations
- 6.5 Describe characteristics of REST-based APIs (authentication types, CRUD, HTTP verbs, and data encoding)
- 6.6 Recognize the capabilities of configuration management mechanisms such as Ansible and Terraform
- 6.7 Recognize components of JSON-encoded data

Blueprint size: 6 domains, 53 numbered topics (1.1–1.13, 2.1–2.9, 3.1–3.5, 4.1–4.9, 5.1–5.10, 6.1–6.7), plus lettered sub-topics.

**Two wording inconsistencies.** The Cisco Learning Network web page [S9] still shows some older wording than the PDF. It has "1.1.e Controllers (Cisco DNA Center and WLC)", "1.2.f On-premise and cloud", and "2.5.b Port states (forwarding/blocking)", next to the new 2.5.d. Treat the PDF [S1] as authoritative.

### 1.4 What changed from v1.0 to v1.1

Cisco describes v1.1 as a "minor update". Roughly **10%** of the exam changed, and the domains and weights stayed the same [S3][S4][S5]. Cisco's FAQ, as quoted in [S5], lists the new themes as "generative AI, cloud network management, and machine learning". The release notes say: "the addition of AI, machine learning, and Terraform" [S3].

**Changes listed in Cisco's official release notes [S3]:**

| Topic | v1.0 | v1.1 |
|---|---|---|
| 2.5 | (no 2.5.d) | **Added 2.5.d** Root guard, loop guard, BPDU filter, and BPDU guard |
| 2.8 | Describe **AP and WLC** management access connections (Telnet, SSH, HTTP, HTTPS, console, and TACACS+/RADIUS) | Describe **network device** management access (… TACACS+/RADIUS, **and cloud managed**) |
| 6.4 | Compare traditional campus device management with **Cisco DNA Center** enabled device management | **Explain AI (generative and predictive) and machine learning in network operations** |
| 6.5 | REST-based APIs (CRUD, HTTP verbs, and data encoding) | Adds **authentication types** |
| 6.6 | Configuration management mechanisms: **Puppet, Chef, and Ansible** | **Ansible and Terraform** (Puppet and Chef dropped) |

**Further wording changes (from diffing Cisco's 2021 v1.0 PDF [S2] against the v1.1 PDF [S1]):**
- 1.1.e: "Controllers (Cisco DNA Center and WLC)" became "Controllers". DNA Center is now branded **Catalyst Center**. [S5] reads the broader wording as covering other controllers too, e.g., the Catalyst SD-WAN Manager (interpretation).
- 1.2.f: "On-premise" became "On-premises".
- 1.7: "Describe the need for private IPv4 addressing" became "Describe private IPv4 addressing".
- 2.1.c: "Connectivity" became "InterVLAN connectivity".
- 2.5.b: "Port states (forwarding/blocking)" became "Port states and roles". Cisco's release notes show "Port states and roles" in both columns.
- 4.5: "facilities and levels" became "facilities and **severity** levels".
- Trivial edits in 4.7, 4.9, and 5.4.

**What v1.1 did NOT change, despite some reports.** Some third-party "what's new" lists credit v1.1 with PoE (1.1.h), "Two-tier/Three-tier" wording, "Longest prefix match", and "containers and VRFs" in 1.12. Cisco's 2021-dated v1.0 PDF [S2] already contains all of these. They probably come from comparing against the original 2019 v1.0 PDF (uncertain; I did not get the 2019 PDF).

**Wi-Fi:** v1.0 and v1.1 have identical wireless topics (1.11, 2.6, 2.7, 2.9, 5.9, 5.10). The only wireless-related edits are 1.1.e (controllers generalized) and 2.8 (management access generalized, cloud-managed added).

**Cisco's study guidance on the verbs [S4]:** "explain" means high-level knowledge. "Configure/verify" means hands-on skill. "Interpret" (e.g., 2.5) means reading the state of a running network. 6.4 needs only high-level knowledge, not configuration. 6.6 means recognizing what Ansible and Terraform do.

### 1.5 NetAcad's response to v1.1 (official)

A NetAcad presentation ("AI in the next CCNA", IPD Week, June 2024 [S15]) states:
- **ITN:** no changes.
- **SRWE:** a new **Supplemental Module** for 2.5 Rapid PVST+ (2.5.b port states and roles; 2.5.d root guard, loop guard, BPDU filter, BPDU guard).
- **ENSA:** a new **Supplemental Module** for 6.4 AI/ML, 6.5 REST API authentication types, and 6.6 Ansible and Terraform.
- The modules were "Available Aug/Sep" 2024.

The NetAcad catalog describes the **SRWE Supplemental Module** as "Rapid PVST+ Spanning Tree Protocol and key network operations for cloud network management". It describes the **ENSA Supplemental Module** as "AI, machine learning, REST APIs, and configuration management tools like Ansible and Terraform" [S16]. Third-party mirrors number them **SRWE Module 17** and **ENSA Module 15** [S19]. See section 2.4.

### 1.6 Heads-up: CCNA v2.0 (first test date 2027-02-03)

Short summary from Cisco's v2.0 exam-topics page [S10] (official; read from a cached copy). The exam code stays 200-301, and the length stays 120 minutes / US$300.

| v2.0 domain | Weight |
|---|---|
| 1.0 Network Infrastructure and Connectivity | 25% |
| 2.0 Switching and Network Access | 25% |
| 3.0 IP Routing | 20% |
| 4.0 Network Services and Security | 20% |
| 5.0 AI, and Network Operations and Management | 10% |

Notable shifts:
- Troubleshoot, diagnose, and validate verbs return (e.g., 1.1 "Diagnose interface and cable … issues", 3.2 "Troubleshoot IPv4 and IPv6 static routing").
- OSPFv3 for IPv6 is added (3.3).
- FHRP status is named as HSRP and VRRP (3.4).
- AAA client config with TACACS+/RADIUS (4.1) and SFTP/SCP (4.2) are added.
- DNS records (A, AAAA, CNAME, MX, NS, PTR) appear in 4.4.
- Storm control and RA guard join the L2 security features (4.7).
- **Agentic AI** (5.1) and **prompt selection for generative AI** (5.2) are added.
- Network management approaches now include IaC (5.3).
- "Use … Ansible to execute commands" (5.5).
- BPDU filter is dropped from 2.5.d.
- Terraform, JSON, and REST no longer appear by name in the domain 5 list I saw (uncertain; check against the official v2.0 PDF).

---

## 2. Cisco NetAcad CCNA v7 (v7.02) course modules and topics

**Sources.** Module titles, module objectives, and numbered topics come from the itexamanswers "CCNA v7.0 Curriculum: Module N" pages [S17]. That is 47 pages, one per module, each reproducing the course's "What will I learn" table and section headings. They were cross-checked against NetAcad's official **CCNAv7.02 Scope and Sequence** documents for ITN, SRWE, and ENSA (updated Feb 2021) [S18]. Those documents list the same modules, topics, and objectives. Short topic objectives follow each section title. The last section of each module is the "Module Practice and Quiz". The current NetAcad catalog names the courses "CCNA: Introduction to Networks", "CCNA: Switching, Routing, and Wireless Essentials", and "CCNA: Enterprise Networking, Security, and Automation". The v1.1 supplemental modules are in section 2.4.

Counts: ITN 17 modules, SRWE 16 modules (+1 supplemental), ENSA 14 modules (+1 supplemental).

### 2.1 Introduction to Networks (ITN) — 17 modules

Course #1 ("CCNA 1"). Official module and topic objectives: [S18] ITN Scope and Sequence. Section numbering: [S17].

#### ITN Module 1: Networking Today

*Module objective:* Explain the advances in modern network technologies.

- **1.1 Networks Affect our Lives** — Explain how networks affect our daily lives.
- **1.2 Network Components** — Explain how host and network devices are used.
- **1.3 Network Representations and Topologies** — Explain network representations and how they are used in network topologies.
- **1.4 Common Types of Networks** — Compare the characteristics of common types of networks.
- **1.5 Internet Connections** — Explain how LANs and WANs interconnect to the internet.
- **1.6 Reliable Networks** — Describe the four basic requirements of a reliable network.
- **1.7 Network Trends** — Explain how trends such as BYOD, online collaboration, video, and cloud computing are changing the way we interact.
- **1.8 Network Security** — Identify some basic security threats and solution for all networks.
- **1.9 The IT Professional** — Explain employment opportunities in the networking field.
- **1.10 Module Practice and Quiz**

#### ITN Module 2: Basic Switch and End Device Configuration

*Module objective:* Implement initial settings including passwords, IP addressing, and default gateway parameters on a network switch and end devices.

- **2.1 Cisco IOS Access** — Explain how to access a Cisco IOS device for configuration purposes.
- **2.2 IOS Navigation** — Explain how to navigate Cisco IOS to configure network devices.
- **2.3 The Command Structure** — Describe the command structure of Cisco IOS software.
- **2.4 Basic Device Configuration** — Configure a Cisco IOS device using CLI.
- **2.5 Save Configurations** — Use IOS commands to save the running configuration.
- **2.6 Ports and Addresses** — Explain how devices communicate across network media.
- **2.7 Configure IP Addressing** — Configure a host device with an IP address.
- **2.8 Verify Connectivity** — Verify connectivity between two end devices.
- **2.9 Module Practice and Quiz**

#### ITN Module 3: Protocols and Models

*Module objective:* Explain how network protocols enable devices to access local and remote network resources.

- **3.1 The Rules** — Describe the types of rules that are necessary to successfully communicate.
- **3.2 Protocols** — Explain why protocols are necessary in network communication.
- **3.3 Protocol Suites** — Explain the purpose of adhering to a protocol suite.
- **3.4 Standards Organizations** — Explain the role of standards organizations in establishing protocols for network interoperability.
- **3.5 Reference Models** — Explain how the TCP/IP model and the OSI model are used to facilitate standardization in the communication process.
- **3.6 Data Encapsulation** — Explain how data encapsulation allows data to be transported across the network.
- **3.7 Data Access** — Explain how local hosts access local resources on a network.
- **3.8 Module Practice and Quiz**

#### ITN Module 4: Physical Layer

*Module objective:* Explain how physical layer protocols, services, and network media support communications across data networks.

- **4.1 Purpose of the Physical Layer** — Describe the purpose and functions of the physical layer in the network.
- **4.2 Physical Layer Characteristics** — Describe characteristics of the physical layer.
- **4.3 Copper Cabling** — Identify the basic characteristics of copper cabling.
- **4.4 UTP Cabling** — Explain how UTP cable is used in Ethernet networks.
- **4.5 Fiber-Optic Cabling** — Describe fiber optic cabling and its main advantages over other media.
- **4.6 Wireless Media** — Connect devices using wired and wireless media.
- **4.7 Module Practice and Quiz**

#### ITN Module 5: Number Systems

*Module objective:* Calculate numbers between decimal, binary, and hexadecimal systems.

- **5.1 Binary Number System** — Calculate numbers between decimal and binary systems.
- **5.2 Hexadecimal Number System** — Calculate numbers between decimal and hexadecimal systems.
- **5.3 Module Practice and Quiz**

#### ITN Module 6: Data Link Layer

*Module objective:* Explain how media access control in the data link layer supports communication across networks.

- **6.1 Purpose of the Data Link Layer** — Describe the purpose and function of the data link layer in preparing communication for transmission on specific media.
- **6.2 Topologies** — Compare the characteristics of media access control methods on WAN and LAN topologies.
- **6.3 Data Link Frame** — Describe the characteristics and functions of the data link frame.
- **6.4 Module Practice and Quiz**

#### ITN Module 7: Ethernet Switching

*Module objective:* Explain how Ethernet operates in a switched network.

- **7.1 Ethernet Frames** — Explain how the Ethernet sublayers are related to the frame fields.
- **7.2 Ethernet MAC Address** — Describe the Ethernet MAC address.
- **7.3 The MAC Address Table** — Explain how a switch builds its MAC address table and forwards frames.
- **7.4 Switch Speeds and Forwarding Methods** — Describe switch forwarding methods and port settings available on Layer 2 switch ports.
- **7.5 Module Practice and Quiz**

#### ITN Module 8: Network Layer

*Module objective:* Explain how routers use network layer protocols and services to enable end-to-end connectivity.

- **8.1 Network Layer Characteristics** — Explain how the network layer uses IP protocols for reliable communications.
- **8.2 IPv4 Packet** — Explain the role of the major header fields in the IPv4 packet.
- **8.3 IPv6 Packet** — Explain the role of the major header fields in the IPv6 packet.
- **8.4 How a Host Routes** — Explain how network devices use routing tables to direct packets to a destination network.
- **8.5 Introduction to Routing** — Explain the function of fields in the routing table of a router.
- **8.6 Module Practice and Quiz**

#### ITN Module 9: Address Resolution

*Module objective:* Explain how ARP and ND enable communication on a network.

- **9.1 MAC and IP** — Compare the roles of the MAC address and the IP address.
- **9.2 ARP** — Describe the purpose of ARP.
- **9.3 IPv6 Neighbor Discovery** — Describe the operation of IPv6 neighbor discovery.
- **9.4 Module Practice and Quiz**

#### ITN Module 10: Basic Router Configuration

*Module objective:* Implement initial settings on a router and end devices.

- **10.1 Configure Initial Router Settings** — Configure initial settings on an IOS Cisco router.
- **10.2 Configure Interfaces** — Configure two active interfaces on a Cisco IOS router.
- **10.3 Configure the Default Gateway** — Configure devices to use the default gateway.
- **10.4 Module Practice and Quiz**

#### ITN Module 11: IPv4 Addressing

*Module objective:* Calculate an IPv4 subnetting scheme to efficiently segment your network.

- **11.1 IPv4 Address Structure** — Describe the structure of an IPv4 address including the network portion, the host portion, and the subnet mask.
- **11.2 IPv4 Unicast, Broadcast, and Multicast** — Compare the characteristics and uses of the unicast, broadcast and multicast IPv4 addresses.
- **11.3 Types of IPv4 Addresses** — Explain public, private, and reserved IPv4 addresses.
- **11.4 Network Segmentation** — Explain how subnetting segments a network to enable better communication.
- **11.5 Subnet an IPv4 Network** — Calculate IPv4 subnets for a /24 prefix.
- **11.6 Subnet a Slash 16 and a Slash 8 Prefix** — Calculate IPv4 subnets for a /16 and /8 prefix.
- **11.7 Subnet to Meet Requirements** — Given a set of requirements for subnetting, implement an IPv4 addressing scheme.
- **11.8 VLSM** — Explain how to create a flexible addressing scheme using variable length subnet masking (VLSM).
- **11.9 Structured Design** — Implement a VLSM addressing scheme.
- **11.10 Module Practice and Quiz**

#### ITN Module 12: IPv6 Addressing

*Module objective:* Implement an IPv6 addressing scheme.

- **12.1 IPv4 Issues** — Explain the need for IPv6 addressing.
- **12.2 IPv6 Address Representation** — Explain how IPv6 addresses are represented.
- **12.3 IPv6 Address Types** — Compare types of IPv6 network addresses.
- **12.4 GUA and LLA Static Configuration** — Explain how to Configure static global unicast and link-local IPv6 network addresses.
- **12.5 Dynamic Addressing for IPv6 GUAs** — Explain how to configure global unicast addresses dynamically.
- **12.6 Dynamic Addressing for IPv6 LLAs** — Configure link-local addresses dynamically.
- **12.7 IPv6 Multicast Addresses** — Identify IPv6 addresses.
- **12.8 Subnet an IPv6 Network** — Implement a subnetted IPv6 addressing scheme.
- **12.9 Module Practice and Quiz**

#### ITN Module 13: ICMP

*Module objective:* Use various tools to test network connectivity.

- **13.1 ICMP Messages** — Explain how ICMP is used to test network connectivity.
- **13.2 Ping and Traceroute Tests** — Use ping and traceroute utilities to test network connectivity.
- **13.3 Module Practice and Quiz**

#### ITN Module 14: Transport Layer

*Module objective:* Compare the operations of transport layer protocols in supporting end-to-end communication.

- **14.1 Transportation of Data** — Explain the purpose of the transport layer in managing the transportation of data in end-to-end communication.
- **14.2 TCP Overview** — Explain characteristics of TCP.
- **14.3 UDP Overview** — Explain characteristics of UDP.
- **14.4 Port Numbers** — Explain how TCP and UDP use port numbers.
- **14.5 TCP Communication Process** — Explain how TCP session establishment and termination processes facilitate reliable communication.
- **14.6 Reliability and Flow Control** — Explain how TCP protocol data units are transmitted and acknowledged to guarantee delivery.
- **14.7 UDP Communication** — Compare the operations of transport layer protocols in supporting end-to-end communication.
- **14.8 Module Practice and Quiz**

#### ITN Module 15: Application Layer

*Module objective:* Explain the operation of application layer protocols in providing support to end-user applications.

- **15.1 Application, Presentation, and Session** — Explain how the functions of the application layer, presentation layer, and session layer work together to provide network services to end user applications.
- **15.2 Peer-to-Peer** — Explain how end user applications operate in a peer-to-peer network.
- **15.3 Web and Email Protocols** — Explain how web and email protocols operate.
- **15.4 IP Addressing Services** — Explain how DNS and DHCP operate.
- **15.5 File Sharing Services** — Explain how file transfer protocols operate.
- **15.6 Module Practice and Quiz**

#### ITN Module 16: Network Security Fundamentals

*Module objective:* Configure switches and routers with device hardening features to enhance security.

- **16.1 Security Threats and Vulnerabilities** — Explain why basic security measure are necessary on network devices.
- **16.2 Network Attacks** — Identify security vulnerabilities.
- **16.3 Network Attack Mitigations** — Identify general mitigation techniques.
- **16.4 Device Security** — Configure network devices with device hardening features to mitigate security threats.
- **16.5 Module Practice and Quiz**

#### ITN Module 17: Build a Small Network

*Module objective:* Implement a network design for a small network to include a router, a switch, and end devices.

- **17.1 Devices in a Small Network** — Identify the devices used in a small network.
- **17.2 Small Network Applications and Protocols** — Identify the protocols and applications used in a small network.
- **17.3 Scale to Larger Networks** — Explain how a small network serves as the basis of larger networks.
- **17.4 Verify Connectivity** — Use the output of the ping and tracert commands to verify connectivity and establish relative network performance.
- **17.5 Host and IOS Commands** — Use host and IOS commands to acquire information about the devices in a network.
- **17.6 Troubleshooting Methodologies** — Describe common network troubleshooting methodologies
- **17.7 Troubleshooting Scenarios** — Troubleshoot issues with devices in the network.
- **17.8 Module Practice and Quiz**


### 2.2 Switching, Routing, and Wireless Essentials (SRWE) — 16 modules

Course #2 ("CCNA 2"). Sources [S17][S18]. Note: the source page for SRWE Module 1 shows no "1.6 Module Practice and Quiz" heading. Every other module has one, so 1.6 probably exists (uncertain).

#### SRWE Module 1: Basic Device Configuration

*Module objective:* Configure devices using security best practices.

- **1.1 Configure a Switch with Initial Settings** — Configure initial settings on a Cisco switch.
- **1.2 Configure Switch Ports** — Configure switch ports to meet network requirements.
- **1.3 Secure Remote Access** — Configure secure management access on a switch.
- **1.4 Basic Router Configuration** — Configure basic settings on a router to route between two directly-connected networks, using CLI.
- **1.5 Verify Directly Connected Networks** — Verify connectivity between two networks that are directly connected to a router.

#### SRWE Module 2: Switching Concepts

*Module objective:* Explain how Layer 2 switches forward data.

- **2.1 Frame Forwarding** — Explain how frames are forwarded in a switched network.
- **2.2 Switching Domains** — Compare a collision domain to a broadcast domain.
- **2.3 Module Practice and Quiz**

#### SRWE Module 3: VLANs

*Module objective:* Implement VLANs and trunking in a switched network.

- **3.1 Overview of VLANs** — Explain the purpose of VLANs in a switched network
- **3.2 VLANs in a Multi-Switched Environment** — Explain how a switch forwards frames based on VLAN configuration in a multi-switch environment.
- **3.3 VLAN Configuration** — Configure a switch port to be assigned to a VLAN based on requirements.
- **3.4 VLAN Trunks** — Configure a trunk port on a LAN switch.
- **3.5 Dynamic Trunking Protocol** — Configure Dynamic Trunking Protocol (DTP).
- **3.6 Module Practice and Quiz**

#### SRWE Module 4: Inter-VLAN Routing

*Module objective:* Troubleshoot inter-VLAN routing on Layer 3 devices.

- **4.1 Inter-VLAN Routing Operation** — Describe options for configuring inter-VLAN routing.
- **4.2 Router-on-a-Stick Inter-VLAN Routing** — Configure router-on-a-stick inter-VLAN routing.
- **4.3 Inter-VLAN Routing using Layer 3 Switches** — Configure inter-VLAN routing using Layer 3 switching.
- **4.4 Troubleshoot Inter-VLAN Routing** — Troubleshoot common inter-VLAN configuration issues.
- **4.5 Module Practice and Quiz**

#### SRWE Module 5: STP Concepts

*Module objective:* Explain how STP enables redundancy in a Layer 2 network.

- **5.1 Purpose of STP** — Explain common problems in a redundant, L2 switched network.
- **5.2 STP Operations** — Explain how STP operates in a simple switched network.
- **5.3 Evolution of STP** — Explain how Rapid PVST+ operates.
- **5.4 Module Practice and Quiz**

#### SRWE Module 6: EtherChannel

*Module objective:* Troubleshoot EtherChannel on switched links.

- **6.1 EtherChannel Operation** — Describe EtherChannel technology.
- **6.2 Configure EtherChannel** — Configure EtherChannel.
- **6.3 Verify and Troubleshoot EtherChannel** — Troubleshoot EtherChannel.
- **6.4 Module Practice and Quiz**

#### SRWE Module 7: DHCPv4

*Module objective:* Implement DHCPv4 to operate across multiple LANs.

- **7.1 DHCPv4 Concepts** — Explain how DHCPv4 operates in a small- to medium-sized business network.
- **7.2 Configure a Cisco IOS DHCPv4 Server** — Configure a router as a DHCPv4 server.
- **7.3 Configure a DHCPv4 Client** — Configure a router as a DHCPv4 client.
- **7.4 Module Practice and Quiz**

#### SRWE Module 8: SLAAC and DHCPv6

*Module objective:* Configure dynamic address allocation in IPv6 networks.

- **8.1 IPv6 GUA Assignment** — Explain how an IPv6 host can acquire its IPv6 configuration.
- **8.2 SLAAC** — Explain the operation of SLAAC.
- **8.3 DHCPv6** — Explain the operation of DHCPv6.
- **8.4 Configure DHCPv6 Server** — Configure a stateful and stateless DHCPv6 server.
- **8.5 Module Practice and Quiz**

#### SRWE Module 9: FHRP Concepts

*Module objective:* Explain how FHRPs provide default gateway services in a redundant network.

- **9.1 First Hop Redundancy Protocols** — Explain the purpose and operation of first hop redundancy protocols.
- **9.2 HSRP** — Explain how HSRP operates.
- **9.3 Module Practice and Quiz**

#### SRWE Module 10: LAN Security Concepts

*Module objective:* Explain how vulnerabilities compromise LAN security.

- **10.1 Endpoint Security** — Explain how to use endpoint security to mitigate attacks.
- **10.2 Access Control** — Explain how AAA and 802.1X are used to authenticate LAN endpoints and devices.
- **10.3 Layer 2 Security Threats** — Identify Layer 2 vulnerabilities.
- **10.4 MAC Address Table Attack** — Explain how a MAC address table attack compromises LAN security.
- **10.5 LAN Attacks** — Explain how LAN attacks compromise LAN security.
- **10.6 Module Practice and Quiz**

#### SRWE Module 11: Switch Security Configuration

*Module objective:* Configure switch security to mitigate LAN attacks.

- **11.1 Implement Port Security** — Implement port security to mitigate MAC address table attacks.
- **11.2 Mitigate VLAN Attacks** — Explain how to configure DTP and native VLAN to mitigate VLAN attacks.
- **11.3 Mitigate DHCP Attacks** — Explain how to configure DHCP snooping to mitigate DHCP attacks.
- **11.4 Mitigate ARP Attacks** — Explain how to configure ARP inspection to mitigate ARP attacks.
- **11.5 Mitigate STP Attacks** — Explain how to configure PortFast and BPDU Guard to mitigate STP attacks.
- **11.6 Module Practice and Quiz**

#### SRWE Module 12: WLAN Concepts

*Module objective:* Explain how WLANs enable network connectivity.

- **12.1 Introduction to Wireless** — Describe WLAN technology and standards.
- **12.2 WLAN Components** — Describe the components of a WLAN infrastructure.
- **12.3 WLAN Operation** — Explain how wireless technology enables WLAN operation.
- **12.4 CAPWAP Operation** — Explain how a WLC uses CAPWAP to manage multiple APs.
- **12.5 Channel Management** — Describe channel management in a WLAN.
- **12.6 WLAN Threats** — Describe threats to WLANs.
- **12.7 Secure WLANs** — Describe WLAN security mechanisms.
- **12.8 Module Practice and Quiz**

#### SRWE Module 13: WLAN Configuration

*Module objective:* Implement a WLAN using a wireless router and WLC.

- **13.1 Remote Site WLAN Configuration** — Configure a WLAN to support a remote site.
- **13.2 Configure a Basic WLAN on the WLC** — Configure a WLC WLAN to use the management interface and WPA2 PSK authentication.
- **13.3 Configure a WPA2 Enterprise WLAN on the WLC** — Configure a WLC WLAN to use a VLAN interface, a DHCP server, and WPA2 Enterprise authentication.
- **13.4 Troubleshoot WLAN Issues** — Troubleshoot common wireless configuration issues.
- **13.5 Module Practice and Summary**

#### SRWE Module 14: Routing Concepts

*Module objective:* Explain how routers use information in packets to make forwarding decisions.

- **14.1 Path Determination** — Explain how routers determine the best path.
- **14.2 Packet Forwarding** — Explain how routers forward packets to the destination.
- **14.3 Basic Router Configuration Review** — Configure basic settings on a router.
- **14.4 IP Routing Table** — Describe the structure of a routing table.
- **14.5 Static and Dynamic Routing** — Compare static and dynamic routing concepts.
- **14.6 Module Practice and Quiz**

#### SRWE Module 15: IP Static Routing

*Module objective:* Configure IPv4 and IPv6 static routes.

- **15.1 Static Routes** — Describe the command syntax for static routes.
- **15.2 Configure IP Static Routes** — Configure IPv4 and IPv6 static routes.
- **15.3 Configure IP Default Static Routes** — Configure IPv4 and IPv6 default static routes.
- **15.4 Configure Floating Static Routes** — Configure a floating static route to provide a backup connection.
- **15.5 Configure Static Host Routes** — Configure IPv4 and IPv6 static host routes that direct traffic to a specific host.
- **15.6 Module Practice and Quiz**

#### SRWE Module 16: Troubleshoot Static and Default Routes

*Module objective:* Troubleshoot static and default route configurations.

- **16.1 Packet Processing with Static Routes** — Explain how a router processes packets when a static route is configured.
- **16.2 Troubleshoot IPv4 Static and Default Route Configuration** — Troubleshoot common static and default route configuration issues.
- **16.3 Module Practice and Quiz**


### 2.3 Enterprise Networking, Security, and Automation (ENSA) — 14 modules

Course #3 ("CCNA 3"). Sources [S17][S18]. Module 1 is titled "Single-Area OSPFv2 Concepts" in the Scope and Sequence; itexamanswers shows "Single-Area OSPF Concepts". The ENSA Module 3 topic objectives come from the Scope and Sequence [S18].

#### ENSA Module 1: Single-Area OSPFv2 Concepts

*Module objective:* Explain how single-area OSPF operates in both point-to-point and broadcast multiaccess networks.

- **1.1 OSPF Features and Characteristics** — Describe basic OSPF features and characteristics.
- **1.2 OSPF Packets** — Describe the OSPF packet types used in single-area OSPF.
- **1.3 OSPF Operation** — Explain how single-area OSPF operates.
- **1.4 Module Practice and Quiz**

#### ENSA Module 2: Single-Area OSPFv2 Configuration

*Module objective:* Implement single-area OSPFv2 in both point-to-point and broadcast multiaccess networks.

- **2.1 OSPF Router ID** — Configure an OSPFv2 router ID.
- **2.2 Point-to-Point OSPF Networks** — Configure single-area OSPFv2 in a point-to-point network.
- **2.3 Multiaccess OSPF Networks** — Configure the OSPF interface priority to influence the DR/BDR election in a multiaccess network.
- **2.4 Modify Single-Area OSPFv2** — Implement modifications to change the operation of single-area OSPFv2.
- **2.5 Default Route Propagation** — Configure OSPF to propagate a default route.
- **2.6 Verify Single-Area OSPFv2** — Verify a single-area OSPFv2 implementation.
- **2.7 Module Practice and Quiz**

#### ENSA Module 3: Network Security Concepts

*Module objective:* Explain how vulnerabilities, threats, and exploits can be mitigated to enhance network security.

- **3.1 Current State of Cybersecurity** — Describe the current state of cybersecurity and vectors of data loss.
- **3.2 Threat Actors** — Describe the threat actors who exploit networks.
- **3.3 Threat Actor Tools** — Describe tools used by threat actors to exploit networks.
- **3.4 Malware** — Describe malware types.
- **3.5 Common Network Attacks** — Describe common network attacks.
- **3.6 IP Vulnerabilities and Threats** — Explain how IP vulnerabilities are exploited by threat actors.
- **3.7 TCP and UDP Vulnerabilities** — Explain how TCP and UDP vulnerabilities are exploited by threat actors.
- **3.8 IP Services** — Explain how IP services are exploited by threat actors.
- **3.9 Network Security Best Practices** — Describe best practices for protecting a network.
- **3.10 Cryptography** — Describe common cryptographic processes used to protect data in transit.
- **3.11 Module Practice and Quiz**

#### ENSA Module 4: ACL Concepts

*Module objective:* Explain how ACLs are used as part of a network security policy.

- **4.1 Purpose of ACLs** — Explain how ACLs filter traffic.
- **4.2 Wildcard Masks in ACLs** — Explain how ACLs use wildcard masks.
- **4.3 Guidelines for ACL Creation** — Explain how to create ACLs.
- **4.4 Types of IPv4 ACLs** — Compare standard and extended IPv4 ACLs.
- **4.5 Module Practice and Quiz**

#### ENSA Module 5: ACLs for IPv4 Configuration

*Module objective:* Implement IPv4 ACLs to filter traffic and secure administrative access.

- **5.1 Configure Standard IPv4 ACLs** — Configure standard IPv4 ACLs to filter traffic to meet networking requirements.
- **5.2 Modify IPv4 ACLs** — Use sequence numbers to edit existing standard IPv4 ACLs.
- **5.3 Secure VTY Ports with a Standard IPv4 ACL** — Configure a standard ACL to secure VTY access.
- **5.4 Configure Extended IPv4 ACLs** — Configure extended IPv4 ACLs to filter traffic according to networking requirements.
- **5.5 Module Practice and Quiz**

#### ENSA Module 6: NAT for IPv4

*Module objective:* Configure NAT services on the edge router to provide IPv4 address scalability.

- **6.1 NAT Characteristics** — Explain the purpose and function of NAT.
- **6.2 Types of NAT** — Explain the operation of different types of NAT.
- **6.3 NAT Advantages and Disadvantages** — Describe the advantages and disadvantages of NAT.
- **6.4 Static NAT** — Configure static NAT using the CLI.
- **6.5 Dynamic NAT** — Configure dynamic NAT using the CLI.
- **6.6 PAT** — Configure PAT using the CLI.
- **6.7 NAT64** — Describe NAT for IPv6.
- **6.8 Module Practice and Quiz**

#### ENSA Module 7: WAN Concepts

*Module objective:* Explain how WAN access technologies can be used to satisfy business requirements.

- **7.1 Purpose of WANs** — Explain the purpose of a WAN.
- **7.2 WAN Operations** — Explain how WANs operate.
- **7.3 Traditional WAN Connectivity** — Compare traditional WAN connectivity options.
- **7.4 Modern WAN Connectivity** — Compare modern WAN connectivity options.
- **7.5 Internet-Based Connectivity** — Compare internet-based connectivity options.
- **7.6 Module Practice and Quiz**

#### ENSA Module 8: VPN and IPsec Concepts

*Module objective:* Explain how VPNs and IPsec are used to secure site-to-site and remote access connectivity.

- **8.1 VPN Technology** — Describe benefits of VPN technology.
- **8.2 Types of VPNs** — Describe different types of VPNs.
- **8.3 IPsec** — Explain how the IPsec framework is used to secure network traffic.
- **8.4 Module Practice and Quiz**

#### ENSA Module 9: QoS Concepts

*Module objective:* Explain how networking devices implement QoS.

- **9.1 Network Transmission Quality** — Explain how network transmission characteristics impact quality.
- **9.2 Traffic Characteristics** — Describe minimum network requirements for voice, video, and data traffic.
- **9.3 Queuing Algorithms** — Describe the queuing algorithms used by networking devices.
- **9.4 QoS Models** — Describe the different QoS models.
- **9.5 QoS Implementation Techniques** — Explain how QoS uses mechanisms to ensure transmission quality.
- **9.6 Module Practice and Quiz**

#### ENSA Module 10: Network Management

*Module objective:* Implement protocols to manage the network.

- **10.1 Device Discovery with CDP** — Use CDP to map a network topology.
- **10.2 Device Discovery with LLDP** — Use LLDP to map a network topology.
- **10.3 NTP** — Implement NTP between an NTP client and NTP server.
- **10.4 SNMP** — Explain how SNMP operates.
- **10.5 Syslog** — Explain syslog operation.
- **10.6 Router and Switch File Maintenance** — Use commands to back up and restore an IOS configuration file.
- **10.7 IOS Image Management** — Implement protocols to manage the network.
- **10.8 Module Practice and Quiz**

#### ENSA Module 11: Network Design

*Module objective:* Explain the characteristics of scalable network architectures.

- **11.1 Hierarchical Networks** — Explain how data, voice, and video are converged in a switched network.
- **11.2 Scalable Networks** — Explain considerations for designing a scalable network.
- **11.3 Switch Hardware** — Explain how switch hardware features support network requirements.
- **11.4 Router Hardware** — Describe the types of routers available for small to-medium-sized business networks.
- **11.5 Module Practice and Quiz**

#### ENSA Module 12: Network Troubleshooting

*Module objective:* Troubleshoot enterprise networks.

- **12.1 Network Documentation** — Explain how network documentation is developed and used to troubleshoot network issues.
- **12.2 Troubleshooting Process** — Compare troubleshooting methods that use a systematic, layered approach.
- **12.3 Troubleshooting Tools** — Describe different networking troubleshooting tools.
- **12.4 Symptoms and Causes of Network Problems** — Determine the symptoms and causes of network problems using a layered model.
- **12.5 Troubleshooting IP Connectivity** — Troubleshoot a network using the layered model.
- **12.6 Module Practice and Quiz**

#### ENSA Module 13: Network Virtualization

*Module objective:* Explain the purpose and characteristics of network virtualization.

- **13.1 Cloud Computing** — Explain the importance of cloud computing.
- **13.2 Virtualization** — Explain the importance of virtualization.
- **13.3 Virtual Network Infrastructure** — Describe the virtualization of network devices and services.
- **13.4 Software-Defined Networking** — Describe software-defined networking.
- **13.5 Controllers** — Describe controllers used in network programming.
- **13.6 Module Practice and Quiz**

#### ENSA Module 14: Network Automation

*Module objective:* Explain how network automation is enabled through RESTful APIs and configuration management tools.

- **14.1 Automation Overview** — Describe automation.
- **14.2 Data Formats** — Compare JSON, YAML, and XML data formats.
- **14.3 APIs** — Explain how APIs enable computer to computer communications.
- **14.4 REST** — Explain how REST enables computer to computer communications.
- **14.5 Configuration Management Tools** — Compare the configuration management tools Puppet, Chef, Ansible, and SaltStack.
- **14.6 IBN and Cisco DNA Center** — Explain how Cisco DNA center enables intent-based networking.
- **14.7 Module Practice and Quiz**

### 2.4 v1.1 Supplemental Modules (added Aug/Sep 2024)

These are free NetAcad / Skills for All modules [S16], announced in [S15].

#### SRWE Supplemental Module (numbered Module 17 in mirrors): "CCNA 200-301 Exam v1.1 Supplemental Module"

*Catalog description:* "Learn Rapid PVST+ Spanning Tree Protocol and key network operations for cloud network management to prepare for the CCNA v1.1 certification exam." [S16]

- **17.1 RSTP Port Roles and States.** Sub-topics include STP versus RSTP, RSTP port states, RSTP port roles, RSTP link types and edge ports, and root-bridge election practice. (Titles translated back from a Portuguese copy, so uncertain [S20].)
- **17.2 STP enhancement mechanisms**: BPDU Guard, BPDU Filter, Root Guard, Loop Guard, with configuration examples. (English title uncertain [S20].)
- **17.3 Module Practice and Quiz**. The quiz is "17.3.2" [S19].
- Quiz items cover port roles, RSTP vs STP, discarding state, root bridge selection, PortFast, BPDU Guard/Filter behavior, `spanning-tree portfast bpduguard enable`, and root guard [S19].
- (uncertain) The catalog mentions "cloud network management", but no cloud-management questions appear in the 17.3.2 quiz.

#### ENSA Supplemental Module (numbered Module 15 in mirrors)

*Catalog description:* "Learn about AI, machine learning, REST APIs, and configuration management tools like Ansible and Terraform to prepare for the CCNA v1.1 certification exam." [S16]

- I could not find the section titles. The quiz is numbered **15.8.2**, which suggests sections 15.1–15.7 plus 15.8 Module Practice and Quiz (inferred, uncertain).
- Quiz topics [S19]:
  - Network evolution (ARPANET → SDN)
  - AI and IBN tooling (Python/Netmiko/NAPALM, Ansible, Terraform, NETCONF, RESTCONF)
  - Explainable AI (XAI); narrow AI; predictive vs generative AI; AI vs ML; learning methods; prompt engineering; AI risks
  - Per-device vs cloud-based management (e.g., a cloud solution for distributed networks)
  - Infrastructure as Code
  - Ansible architecture, install options, and IOS modules
  - Ansible vs Terraform, HCL, `terraform init` / `terraform plan`
  - REST best practices; basic auth vs access tokens; OAuth-style third-party login

---

## 3. Gap analysis: v1.1 exam topics vs ITN/SRWE/ENSA v7

**Method.** Each exam topic was mapped to the v7 sections in section 2. I also keyword-searched all 47 v7 module pages, e.g., "Terraform", "container", "monitor mode", "QoS profile", "multifactor", "loop guard", "Catalyst Center". The keyword counts are in my working notes; they are evidence, not proof.

Coverage legend:
- **Full**: core v7 content matches the topic's verb and depth.
- **Partial**: some sub-items are missing, or the treatment is shallower than the verb implies.
- **Light**: mentioned only in passing.
- **None→Supp**: absent from core v7 and covered only by a 2024 supplemental module.
- **None**: not found.

### 3.1 Topics not covered or only lightly covered (priority list)

| Exam topic | v7 location | Coverage | What's missing |
|---|---|---|---|
| **6.4** AI (generative, predictive) and ML in network operations | ENSA 14.6 (IBN/DNA Center mentions ML in one paragraph) | **None→Supp** | Core v7 has nothing on generative/predictive AI. Only the ENSA Supplemental Module covers it. |
| **6.6** Ansible **and Terraform** | ENSA 14.5 (Ansible, Chef, Puppet, SaltStack compared) | **Partial→Supp** | Terraform has zero hits in v7. ENSA 14.5 still teaches Puppet, Chef, and SaltStack, which v1.1 dropped. Terraform, IaC, and HCL come from the ENSA supplemental module. |
| **6.5** REST APIs: **authentication types** | ENSA 14.3–14.4 (API types, REST, URI, anatomy of a request) | **Partial→Supp** | CRUD, verbs, and encoding are covered. Auth types (basic, token/API key, OAuth) get about one sentence in v7. The supplemental module adds them. |
| **2.5** Rapid PVST+ (2.5.a–d) | SRWE 5 (STP Concepts: 802.1D-centric; 5.3.2–5.3.4 RSTP, PortFast, BPDU guard); SRWE 11.5 (PortFast/BPDU guard config) | **Partial→Supp** | Core v7 has no Rapid PVST+ configuration (`spanning-tree mode rapid-pvst`, `root primary/secondary`: zero hits). Root guard, loop guard, and BPDU filter are only named in a list in 5.3.1. The SRWE supplemental module covers RSTP roles, states, and the four guard features. |
| **2.6** Cisco wireless architectures and **AP modes** | SRWE 12.2.5 (AP categories: autonomous vs controller-based), 12.4 (CAPWAP, split-MAC, DTLS, FlexConnect) | **Partial** | No AP modes beyond FlexConnect: no local, monitor, sniffer, rogue detector, SE-Connect, bridge/mesh, or Flex+Bridge ("monitor mode" has zero hits). Cloud-managed (Meraki) and embedded/Mobility Express architectures are only in passing. |
| **2.7** Physical WLAN connections (AP, WLC, access/trunk ports, LAG) | SRWE 12.4 (WLC four ports as a LAG, in figure text), SRWE 13.2 (WLC ports and interfaces) | **Light** | No explicit rule for which AP mode uses an access port vs a trunk (local mode on access, FlexConnect on trunk). LAG gets one sentence. |
| **2.9** Interpret WLC GUI (WLAN creation, security, **QoS profiles**, advanced) | SRWE 13.2–13.3 (Cisco 3504 AireOS GUI: log in, view APs, advanced settings, configure WLAN, SNMP/RADIUS, new interface, DHCP scope, WPA2-Enterprise) | **Partial** | WLAN QoS profiles (Platinum/Gold/Silver/Bronze) are not covered; QoS appears only for a home wireless router (13.1.8). The course uses the AireOS 3504 GUI only. Whether the exam shows AireOS, the 9800 (IOS XE) GUI, or both is unknown (uncertain). |
| **2.8** Device management access, incl. **cloud managed** | SRWE 1.3 (Telnet/SSH), ITN 2.1 (console), SRWE 10.2 (AAA, RADIUS/TACACS+ server-based), SRWE 13 (HTTP/HTTPS WLC GUI), ENSA 11.3 (Meraki cloud-managed switches) | **Partial→Supp** | "Cloud managed" appears only as a Meraki switch blurb. The supplemental module(s) add cloud-based management. TACACS+ vs RADIUS differences (TCP 49 vs UDP 1812/1813, encryption scope) get little depth (TACACS: 1 hit in SRWE 10). |
| **1.12** Virtualization: **containers** and **VRFs** | ENSA 13.2–13.3 (server virtualization, Type 1/2 hypervisors, VMs, virtual network infrastructure) | **Partial** | Containers: zero hits. VRFs: one passing mention in ENSA 13.3. Server virtualization is well covered. |
| **1.1.e** Controllers (now generic) | SRWE 12/13 (WLC), ENSA 13.5 (SDN controllers, APIC, APIC-EM), ENSA 14.6 (Cisco DNA Center) | **Partial** | The material predates the Catalyst Center rename and calls it DNA Center. Catalyst SD-WAN Manager, Meraki dashboard, and the 9800 WLC are not covered. APIC-EM (ENSA 13.5.6–13.5.7) is legacy. |
| **6.3** Overlay, underlay, fabric; NB/SB APIs | ENSA 13.4–13.5 (control/data plane, SDN, ACI), ENSA 14.6.3 (fabric, overlay, underlay) | **Partial** | The terms are covered. Northbound/southbound APIs have only 1–2 mentions (ENSA 13). SD-Access fabric specifics (e.g., LISP/VXLAN roles) are thin, and probably beyond CCNA depth anyway. |
| **5.4** Password policy; **alternatives (MFA, certificates, biometrics)** | ITN 16.4.2–16.4.3 (passwords, additional password security), SRWE 1 | **Partial** | MFA has zero hits and biometrics one passing hit (ENSA 8). Policy elements like complexity, rotation, and management get little coverage. |
| **5.2** Security program elements (user awareness, training, physical access control) | ITN 16.1.3 (Physical Security) | **Light** | User awareness and training programs are not found as content. Physical access control (badges, mantraps, etc.) is minimal. |
| **6.2 / 6.4 (v1.0 topic now removed)** DNA Center vs traditional management | ENSA 14.6 | Surplus | v7 still teaches the removed v1.0 6.4 content. It still helps for 6.2 (traditional vs controller-based). |
| **1.2.c** Spine-leaf | ENSA 13.5.4 (in the Cisco ACI context only) | **Partial** | Covered only as ACI fabric. Generic data-center spine-leaf design and its benefits get no separate treatment. |
| **1.9.a/1.9.b** ULA and anycast | ITN 12.3.1 (unicast/multicast/anycast), 12.3.4 "A Note About the Unique Local Address" | **Light** | Both are defined briefly. The course says ULA is used little and covers neither ULA addressing details (fc00::/7, fd00::/8) nor anycast use cases. |
| **3.5** FHRP | SRWE 9 (9.1.4 FHRP options; 9.2 HSRP overview, priority/preemption, states/timers; one HSRP Packet Tracer activity) | **Partial** | Fine for "describe". VRRP and GLBP are only listed (9.1.4). No VRRP vs HSRP comparison (open standard, master/backup, virtual MAC formats) and no HSRPv1 vs v2. |
| **2.4** EtherChannel **Layer 3** | SRWE 6 (PAgP/LACP config, verify, troubleshoot) | **Partial** | Layer 2 EtherChannel is covered. Layer 3 (routed) port-channels get one sentence ("…or on a routed port"), with no configuration. |
| **1.11** Wireless principles | SRWE 12.1.5 (RF), 12.5 (channel saturation, channel selection, planning), 12.7 (SSID cloaking, encryption) | **Mostly full** | 2.4/5 GHz non-overlapping channels are covered. 6 GHz / Wi-Fi 6E has zero hits; the blueprint does not name it, but newer study guides add it. |
| **4.7** QoS PHB | ENSA 9 (queuing FIFO/WFQ/CBWFQ/LLQ, models, classification/marking, DSCP, trust boundaries, congestion avoidance, shaping/policing) | **Full** | Covered well, and goes beyond the blueprint (IntServ). |

### 3.2 Topics well covered by v7 (for completeness)

| Exam topic | v7 location |
|---|---|
| 1.1.a–d, f–h components (routers, L2/L3 switches, NGFW/IPS, APs, endpoints, servers, PoE) | ITN 1.2; SRWE 10.1.2 (security devices incl. NGFW); ENSA 3.9.3–3.9.4 (firewalls, IPS); ENSA 11.3–11.4 (switch and router hardware, 11.3.5 PoE, multilayer switching); SRWE 12.2 |
| 1.2.a/b/d/e/f two-tier, three-tier, WAN, SOHO, on-prem vs cloud | ENSA 11.1.6 (Three-Tier and Two-Tier Examples, collapsed core); ENSA 7 (WAN); ITN 1.5, ITN 17.1, SRWE 13.1 (SOHO); ENSA 13.1 (cloud models, cloud vs data center) |
| 1.3 cabling (SMF/MMF/copper; shared vs point-to-point) | ITN 4.3–4.6; ITN 6.2 (topologies, half/full duplex, access control methods) |
| 1.4 interface and cable issues | SRWE 1.2.1–1.2.8 (duplex, auto-MDIX, input/output errors, runts, giants, CRC, late collisions); ITN 17.7.1 (duplex mismatch); ENSA 12.4 |
| 1.5 TCP vs UDP | ITN 14 |
| 1.6 / 1.7 IPv4 addressing, subnetting, private addressing | ITN 11 (incl. 11.3 types of addresses, 11.5–11.8 subnetting/VLSM); ITN 10, SRWE 1 (configure/verify) |
| 1.8 / 1.9.c / 1.9.d IPv6 config, multicast, EUI-64 | ITN 12 (12.4–12.8), SRWE 8 (SLAAC/DHCPv6), SRWE 1.5.3 |
| 1.10 client OS IP parameters | ITN 17.5.1–17.5.3 (Windows, Linux, macOS) |
| 1.13 switching concepts | ITN 7.3–7.4; SRWE 2 |
| 2.1 / 2.2 VLANs, voice VLAN, trunks, 802.1Q, native VLAN, inter-VLAN | SRWE 3, SRWE 4 (ROAS and L3 switch SVIs) |
| 2.3 CDP/LLDP | ENSA 10.1–10.2 |
| 3.1 / 3.2 routing table, longest prefix match, AD, metric | SRWE 14.1 (Best Path Equals Longest Match), 14.4 (incl. 14.4.12 AD); ENSA 2.4 (OSPF cost) |
| 3.3 IPv4/IPv6 static: default, network, host, floating | SRWE 15.2–15.5; SRWE 16 |
| 3.4 single-area OSPFv2 | ENSA 1–2 (router ID order of precedence, P2P, DR/BDR election and priority, cost/reference bandwidth, timers, default-route propagation, verification) |
| 4.1 NAT (static, pool, PAT) | ENSA 6 (plus NAT64, beyond the blueprint) |
| 4.2 NTP | ENSA 10.3 |
| 4.3 DHCP / DNS | ITN 15.4; SRWE 7 |
| 4.4 SNMP | ENSA 10.4 (versions, community strings, MIB/OID, traps) |
| 4.5 syslog facilities and severities | ENSA 10.5 |
| 4.6 DHCP client and relay | SRWE 7.2.8 (DHCPv4 Relay), 7.3 (router as DHCP client) |
| 4.8 SSH | ITN 16.4.4; SRWE 1.3 |
| 4.9 TFTP/FTP | ITN 15.5.1; ENSA 10.6–10.7 (config backup/restore and IOS image via TFTP) |
| 5.1 security concepts | ITN 16; ENSA 3 |
| 5.3 local passwords | ITN 2.4, ITN 16.4; SRWE 1 |
| 5.5 IPsec VPNs (site-to-site, remote access) | ENSA 8 |
| 5.6 ACLs | ENSA 4 (incl. 4.2 wildcard masks), ENSA 5 (standard, extended, named, VTY) |
| 5.7 DHCP snooping, DAI, port security | SRWE 10.3–10.5 (attacks), SRWE 11.1–11.4 (mitigation config) |
| 5.8 AAA | SRWE 10.2 (AAA components, authentication, authorization, accounting, 802.1X); ITN 16.3.4 |
| 5.9 WPA/WPA2/WPA3 | SRWE 12.7.4–12.7.8 |
| 5.10 WLAN via GUI using WPA2-PSK | SRWE 13.2.6 (Configure a WLAN: PSK on the WLC); 13.1 (home router WPA2 Personal) |
| 6.1 automation impact | ENSA 14.1, 14.5.2–14.5.3 |
| 6.2 traditional vs controller-based | ENSA 13.4.4 (Traditional and SDN Architectures), ENSA 14.6 |
| 6.7 JSON | ENSA 14.2 (JSON, YAML, XML; JSON syntax rules) |

### 3.3 v7 content that goes beyond v1.1 (time sinks for exam prep)

These items are taught in v7 but are not named in v1.1. The wording is mine.
- DTP (SRWE 3.5)
- NAT64 (ENSA 6.7)
- OSPFv3 and multiarea overview (ENSA 1.1.4–1.1.6). Note: OSPFv3 returns in v2.0.
- WAN legacy technologies: traditional WAN connectivity, MPLS, DMVPN, GRE over IPsec, IPsec VTI (ENSA 7.3, ENSA 8.2)
- Queuing algorithm details and IntServ (ENSA 9.3–9.4)
- APIC-EM features and Path Trace (ENSA 13.5.6–13.5.7)
- Puppet, Chef, and SaltStack (ENSA 14.5.5)
- Router and switch hardware selection, password recovery, IOS image management, USB backup (ENSA 10.6–10.7, ENSA 11.3–11.4)
- Cryptography (hash, symmetric/asymmetric, Diffie-Hellman; ENSA 3.10)
- Network documentation and troubleshooting tools (ENSA 12)

---

## 4. Commonly reported "hard spots" on the CCNA

These are anecdotal: most sources are prep vendors, blogs, and community threads. Cisco publishes no per-topic difficulty or pass-rate data, and third-party pass-rate estimates (e.g., "45–55% first attempt") are unverified [S22].

| Hard spot | Why candidates struggle (as reported) | Blueprint topics | Sources |
|---|---|---|---|
| **Subnetting speed and VLSM** | Ranked the "universal" struggle. The concept is easy, but doing it fast under time pressure is not. Slow subnetting eats time across the whole exam because many items depend on it (ACLs, OSPF network statements, routes). | 1.6, 1.7, 3.x, 5.6 | [S21][S22][S23] |
| **OSPF details** | Neighbor states (Down→Init→2-Way→ExStart→Exchange→Loading→Full) and the adjacency requirements (area, hello/dead timers, subnet, MTU, unique RID). DR/BDR election on multiaccess links, router-ID precedence, cost and reference-bandwidth math, and reading `show ip ospf neighbor`/`interface`. Note: one source [S22] garbles DR/BDR election. The correct order is highest interface priority, then highest router ID; the router ID comes from manual config, else highest loopback, else highest active interface IP. | 3.4 | [S21][S22] (one candidate needed "three attempts" to understand it) |
| **STP roles, costs, and elections** | Applying the full decision sequence in multi-switch diagrams: root bridge (priority + MAC), root port (lowest root path cost, then sender BID, then sender port ID), designated and alternate/blocked ports. Plus RSTP states and roles and the four guard features new in v1.1. | 2.5 | [S21][S24] |
| **Route selection: longest prefix → AD → metric** | Picking the forwarding route from complex routing tables. Floating statics (AD tweaks) and the gateway of last resort. | 3.1, 3.2, 3.3 | [S22] |
| **ACL wildcards and placement** | Wildcard-mask calculation, extended ACL syntax, the implicit deny, and placement (standard near the destination, extended near the source), tested in scenarios. | 5.6 | [S21][S22] |
| **IPv6 addressing types** | Address compression rules, GUA/LLA/ULA/multicast/anycast, EUI-64 math, and SLAAC vs DHCPv6. A long-standing CLN thread calls IPv6 "the hardest thing on the test". | 1.8, 1.9, 3.3 | [S21][S23-b] |
| **NAT/PAT** | Command sequences (inside/outside, pool vs overload) and reading translation tables. | 4.1 | [S21][S22] |
| **DHCP relay; DHCP snooping / DAI** | Candidates who know DHCP conceptually miss `ip helper-address`. Snooping/DAI trust config is often under-practiced. | 4.6, 5.7 | [S22] |
| **Automation / JSON / REST** | Easy for people with coding backgrounds, "entirely foreign" for traditional network engineers. Tested conceptually (read JSON, map CRUD to HTTP verbs, know what Ansible/Terraform do). | 6.5–6.7 | [S22] |
| **Wireless (WLC GUI, AP modes, security)** | (uncertain) I found no ranked source. The blueprint verbs ("interpret the wireless LAN GUI", "configure … within the GUI") imply exhibit-based questions on WLC screens. NetAcad gives only partial coverage (see gap table), which makes this a likely weak spot for NetAcad-only learners. | 2.6, 2.7, 2.9, 5.9, 5.10 | inference from [S1] + section 3 |
| **Lab sims and time management** | The format is forward-only with no review. Sims take 5–12 minutes each and are reportedly weighted more. Candidates without hands-on CLI practice "freeze" on sims. Commonly advised: time-box each sim (~10 min) and bank partial credit. | all "configure/verify" topics | [S13][S22] |

---

## Sources

**Official Cisco / NetAcad**
- [S1] Cisco, *CCNA Exam v1.1 (200-301) exam topics* (PDF, 2024). https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf
- [S2] Cisco, *CCNA Exam v1.0 (200-301) exam topics* (PDF, ©2021 revision). https://www.cisco.com/c/dam/en_us/training-events/le31/le46/cln/marketing/exam-topics/200-301-CCNA.pdf
- [S3] Cisco, *Release notes: CCNA Minor Update v1.1* (PDF, 4/24). https://learningcontent.cisco.com/documents/marketing/exam-topics/CCNA_1_1_release_notes.pdf
- [S4] J. Armaganian, "Inside the CCNA v1.1 exam update: AI, machine learning, and more", Cisco Blogs, 2024-08-22. https://blogs.cisco.com/learning/understanding-the-updated-ccna-v1-1-with-ai-machine-learning-and-more
- [S6] Cisco, *200-301 CCNA exam page*. https://www.cisco.com/site/us/en/learn/training-certifications/exams/ccna.html
- [S7] Cisco, *CCNA certification page and FAQ*. https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccna/index.html
- [S8] Cisco, *Certification exam policies* (passing scores, retakes). https://www.cisco.com/site/us/en/learn/training-certifications/exams/policies.html
- [S9] Cisco Learning Network, *200-301 CCNA Exam Topics and Study Guide* (v1.1; includes the v1.1 end date and v2.0 start date). https://learningnetwork.cisco.com/s/ccna-exam-topics
- [S10] Cisco Learning Network, *CCNA v2.0 Exam Topics*. https://learningnetwork.cisco.com/s/ccna-v2-exam-topics (read via a cached copy)
- [S11] Cisco Learning Network, *Certification Exam Tutorial Videos*. https://learningnetwork.cisco.com/s/certification-exam-tutorials
- [S12] Cisco Learning Network forum, moderator answer: questions cannot be marked or revisited. https://learningnetwork.cisco.com/s/question/0D53i00000Kt0qOCAR/just-took-the-ccna-200120-and-got-a-725
- [S15] G. Cinque (NetAcad), "AI in the next CCNA", IPD Week, 2024-06-13 (PDF). https://www.netacad.com/authoring-resources/courses/ff9e491c-49be-4734-803e-a79e6e83dab1/6d01ec8a-29fc-44b7-ae76-646fe2733ed6/en-US/assets/fc45d5f484fe4f4e81a7faae11878396.pdf
- [S16] NetAcad, *SRWE Supplemental Module* https://www.netacad.com/modules/srwe-supplemental?courseLang=en-US and *ENSA Supplemental Module* https://www.netacad.com/modules/ensa-supplemental?courseLang=en-US
- [S18] NetAcad, *CCNAv7.02 Scope and Sequence* for ITN, SRWE, and ENSA (last updated Feb 2021; hosted by VUT Brno academy). https://netacad.fit.vutbr.cz/wp-content/uploads/ccna/itn/ITN%20v7.02%20Scope%20and%20Sequence.pdf · https://netacad.fit.vutbr.cz/wp-content/uploads/ccna/srwe/SRWE%20v7.02%20Scope%20and%20Sequence.pdf · https://netacad.fit.vutbr.cz/wp-content/uploads/ccna/ensa/ENSA%20v7.02%20Scope%20and%20Sequence.pdf

**Third-party**
- [S5] D. Dib, "CCNA 200-301 Updated To Version 1.1", Lost in Transit, 2024-04-23 (quotes Cisco's FAQ). https://lostintransit.se/2024/04/23/ccna-200-301-updated-to-version-1-1/
- [S13] ComputingForGeeks, "CCNA exam question types and sim strategy". https://computingforgeeks.com/ccna-exam-question-types-sim-strategy/
- [S14] SPOTO, "How many questions are on the CCNA 200-301 exam". https://cciedump.spoto.net/blog/how-many-questions-are-on-the-ccna-200-301-exam-in-2025_22690.html
- [S17] ITExamAnswers, "CCNA 1/2/3 v7.0 Curriculum: Module N" pages (47 pages), e.g. https://itexamanswers.net/ccna-1-v7-0-curriculum-module-1-networking-today.html, https://itexamanswers.net/ccna-2-v7-0-curriculum-module-6-etherchannel.html, https://itexamanswers.net/ccna-3-v7-0-curriculum-module-2-single-area-ospfv2-configuration.html. The full URL list comes from the itexamanswers.net post sitemaps.
- [S19] ITExamAnswers, supplemental-module quizzes: https://itexamanswers.net/17-3-2-module-quiz-answers-ccna-200-301-exam-v1-1-supplemental-module.html and https://itexamanswers.net/15-8-2-module-quiz-answers-ccna-200-301-exam-v1-1-supplemental-module.html
- [S20] Scribd, "Módulo 17 – CCNA 200-301 Exam v1.1 Supplemental Module" (Portuguese copy). https://www.scribd.com/document/1068479165/Modulo-17-CCNA-200-301-Exam-v1-1-Supplemental-Module
- [S21] NetPilot, "The Hardest CCNA Topics and How to Practice Them", 2026-03-16. https://www.netpilot.io/blog/hardest-ccna-topics
- [S22] AskBoudin, "How Hard Is the CCNA Exam?", 2026-06-27. https://askboudin.com/blog/how-hard-is-the-ccna-exam
- [S23] Cisco Learning Network community, "Which CCNA Topic Is Most Difficult for Beginners…" (2025). https://learningnetwork.cisco.com/s/question/0D5Kd0000BvtUWUKQ2/which-ccna-topic-is-most-difficult-for-beginners-and-how-did-you-overcome-it ; [S23-b] "What topic are you grappling with the most for the exam?" https://learningnetwork.cisco.com/s/question/0D53i00000KsuKGCAZ/what-topic-are-you-grappling-with-the-most-for-the-exam
- [S24] Certsqill, "CCNA Spanning Tree Questions: Why STP Confuses", 2026-03-08. https://www.certsqill.com/blog/ccna-spanning-tree-exam-questions-confusion/
- [S25] PacketMentor, "CCNA v2.0 (2027): What's Changing" (v2.0 topics published 2026-05-20), https://packetmentor.com/blog/ccna-v2-2027-changes/ ; Cisco Press, "New Cisco Certifications" (v1.1 valid until Feb 2027), https://www.ciscopress.com/promotions/new-cisco-certifications-142035
