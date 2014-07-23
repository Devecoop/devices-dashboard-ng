'use strict';

angular.module('lelylan.dashboards.device')
  .controller('DevicesCtrl', function ($scope, $rootScope, $timeout, $q, $location, $route, $cacheFactory, ENV, Device, Type, Category, AccessToken, Dimension, Column, Menu) {

    /* -------------- *
     * INITIALIZATION *
     * -------------- */

    /*
     * Categories API request
     */

    // Verify if categories is already cached
    var cached = $cacheFactory.get('$http').get(ENV.endpoint + '/categories');

    // Get all categories
    var categories = Category.all().
      success(function(categories) {
        $rootScope.categories = categories;
        $rootScope.categories.unshift({ tag: 'all', name: 'All'});
        $rootScope.currentCategory = $rootScope.categories[0];
      });



    /*
     * Devices API request
     */

    var devices = Device.all().
      success(function(devices) {
        $rootScope.all = devices;
        $rootScope.devices = devices;

        if (devices.length == 0) { $location.path('/empty') }
        else                     { loadTypes($rootScope.devices); }
      });



    /*
     * Devices per category
     *
     * Counts the number of devices per category when all devices and
     * all categories are loaded.
     */

    $q.all([devices, categories]).then(function(values) {
      _.map($rootScope.categories, function(category) {
        category.devices = _.countBy($rootScope.all, function(device) {
          return (device.category == category.tag) ? 'count' : 'missed'
        }).count;
      });

      $rootScope.categories[0].devices = $rootScope.all.length;
    });



    /*
     * Types preloading
     *
     * Makes an API request to each device type to cache it. This let you
     * move between all devices instantaneously
     */

    var loadTypes = function(devices) {
      var requests = _.map(devices, function(device) {
        return Type.find(device.type.id)
      });

      $q.all(requests).then(function(values) {
        $rootScope.types = _.map(values, function(value) { return value.data });
        init(values);
      });
    }



    /*
     * Visualization
     *
     * All resources (categories, devices and types) are loaded and can be shown.
     */

    var init = function(values) {
      $rootScope.loading = false;
      $scope.currentDevice = $rootScope.devices[0];
    }



    /* --------- *
     * BEHAVIOUR *
     * --------- */


    /*
     * Category selection
     */

    $scope.setCategory = function(category) {
      if (category.devices) { // does not open when there are no devices per category
        $rootScope.devices = (category.tag == 'all') ? $rootScope.all : _.where($rootScope.all, { category: category.tag });
        $scope.currentDevice = $rootScope.devices[0];
        $rootScope.currentCategory = category;

        if ($scope.columns.count == 'one') {
          Column.setVisible({ one: false, two: true, three: false });
          Column.set($scope.dimensions);
        }
      }
    }



    /*
     * Device selection
     */

    $rootScope.$on('lelylan:device:custom:open', function(event, device) {
      $scope.currentDevice = device;

      if ($scope.columns.count == 'two') {
        Column.setVisible({ one: false, two: true, three: true });
        Menu.set('categories');
      }

      if ($scope.columns.count == 'one') {
        Column.setVisible({ one: false, two: false, three: true });
        Menu.set('devices');
      }
    });



    /*
     * Device updated
     */

    $scope.$on('lelylan:device:update:set', function(event, device) {
      var _device = _.find($rootScope.all, function(resource) {
        return resource.id == device.id;
      });

      angular.extend(_device, device);
    });



    /*
     * Device deleted
     */

    $rootScope.$on('lelylan:device:delete', function(event, device) {
      var cached = $cacheFactory.get('$http').get(ENV.endpoint + '/devices');
      var devices = JSON.parse(cached[1]);

      var _device = _.find(devices, function(resource) {
        return resource.id == device.id;
      });

      if (_device) {
        var index = devices.indexOf(_device);
        devices.splice(index, 1);
        cached[1] = JSON.stringify(devices);
      }

      if ($scope.columns.count == 'one') {
        Column.setVisible({ one: false, two: true, three: false });
        Menu.set('categories');
      }

      $route.reload();
    });


    /* ---------- *
     * Navigation *
     * ---------- */


    /*
     * Move back to categories
     */

    $rootScope.moveToCategories = function() {

      if ($scope.columns.count == 'two') {
        Column.setVisible({ one: true, two: true, three: false });
        Menu.set('none');
      }

      if ($scope.columns.count == 'one') {
        Column.setVisible({ one: true, two: false, three: false });
        Menu.set('none');
      }

    };



    /*
     * Move back to devices
     */

    $rootScope.moveToDevices = function() {
      if ($scope.columns.count == 'one') {
        Column.setVisible({ one: false, two: true, three: false });
        Menu.set('categories')
      }
    };


    // set the default menu when opening the page
    if ($scope.columns.count == 'one') {
      Column.setVisible({ one: false, two: true, three: false });
      Menu.set('categories');
    }

  });
