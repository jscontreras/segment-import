'use strict';

/*!
 * Deep merge two or more objects together.
 * (c) 2019 Chris Ferdinandi, MIT License, https://gomakethings.com
 * @param   {Object}   objects  The objects to merge together
 * @returns {Object}            Merged values of defaults and options
 */
var deepMerge = function () {

	// Setup merged object
	var newObj = {};

	// Merge the object into the newObj object
	var merge = function (obj) {
		for (var prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				// If property is an object, merge properties
				if (Object.prototype.toString.call(obj[prop]) === '[object Object]') {
					newObj[prop] = deepMerge(newObj[prop], obj[prop]);
				} else {
					newObj[prop] = obj[prop];
				}
			}
		}
	};

	// Loop through each object and conduct a merge
	for (var i = 0; i < arguments.length; i++) {
		merge(arguments[i]);
	}

	return newObj;

};

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
      if (conversionData.stringToint.includes(fieldName)) {
        let source = fieldValue.replace(',', '');
        source = source.replace("'", '');
        return Number(source);
      }
      return fieldValue;
    }

    csv.processOverrides = function processOverrides(obj) {
      if (conversionData.overrides[obj.action]) {
        const objOverrides = conversionData.overrides[obj.action];
        return deepMerge(obj, objOverrides);
      }
      return obj;
    }

    csv.findMistake = async function(batchArray) {
      console.log(JSON.stringify(batchArray, null, 2));
      var i = 0;
      for (i = 0; i < batchArray.length; i++) {
        console.log(`Processing (${i + 1}  of ${batchArray.length}) entry...`);
        try {
          const resp = await axios.post('/api/single', { payload: batchArray[i], writeKey: this.writeKey });
          if (!JSON.stringify(resp.data).includes('Bad Request')) {
            console.log(`ITEM (${i + 1}  of ${batchArray.length}) processed...`, resp.data);

            if (i == batchArray.length) {
              console.log('ITEM Completed!');
              alert('Import Completed, check Browser Console for more details');
            }
          }
          else {
            console.error(`ITEM (${i + 1}  of ${batchArray.length}) FAILED...`);
            i = batchArray.length;
          }

        } catch (err) {
            console.log(err);
            console.error(`ITEM (${i + 1}  of ${slices.length}) FAILED...`);
            i = batchArray.length;
        }
      }

    }

    // Convert csv.array to csv.JSON.
    csv.arrayToJSON = async function arrayToJSON() {
      const regexDateFormats = [
        /\d\d\d\d-(0|1)\d-\d\d?\s(1|2)?\d:\d\d?:\d\d?/gm,
        /1?\d\/\d\d?\/\d\d?\s\d\d?:\d\d/gm,
        /\d\d\d\d-(0|1)\d-\d\d?T\d\d:\d\d:\d\d.\d\d\d\d\d\d/gm,
        /\d\d?\/\d\d?\/\d\d\d\d\s\d\d?:\d\d:\d\d\s(PM|AM)/gm
      ];
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
        obj = this.processOverrides(obj);
        this.JSON.push(obj);
      }
      this.JSONString = `Total Records: (${this.JSON.length}): \r\n`;
      this.JSONString += JSON.stringify(this.JSON.slice(0, Math.min(10, this.JSON.length)), null, 2);
    };

    // Post csv.JSON to end point.
    csv.importJSON = async function importJSON() {
      var slices = csv.spliceIntoChunks(this.JSON, conversionData.batchSize);
      console.log('Starting import...')
      var i = 0;
      for (i = 0; i < slices.length; i++) {
        console.log(`Processing (${i + 1}  of ${slices.length}) ${conversionData.batchSize} requests block(s)...`);
        try {
          const resp = await axios.post('/api/import', { batch: slices[i], writeKey: this.writeKey });
          if (!JSON.stringify(resp.data).includes('Bad Request')) {
            console.log(`Block (${i + 1}  of ${slices.length}) processed...`, resp.data);

            if (i == slices.length - 1) {
              console.log('Import Completed!');
              alert('Import Completed, check Browser Console for more details');
            }
            //await new Promise(r => setTimeout(r, 2000));
          }
          else {
            console.error(`Block (${i + 1}  of ${slices.length}) FAILED...`);
            await csv.findMistake(slices[i]);
            i = slices.length;
          }

        } catch (err) {
            console.log(err);
            console.error(`Block (${i + 1}  of ${slices.length}) FAILED...`);
            await csv.findMistake(slices[i]);
            i = slices.length;
        }
      }
    };
  }]);