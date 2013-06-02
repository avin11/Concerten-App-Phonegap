var app = {};

// Concert model
app.Concert = Backbone.Model.extend({
	constructor: function(attributes, options) {
		Backbone.Model.apply( this, arguments );
		// Maak datum object van string die LastFM levert
		this.maakDatum();
	},
	// Haalt datum en tijd uit de standaard string die LastFM levert
	maakDatum: function() {
		var datum = new Date(this.get("startDate"));	

		// Zet datum 
		this.set("datum", datum);

		// Zet nummers stuk voor stuk
		this.set("dag", datum.getDate());
		this.set("maand", datum.getMonth() + 1);
		this.set("jaar", datum.getFullYear());
		this.set("weekDag", datum.getDay());
		this.set("uur", datum.getUTCHours());
		this.set("minuut", datum.getUTCMinutes());
	}
});

// Maakt Backbone concert-model vanuit JSON data
app.haalConcert = function(id) {
	var resultaat;

	// Haal concert uit LastFM API
	$.ajax({
		url:'http://ws.audioscrobbler.com/2.0/?method=event.getinfo&event=' + id + '&api_key=db82d9522dfa21bd4b52ebcb3cba3eb3&format=json',
		success: function(antwoord) {
			resultaat = antwoord;
		},
		async: false	// Asynchroon uit zodat de view niet laadt voordat de data er is
	});

	if (typeof(resultaat.error) != 'undefined') { 
		alert(Error(resultaat.message));
	}
	return new app.Concert(resultaat.event);
}

// View testdriver
app.testdriverView = Backbone.View.extend({
	tagName: "div",
	id: "div-testdriver",

	events: {
		"click #driver-knop": "openConcert"
	},
	initialize: function() {
		this.template = _.template($("#testdriver-template").html());
	},
	openConcert: function() {
		// Linken naar concert details
		var concertId = $("#driver-concertid").val();
		app.appRouter.navigate("concert/" + concertId, {trigger: true});
		window.location.reload();	// Pagina herladen zodat Backbone niet teruggaat naar home
	},
	render: function() {
		var container = this.options.viewContainer,	// HTML element waarin view getoond moet worden
			template = this.template,	// Template van de view
			testdriverView = $(this.el);	// HTML element van de view

		testdriverView.html(template({}));	// Vul HTML element met de driver template

		container.html(testdriverView);	// Laat driver zien
		container.trigger('create');	// Laad jQuery Mobile UI
		
		return this;
	}
});

// View concert
app.concertView = Backbone.View.extend({
	tagName: "div",
	id: "div-concertview",

	initialize: function() {
		this.template = _.template($("#concert-template").html());
	},
	render: function() {
		var container = this.options.viewContainer,	// HTML element waarin view getoond moet worden
			concert = this.options.concert,	// Concert dat weergegeven moet worden
			template = this.template,	// Template van de view
			concertView = $(this.el);	// HTML element van de view


		concertView.html(template(concert.toJSON()));	// Vul HTML element met de concert template
		container.html(concertView);	// Laat concert zien
		container.trigger('create');	// Laad jQuery Mobile UI
		
		return this;
	}
});


// View concertdetails
app.concertDetailsView = Backbone.View.extend({
	events: {
		"click #poster_link": "zoomPoster"
	},
	initialize: function() {
		this.template = _.template($("#concert-details-template").html());
	},
	// Zoom poster in
	zoomPoster: function() {
		var posterAfbeelding = $("#poster_afbeelding"),
			concertAfbeeldingen = this.options.concert.get("image");
		if(posterAfbeelding.hasClass("klein")) {
			// Maak groter
			posterAfbeelding.attr("src", concertAfbeeldingen[3]["#text"]);	// Verander afbeelding
			posterAfbeelding.removeClass("klein").addClass("groot");	// Verander class voor verkleinen
		}	
		else {
			// Maak kleiner
			posterAfbeelding.attr("src", concertAfbeeldingen[2]["#text"]);	// Verander afbeelding
			posterAfbeelding.removeClass("groot").addClass("klein");	// Verander class voor vergroten
		}
	},
	render: function() {
		var container = this.options.viewContainer,	// HTML element waarin view getoond moet worden
			concert = this.options.concert,	// Concert waarvan details weergegeven moeten worden
			template = this.template,	// Template van de view
			detailsView = $(this.el);	// HTML element van de view

		container.empty();	// Maak HTML element leeg
		detailsView.html(template(concert.toJSON()));	// Vul HTML element met de concertdetails
		container.html(detailsView);	// Laat de details zien
		container.trigger('create');	// Laad jQuery Mobile UI
		return this;
	}
});

