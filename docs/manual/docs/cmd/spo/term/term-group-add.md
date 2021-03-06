# spo term group add

Adds taxonomy term group

## Usage

```sh
spo term group add [options]
```

## Options

Option|Description
------|-----------
`--help`|output usage information
`-n, --name <name>`|Name of the term group to add
`-i, --id [id]`|ID of the term group to add
`-d, --description [description]`|Description of the term group to add
`-o, --output [output]`|Output type. `json|text`. Default `text`
`--verbose`|Runs command with verbose logging
`--debug`|Runs command with debug logging

!!! important
    Before using this command, log in to a SharePoint Online tenant admin site, using the [spo login](../login.md) command.

## Remarks

To add a taxonomy term group, you have to first log in to a tenant admin site using the [spo login](../login.md) command, eg. `spo login https://contoso-admin.sharepoint.com`.

## Examples

Add a new taxonomy term group with the specified name

```sh
spo term group add --name PnPTermSets
```

Add a new taxonomy term group with the specified name and id

```sh
spo term group add --name PnPTermSets --id 0e8f395e-ff58-4d45-9ff7-e331ab728beb
```

Add a new taxonomy term group with the specified name and description

```sh
spo term group add --name PnPTermSets --description 'Term sets for PnP'
```