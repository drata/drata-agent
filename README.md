# Drata Agent

The Drata Agent is a lightweight application that lives in your computer's toolbar. This application is granted READ ONLY access to your system preferences to help ensure proper security configurations are set - such as screensaver locking, password manager, antivirus software and automatic updates are enabled. These security configurations are required for SOC 2 compliance.

## See also

- [Drata Help](https://help.drata.com/)
- [Automatic Upgrades Channel Repository](https://github.com/drata/agent-releases)
- [Electron](https://www.electronjs.org/)
- [Electron Builder](https://www.electron.build/)
- [osquery](https://www.osquery.io/)

# Run or Build Drata Agent on Mac

## Caveats

- The Drata Agent requires an active production account to register successfully.
- Support is not provided for building, running, or installing unofficial packages.
- The build process outlined does not include secure code signing.
- IMPORTANT: Component Library Package is NOT provided. At this time, certain front end components will need replaced to build.

## Prerequisites

1. XCode (command line tools)
1. NodeJS

## Run Local

```bash
# Run on local in dev mode
yarn start
```

## Build Package

The following commands will bundle and build a installation package into the local ./dist folder.

```bash
# Bundle
node_modules/.bin/webpack --mode=production --env targetEnv=PROD

# Build with profile - see package.json for configured profiles
node_modules/.bin/electron-builder --mac -c.mac.identity=null
```

## Install and register agent from local build

1. Switch/checkout this repository
1. Build desired package
1. Execute dmg disk image (dist folder) and copy Drata Agent to `Applications`
1. Run Drata Agent from `Applications`
1. Click Agent -> Settings Icon -> you can view which version of the agent is running, it should say `[LOCAL] Agent Version`
1. Log into Drata -> MyDrata -> Install the Drata Agent -> click Register Drata Agent. This will send a magic-link.
1. From the magic-link email, copy the token portion of the magic-link URL and paste it into your local Agent -> Click Register.

## Drata Support

Drata supports the latest and previous major LTS versions of Ubuntu, Windows, and macOS.

Please see Drata help for the most up-to-date support information.
