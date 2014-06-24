var app = angular.module('app', ['lelylan.dashboards.device', 'ngMockE2E']);

// mock all requests we need
app.run(function($httpBackend, $timeout, Profile) {
  Profile.set({id: '1'});
  jasmine.getFixtures().fixturesPath = 'spec/fixtures';

  device   = JSON.parse(readFixtures('device.json'));
  type     = JSON.parse(readFixtures('type.json'));
  privates = JSON.parse(readFixtures('privates.json'));

  $httpBackend.when('GET', /views/).passThrough();
  $httpBackend.whenGET('http://api.lelylan.com/devices/1').respond(device);
  $httpBackend.whenGET('http://api.lelylan.com/devices/2').respond(device);
  $httpBackend.whenGET('http://api.lelylan.com/devices/3').respond(device);
  $httpBackend.whenGET('http://api.lelylan.com/devices/4').respond(device);
  $httpBackend.whenGET('http://api.lelylan.com/devices/5').respond(device);
  $httpBackend.whenGET('http://api.lelylan.com/devices/6').respond(device);
  $httpBackend.whenPUT('http://api.lelylan.com/devices/1')
    .respond(function(method, url, data, headers) { return [200, updateDevice(data), {}]; });
  $httpBackend.whenPUT('http://api.lelylan.com/devices/1/properties')
    .respond(function(method, url, data, headers) { return [200,  updateDeviceProperties(data), {}]; });
  $httpBackend.whenDELETE('http://api.lelylan.com/devices/1').respond(device);
  $httpBackend.whenGET('http://api.lelylan.com/types/1').respond(type);
  $httpBackend.whenGET('http://api.lelylan.com/devices/1/privates').respond(privates);

  var updateDevice = function(data) {
    data = angular.fromJson(data);
    device.updated_at   = new Date();
    device.name         = data.name;
    device.physical.uri = data.physical.uri;
    return device;
  }

  var updateDeviceProperties = function(data) {
    data = angular.fromJson(data);
    device.updated_at = new Date();
    _.each(data.properties, function(property) {
      var result = _.find(device.properties, function(_property) { return _property.id == property.id; } );
      result.expected = result.value = property.expected; });
    return device;
  }
});
