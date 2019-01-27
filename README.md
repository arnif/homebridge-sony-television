# Homebridge plugin for Bravia TV

### !🚧 This is work in progress 🚧!


## Requirements

1. iOS 12.2 beta
2. Homebridge v0.4.46 or newer

## Installation

1. npm install -g homebridge-sony-television
2. Update your configuration file. See below for a sample.
3. Set "Remote start" to ON in your Android TV Settings->Network->Remote Start
4. Change "Authentication" to "Normal and Pre-Shared Key" in your Android Settings->Network->IP Control->Authentication
5. Enter a "Pre-Shared Key" in your Android TV Settings->Network->IP control->Pre-Shared Key


## Configuration

Enter the IP address of your television in the ipaddress field.
On your TV go to Settings->Network->Home network->IP Control.
  Change Authentication to "Normal and Pre-Shared Key".
  Enter something for the Pre-Shared Key.
  Put that same string in the presharedkey field.


Configuration sample:

 ```
"accessories": [
	{
    "accessory": "Sony-Television",
    "name": "Sony Television",
		"ipaddress": "YOUR TV IP ADDRESS HERE",
		"presharedkey": "YOUR PRESHARED KEY HERE",
    "port": "80"
  }
    ]
```
