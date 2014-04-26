$(function() {


	/* Universal instance variables */
	var complete_tags = []; // The complete list of all possible tags
	var selected_tags = [] // The list of tags the user is choosing to use
	var selected_locastions = [] // The list of points the user is choosing to use
	var location = { // The location information for the user
		text: "",
		lat: 0,
		lng: 0
	};

	/* Init
	 * Loads tag list
	 */
	function init() {
		$.ajax({
			url: '/static/data/tags.json',
			type: 'get',
			dataType: 'json'
		})
		 .done(function(data) {
		 	complete_tags = data;
		 	sceneA();
		 })
	}


	/* Scene A
	 * The user is introduced to the app
	 * The user is asked to enter their current location.
	 */
	function sceneA() {
		
		function redraw() {}
		function next() {}

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
		var $tags = $("#tags"); // The html element where tags are rendered
		var rendered_tags = []; // The list of tags being rentered

		function redraw() {
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
			var new_tags = getRandomSubarray(arr_diff(complete_tags, selected_tags), new_tag_count);
			rendered_tags = selected_tags.concat(new_tags); 
		}

		function randomizeTags() {
			selected_tags = getRandomSubarray(arr_diff(complete_tags, selected_tags), 4);
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
		
		function redraw() {}
		function next() {}

		$(".scene").hide();
		$("#scene-c").show();
	}

	function sceneD() {
		
		function redraw() {}

		$(".scene").hide();
		$("#scene-d").show();
	}

	init();
})