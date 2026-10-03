# Activity Notifications for Sociable

A lightweight Joomla system plugin created to improve notification behavior in Sociable without modifying the Sociable core.

## Why this plugin exists

Sociable already includes its own notification system for comments, replies, and other activities.

However, in the version tested during development, the notification module did not automatically refresh the notification bell and unread counter in real time, even though automatic refresh settings were available.

Because of this, users could receive a new comment or reply without immediately noticing it. In many cases, the notification only became visible after manually reloading the page.

This plugin was created to solve that limitation without modifying any Sociable core files.

## How it works

The plugin acts as an additional layer on top of Sociable's existing notification system.

It periodically checks Sociable's notification API and refreshes the notification interface automatically.

The plugin does not create a separate notification system and does not replace Sociable's existing functionality.

Instead, it uses the notification infrastructure already provided by Sociable.

## Features

- Automatic notification refresh
- Automatic unread notification counter update
- Detects new comment notifications
- Detects new reply notifications
- Updates the notification list without reloading the page
- Displays a small visual alert when a new notification arrives
- Uses Sociable's existing notification API
- Does not modify Sociable core files
- Designed to remain independent from Sociable updates
- Can be disabled or removed at any time

## Default refresh interval

By default, the plugin checks for new notifications every:

`20 seconds`

The interval can be adjusted through the plugin configuration.

## Installation

1. Download the plugin ZIP package.
2. Log in to the Joomla Administrator panel.
3. Go to:

   `System → Install → Extensions`

4. Upload and install the ZIP package.
5. Go to:

   `System → Manage → Plugins`

6. Find:

   `System - Activity Notifications`

7. Enable the plugin.

## Testing

A simple way to test the plugin:

1. Log in with User A.
2. Open a Sociable page in the browser.
3. Log in with User B using another browser or private window.
4. Comment on a post created by User A.
5. Return to User A's browser without reloading the page.
6. Within the configured refresh interval, the notification counter should update automatically.

## Compatibility

This plugin was developed specifically to complement Sociable's notification system.

Because it does not modify Sociable core files, it should be safer to use alongside future Sociable updates.

If a future version of Sociable provides fully functional real-time notification refreshing natively, this plugin can simply be disabled.

## Philosophy

The main goal of this plugin is simple:

> Extend Sociable without modifying its core.

Keeping the functionality in a separate Joomla plugin makes maintenance easier and reduces the risk of custom changes being overwritten during future Sociable upgrades.

## Version

Current version:

`1.0.0`

## License

Use and distribution should follow the license terms of this project and any applicable requirements from Joomla and Sociable.
