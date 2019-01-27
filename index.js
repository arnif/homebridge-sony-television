var BraviaRemoteControl = require("sony-bravia-tv-remote-v2");
var request = require("request");
var Service, Characteristic, VolumeCharacteristic;

const inputMap = {
  1: "Hdmi1",
  2: "Hdmi2",
  3: "Hdmi3",
  4: "Hdmi4",
  5: "Netflix"
};

const tvRemoteMap = {
  4: "Up",
  7: "Right",
  5: "Down",
  6: "Left",
  8: "Confirm",
  11: "Play/Pause",
  9: "Exit",
  10: "Exit", // TODO....
  15: "Home" // TODO...
};

const volumeMap = {
  0: "VolumeUp",
  1: "VolumeDown"
};

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory(
    "homebridge-sony-television",
    "Sony-Television",
    SonyBraviaTvAccessory
  );
};

function SonyBraviaTvAccessory(log, config) {
  this.log = log;
  this.config = config;
  this.name = config["name"];
  this.psk = config["presharedkey"];
  this.ipaddress = config["ipaddress"];
  this.port = config["port"];

  this.remote = new BraviaRemoteControl(this.ipaddress, this.port, this.psk);

  this.enabledServices = [];

  this.isOn = false;

  this.tvService = new Service.Television(this.name, "Television");

  this.tvService.setCharacteristic(Characteristic.ConfiguredName, this.name);

  this.tvService.setCharacteristic(
    Characteristic.SleepDiscoveryMode,
    Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE
  );
  this.tvService
    .getCharacteristic(Characteristic.Active)
    .on("set", this.setPowerState.bind(this))
    .on("get", this.getPowerState.bind(this));
  this.tvService.setCharacteristic(Characteristic.ActiveIdentifier, 1);

  this.tvService
    .getCharacteristic(Characteristic.ActiveIdentifier)
    .on("set", this.setInput.bind(this, inputMap));

  this.tvService
    .getCharacteristic(Characteristic.RemoteKey)
    .on("set", this.setInput.bind(this, tvRemoteMap));

  this.inputHDMI1Service = createInputSource("hdmi1", "HDMI 1", 1);
  this.inputHDMI2Service = createInputSource("hdmi2", "HDMI 2", 2);
  this.inputHDMI3Service = createInputSource("hdmi3", "HDMI 3", 3);
  this.inputHDMI4Service = createInputSource("hdmi4", "HDMI 4", 4);
  this.inputNetflixService = createInputSource(
    "netflix",
    "Netflix",
    5,
    Characteristic.InputSourceType.APPLICATION
  );

  this.tvService.addLinkedService(this.inputHDMI1Service);
  this.tvService.addLinkedService(this.inputHDMI2Service);
  this.tvService.addLinkedService(this.inputHDMI3Service);
  this.tvService.addLinkedService(this.inputHDMI4Service);
  this.tvService.addLinkedService(this.inputNetflixService);

  this.speakerService = new Service.TelevisionSpeaker(
    this.name + " Volume",
    "volumeService"
  );

  this.speakerService
    .setCharacteristic(Characteristic.Active, Characteristic.Active.ACTIVE)
    .setCharacteristic(
      Characteristic.VolumeControlType,
      Characteristic.VolumeControlType.ABSOLUTE
    );

  this.speakerService
    .getCharacteristic(Characteristic.VolumeSelector)
    .on("set", this.setInput.bind(this, volumeMap));

  this.tvService.addLinkedService(this.speakerService);

  this.enabledServices.push(this.tvService);
  this.enabledServices.push(this.speakerService);
  this.enabledServices.push(this.inputHDMI1Service);
  this.enabledServices.push(this.inputHDMI2Service);
  this.enabledServices.push(this.inputHDMI3Service);
  this.enabledServices.push(this.inputHDMI4Service);
  this.enabledServices.push(this.inputNetflixService);
}

SonyBraviaTvAccessory.prototype.setInput = function(map, newValue, callback) {
  console.log("input", newValue);
  console.log("map", map);
  const remoteAction = map[newValue];
  if (!remoteAction) {
    callback(null);
  } else {
    // TODO check if on before sending command...or not?
    this.remote.sendAction(remoteAction).then(rr => {
      //   this.log.debug("rr", rr);
      callback();
    });
  }
};

SonyBraviaTvAccessory.prototype.getPowerState = function(callback) {
  request.post(
    {
      "Content-Type": "application/json",
      url: `http://${this.ipaddress}/sony/system`,
      json: {
        id: 20,
        method: "getPowerStatus",
        version: "1.0",
        params: [""]
      }
    },
    function(err, httpResponse, response) {
      var result = response.result;
      if (result.length > 0) {
        var status = result[0].status;
        this.isOn = status === "active";
        callback(null, this.isOn);
      } else {
        callback(null, false);
      }
    }
  );
};

SonyBraviaTvAccessory.prototype.setPowerState = function(state, callback) {
  this.log.debug("state", state);
  if (state) {
    this.log.debug("Powering on...");
    this.remote.sendAction("PowerOn").then(rr => {
      this.log.debug("rr", rr);
      callback();
    });
  } else {
    this.log.debug("state false, power off...");
    this.remote.sendAction("PowerOff").then(rr => {
      callback();
    });
  }
};

SonyBraviaTvAccessory.prototype.getServices = function() {
  return this.enabledServices;
};

function createInputSource(
  id,
  name,
  number,
  type = Characteristic.InputSourceType.HDMI
) {
  var input = new Service.InputSource(id, name);
  input
    .setCharacteristic(Characteristic.Identifier, number)
    .setCharacteristic(Characteristic.ConfiguredName, name)
    .setCharacteristic(
      Characteristic.IsConfigured,
      Characteristic.IsConfigured.CONFIGURED
    )
    .setCharacteristic(Characteristic.InputSourceType, type);
  return input;
}
