+++
title = "Containers"
summary = "Lighter than VMs: applications packaged with their dependencies, sharing the host's kernel."
links = ["ensa/13/04-containers-and-vrfs", "field/09/02-hypervisors-and-virtual-machines", "field/09/04-virtual-network-functions"]
+++

A VM carries a whole operating system just to run one web server. A *container* carries only the web server and the files it needs. That makes it small, quick to start and portable between a laptop, a test rack and a cloud. [ENSA chapter 13](ensa/13/04-containers-and-vrfs) introduced the idea. This page shows how containers are built, run and connected.

## What is shared, and what is not

A container packages an application with its libraries and settings, and runs it as an isolated process. It has no kernel of its own. Every container on a host uses the host's *kernel*, the core of the operating system that talks to the hardware. The kernel keeps the containers apart, so each sees its own processes, files and network interfaces.

This is the point most people get wrong. A container is not a small VM with its own operating system. A Linux container needs a Linux kernel underneath. On a Windows or macOS laptop, Docker quietly runs a small Linux VM for the containers to share.

```trap
Containers do not each run their own kernel. Ten containers on one host are ten isolated processes on one kernel, not ten operating systems.
```

## Image and container

An *image* is a read-only template, built in layers: a base layer such as a minimal Linux file system, then the runtime, then your application. A *container* is a running instance of an image. You can start many containers from one image, as you can run one program many times. Images are stored in a *registry*, a server such as Docker Hub or a company's private store, and are pulled to a host when needed.

*Docker* is the common engine that builds images and runs containers. These are its everyday commands:

```console Docker host
$ docker run -d --name web -p 8080:80 nginx
$ docker ps
CONTAINER ID   IMAGE   COMMAND                  CREATED          STATUS          PORTS                  NAMES
3f1c9a7b2d10   nginx   "/docker-entrypoint.…"   12 seconds ago   Up 11 seconds   0.0.0.0:8080->80/tcp   web
$ docker images
REPOSITORY   TAG       IMAGE ID       CREATED       SIZE
nginx        latest    a1b2c3d4e5f6   2 weeks ago   187MB
```

`-d` runs the container in the background, `--name` names it, and `-p 8080:80` maps a port, which the next section explains. If the `nginx` image is not on the host, Docker pulls it from the registry first. The IDs and sizes above are examples; yours will differ.

```question
prompt = "You run one image three times with docker run. What do you have?"
options = ["One container with three processes", "Three containers started from the same image", "Three images, one per run", "One VM with three guests"]
answer = 1
why = "An image is the template and each run creates a separate container from it. The image is stored once, however many containers use it."
```

## Container networking

By default Docker creates a *bridge* network on the host: a virtual switch with the address range 172.17.0.0/16 by default. Each container gets an address from it, and the host acts like a NAT router for traffic leaving. Outside machines cannot reach a container's address directly. To publish a service you map a host port to a container port. With `-p 8080:80`, a client that connects to the host on TCP 8080 reaches port 80 inside the container, much like a port-forward rule on a home router.

Other network modes exist. With *host* networking the container shares the host's network stack and has no isolation of its own there. An *overlay* network connects containers on different hosts as if they were on one network, by tunneling between the hosts.

## Many hosts: Kubernetes

One host needs little management. Hundreds of containers across dozens of hosts need something to place them, restart those that fail and add copies under load. That is an *orchestrator*, and the common one is *Kubernetes*. Its machines are *nodes*. Its smallest unit is a *pod*: one or more tightly coupled containers that share an IP address and are scheduled together. You tell Kubernetes what you want running, for example three copies of the web pod, and it keeps that true.

```question
prompt = "In Kubernetes, what is a pod?"
options = ["A physical server that runs containers", "One or more containers that share an IP address and are scheduled together", "A registry that stores images", "A virtual switch on the host"]
answer = 1
why = "A pod is the smallest deployable unit. A physical or virtual machine that runs pods is a node."
```

## Containers compared with VMs

| | Virtual machine | Container |
| --- | --- | --- |
| Isolation | Strong: separate kernel, hypervisor boundary | Lighter: shared kernel |
| Size | Gigabytes | Often megabytes |
| Start time | Tens of seconds to minutes | Seconds or less |
| OS per instance | A full guest OS | None; shares the host kernel |
| Typical use | Legacy apps, mixed operating systems, strong separation | Microservices, fast scaling, repeatable builds |

## Containers on network gear

```deeper
Some Catalyst 9000 switches and other IOS XE devices support application hosting: a container, often Docker-format, runs on the switch itself alongside IOS XE, using a separate part of the device's CPU and memory. Teams use it for small monitoring or automation agents. Support depends on model and release, so check the platform's documentation before planning around it.
```

```recall
front = "What do containers on one host share?"
back = "The host operating system kernel. A Linux container needs a Linux kernel."
```

```recall
front = "What does docker run -p 8080:80 do?"
back = "Maps TCP port 8080 on the host to port 80 inside the container."
```

```recall
front = "What is the difference between an image and a container?"
back = "An image is the read-only template. A container is a running instance of it."
```
