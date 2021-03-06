# spo serviceprincipal grant add

Grants the service principal permission to the specified API

## Usage

```sh
spo serviceprincipal grant add [options]
```

## Alias

```sh
spo sp grant add
```

## Options

Option|Description
------|-----------
`--help`|output usage information
`-r, --resource <resource>`|The name of the resource for which permissions should be granted
`-s, --scope <scope>`|The name of the permission that should be granted
`-o, --output [output]`|Output type. `json|text`. Default `text`
`--verbose`|Runs command with verbose logging
`--debug`|Runs command with debug logging

!!! important
    Before using this command, log in to a SharePoint Online tenant admin site, using the [spo login](../login.md) command.

## Remarks

To grant the service principal API permission, you have to first log in to a tenant admin site using the [spo login](../login.md) command, eg. `spo login https://contoso-admin.sharepoint.com`.

## Examples

Grant the service principal permission to read email using the Microsoft Graph

```sh
spo serviceprincipal grant add --resource 'Microsoft Graph' --scope 'Mail.Read'
```

Grant the service principal permission to a custom API

```sh
spo serviceprincipal grant add --resource 'contoso-api' --scope 'user_impersonation'
```