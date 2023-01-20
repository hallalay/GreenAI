let map;

// For this file to work with the squares and images you will need to make a new
// folder with the same structure as Digitalisering_AI and change all the images
// to png. tif is not supported by Google. It will work using only the polys though.
// you will also need the predictions in png

var Toggle_square = true;
var image_folder = './Cropped_maps';
var pred_folder = './cropped_preds';

import polys_20 from './Geodata/polys_2020.json' assert { type: "json"};
import polys_15 from './Geodata/polys_2015.json' assert { type: "json"};
import polys_10 from './Geodata/polys_2010.json' assert { type: "json"};
import polys_05 from './Geodata/polys_2005.json' assert { type: "json"};
import polys_00 from './Geodata/polys_2000.json' assert { type: "json"};
import polys_95 from './Geodata/polys_1995.json' assert { type: "json"};
import polys_90 from './Geodata/polys_1990.json' assert { type: "json"};
import polys_80 from './Geodata/polys_1980.json' assert { type: "json"};
import polys_75 from './Geodata/polys_1975.json' assert { type: "json"};

function initMap() {
	map = new google.maps.Map(document.getElementById("map"), {
		zoom: 5,
		center: new google.maps.LatLng(63.2, 18),
		mapTypeId: "terrain",
	});

	// Create a <script> tag and set the USGS URL as the source.

	if(Toggle_square == true){

		const script = document.createElement("script");
		script.src = "./Geodata/geo.js";
		document.head.appendChild(script);

		window.eqfeed_callback = eqfeed_callback;
	}
	// console.log(eqfeed_callback)

	var polys = [polys_20,polys_15,polys_10, polys_05, polys_00, polys_95, polys_90, polys_80, polys_75]
	var colors = ['green', 'blue', 'red', 'yellow', 'purple', 'pink', 'orange', 'aqua', 'gold']
	var check_names = ['check_2020', 'check_2015','check_2010','check_2005','check_2000','check_1995','check_1990','check_1980', 'check_1975']
	var orter = []

	polys.forEach((poly, index) => {
		var color = colors[index];
		var orts = make_polys(poly['all'], color);

		var check_name = check_names[index]

		const checkbox = document.getElementById(check_name)
		checkbox.addEventListener('change', (event) => {
		if (event.currentTarget.checked) {
			for (var ort of orts){
				ort.setMap(map)
				checkbox.style.backgroundColor = color; 
				// checkbox.style.fill = 'green'
			}
		} else {
			for (var ort of orts){
				ort.setMap(null)
				// checkbox1.style.fill = none
			}
		}
		})

		orter.push(orts)
	})
}

function make_polys(polys, color) {
	var orts = []
	// console.log(typeof polys)
	for (const poly of polys) {
		const cords = [];
		// console.log(poly[0]['lat'])
		// print(poly[0])

		// print(cords[0])

		for (var cord of poly) {
			// console.log(cord);
			// cord = { lat: cord['lat'], lng: cord['lng'] };
			cords.push(cord)

			// console.log(cord)
			// break
		}
		// 	cords.push(cord)
		// }
		// console.log(cords)
		const ort = new google.maps.Polygon({
			paths:cords,
			strokeColor: color,
			strokeOpacity: 1.0,
			strokeWeight: 2,
			fillColor: color,
			fillOpacity: 0.2,
			map: map,
		});

		ort.setMap(null)

		orts.push(ort)
	}

	return orts
};

var toggled = false
// set of coordinates.
const eqfeed_callback = function (results) {
	// console.log(Object.keys(results))
	var maps = []

	for (const [key,val] of Object.entries(results)) {
		// console.log(val)
		const corners = [
			{lat:val[1][1], lng:val[0][0]},
			{lat:val[1][1], lng:val[1][0]},
			{lat:val[0][1], lng:val[1][0]},
			{lat:val[0][1], lng:val[0][0]},
		]

		const box = new google.maps.Polygon({
			paths:corners,
			strokeColor: "#FF0000",
			strokeOpacity: 0.8,
			strokeWeight: 2,
			fillColor: "#FF0000",
			fillOpacity: 0.0, //0.35
			map: map,
		});

		google.maps.event.addListener(box,'click', function(a) {
			var path = key.replace('Ekonomisk', image_folder)
			var mask = key.replace('Ekonomisk', pred_folder)
			
			mask = mask.replace('tif', 'png')
			path = path.replace('tif', 'png')

			document.getElementById("myMask").src="../" + mask;
			document.getElementById("myImg").src="../" + path;

			if(toggled == false) {
				$('#slide_in').toggleClass('show');
				$('#map').toggleClass('show');
				toggled = true
			}
		})

		const contentString = '';

		const infowindow = new google.maps.InfoWindow({
			content: contentString,
			ariaLabel: "Uluru",
			map:map,
		});
		box.addListener('click', function(a) {
			// return
			infowindow.close()

			setTimeout(() => {

				const center_lng = (val[1][0]-val[0][0])/2 + val[0][0]
				const center_lat = (val[0][1]-val[1][1])/2 + val[0][1]
				var latlng = new google.maps.LatLng(center_lat, center_lng);

				var test = new google.maps.Geocoder().geocode({'latLng' : latlng}, function(results, status) {
					
				})

				const printAddress = async () => {
					// test.then((a) => {
						const a = await test;
						var ort = a.results[0].address_components[2].long_name;
						var ort2 = a.results[0].address_components[1].long_name;

						console.log(ort);
						console.log(ort2);

						var contentString = ort + ' - '+ ort2;
						infowindow.setContent(contentString);
						infowindow.setPosition({lat:val[1][1], lng:center_lng});
						infowindow.open(map);
						// return

						map.addListener('click', function() {
							infowindow.close()
						})

						box.addListener('mouseout', function () {
							infowindow.close()
						})
				}
				// setTimeout(() => {  printAddress(); }, 50);
				printAddress()
				return

			}, 50);
			
		})

		google.maps.event.addListener(map, "click", function(event) {
			if(toggled == true) {
				$('#slide_in').toggleClass('show');
				$('#map 	').toggleClass('show');
				
			infowindow.close();

				toggled = false
			}

			// document.getElementById('outer')
			// 				.style = "none";
		});

		// box.push(maps)
		maps.push(box)
	};
	return maps
};

window.initMap = initMap;
