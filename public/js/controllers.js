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

    csv.applyConversions = function applyConversions(fieldName, fieldValue) {
      if(conversionData.stringToint.includes(fieldName)) {
        let source = fieldValue.replace(',','');
        source = source.replace("'",'');
        return Number(source);
      }
      return fieldValue;
    }

    csv.processOverrides = function processOverrides(obj) {
      if(conversionData.overrides[obj.action]) {
        const overrides = conversionData.overrides[obj.action];
        for (var prop in overrides) {
          obj[prop] = overrides[prop];
        }
      }
    }


    // Convert csv.array to csv.JSON.
    csv.arrayToJSON =  async function arrayToJSON() {
      const regexDateFormats = [/\d\d\d\d-(0|1)\d-\d\d?\s(1|2)?\d:\d\d?:\d\d?/gm, /1?\d\/\d\d?\/\d\d?\s\d\d?:\d\d/gm, /\d\d\d\d-(0|1)\d-\d\d?T\d\d:\d\d:\d\d.\d\d\d\d\d\d/gm];
      var headersStock = this.array[0];
      var headers = [];
      for (var i = 0; i < headersStock.length; i++) {
        var header = headersStock[i];
        headers.push(header.endsWith('_') ? header.slice(0, -1) : header);
      }
      this.JSON.length = 0;

      // Now go to every line
      for (var i = 1; i < this.array.length; i++) {
        var obj = {};
        var currentLine = this.array[i];

        for (var j = 0; j < currentLine.length; j++) {
          // clean lines and weird values
          currentLine[j] = currentLine[j].replace(/(\r\n|\n|\r)/gm, "");
          // convert "true" and "false" to booleans equivalents
          if (['false', 'true', 'FALSE', 'TRUE'].includes(currentLine[j])) {
            currentLine[j] = ['true', 'TRUE'].includes(currentLine[j]);
          }
          // Converts dates to the right format
          regexDateFormats.forEach((regexDate) => {
            if (regexDate.test(currentLine[j])) {
              currentLine[j] = new Date(currentLine[j]).toISOString();
            }
          });
        }

        for (var j = 0; j < headers.length; j++) {
          if (headers[j].indexOf('.') > 0) {
            // obtain parts
            var parts = headers[j].split('.');
            // chaining parts
            var ref = obj;
            for (var k = 0; k < parts.length; k++) {
              if (!ref[parts[k]]) {
                ref[parts[k]] = {}
              }
              if (k + 1 < parts.length) {
                ref = ref[parts[k]]
              }
            }
            const fieldName = parts[parts.length - 1];
            currentLine[j] = this.applyConversions(fieldName, currentLine[j]);
            ref[fieldName] = currentLine[j];
          } else {
            currentLine[j] = this.applyConversions(headers[j], currentLine[j]);
            obj[headers[j]] = currentLine[j];
          }
        }
        // Processing Overrides
        this.processOverrides(obj);
        this.JSON.push(obj);
      }

      this.JSONString = JSON.stringify(this.JSON, null, 2);
    };

    // Post csv.JSON to end point.
    csv.importJSON = async function importJSON() {
      var slices = csv.spliceIntoChunks(this.JSON, 1000);
      console.log('Starting import...')
      var i = 0;
      for (i = 0; i < slices.length; i++) {
        console.log(`Processing (${i}  of ${slices.length}) 1000 requests block(s)...`);
        await new Promise(r => setTimeout(r, 2000));
        $http.post('/api/import', { batch: slices[i], writeKey: this.writeKey })
          .success(function (err, data) {
            console.log(err);
            console.log(data);
            console.log(`Block (${i}  of ${slices.length}) processed.`);

            if(i == slices.length) {
              console.log('Import Completed!');
              alert('Import Completed, check Browser Console for more details');
            }
          })
          .error(function (err, data) {
            console.log(err);
            console.log(data);
          });
      }
    };
  }]);