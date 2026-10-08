+++
title = "Check yourself: automation"
summary = "Read JSON, match verbs to CRUD, compare tools, and recall how controllers manage intent."
links = ["ensa/14/03-reading-json", "ensa/14/05-rest", "ensa/14/06-configuration-management-tools", "ensa/14/07-intent-based-networking"]
+++

This page ties the chapter together with one working day. Read the scenario, then answer the questions. If one stumps you, the linked page at the bottom teaches it.

## The scenario

Priya is a network engineer at Harbor Supply. A new guest VLAN must go on every access switch. She does not log in to any of them.

First she asks the controller for its device list. Her script sends this request:

```text
GET https://controller.example.com/api/v1/devices?type=switch
Accept: application/json
```

The controller replies with status `200 OK` and this body:

```text
{
  "devices": [
    { "hostname": "S1", "ip": "10.0.0.11", "reachable": true },
    { "hostname": "S2", "ip": "10.0.0.12", "reachable": false },
    { "hostname": "S3", "ip": "10.0.0.13", "reachable": true }
  ]
}
```

She sees that S2 is unreachable, so she leaves it for later. Then she writes a short YAML playbook for the other switches and runs it with Ansible, which connects to each over SSH and pushes the change. Afterward she asks the controller again to confirm the result. The whole change is recorded in files that a colleague can review.

## Questions

```question
prompt = "In the controller's reply above, what is the IP address of S3?"
options = ["10.0.0.11", "10.0.0.12", "10.0.0.13", "true"]
answer = 2
why = "S3 is the third object in the devices array, and its `ip` value is 10.0.0.13."
```

```question
prompt = "Which of these JSON snippets contains a syntax error?"
options = ["{ \"hostname\": \"S1\", \"reachable\": true }", "{ 'hostname': 'S1', 'reachable': true }", "[ \"S1\", \"S2\" ]", "{ \"count\": 3, \"items\": [] }"]
answer = 1
why = "JSON requires double quotes around keys and strings. Single quotes make the second snippet invalid."
```

```question
prompt = "Priya's script wants to create a new object on the controller through a REST API. Which method does it use?"
options = ["GET", "POST", "DELETE", "HEAD"]
answer = 1
why = "POST maps to create. GET reads, DELETE removes, and update uses PUT or PATCH."
```

```question
prompt = "A REST call returns 404. What does that mean?"
options = ["The credentials were wrong", "The server crashed", "The resource was not found", "A new resource was created"]
answer = 2
why = "404 is Not Found. Wrong credentials give 401, a server fault gives 500, and 201 means created."
```

```question
prompt = "Which TWO statements about JSON, YAML and XML are correct?"
options = ["NETCONF messages use XML", "YAML uses braces and quoted keys as its main structure", "YAML uses indentation and dashes for lists", "JSON marks structure with opening and closing tags", "XML cannot be nested"]
answer = [0, 2]
why = "NETCONF carries XML, and YAML shows nesting with indentation and lists with dashes. Braces and quoted keys describe JSON, and tags describe XML, which nests freely."
```

```question
prompt = "Which pairing is correct?"
options = ["Ansible: agent-based, pull, Ruby", "Puppet: agentless, push, YAML", "Chef: agent-based, pull, Ruby", "SaltStack: never uses agents"]
answer = 2
why = "Chef uses agents, pulls, and is written in Ruby. Ansible is agentless and pushes with YAML playbooks, Puppet is agent-based, and SaltStack typically uses minion agents though it can run over SSH."
```

```question
prompt = "A tool installs a small program on every managed device, and each device asks a central server for its configuration on a schedule. What model is this?"
options = ["Agentless push", "Agent-based pull", "Agent-based push over SSH only", "Manual configuration"]
answer = 1
why = "Agents that check in with a server describe a pull model, as in Puppet and Chef."
```

```question
prompt = "A controller keeps checking that the network still does what the business asked for. Which part of intent-based networking is that?"
options = ["Translation", "Activation", "Assurance", "Provisioning a new device"]
answer = 2
why = "Assurance is the continuous comparison of the live network against the intent."
```

## Cards to keep

```recall
front = "Give the HTTP verb for each CRUD action."
back = "Create: POST. Read: GET. Update: PUT or PATCH. Delete: DELETE."
```

```recall
front = "What do status codes 201 and 404 mean?"
back = "201 means Created. 404 means Not Found."
```

```recall
front = "What is the difference between a northbound and a southbound API?"
back = "Northbound APIs face applications above the controller. Southbound APIs face the network devices below it."
```

```recall
front = "What kind of files does Ansible use, and does it need an agent?"
back = "YAML playbooks, and no agent: it connects over SSH."
```
