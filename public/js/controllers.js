'use strict';


segImport.controller('mainController', ['$scope', '$http',
  function ($scope, $http) {
    var csv = $scope.csv = {};

    csv.array = []; // These are the rows.
    csv.JSON = []; // JSON object
    csv.JSONString = '';
    csv.writeKey = '';

    // Take csv string and turn it into array.
    csv.addArray = function addArray(csv) {
      csv.forEach(function (row) {
        this.array.push(row);
      }.bind(this));
      this.arrayToJSON();
    };

    // Empty rows in csv.array.
    csv.removeAll = function removeAll() {
      this.array.length = 0;
    };

    // Split array in chunks
    csv.spliceIntoChunks = function (arr, chunkSize) {
      const res = [];
      while (arr.length > 0) {
        const chunk = arr.splice(0, chunkSize);
        res.push(chunk);
      }
      return res;
    }

    // Convert csv.array to csv.JSON.
    csv.arrayToJSON = function arrayToJSON() {
      const regex = /\d\d\d\d-\d\d?-\d\d?\s?\d\d?:\d\d?:\d\d?/gm;
      var headersStock = this.array[0];
      var headers = [];
      for (var i =0; i< headersStock.length; i++) {
        var header = headersStock[i];
        headers.push(header.endsWith('_')? header.slice(0, -1): header);
      }
      this.JSON.length = 0;

      // Now go to every line
      for (var i = 1; i < this.array.length; i++) {
        var obj = {};
        var currentLine = this.array[i];

        for (var j=0; j<currentLine.length; j++) {
          // convert "true" and "false" to booleans equivalents
          if(['false', 'true', 'FALSE', 'TRUE'].includes(currentLine[j])) {
            currentLine[j] = ['true', 'TRUE'].includes(currentLine[j]);
          }
          // Converts dates to the right format
          if (regex.test(currentLine[j])) {
            currentLine[j] =  new Date(currentLine[j]).toISOString();
          }
        }

        for (var j = 0; j < headers.length; j++) {
          if (headers[j].indexOf('.') > 0) {
            // obtain parts
            var parts = headers[j].split('.');
            // chaining parts
            var ref = obj;
            for (var k =0; k < parts.length; k++) {
              if(!ref[parts[k]]) {
                ref[parts[k]]={}
              }
              if (k+1 < parts.length) {
                ref = ref[parts[k]]
              }
            }

            ref[parts[parts.length-1]] = currentLine[j];
          } else {
            obj[headers[j]] = currentLine[j];
          }
        }

        this.JSON.push(obj);
      }

      this.JSONString = JSON.stringify(this.JSON, null, 2);
    };

    // Post csv.JSON to end point.
    csv.importJSON = async function importJSON() {
      var slices = csv.spliceIntoChunks(this.JSON,1000);
      for (var i = 0; i < slices.length; i++) {
        await new Promise(r => setTimeout(r, 2000));
        $http.post('/api/import', { batch: slices[i], writeKey: this.writeKey })
          .success(function (err, data) {
            console.log(err);
            console.log(data);
          })
          .error(function (err, data) {
            console.log(err);
            console.log(data);
          });
      }
    };
  }]);