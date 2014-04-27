$(function() {

	/* Universal instance variables */
	var available_tags = []; // The complete list of all possible tags
	var selected_tags = []; // The selected list of tags

	var available_venues = []; // The complete list of all possible venues
	var selected_venues = [] // The list of venues the user is choosing to use

	var available_events = [] // The list of events the user might face
	
	var selected_events = [] // The list of events + start time objects

	var location = {} // The location information for the user

	/* Init
	 * Loads tag list
	 */
	function init() {

		$.when(
			$.ajax({
				url: '/static/data/tags.json',
				type: 'get',
				dataType: 'json'
			}).done(function(data) {
			 	available_tags = data;
			}),
			$.ajax({
				url: '/static/data/events.json',
				type: 'get',
				dataType: 'json'
			}).done(function(data) {
			 	available_events = data;
			})
		).done(function(data) {
		 	sceneA();
		});
	}


	/* Scene A
	 * The user is introduced to the app
	 * The user is asked to enter their current location.
	 */
	function sceneA() {
		
		function redraw() {}

		function geocode(address) {
			var geocoder = new google.maps.Geocoder();
			geocoder.geocode( { 'address': address}, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					location = results[0].geometry.location; // "k" is lat and "A" is lng
				} else {
					alert("Geocode was not successful for the following reason: " + status);
				}
			});
		}


		function next() {
			sceneB();
		}

		$("#location-form").submit(function() {
			var location_text = $("#location-text").val();
			geocode(location_text);
			next();
			return false;
		});


		$(".scene").hide();
		$("#scene-a").show();
	}

	/* Scene A
	 * The user is presented with tags
	 * The user is asked to select tags
	 * The user may refresh the tag list
	 * The user may select a random tag set
	 */
	function sceneB() {
		var rendered_tags = []; // The list of tags being rentered

		function redraw() {
			var $tags = $("#tags");
			$tags.empty();

			for(var x in rendered_tags) {
				var tag = rendered_tags[x];
				var $tag = $("<div>")
					.addClass("tag" + (is_selected(tag)?" selected":""))
					.text(tag)
					.click(function() {
						var tag = $(this).text();
						toggleTag(tag);
						redraw();
					})
					.appendTo($tags);
			}
		}

		function refreshTags() {
			var new_tag_count = Math.max(0, 16 - selected_tags.length);
			var new_tags = getRandomSubarray(arr_diff(available_tags, selected_tags), new_tag_count);
			rendered_tags = selected_tags.concat(new_tags); 
		}

		function randomizeTags() {
			selected_tags = getRandomSubarray(arr_diff(available_tags, selected_tags), 4);
		}

		function is_selected(tag) {
			return $.inArray(tag, selected_tags) != -1;
		}

		function toggleTag(tag) {
			if(is_selected(tag))
				deselectTag(tag);
			else
				selectTag(tag);
		}

		function selectTag(tag) {
			if(is_selected(tag))
				return;
			selected_tags.push(tag);
		}

		function deselectTag(tag) {
			if(!is_selected(tag))
				return;

			selected_tags.splice(indexOf.call(selected_tags,tag), 1);
		}

		function next() {
			sceneC();
		}

		/* Initialization */
		refreshTags();
		redraw();

		$("#refresh-tags").click(function() {
			refreshTags();
			redraw();
		});

		$("#randomize-tags").click(function() {
			randomizeTags();
			next();
		});
		$("#goto-c").click(function() {
			if(selected_tags.length == 0)
				randomizeTags();
			next();
		});

		$(".scene").hide();
		$("#scene-b").show();
	}

	function sceneC() {
		function redraw() {
			var $venues = $("#venues");
			$venues.empty();

			for(var x in available_venues) {
				var venue = available_venues[x];
				var $venue = $("<div>")
					.attr("id", "venue-" + x)
					.addClass("venue" + (is_selected(x)?" selected":""))
					.html("<img src='http://maps.googleapis.com/maps/api/streetview?size=200x200&location=" + venue.location.lat + "," + venue.location.lng + "&fov=90&heading=235&pitch=10&sensor=false'>")
					.click(function() {
						toggleVenue($(this).data("venue-index"));
						
						if(is_selected($(this).data("venue-index")))
							$(this).addClass("selected");
						else
							$(this).removeClass("selected");
					})
					.data("venue-index",x)
					.appendTo($venues);
			}
		}

		function selectVenue(index) {
			if(is_selected(index))
				return;
			selected_venues.push(index);
		}
		function deselectVenue(index) {
			if(!is_selected(index))
				return;
			selected_venues.splice(indexOf.call(selected_venues,index), 1);
		}
		function toggleVenue(index) {
			if(is_selected(index))
				deselectVenue(index);
			else
				selectVenue(index);
		}

		function randomizeVenues() {
			var indexArray = []
			for(var x in available_venues){
				indexArray.push(x);
			}
			selected_venues = getRandomSubarray(indexArray, 5);
		}

		function is_selected(index) {
			return $.inArray(index, selected_venues) != -1;
		}

		function next() {
			if(selected_venues.length < 1)
				randomizeVenues();
			sceneD();
		}

		$(".scene").hide();
		$("#scene-c").show();
		$("#randomize-venues").click(function() {
			randomizeVenues();
			next();
		});
		$("#goto-d").click(function() {
			next();
		});

		for(var x in selected_tags){
			var tag = selected_tags[x];
			$.ajax({
				type:"get",
				url: "https://api.foursquare.com/v2/venues/search",
				data: {
					client_id: "2SKTYCIHVE53FBV0FUSZMFZKPQUAFYTRAEFLXBVYKOOKLEZX",
					client_secret: "IIJ1CDSCVDEJP3ZEMKTDR0LNGOOPU3NUZUHFHLQSKONF4PWK", // <-- whatever man.  TAKE MY SECRETS.  THE NSA HAS THEM ANYWAY.
					ll: location.k + "," + location.A,
					intent: "browse",
					query: tag,
					v: "20140427",
					radius: "3000"
				}
			})
			.done(function(data) {
				available_venues = available_venues.concat(data.response.venues);
				redraw();
			});
		}


	}

	function sceneD() {

		var merge_data = []; // The route data, used in the animated map
		
		function redraw() {}

		function animated_map_init() {
			// Set up the timeline
			var $timeline = $("#timeline");
			var $progress = $("<div />")
				.addClass("progress")
				.appendTo($timeline);

			var timeline_start = 0;
			var timeline_end = 1;

			var event_probability = 0; // How likely is an event
			var event_threshold = 500; // How many heartbeats until events are guaranteed
			var event_allowed = true; // is an event allowed right now

			var tweet_probability = 0; // How likely is an event
			var tweet_threshold = 300; // How many heartbeats until events are guaranteed

			// Set up the clock
			var $clock = $("#clock");

			// Set up the narrative
			var $narrative = $("#narrative");
			var $narrative_details = $narrative.find(".details");

			// Create the Map
			var map = L.map('map', {attributionControl: false}).setView([
					location.A, // default lat
					location.k // default lon
				], 17); // default zoom level


			L.tileLayer('http://{s}.tiles.mapbox.com/v3/gabriel-florit.map-s24tp6w4/{z}/{x}/{y}.png', {
				minZoom: 13,
				maxZoom: 17
			}).addTo(map);

			// Prepare the timeline
			var h = 0;
			var m = 0;
			var s = 0;
			var speed = 5; // in seconds
			var active_route = null;
			var active_line = null;
			var lines = null;

			var currPoint = null;

			var heartbeat = null;
			var panbeat = null;

			function getRouteAtTime(time) {
				var daystamp = getDaystampFromTime(time);

				for(var x in merge_data) {
					var item = merge_data[x];
					var start_daystamp = getDaystampFromTime(item.table_data.starttime);
					var end_daystamp = getDaystampFromTime(item.table_data.endtime);

					if(daystamp < start_daystamp || daystamp > end_daystamp)
						continue;

					item.percent_complete = (daystamp - start_daystamp) / (end_daystamp - start_daystamp);
					return item;
				}
			}

			function getPositionAtTime(time) {
				var daystamp = getDaystampFromTime(time);

				var item = getRouteAtTime(time);
				var start_daystamp = getDaystampFromTime(item.table_data.starttime);
				var end_daystamp = getDaystampFromTime(item.table_data.endtime);
				
				var total_distance = item.route_data.distance.value;
				var time_distance = total_distance * (daystamp - start_daystamp) / (end_daystamp - start_daystamp);
				var odometer = 0;

				// Which step are we in?
				for(var y in item.route_data.steps) {
					var step = item.route_data.steps[y];
					if(time_distance > odometer + step.distance.value ) {
						odometer += step.distance.value;
						continue;
					}
					var step_progress = (time_distance - odometer) / step.distance.value; 

					// How long is the step in total?
					var polyline = L.Polyline.fromEncoded(step.polyline.points);
					var points = polyline.getLatLngs();
					var length = 0;
					var prev_point = null;
					for(var z in points) {
						var point = points[z];
						if(prev_point != null)
							length += Math.sqrt(Math.pow(point.lat - prev_point.lat,2) + Math.pow(point.lng - prev_point.lng,2));
						prev_point = point;
					}

					// Which line are we in?
					var length_odometer = 0;
					length_target = length * step_progress;
					prev_point = null;
					for(var z in points) {
						var point = points[z];
						if(prev_point != null) {
							var length_contribution = Math.sqrt(Math.pow(point.lat - prev_point.lat,2) + Math.pow(point.lng - prev_point.lng,2));
							if(length_target > length_odometer + length_contribution) {
								length_odometer += length_contribution;
							} else {
								var length_progress = (length_target - length_odometer) / length_contribution;
								var lat = prev_point.lat + (point.lat - prev_point.lat) * length_progress;
								var lng = prev_point.lng + (point.lng - prev_point.lng) * length_progress;
								return [lat,lng];
							}
						}
						prev_point = point;
					}
				}
			}

			function updateTimeline(time) {
				var timeline_current = getDaystampFromTime(time);
				$progress.css("width", (100 * (timeline_current - timeline_start) / (timeline_end - timeline_start)) + "%");
			}

			function scanTo(time) {
				// Stop the heartbeat
				if(heartbeat)
					clearTimeout(heartbeat);

				// Clear the map
				if(active_line) map.removeLayer(active_line);
				if(lines) map.removeLayer(lines);

				// Reset our vars
				lines = null
				active_route = null;
				active_line = null;
				fares = 0;
				meters = 0;

				// Jump to the right route (we won't support starting mid-route)
				var daystamp = getDaystampFromTime(time);
				for(var x in merge_data) {
					var route = merge_data[x];
					var start_daystamp = getDaystampFromTime(route.table_data.starttime);
					var end_daystamp = getDaystampFromTime(route.table_data.endtime);

					if(daystamp < start_daystamp || daystamp > end_daystamp) {
						// Render this route
						renderRoute(route)
						meters += parseFloat(route.route_data.distance.value);
						continue;
					}

					// Start animating at the beginning of this route
					var components = route.table_data.starttime.split(":");
					h = parseInt(components[0]);
					m = parseInt(components[1]);
					s = parseInt(components[2]);
					tick();
					return;
				}
			}

			function renderRoute(route) {
				var points = [];
				for(var x in route.route_data.steps) {
					var step = route.route_data.steps[x];
					var line = L.Polyline.fromEncoded(step.polyline.points);
					points = points.concat(line.getLatLngs().slice(x == 0?0:1));
				}
				
				var multiline = new L.Polyline(points)
				multiline.options.color = "#903";
				
				if(lines == null) {
					lines = new L.layerGroup()
						.addTo(map);
				}
				lines.addLayer(multiline);
			}

			function renderNarrative(text) {
				if(text == "")
					$narrative.fadeOut(400);
				else {
					$narrative_details.text(text);
					$narrative.fadeIn(400);
				}
			}

			function tick() {
				// Update the time
				s += speed;
				m = m + Math.floor(s / 60);
				h = h + Math.floor(m / 60);
				m = m % 60;
				s = s % 60;
				var time = h + ":" + m + ":" + s;
				var route = getRouteAtTime(time);
				var distance = route.route_data.distance.value * route.percent_complete;

				// Update the clock
				$clock.text(formatTime(time));

				if(active_route == null) {
					active_route = route;
				}

				// Did we finish a route?
				if(route != active_route) {
					meters += active_route.route_data.distance.value;
					renderRoute(active_route);
					
					// Start the next line at the end of this line
					map.removeLayer(active_line);
					active_line = null;

					// Update the notebook
					active_route = route;
				}

				if(active_line == null) {
					active_line = new L.Polyline([getPositionAtTime(time)]);
					active_line.options.color = "#903";
					active_line.addTo(map);
				}

				// Update current progress
				var point = getPositionAtTime(time);
				currPoint = point;
				active_line.addLatLng(point);
				updateTimeline(time);

				// Pan to the right position
				if(panbeat == null) {
					map.panTo(point);
					panbeat = setTimeout(function() {
						panbeat = null;
					}, 180 );
				}


				// Figure out events
				event_probability++;
				tweet_probability++;
				event_rng = Math.random() * event_threshold;
				tweet_rng = Math.random() * tweet_threshold;
				if(event_probability > event_rng && event_allowed) {
					// AN EVENT!
					event_probability = 0;
					trigger_event(selected_events.pop());
				}

				if(tweet_probability > tweet_rng && event_allowed) {
					// AN EVENT!
					tweet_probability = 0;
					console.log("TWEET");
					load_tweet();
				}


				heartbeat = setTimeout(function() { map.whenReady(function() {
					requestAnimationFrame(function() {
						tick();
					});
				})}, 100);
			};

			function trigger_event(e) {
				if(e) {
					var text = e.text;
					var icon = "/static/event_assets/icons/" + e.icon;
					var sound = "/static/event_assets/sounds/" + e.sound;

					event_allowed = false;
					setTimeout(
						function() {
							event_allowed = true;
							event_probability = 0;
							renderNarrative("");
						},
						15000
					);

					// Trigger the audio
					var audio = new Howl({  urls: [sound+'.ogg', sound+'.mp3']});
					audio.play();

					// Show the narrative
					renderNarrative(text);

					// Show a pin
					var icon = L.icon({
					  iconUrl: icon,
					  iconSize:     [20, 20], // size of the icon
					  iconAnchor:   [10, 10], // point of the icon which will correspond to marker's location
					});
					L.marker(currPoint, {icon: icon}).addTo(map).bindPopup(text);
				}

			}

			function load_tweet() {
				var keyword = getRandomSubarray(selected_tags, 1);
				console.log(currPoint);
				$.ajax({
					url: "/twittersearch",
					type: "get",
					dataType: "json",
					data: {
						q: keyword[0],
						lat: currPoint[0],
						lng: currPoint[1]
					}
				}).done(function(data) {
					console.log(data);
					if(data.results == "none")
						return;
					console.log("TEST");
					console.log(data.results.coordinates);
					// Show a pin
					var icon = L.icon({
					  iconUrl: "/static/event_assets/icons/twitter.png",
					  iconSize:     [20, 20], // size of the icon
					  iconAnchor:   [10, 10], // point of the icon which will correspond to marker's location
					});

					L.marker(data.results.coordinates, {icon: icon}).addTo(map).bindPopup(data.results.text);

				});
			}


			// Load the data
			var features = [];

			// Assign an ID to each record
			for(var x in merge_data) {
				merge_data[x].id = x;
			}

			// Enable scanning
			timeline_start = getDaystampFromTime(merge_data[0].table_data.starttime);
			timeline_end = getDaystampFromTime(merge_data[merge_data.length - 1].table_data.endtime);

			$timeline.click(function(e) {
				var $this = $(this)
				var offset = e.pageX - $this.offset().left;
				var time = timeline_start + (timeline_end - timeline_start) * offset / $this.width();
				scanTo(getTimeFromDaystamp(time));
			});

			// Start the animation
			scanTo(getTimeFromDaystamp(getCurrentDaystamp()));
		};

		function processRouteData(route_data) {
			var item = {};
			var d = new Date();
			var time = d.getHours() * 60 * 60 + d.getMinutes() * 60 + d.getSeconds();

			// Merge the legs
			item.route_data = {
				distance: {
					value: 0
				},
				steps: []
			};

			var duration = 0;
			for(var y in route_data.routes[0].legs) {
				var leg = route_data.routes[0].legs[y];
				item.route_data.distance.value += leg.distance.value;
				item.route_data.steps = item.route_data.steps.concat(leg.steps);
				duration = leg.duration.value;
			}
			item.table_data = {
				starttime: getTimeFromDaystamp(time),
				endtime: getTimeFromDaystamp(time + duration)
			}

			time = time + duration;

			merge_data.push(item);

			// Create the narration
			var event_count =Math.min(available_events.length, Math.round(Math.random() * duration / (60 * 10)));
			selected_events = getRandomSubarray(available_events, available_events.length);
		}

		$(".scene").hide();
		$("#narrative").hide();
		$("#scene-d").show();

		var directionsService = new google.maps.DirectionsService();
		var waypoints = [];
		for(var x in selected_venues) {
			var venue = available_venues[selected_venues[x]];
			waypoints.push({
				location: new google.maps.LatLng(venue.location.lat, venue.location.lng),
				stopover: false
			});
		}
		///*
		var request = {
			origin:location,
			destination:location,
			travelMode: google.maps.TravelMode.WALKING,
			waypoints: waypoints,
			optimizeWaypoints: true
		};
		directionsService.route(request, function(result, status) {
			if (status == google.maps.DirectionsStatus.OK) {
				route_data = result;
				processRouteData(route_data);
				animated_map_init();
			}
		});
		/**/
		/*
		location = new google.maps.LatLng(53, -16);
		selected_tags = ["test"];
		var route_data = {"routes":[{"bounds":{"northeast":{"lat":53.3449932,"lng":-6.257216300000001},"southwest":{"lat":53.3414199,"lng":-6.2642802}},"copyrights":"Map data ©2014 Google","legs":[{"distance":{"text":"1.2 km","value":1236},"duration":{"text":"15 mins","value":910},"end_address":"2 Cecilia Street, Dublin, Ireland","end_location":{"lat":53.3449932,"lng":-6.2642802},"start_address":"41-43 Clarendon Street, Dublin, Ireland","start_location":{"lat":53.3416505,"lng":-6.2616875},"steps":[{"distance":{"text":"53 m","value":53},"duration":{"text":"1 min","value":36},"end_location":{"lat":53.34206649999999,"lng":-6.2613008},"html_instructions":"Head <b>northeast</b> on <b>Clarendon Street</b> toward <b>Coppinger Row</b>","polyline":{"points":"ihqdIp~ee@s@q@_@["},"start_location":{"lat":53.3416505,"lng":-6.2616875},"travel_mode":"WALKING"},{"distance":{"text":"87 m","value":87},"duration":{"text":"1 min","value":63},"end_location":{"lat":53.3417927,"lng":-6.260075},"html_instructions":"Turn <b>right</b> onto <b>Johnson's Court</b>","maneuver":"turn-right","polyline":{"points":"}jqdIb|ee@P{@Hg@BSBO?I@G?E?E?C?C@IJm@BM"},"start_location":{"lat":53.34206649999999,"lng":-6.2613008},"travel_mode":"WALKING"},{"distance":{"text":"26 m","value":26},"duration":{"text":"1 min","value":18},"end_location":{"lat":53.3420082,"lng":-6.259940100000001},"html_instructions":"Turn <b>left</b> onto <b>Grafton Street</b>","maneuver":"turn-left","polyline":{"points":"eiqdIntee@k@["},"start_location":{"lat":53.3417927,"lng":-6.260075},"travel_mode":"WALKING"},{"distance":{"text":"0.1 km","value":124},"duration":{"text":"1 min","value":87},"end_location":{"lat":53.3418047,"lng":-6.258103999999999},"html_instructions":"Turn <b>right</b> onto <b>Duke Street</b>","maneuver":"turn-right","polyline":{"points":"qjqdIrsee@L{BBa@Bq@R_D"},"start_location":{"lat":53.3420082,"lng":-6.259940100000001},"travel_mode":"WALKING"},{"distance":{"text":"3 m","value":3},"duration":{"text":"1 min","value":2},"end_location":{"lat":53.34177649999999,"lng":-6.258109600000001},"html_instructions":"Turn <b>right</b> onto <b>Dawson Street/R138</b>","maneuver":"turn-right","polyline":{"points":"giqdIbhee@B@"},"start_location":{"lat":53.3418047,"lng":-6.258103999999999},"travel_mode":"WALKING"},{"distance":{"text":"60 m","value":60},"duration":{"text":"1 min","value":48},"end_location":{"lat":53.3416771,"lng":-6.257216300000001},"html_instructions":"Turn <b>left</b> onto <b>Dawson Lane</b>","maneuver":"turn-left","polyline":{"points":"ciqdIdhee@RqD"},"start_location":{"lat":53.34177649999999,"lng":-6.258109600000001},"travel_mode":"WALKING"},{"distance":{"text":"29 m","value":29},"duration":{"text":"1 min","value":22},"end_location":{"lat":53.3414199,"lng":-6.2572306},"html_instructions":"Turn <b>right</b> to stay on <b>Dawson Lane</b>","maneuver":"turn-right","polyline":{"points":"ohqdIrbee@r@@"},"start_location":{"lat":53.3416771,"lng":-6.257216300000001},"travel_mode":"WALKING"},{"distance":{"text":"29 m","value":29},"duration":{"text":"1 min","value":19},"end_location":{"lat":53.3416771,"lng":-6.257216300000001},"html_instructions":"Make a <b>U-turn</b>","maneuver":"uturn-right","polyline":{"points":"{fqdItbee@s@A"},"start_location":{"lat":53.3414199,"lng":-6.2572306},"travel_mode":"WALKING"},{"distance":{"text":"60 m","value":60},"duration":{"text":"1 min","value":44},"end_location":{"lat":53.34177649999999,"lng":-6.258109600000001},"html_instructions":"Turn <b>left</b> to stay on <b>Dawson Lane</b>","maneuver":"turn-left","polyline":{"points":"ohqdIrbee@SpD"},"start_location":{"lat":53.3416771,"lng":-6.257216300000001},"travel_mode":"WALKING"},{"distance":{"text":"0.1 km","value":119},"duration":{"text":"1 min","value":81},"end_location":{"lat":53.3428275,"lng":-6.2577786},"html_instructions":"Turn <b>right</b> onto <b>Dawson Street/R138</b>","maneuver":"turn-right","polyline":{"points":"ciqdIdhee@CAyDy@IAIC"},"start_location":{"lat":53.34177649999999,"lng":-6.258109600000001},"travel_mode":"WALKING"},{"distance":{"text":"0.2 km","value":232},"duration":{"text":"3 mins","value":173},"end_location":{"lat":53.34435,"lng":-6.25943},"html_instructions":"Turn <b>left</b> onto <b>Nassau Street/R138</b><div style=\"font-size:0.9em\">Continue to follow R138</div>","maneuver":"turn-left","polyline":{"points":"uoqdIbfee@GFEFEHERKf@W`CGd@KRIHIFE@A?YAWAs@CI?K@QDKDKFSNGD"},"start_location":{"lat":53.3428275,"lng":-6.2577786},"travel_mode":"WALKING"},{"distance":{"text":"0.3 km","value":323},"duration":{"text":"4 mins","value":251},"end_location":{"lat":53.3441758,"lng":-6.2642789},"html_instructions":"Turn <b>left</b> onto <b>College Green/R137</b><div style=\"font-size:0.9em\">Continue to follow R137</div>","maneuver":"turn-left","polyline":{"points":"eyqdIlpee@?^AV@Z?P@VD|C@X?D@bAB~AB`ABj@CX@PBtCATBdAD|A"},"start_location":{"lat":53.34435,"lng":-6.25943},"travel_mode":"WALKING"},{"distance":{"text":"91 m","value":91},"duration":{"text":"1 min","value":66},"end_location":{"lat":53.3449932,"lng":-6.2642802},"html_instructions":"Turn <b>right</b> onto <b>Temple Lane South</b>","maneuver":"turn-right","polyline":{"points":"cxqdIvnfe@cCA]@"},"start_location":{"lat":53.3441758,"lng":-6.2642789},"travel_mode":"WALKING"}],"via_waypoint":[{"location":{"lat":53.3417593,"lng":-6.257955},"step_index":5,"step_interpolation":0.1730586706501407}]}],"overview_polyline":{"points":"ihqdIp~ee@sAmAZcBHu@?SLw@BMk@[P}CVqEB@RqDr@@s@ASpDCAcE{@ICGFKPQz@_@fDU\\OHgBGU@]J_@VGD?^?r@@h@H`GF`DBj@CXDfD@zAD|AcCA]@"},"summary":"R137","warnings":["Walking directions are in beta.    Use caution – This route may be missing sidewalks or pedestrian paths."],"waypoint_order":[]}],"status":"OK"};
		processRouteData(route_data);
		animated_map_init();
		/**/
	}

	init();
})