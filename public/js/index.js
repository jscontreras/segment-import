'use strict';


async function readTextFile() {
  const resp = await axios.get('/config/conversions.json');
  return await resp.data;
}

window.onload = function() {
  readTextFile().then(data => {
    window.conversionData = data;
    window.conversionData = window.conversionData ? window.conversionData : {};
    window.stringToint = window.stringToint ? window.stringToint : [];
    console.info('Configuration LOADED /public/condig/conversion.json \r\n Check README.md for detail.');
    console.info(JSON.stringify(conversionData, null, 2));

  })
  var fileInput = document.getElementById('fileInput');
  var fileDisplayArea = document.getElementById('fileDisplayArea');
  var csvFile = {};

  fileInput.addEventListener('change', function(e) {
    // Use DOM to get AngularJS root scope.
    var scope = angular.element(this).scope();

    // Reset firebase and local data store.
    scope.$apply(function() {
      scope.csv.removeAll();
    });

    var file = fileInput.files[0];
    var textType = /text.*/;

    if (file.type.match(textType)) {
      var reader = new FileReader();

      reader.onload = function(e) {
        var csvString = reader.result;
        // Clean the headers.
        var firstLine = csvString.split('\n')[0];
        var cleanedFirstLine = firstLine.replace(/\s+/g, '_');
        csvString = csvString.replace(firstLine, cleanedFirstLine);

        // Parse csv.
        var csv = new CSV(csvString);
        scope.$apply(function() {
          scope.csv.addArray(csv);
        });
      };

      reader.readAsText(file);
    } else {
      fileDisplayArea.innerText = "File not supported!"
    };
  });
}