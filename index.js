export class MapApp {
    constructor() {
      // Variables
      this.map = null;
      this.markers = [];
      this.allSegmented = [];
      this.drawingManager = null;
      this.progressUpdateInterval = null;
  
      // Constants
      this.maxAllowedAreaInSquareMeters = 2000;
      this.defaultMapCenterLatitude = 59.27;

      // Coordinate bounds for allowed area
      this.coordinateBounds = {
        minLatitude: 59.248682,
        maxLatitude: 59.296590,
        minLongitude: 15.170445,
        maxLongitude: 15.283718,
      }

      // Conversion factor for square meters to square degrees
      this.conversionFactor = 111.32 * Math.cos(this.defaultMapCenterLatitude * Math.PI / 180);
      this.maxAllowedArea = this.maxAllowedAreaInSquareMeters / 1000000 / this.conversionFactor;

      // Bind event listeners
      this.initMap = this.initMap.bind(this);
      this.polygonCompleteHandler = this.polygonCompleteHandler.bind(this);
      this.polygonClickHandler = this.polygonClickHandler.bind(this);
      this.updateGAIAndMarkerLabels = this.updateGAIAndMarkerLabels.bind(this);
      this.getGAI = this.getGAI.bind(this);
    }
  
    // Initialize the map
    initMap() {
      // Create a new Google Map instance
      this.map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 59.27, lng: 15.220 },
        zoom: 14.2,
      });
  
      // Initialize the drawing manager for polygons
      this.drawingManager = new google.maps.drawing.DrawingManager({
        drawingControl: true,
        drawingControlOptions: {
          position: google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [
            google.maps.drawing.OverlayType.POLYGON,
          ],
        },
        polygonOptions: {
          fillOpacity: 0.7,
        },
      });
  
      // Set the map for the drawing manager
      this.drawingManager.setMap(this.map);
  
      // Add a listener for polygon completion
      google.maps.event.addListener(this.drawingManager, 'polygoncomplete', this.polygonCompleteHandler);
  
      // Add event listeners to input elements representing the constants
      // These listeners will update the green area index (GAI) and marker labels
      document.getElementById("area_bush_constant").addEventListener("change", this.updateGAIAndMarkerLabels);
      document.getElementById("area_grass_constant").addEventListener("change", this.updateGAIAndMarkerLabels);
      document.getElementById("area_newTree_constant").addEventListener("change", this.updateGAIAndMarkerLabels);
      document.getElementById("area_treeBig_constant").addEventListener("change", this.updateGAIAndMarkerLabels);
      document.getElementById("area_treeMedium_constant").addEventListener("change", this.updateGAIAndMarkerLabels);
      document.getElementById("area_treeSmall_constant").addEventListener("change", this.updateGAIAndMarkerLabels);
      document.getElementById("area_playGr_constant").addEventListener("change", this.updateGAIAndMarkerLabels);
      document.getElementById("area_social1_constant").addEventListener("change", this.updateGAIAndMarkerLabels);
      document.getElementById("area_social2_constant").addEventListener("change", this.updateGAIAndMarkerLabels);
      document.getElementById("area_social3_constant").addEventListener("change", this.updateGAIAndMarkerLabels);
      document.getElementById("area_shadow_constant").addEventListener("change", this.updateGAIAndMarkerLabels);
      document.getElementById("area_cultiVland_constant").addEventListener("change", this.updateGAIAndMarkerLabels);
      document.getElementById("area_pergola_constant").addEventListener("change", this.updateGAIAndMarkerLabels);
    }

    // Event handlers

    /**
     * Handles the completion of a polygon.
     * @param {google.maps.Polygon} polygon - The completed polygon.
     */
    polygonCompleteHandler(polygon) {
      const path = polygon.getPath();
  
      // Check if any point is outside the allowed coordinate area
      for (let i = 0; i < path.getLength(); i++) {
        const point = path.getAt(i);
  
        if (this.isPointOutsideCoordinateBounds(point)) {
          alert("One or more points are outside the allowed coordinate area.");
          polygon.setMap(null);
          return;
        }
      }
  
      const pathLength = polygon.getPath().getLength();
  
      // Check if the polygon has only two points
      if (pathLength < 3) {
        alert("The polygon must have three or more points.");
        polygon.setMap(null);
        return;
      }
  
      const area = this.getPolygonArea(polygon);
  
      if (area > this.maxAllowedArea) {
        alert("The polygon area exceeds the maximum allowed area.");
        polygon.setMap(null);
        return;
      }
  
      const progressBar = document.getElementById('progress-bar');
      progressBar.style.width = `0%`;
  
      const corners = [];
      const lats = [];
      const lngs = [];
  
      for (let i = 0; i < pathLength; i++) {
        const corner = polygon.getPath().getAt(i).toJSON(5);
        const swerefCorner = this.convertToSweref(corner.lng, corner.lat);
        corners.push(swerefCorner);
        lats.push(corner.lat);
        lngs.push(corner.lng);
      }
  
      const response = this.getGAI(corners);
  
      // Handle the response from the server containing the green area index (GAI)
      response.then(value => {
        const center = this.polygonCenter(lngs, lats);
        const gai = value.gyf;
  
        this.customLabel(value, center[0], center[1]);
        polygon.set('fillColor', this.perc2color(100 * gai, 0, 200));

        // Add a click event listener to the polygon to show the images
        google.maps.event.addListener(polygon, 'click', (event) => {
            this.polygonClickHandler(event, value, this.map); // Pass the value and map instance
          });
      });
    }

    /**
     * Handles the click event on a polygon.
     * @param {google.maps.MouseEvent} event - The click event.
     * @param {Object} value - The value containing the images.
     * @param {google.maps.Map} map - The map instance.
     */
    polygonClickHandler(event, value, map) {
        const infoWindow = new google.maps.InfoWindow({ map }); // Set the map instance
    
        console.log(value)
        
        var image1 = new Image();
        image1.src = `data:image/jpeg;base64,${value.orto_img}`;
        
        var image2 = new Image();
        image2.src = `data:image/jpeg;base64,${value.segmented_img}`;
        
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        
        var isOverlay = false; // Flag to track current state
        
        image1.onload = function() {
            const originalWidth1 = image1.width;
            const originalHeight1 = image1.height;
        
            var desiredWidth1 = 600;
            var desiredHeight1 = 600;

            const aspectRatio1 = originalWidth1 / originalHeight1;

            if (aspectRatio1 > 1) {
            // Image is wider, adjust width
            desiredWidth1 = 400;
            desiredHeight1 = desiredWidth1 / aspectRatio1;
            } else {
            // Image is taller, adjust height
            desiredHeight1 = 400;
            desiredWidth1 = desiredHeight1 * aspectRatio1;
            }

            canvas.width = desiredWidth1 * 2;
            canvas.height = desiredHeight1;
        
            var container = document.createElement('div');

            // Toggle the overlay between image1 and image2
            var toggleOverlay = document.createElement('button');
            toggleOverlay.textContent = 'Toggle Overlay';
            toggleOverlay.onclick = function() {

            isOverlay = !isOverlay; // Toggle the state
            renderImages(desiredWidth1);
            };

            var saveButton = document.createElement('button');
            saveButton.textContent = 'Save images';

            // Save images
            saveButton.onclick = function() {
            save(image1, 'original_image');
            save(image2, 'segmented_image');
            };

            // Create and append the color legend bar
            var colorBar = createColorBar();
            container.appendChild(colorBar);
            container.appendChild(saveButton);
            container.appendChild(toggleOverlay);
            container.appendChild(canvas);
        
            infoWindow.setContent(container);
            infoWindow.setPosition(event.latLng);
            infoWindow.open(map);

            // Render images initially
            renderImages(desiredWidth1);
        };

        function createColorBar() {
            // Create the color bar container element
            var colorBarContainer = document.createElement('div');
            colorBarContainer.style.display = 'flex';
            colorBarContainer.style.flexDirection = 'row';
            colorBarContainer.style.flexWrap = 'wrap';
            colorBarContainer.style.justifyContent = 'space-between';
            colorBarContainer.style.alignItems = 'center';
            colorBarContainer.style.marginTop = '10px';
            
            // Define your color legend or color definition here
            var colorLegend = [
                { color: '#BFBF00', label: 'Road' },
                { color: '#FFFFFF', label: 'Building' },
                { color: '#0000FF', label: 'Bush' },
                { color: '#FFF000', label: 'Cultivated Area' },
                { color: '#00FF00', label: 'Grass' },
                { color: '#649B00', label: 'New Tree' },
                { color: '#FFFF00', label: 'Old Tree' },
                { color: '#FF0000', label: 'pergolla' },
                { color: '#FF00FF', label: 'Playground' },
                { color: '#A3C5FF', label: 'Social Area 1' },
                { color: '#A31DF4', label: 'Social Area 2' },
                { color: '#800080', label: 'Social Area 3' },
                { color: '#A0B0D0', label: 'shadow' }
            
            ];
            
            // Iterate over the colorLegend array to create color bar elements
            for (var i = 0; i < colorLegend.length; i++) {
                var colorItem = colorLegend[i];
            
                // Create a color box element
                var colorBox = document.createElement('div');
                colorBox.style.backgroundColor = colorItem.color;
                colorBox.style.width = '20px';
                colorBox.style.height = '20px';
                colorBox.style.marginBottom = '5px';
                colorBox.style.border = '1px solid black';
            
                // Create a label element
                var label = document.createElement('span');
                label.textContent = colorItem.label;
                label.style.marginLeft = '5px';
            
                // Create a container element to hold the color box and label
                var container = document.createElement('div');
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.appendChild(colorBox);
                container.appendChild(label);
            
                var secondColumnContainer = document.createElement('div');
                secondColumnContainer.style.flexBasis = '30%';
                secondColumnContainer.appendChild(container);
            
                // Append the second column container to the color bar container
                colorBarContainer.appendChild(secondColumnContainer);
                
            }
            
            return colorBarContainer;
            }
        
        function renderImages(w) {
            // Check if a point is outside the allowed coordinate area
            // based on the defined coordinate bounds
            context.clearRect(0, 0, canvas.width, canvas.height);
        
            if (isOverlay) {
            canvas.width = w;
            drawOverlay();
            } else {
            canvas.width = w*2;
            drawSideBySide();
            }
        }
        
        function drawOverlay() {
            const imageWidth = canvas.width;
            const imageHeight = canvas.height;
        
            // Draw image1
            context.drawImage(image1, 0, 0, imageWidth, imageHeight);
        
            // Set the opacity for image2
            context.globalAlpha = 0.5;
        
            // Draw image2 on top of image1
            context.drawImage(image2, 0, 0, imageWidth, imageHeight);
        
            // Reset the opacity
            context.globalAlpha = 1;
        }
        
        function drawSideBySide() {
            const imageWidth = canvas.width/2;
            const imageHeight = canvas.height;
        
            context.drawImage(image1, 0, 0, imageWidth, imageHeight);
            context.drawImage(image2, imageWidth, 0, imageWidth, imageHeight);
        }

        function save(image, name) {
            var link = document.createElement('a');
            link.href = image.src;
            link.download = name + '.jpg';
            link.click();
        }
    }

    // Utility functions section

    /**
     * Checks if a point is outside the allowed coordinate bounds.
     * @param {google.maps.LatLng} point - The point to check.
     * @returns {boolean} - True if the point is outside the bounds, false otherwise.
     */
    isPointOutsideCoordinateBounds(point) {
        // Check if a point is outside the allowed coordinate area
        // based on the defined coordinate bounds
        const { minLatitude, maxLatitude, minLongitude, maxLongitude } = this.coordinateBounds;
        const latitude = point.lat();
        const longitude = point.lng();
    
        return (
          latitude < minLatitude ||
          latitude > maxLatitude ||
          longitude < minLongitude ||
          longitude > maxLongitude
        );
    }

    /**
     * Calculates the area of a polygon.
     * @param {google.maps.Polygon} polygon - The polygon to calculate the area for.
     * @returns {number} - The area of the polygon.
     */
    getPolygonArea(polygon) {
        // Calculate the area of a polygon using its coordinates
        const coordinates = polygon.getPath().getArray();
        const numPoints = coordinates.length;
        let area = 0;
    
        for (let i = 0; i < numPoints; i++) {
          const j = (i + 1) % numPoints;
          const point1 = coordinates[i];
          const point2 = coordinates[j];
          area += point1.lng() * point2.lat();
          area -= point1.lat() * point2.lng();
        }
    
        area = Math.abs(area) / 2;
        return area;
    }

    /**
     * Converts longitude and latitude to the SWEREF coordinate system.
     * @param {number} longitude - The longitude value.
     * @param {number} latitude - The latitude value.
     * @returns {Array} - The converted SWEREF coordinates.
     */
    convertToSweref(longitude, latitude) {
        // Convert longitude and latitude to the SWEREF coordinate system
        proj4.defs([
          ['WGS84', "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees"],
          ['SWEREF991500', "+proj=tmerc +lat_0=0 +lon_0=15 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],
        ]);
      
        const epsg3009 = proj4("SWEREF991500");
        const swerefCorner = proj4('WGS84', epsg3009, [longitude, latitude]);
      
        return swerefCorner.reverse();
    }

    /**
     * Calculates the center of a polygon.
     * @param {number[]} lngs - The array of longitudes.
     * @param {number[]} lats - The array of latitudes.
     * @returns {number[]} - The center coordinates.
     */
    polygonCenter(lngs, lats) {
        // Calculate the center of a polygon based on its coordinates
        const longitudes = lngs;
        const latitudes = lats;
    
        latitudes.sort();
        longitudes.sort();
    
        const lowX = latitudes[0];
        const highX = latitudes[latitudes.length - 1];
        const lowy = longitudes[0];
        const highy = longitudes[latitudes.length - 1];
    
        const centerX = lowX + ((highX - lowX) / 2);
        const centerY = lowy + ((highy - lowy) / 2);
    
        return [centerX, centerY];
    }

    /**
     * Converts a percentage value to a color between the specified range.
     * @param {number} perc - The percentage value.
     * @param {number} min - The minimum value of the range.
     * @param {number} max - The maximum value of the range.
     * @returns {string} - The color value in hex format.
     */
    perc2color(perc, min, max) {
        // Convert a percentage value to a color between the specified range
        let base = (max - min);
        if (base === 0) {
          perc = 100;
        } else {
          perc = (perc - min) / base * 100;
        }
    
        let r, g, b = 0;
        if (perc < 50) {
          r = 255;
          g = Math.round(5.1 * perc);
        } else {
          g = 255;
          r = Math.round(510 - 5.10 * perc);
        }
    
        const h = r * 0x10000 + g * 0x100 + b * 0x1;
        return '#' + ('000000' + h.toString(16)).slice(-6);
    }

    // API requests functions section

    /**
     * Updates the green area index (GAI) and marker labels based on the input values of the constants.
     */
    updateGAIAndMarkerLabels() {
        // Update the green area index (GAI) and marker labels
        // based on the input values of the constants
        const areaBushConstant = document.getElementById("area_bush_constant").value;
        const areaGrassConstant = document.getElementById("area_grass_constant").value;
        const areaNewTreeConstant = document.getElementById("area_newTree_constant").value;
        const areaTreeBigConstant = document.getElementById("area_treeBig_constant").value;
        const areaTreeMediumConstant = document.getElementById("area_treeMedium_constant").value;
        const areaTreeSmallConstant = document.getElementById("area_treeSmall_constant").value;
        const areaPlayGrConstant = document.getElementById("area_playGr_constant").value;
        const areaSocial1Constant = document.getElementById("area_social1_constant").value;
        const areaSocial2Constant = document.getElementById("area_social2_constant").value;
        const areaSocial3Constant = document.getElementById("area_social3_constant").value;
        const areaShadowConstant = document.getElementById("area_shadow_constant").value;
        const areaCultiVlandConstant = document.getElementById("area_cultiVland_constant").value;
        const areaPergolaConstant = document.getElementById("area_pergola_constant").value;

        // Update GAI and marker labels for each marker
        for (let i = 0; i < this.markers.length; i++) {
          const currentMarkerSegmented = this.allSegmented[i];
          const payload = {
            segmented: currentMarkerSegmented,
            area_bush_constant: areaBushConstant,
            area_grass_constant: areaGrassConstant,
            area_newTree_constant: areaNewTreeConstant,
            area_treeBig_constant: areaTreeBigConstant,
            area_treeMedium_constant: areaTreeMediumConstant,
            area_treeSmall_constant: areaTreeSmallConstant,
            area_playGr_constant: areaPlayGrConstant,
            area_social1_constant: areaSocial1Constant,
            area_social2_constant: areaSocial2Constant,
            area_social3_constant: areaSocial3Constant,
            area_shadow_constant: areaShadowConstant,
            area_cultiVland_constant: areaCultiVlandConstant,
            area_pergola_constant: areaPergolaConstant,
          };
    
          fetch("http://127.0.0.1:5000/api/update", {
            method: 'POST',
            headers: {
              'Content-type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
          })
          .then(res => {
            if (res.ok) {
              return res.json();
            } else {
              throw new Error("Something went wrong");
            }
          })
          .then(jsonResponse => {
            const gai = jsonResponse;
            const marker = this.markers[i];
            marker.setLabel({
              text: gai.toFixed(2).toString(),
              color: "black",
              fontWeight: "bold",
            });
          })
          .catch((err) => console.error(err));
        }
    }

    /**
     * Sends a request to the server to get the green area index (GAI) based on the given coordinates and constants.
     * @param {Array} coords - The SWEREF coordinates of the polygon corners.
     * @returns {Promise} - A promise that resolves to the GAI value.
     */
    getGAI(coords) {
        // Send a request to the server to get the green area index (GAI)
        // based on the given coordinates and constants
        const areaBushConstant = document.getElementById("area_bush_constant").value;
        const areaGrassConstant = document.getElementById("area_grass_constant").value;
        const areaNewTreeConstant = document.getElementById("area_newTree_constant").value;
        const areaTreeBigConstant = document.getElementById("area_treeBig_constant").value;
        const areaTreeMediumConstant = document.getElementById("area_treeMedium_constant").value;
        const areaTreeSmallConstant = document.getElementById("area_treeSmall_constant").value;
        const areaPlayGrConstant = document.getElementById("area_playGr_constant").value;
        const areaSocial1Constant = document.getElementById("area_social1_constant").value;
        const areaSocial2Constant = document.getElementById("area_social2_constant").value;
        const areaSocial3Constant = document.getElementById("area_social3_constant").value;
        const areaShadowConstant = document.getElementById("area_shadow_constant").value;
        const areaCultiVlandConstant = document.getElementById("area_cultiVland_constant").value;
        const areaPergolaConstant = document.getElementById("area_pergola_constant").value;
    
        const payload = {
          coords: coords,
          area_bush_constant: areaBushConstant,
          area_grass_constant: areaGrassConstant,
          area_newTree_constant: areaNewTreeConstant,
          area_treeBig_constant: areaTreeBigConstant,
          area_treeMedium_constant: areaTreeMediumConstant,
          area_treeSmall_constant: areaTreeSmallConstant,
          area_playGr_constant: areaPlayGrConstant,
          area_social1_constant: areaSocial1Constant,
          area_social2_constant: areaSocial2Constant,
          area_social3_constant: areaSocial3Constant,
          area_shadow_constant: areaShadowConstant,
          area_cultiVland_constant: areaCultiVlandConstant,
          area_pergola_constant: areaPergolaConstant,
        };
    
        return fetch("http://127.0.0.1:5000/api/receiver", {
          method: 'POST',
          headers: {
            'Content-type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
        })
        .then(res => {
          if (res.ok) {
            return res.json();
          } else {
            alert("Something went wrong");
          }
        })
        .then(jsonResponse => {
          return jsonResponse;
        })
        .catch((err) => console.error(err));
    }

    // Map-related functions

    /**
     * Creates a custom label for a marker based on the GAI value.
     * @param {Object} value - The response value containing the GAI and segmentation information.
     * @param {number} lat - The latitude of the marker.
     * @param {number} lng - The longitude of the marker.
     */
    customLabel(value, lat, lng) {
        // Create a custom label for a marker based on the GAI value
        const markerLatLng = new google.maps.LatLng(lat, lng);
        const markerIcon = {
          url: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png',
          scaledSize: new google.maps.Size(0, 0),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(0, 0),
          labelOrigin: new google.maps.Point(0, 0),
        };
    
        const segmented = value.segmentation;
        const gai = value.gyf.toFixed(2).toString();
    
        const marker = new google.maps.Marker({
          map: this.map,
          animation: google.maps.Animation.DROP,
          position: markerLatLng,
          icon: markerIcon,
          label: {
            text: gai,
            color: "black",
            fontWeight: "bold",
          },
        });
    
        this.markers.push(marker);
        this.allSegmented.push(segmented);
    }

    /**
     * Starts the Map App by initializing the map and setting up the progress update interval.
     */
    start() {
        // Start the map app by initializing the map and setting up the progress update interval
        this.progressUpdateInterval = setInterval(this.updateProgressBar, 1000);
        this.initMap();
    }

    /**
     * Updates the progress bar based on the progress retrieved from the server.
     */
    updateProgressBar() {
        // Update the progress bar based on the progress retrieved from the server
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'http://127.0.0.1:5000/api/progress');
        xhr.onload = function() {
          const progress = parseInt(xhr.responseText);
          const progressBar = document.getElementById('progress-bar');
          progressBar.style.width = `${progress}%`;
        };
    
        xhr.send();
    }
}