// View concert locatie
app.concertLocatieView = Backbone.View.extend({
	initialize: function() {
		this.template = _.template($("#concert-locatie-template").html());
	},
	render: function() {
		var container = this.options.viewContainer,	// HTML element waarin view getoond moet worden
			concert = this.options.concert,	// Concert waarvan locatie weergegeven moeten worden
			template = this.template,	// Template van de view
			locatieView = $(this.el);	// HTML element van de view

		container.empty();	// Maak HTML element leeg
		locatieView.html(template(concert.toJSON()));	// Vul HTML element met de concertdetails
		container.html(locatieView);	// Laat de locatie zien
		container.trigger('create');	// Laad jQuery Mobile UI

		// Laad Google Maps
		var concertLocatie = concert.get("venue");	// Waar het concert plaatsvindt
		var mapOptions = {
          center: new google.maps.LatLng(concertLocatie["location"]["geo:point"]["geo:lat"], concertLocatie["location"]["geo:point"]["geo:long"]),
          zoom: 12,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById("div-kaart"), mapOptions);

        // Zet punaise op de locatie van het concert
        var marker = new google.maps.Marker({
		    position: map.getCenter(),
		    map: map,
		    title: 'Klik om in te zoomen'
		});

        // Maak het infoscherm achter de punaise
        var infoschermTemplate = _.template($("#concert-kaart-infoscherm-template").html());
		var infowindow = new google.maps.InfoWindow({
	    	content: infoschermTemplate(concert.toJSON())
	  	});

		// Bij het klikken op de punaise
		google.maps.event.addListener(marker, 'click', function() {
			// Inzoomen
		    map.setZoom(15);
			map.setCenter(marker.getPosition());
			// Open infoscherm
			infowindow.open(marker.get('map'), marker);
		});

		return this;
	}
});

// View concert artiesten
app.concertArtiestenView = Backbone.View.extend({
	tagName: "ul",
	id: "lijst-concert-artiesten",
	attributes: { "data-role": "listview" },

	initialize: function() {
		this.template = _.template($("#concert-artiesten-template").html());
	},
	render: function() {
		var container = this.options.viewContainer,	// HTML element waarin view getoond moet worden
			concert = this.options.concert,	// Concert waarvan details weergegeven moeten worden
			template = this.template,	// Template van de view
			artiestenLijstView = $(this.el),	// HTML element van de view
			artiesten = concert.get("artists").artist;	// Artiest of lijst van artiesten

		container.empty();	// Maak HTML element leeg
		artiestenLijstView.empty();	// Maak artiestenlijst leeg
		
		// Kijk of er meerdere artiesten zijn
		if(typeof(artiesten) === "object") {
			// Er zijn meerdere artiesten, voeg artiesten stuk voor stuk toe aan de lijst	
			_.each(artiesten, function(artiest) {
				artiestenLijstView.append(template({artiest: artiest}));	// Voeg artiest toe aan de lijst
			});
		}
		else {
			// Er is maar 1 artiest, toon deze artiest
			artiestenLijstView.append(template({artiest: artiesten}));	// Voeg artiest toe aan de lijst
		}

		container.html(artiestenLijstView);	// Laat de details zien
		container.trigger('create');	// Laad jQuery Mobile UI
		return this;
	}
});

// App Router
app.router = Backbone.Router.extend({
	routes: {
		"": "testdriver",
		"concert/:id": "concert_details",
		"concert/:id/locatie": "concert_locatie",
		"concert/:id/artiesten": "concert_artiesten"
	},
	initialize: function(){
	},
	// Test driver om concertscherm te testen
	testdriver: function() {
		// Render driver view
		testdriverView = new app.testdriverView({viewContainer: $("#pagina-content")});
		testdriverView.render();
	},
	// Deze functie laadt de concertView
	laad_concert: function(concert, actieveButton) {
	  	// Render concert view
		concertView = new app.concertView({viewContainer: $("#pagina-content"), concert: concert});
		concertView.render();

		// Zet actieve button in navbar
		$("#concert-navigatie a.ui-btn-active").removeClass("ui-btn-active");
		$("#concert-navigatie a#" + actieveButton).addClass("ui-btn-active");
	},
	concert_details: function(concert_id){
		var concert = app.haalConcert(concert_id);	// Haal concert model op

		this.laad_concert(concert, "button-concert-details");

		var concertDetailsContainer = $('#concert-infotab'),	// Zoek container voor Concert-Details-View
        	concertDetailsView;

	    // Render view met concert details
	    concertDetailsView = new app.concertDetailsView({viewContainer: concertDetailsContainer, concert: concert}); 
	    concertDetailsView.render();
	},
	concert_locatie: function(concert_id) {		
		var concert = app.haalConcert(concert_id);	// Haal concert model op

		this.laad_concert(concert, "button-concert-locatie");	// Laad concert

		var concertLocatieContainer = $('#concert-infotab'),	// Zoek container voor Concert-Locatie-View
        	concertLocatieView;
	    	
	    // Render view met concert locatie
	    concertLocatieView = new app.concertLocatieView({viewContainer: concertLocatieContainer, concert: concert}); 
	    concertLocatieView.render();
	},
	concert_artiesten: function(concert_id) {
		var concert = app.haalConcert(concert_id);	// Haal concert model op

		this.laad_concert(concert, "button-concert-artiesten");

		var concertArtiestenContainer = $('#concert-infotab'),	// Zoek container voor Concert-Locatie-View
        	concertArtiestenView;

	    // Render view met concert locatie
	    concertArtiestenView = new app.concertArtiestenView({viewContainer: concertArtiestenContainer, concert: concert}); 
	    concertArtiestenView.render();
	}
});

$(function() {
	// Schakel app router in
	app.appRouter = new app.router();
	Backbone.history.start();
});