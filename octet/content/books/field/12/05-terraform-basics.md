+++
title = "Terraform basics"
summary = "Declaring infrastructure in HCL, planning the change and applying it, with state to remember what exists."
links = ["field/12/06-ansible-versus-terraform", "field/12/02-infrastructure-as-code", "field/09/07-cloud-computing", "field/10/06-catalyst-center"]
+++

*Terraform*, from HashiCorp, is a declarative infrastructure as code tool. You write down what should exist, such as a virtual network, a subnet and a firewall rule, and Terraform works out what to create, change or remove to get there. It began as a way to provision cloud resources, and it is now also used with network platforms that have an API.

Where Ansible logs in and runs tasks, Terraform talks to a platform's API and manages a set of objects it remembers. That memory, called state, is the key idea of this page.

## Configuration in HCL

Terraform files end in `.tf` and use *HCL* (HashiCorp Configuration Language), a readable block-based format. Here is a small configuration that builds a virtual network and one subnet in a public cloud.

```console main.tf
provider "aws" {
  region = "us-east-1"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr
  tags = {
    Name = "lab-vpc"
  }
}

resource "aws_subnet" "web" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}

output "vpc_id" {
  value = aws_vpc.main.id
}
```

- A `provider` block selects the platform plug-in and its settings.
- A `resource` block declares one object. It has a type (`aws_vpc`) and a local name (`main`). The arguments inside are the properties you want.
- A `variable` is an input, so the same files can be reused with different values.
- An `output` prints a value after the run.

Notice the subnet refers to `aws_vpc.main.id`. That reference tells Terraform the subnet depends on the VPC, so it builds the VPC first. You describe relationships, and the order follows.

## Providers

Terraform itself knows nothing about any platform. A *provider* is a plug-in that translates resource blocks into API calls for one platform. There are providers for the public clouds, and for network platforms such as Cisco Meraki, Catalyst Center and IOS XE devices. Anything with an API can have one. `terraform init` downloads the providers your files name.

```question
prompt = "What is the job of a Terraform provider?"
options = ["It stores the state file securely", "It translates resource blocks into API calls for one platform", "It reviews changes before they are applied", "It converts HCL into YAML"]
answer = 1
why = "Providers are the plug-ins that talk to each platform's API. State storage and review are separate matters."
```

## State

After it creates something, Terraform writes a record of it to a *state file*, `terraform.tfstate` by default. The state maps each resource block in your files to the real object, including identifiers the platform assigned, like a VPC ID.

State is how Terraform computes differences. On each run it compares three things: your files (what you want), the state (what it believes exists) and the real platform (what actually exists). Without state it could not tell a subnet it created from one someone else made.

```trap
The state file can contain secrets, such as passwords and keys that appeared in resource arguments, stored in plain text. Never commit it to a public repository. Keep it in a protected remote backend and limit who can read it.
```

## The workflow

Four commands cover nearly everything.

1. `terraform init` prepares the folder and downloads the providers.
2. `terraform plan` shows what would change, and changes nothing.
3. `terraform apply` makes the changes, after you confirm.
4. `terraform destroy` removes everything in the state.

```console
$ terraform plan
...
Terraform will perform the following actions:

  # aws_subnet.web will be created
  + resource "aws_subnet" "web" {
      + cidr_block = "10.0.1.0/24"
      + id         = (known after apply)
      + vpc_id     = (known after apply)
        ...
    }

  # aws_vpc.main will be created
  + resource "aws_vpc" "main" {
      + cidr_block = "10.0.0.0/16"
      + id         = (known after apply)
        ...
    }

Plan: 2 to add, 0 to change, 0 to destroy.
```

## Reading a plan

The symbol at the start of each line tells you the action.

| Symbol | Meaning |
| --- | --- |
| `+` | Create a new resource |
| `~` | Update an existing resource in place |
| `-` | Destroy a resource |
| `-/+` | Destroy and recreate, because a changed property cannot be updated in place |

The last line is the summary to read first. A plan that says `1 to add, 0 to change, 0 to destroy` is what you expected from a small edit. One that says `3 to destroy` deserves a long look before you type `yes`, because replacing a resource can mean downtime.

```question
prompt = "A plan shows `-/+` next to a subnet. What will Terraform do?"
options = ["Update it in place", "Create a second subnet next to it", "Destroy it and create a new one", "Ignore it, because it is unchanged"]
answer = 2
why = "The symbol -/+ means replace: the changed property cannot be modified in place, so the resource is destroyed and recreated."
```

```deeper
Terraform's license changed in 2023, and a community fork called OpenTofu was started. It reads the same HCL and uses the same workflow, so the ideas on this page apply to both.
```

```recall
front = "What do `terraform init`, `plan` and `apply` each do?"
back = "init downloads providers, plan shows what would change without changing it, apply makes the changes."
```

```recall
front = "What is the Terraform state file for, and what is its risk?"
back = "It records what Terraform created so it can compute differences. It can contain secrets in plain text, so it must be stored and shared carefully."
```
