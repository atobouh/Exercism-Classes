+++
title = "Infrastructure as code"
summary = "Keeping the network's intended state in files, under version control, with review before change."
links = ["field/12/01-configuration-at-scale", "field/12/03-ansible-architecture", "field/11/06-yaml-and-xml"]
+++

*Infrastructure as code* (IaC) means the network's intended state lives in text files, and a tool applies those files to the devices. You no longer change the network by logging in and typing. You change a file, and the tool makes the network match it. The point is not to write clever programs. The point is that text files can be stored, compared, reviewed and repeated in ways that a series of keystrokes on a console cannot.

## The source of truth

If you ask "what should this switch's configuration be?", there should be exactly one place to look. That place is the *source of truth*. In an IaC setup it is a folder of files: an inventory of devices, variables such as NTP servers and VLAN lists, and the playbooks or templates that use them. The running configuration on a switch is no longer the authority. It is a copy that should match the files.

This reverses the old habit. Before, the switch was the truth and any documentation was a stale photo of it. Now the files are the truth, and the switch is checked against them. When they disagree, the files win, and the tool brings the device back into line.

## Version control with Git

Files alone are not enough. You also need history, and that is what *version control* provides. The most widely used system is *Git*. A few terms carry most of the weight.

- A *repository* is the project folder together with its complete history.
- A *commit* is a saved snapshot with a message saying what changed and why.
- A *branch* is a separate line of work, so a change can be prepared without touching the working version.
- A *pull request* (a merge request on GitLab) is a proposal to merge a branch into the main one, where teammates can read the exact lines that changed and comment.

```console
$ git switch -c add-backup-ntp
Switched to a new branch 'add-backup-ntp'
$ git add group_vars/switches.yml
$ git commit -m "Add 192.0.2.124 as the secondary NTP server"
[add-backup-ntp 3f9a1c2] Add 192.0.2.124 as the secondary NTP server
 1 file changed, 1 insertion(+), 1 deletion(-)
$ git log --oneline
3f9a1c2 Add 192.0.2.124 as the secondary NTP server
b81d07e Move syslog host to 198.51.100.20
5c44e19 Initial switch variables
```

Each line of that log answers the question the manual world could not: who changed what, when and why.

```question
prompt = "A teammate wants to change a variable file that controls 200 switches. Which Git feature lets others read and approve the exact change before it reaches the main branch?"
options = ["A commit message", "A pull request", "A repository", "A tag on the switch"]
answer = 1
why = "A pull request proposes merging a branch into main and shows the changed lines for review. A commit only records the change locally."
```

## From commit to device: a pipeline

Many teams automate the path from file to network as well. A *pipeline* is a series of automatic steps triggered by a change. In outline:

1. You commit to a branch and open a pull request.
2. Automatic checks run: the YAML is valid, the playbook has no syntax errors, a dry run reports what would change.
3. A teammate reviews the lines and the dry-run result, then approves.
4. The change merges to main, and the pipeline applies it to the devices.

Nobody has to remember the checks, and nobody can skip the review by accident. The exact tools (Jenkins, GitLab CI, GitHub Actions) vary, but the shape does not.

## Rollback

Because every version is stored, going back is a normal operation. If Tuesday's change causes trouble, you restore Monday's files and apply them again. With Git that is often a single `git revert`, which creates a new commit that undoes an earlier one and keeps the history honest.

```trap
Rollback restores the files, not the world. If a change removed something that held data, such as a cloud database, applying the old files recreates an empty one. Know what a change destroys before you apply it.
```

## Benefits and cautions

The benefits are speed, consistency and a record. A change that took ten hours by hand runs in minutes, every device gets the same lines, and the history explains itself.

The caution is the same fact seen from the other side. A tool that can fix 300 switches at once can also break 300 switches at once. A bad variable does not fail on one device and warn you. It spreads. That is why the review, the dry run and a first rollout to a small group matter more with automation than they ever did by hand.

```key
In IaC the files are the source of truth and Git holds their history. Changes are proposed, reviewed and then applied, and a rollback is applying an earlier version.
```

```recall
front = "In infrastructure as code, what is the source of truth?"
back = "The version-controlled files (inventory, variables, playbooks or templates), not the running configuration on the device."
```

```recall
front = "Why is a mistake more dangerous with automation than with manual change?"
back = "The tool can apply it to every device at once, so the error spreads before anyone notices."
```
