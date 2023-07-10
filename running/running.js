var map
var layer
var runs = {};

function loadMapScenario() {
    map = new Microsoft.Maps.Map(document.getElementById('myMap'), {
        /* No need to set credentials if already passed in URL */
        center: new Microsoft.Maps.Location(53.4808, -1.2426),
        mapTypeId: Microsoft.Maps.MapTypeId.aerial,
        zoom: 7
    });

    layer = new Microsoft.Maps.Layer();
    map.layers.insert(layer);
}

function displayRoute(xmlFile, map, colour) {

    function handler() {

        if (this.status == 200 && this.responseXML != null) {
            var xmlDoc = this.responseXML;
            var coords = [];
            var trkpts = xmlDoc.getElementsByTagName("trkpt");

            if (trkpts.length > 0) {
                for (var i = 0; i < trkpts.length; i++) {
                    var trkpt = trkpts[i];
                    var longitude = trkpt.getAttribute("lon");
                    var latitude = trkpt.getAttribute("lat");
                    coords.push(new Microsoft.Maps.Location(latitude, longitude));
                }

                var line = new Microsoft.Maps.Polyline(coords, {
                    strokeColor: colour,
                    strokeThickness: 5,
                    metadata: xmlFile
                });

                runs[xmlFile] = line;

                layer.add(line);
            }
        } 
        else 
        {
            //console.log("Error getting xml file " + xmlFile + " status code " + this.status);
        }
    }

    var run = runs[xmlFile];
    if (run === undefined)
    {
        var client = new XMLHttpRequest();
        client.onreadystatechange = handler;
        client.open("GET", "/running/data/" + xmlFile);
        client.send();
    }
    else
    {
        layer.add(run);
    }
}
 

function redraw() {
    layer.clear();
    var checkboxes = document.querySelectorAll(".route");
    checkboxes.forEach(function (checkbox) {
        if (checkbox.checked) {
            var filename = checkbox.getAttribute("value");
            var colour = checkbox.getAttribute("data-colour");
            displayRoute(filename, map, colour)            
        }
    });
}

var checkboxes = document.querySelectorAll(".route");
checkboxes.forEach(function (checkbox) {
    checkbox.addEventListener('change', function () {
        if (this.checked) {
            var filename = this.getAttribute("value");
            var colour = this.getAttribute("data-colour");
            displayRoute(filename, map, colour)
        } else {
            redraw();
        }
    });
});

var selectAll = document.getElementsByClassName("routeAll")[0];
selectAll.addEventListener('change', function () {
    if (this.checked) {
        var checkboxes = document.querySelectorAll(".route");
        checkboxes.forEach(function (checkbox) {
            checkbox.checked=true;
        });
        redraw();
    }
});

