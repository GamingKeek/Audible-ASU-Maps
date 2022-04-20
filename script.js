var $buttons = document.createElement('p'),
      $button = document.createElement('button'),
      $play = $button.cloneNode(),
      $pause = $button.cloneNode(),
      paused = false,
      to_speak,
      progress_index,
      $speed = document.createElement('p'),
			$speed_label = document.createElement('label'),
	    $speed_value = document.createElement('input');
      //---------------------------
      require(["esri/config",
            "esri/Map", 
            "esri/views/MapView",
            "esri/Graphic",
            "esri/rest/route",
            "esri/rest/support/RouteParameters",
            "esri/rest/support/FeatureSet", 
            "esri/widgets/Track"], // adds current location
        function (esriConfig, Map, MapView,Graphic, route, RouteParameters, FeatureSet, Track) {
            esriConfig.apiKey = "AAPKd6e465ca0efd4a49857f375285111e74k-XzqRsHeHxxWePQBqyWwRkgFwxSUSeQl2CMHxG5gWuQXQcZuVWcmrtKq09u0Beh";

            const map = new Map({
                basemap: "arcgis-topographic" // Basemap layer service
                });
            const view = new MapView({
                map: map,
                center: [-111.9326217,33.4191377], // Longitude, latitude
                zoom: 13, // Zoom level
                container: "viewDiv" // Div element
                });
            // Create an instance of the Track widget and add it to the view's UI
            var track = new Track({
                view: view
            });
            view.ui.add(track, "top-left");
            // The sample will start tracking your location once the view becomes ready
            view.when(function () {
                track.start();
            });
            const routeUrl = "https://gis.m.asu.edu/server/rest/services/Campus/ASUCampusRoute/NAServer/Route";
            view.on("click", function(event){
                if (view.graphics.length === 0) {
                    addGraphic("origin", event.mapPoint);
                } else if (view.graphics.length === 1) {
                    addGraphic("destination", event.mapPoint);
                    getRoute(); // Call the route service
                } else {
                    view.graphics.removeAll();
                    addGraphic("origin",event.mapPoint);
                }
            });
            function addGraphic(type, point) {
            const graphic = new Graphic({
                symbol: {
                type: "simple-marker",
                color: (type === "origin") ? "white" : "black",
                size: "8px"
                },
                geometry: point
            });
            view.graphics.add(graphic);
            }
            function getRoute() {
                const routeParams = new RouteParameters({
                    stops: new FeatureSet({
                    features: view.graphics.toArray()
                    }),
                    returnDirections: true
                });
                route.solve(routeUrl, routeParams)
                .then(function(data) {
                data.routeResults.forEach(function(result) {
                    result.route.symbol = {
                    type: "simple-line",
                    color: [5, 150, 255],
                    width: 3
                    };
                    view.graphics.add(result.route);
                });
                // Display directions
                if (data.routeResults.length > 0) {
                const directions = document.createElement("ol");
                directions.classList = "esri-widget esri-widget--panel esri-directions__scroller";
                directions.style.marginTop = "0";
                directions.style.padding = "15px 15px 15px 30px";
                const features = data.routeResults[0].directions.features;
                // Show each direction
                features.forEach(function(result,i){
                    const direction = document.createElement("li");
                    direction.innerHTML = result.attributes.text + " (" + result.attributes.length.toFixed(2) + " miles)";
                    directions.appendChild(direction); // this is where audio feature could be added?
                    
                
                });
                view.ui.empty("top-right");
                view.ui.add(directions, "top-right");

                if ( 'speechSynthesis' in window ) {
    
                  window.addEventListener('beforeunload',function(){ window.speechSynthesis.cancel(); });
              
                  // content to speak
                  to_speak = new SpeechSynthesisUtterance(directions);
                  window.speechSynthesis.speak(to_speak);
                  
                  // set the rate a little faster than 1x
                  to_speak.rate = 1.4;
                
                  // Event Handlers
                  function play() {
                    if ( paused ) {
                      paused = false;
                      window.speechSynthesis.resume();
                    } else {
                      window.speechSynthesis.speak( to_speak );
                    }
                  }
                  function pause() {
                    window.speechSynthesis.pause();
                  }
                  
                  to_speak.onpause = function(){
                    paused = true;
                  };
                  to_speak.onboundary = function( e ){
                    if ( e.name == 'word' )
                    {
                      progress_index = e.charIndex;
                    }
                  };
                  
                  // Play Button
                  $play.innerText = 'Play';
                  $play.addEventListener( 'click', play, false );
                  $buttons.appendChild( $play );
                  
                  // Pause Button
                  $pause.innerText = 'Pause';
                  $pause.addEventListener( 'click', pause, false );
                  $buttons.appendChild( $pause );
                  
                  // Label the field
                  $speed_label.innerText = 'Speed';
                  $speed_label.htmlFor = 'speed_value';
                  $speed.appendChild( $speed_label );
                  
                  // Insert the Form control
                  $speed_value.type = 'number';
                  $speed_value.id = 'speed_value';
                  $speed_value.min = '0.1';
                  $speed_value.max = '10';
                  $speed_value.step = '0.1';
                  $speed_value.value = Math.round( to_speak.rate * 10 ) / 10;
                  $speed.appendChild( $speed_value );
                  
                  function adjustSpeed() {
                    // cancel the original utterance
                    window.speechSynthesis.cancel();
              
                    // find the previous space
                    var previous_space = to_speak.text.lastIndexOf( ' ', progress_index );
              
                    // get the remains of the original string
                    to_speak.text = to_speak.text.slice( previous_space );
              
                    // Math to 1 decimal place
                    speed = Math.round( $speed_value.value * 10 ) / 10;
              
                    // adjust the rate
                    if ( speed > 10 )
                    {
                      speed = 10;
                    }
                    else if ( speed < 0.1 )
                    {
                      speed = 0.1;
                    }
                    to_speak.rate = speed;
              
                    // return to speaking
                    window.speechSynthesis.speak( to_speak );
                  }
              
                  $speed_value.addEventListener( 'change', adjustSpeed, false );
                
                } else {
                  
                  // Sad panda
                  $buttons.innerText = 'Unfortunately your browser doesn’t support this feature.';
                  
                }
                
                document.body.appendChild( $buttons );
                document.body.appendChild( $speed ); 


                }

            })
            .catch(function(error){
            console.log(error);
        })
                }

        });
      //---------------------------
	
	