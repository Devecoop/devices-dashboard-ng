'use strict';

angular.module('lelylan.dashboards.device')
  .controller('CreateCtrl', function ($scope, $rootScope, $location, $cacheFactory, $timeout, ENV, Device, Type, AccessToken, Menu) {


    /* ------- *
     * CONFIGS *
     * ------- */

    // set the view as loaded
    $rootScope.loading = false;

    // creation step
    $scope.step = 'one';

    // device instance
    $scope.device = {};

    // validation structure
    $scope.invalid = {};

    // type menu definition
    $scope.menu = 'populars';

    // set lelylan as top menu
    Menu.set('lelylan');


    /* --------- *
     * API CALLS *
     * --------- */

    // get the popular types
    Type.popular().
      success(function(types) {
        $scope.popular = types;
      });

    // get created types
    Type.all().
      success(function(types) {
        $scope.created = types;
      });

    // create a new type
    $scope.createType = function() {
      Type.create({ name: 'New', category: 'others' }).
        success(function(type) {
          type.visible = true;
          $scope.created.unshift(type);
        });
    }


    /* --------- *
     * BEHAVIOUR *
     * --------- */

    // move to the desired creation step
    $scope.setStep = function(step) {
      $scope.step = step
    }

    // set device name (step 1)
    $scope.setName = function() {
      $scope.invalid.one = false;
      $scope.setStep('two');
    }

    // set device type (step 2)
    $scope.setType = function(type) {
      $scope.device.type = { id: type.id };
      $scope.invalid.two = false;
      $scope.setStep('three');
      $scope.message = null;
    }

    // set device type by id (step 2)
    $scope.setTypeId = function(id) {
      $scope.message = 'Searching';

      Type.find(id, { cache: true }).
        success(function(response) {
          $scope.message = 'Found type "' + response.name + '"';
          $scope.invalid.two = false;
          $timeout(function() {
            $scope.setStep('three');
          }, 1000);
        }).
        error(function() {
          $scope.message = 'Type id not existing';
        });
    }

    // set physical (step 3)
    $scope.setPhysical = function(mode) {

      // check for the existance of all fields
      if (!$scope.device.name) { $scope.invalid.one = true }
      if (!$scope.device.type) { $scope.invalid.two = true }

      // when all fiels are set we create the device
      if ($scope.device.name && $scope.device.type) {
        $rootScope.loading = true;

        // no physical connection
        if (mode == 'simulation') {
          Device.create($scope.device).success(redirect);
        }

        // MQTT physical connection
        if (mode == 'mqtt') {
          Device.create($scope.device).success(function(device) {
            $scope.device.physical = { uri: "http://nodes.lelylan.com/mqtt/devices/" + device.id };
            Device.update(device.id, $scope.device).success(redirect);
          })
        }

        // custom URI
        if (mode == 'custom') {
          Device.create($scope.device).success(redirect);
        }
      }
    }

    // redirect to the devices list and add the new devices to the list
    // (if everything is cached)
    var redirect = function(device) {

      var cached = $cacheFactory.get('$http').get(ENV.endpoint + '/devices');

      // If devices was already loaded
      if (cached) {

        var devices = JSON.parse(cached[1])
        devices.unshift(device);
        cached[1] = JSON.stringify(devices);

        var category = _.find($rootScope.categories, function(resource) { return resource.tag == device.category; });
        category.devices++;

        $rootScope.currentCategory = $rootScope.categories[0];
        $rootScope.currentDevice   = $rootScope.all[0];
      }

      $location.path('/');
      $rootScope.loading = false;
    }

  });
