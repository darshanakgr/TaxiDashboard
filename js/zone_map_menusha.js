var map = L.map('map').setView([ 1.330875, 103.827381 ], 11.4); // 1.3096622448984000,
																// 103.7689017333800

map.doubleClickZoom.disable();

var currentCategory = "footfall";
var geojson;
var maxValue = 10000;
var paths = new Array();
var marker = new Array();
var legend;
var info = L.control();
var currentHour = 0;
var currentDay = 1;
var currentMonth = 5;
var origin = 1;

// console.log(campus2["features"][0]);

var options = {
	position : 'topleft',
	title : 'Search',
	placeholder : 'enter link id ',
	maxResultLength : 15,
	threshold : 0.5,
	showInvisibleFeatures : true,
	showResultFct : function(feature, container) {
		props = feature.properties;
		var name = L.DomUtil.create('b', null, container);
		name.innerHTML = props.id;

		container.appendChild(L.DomUtil.create('br', null, container));

		var cat = props.id
		info = '' + cat + ', ' + 'th link';
		container.appendChild(document.createTextNode(info));
	}
};

/*
 * methods to change the color::: change the opacity :: change the h in hsl keep
 * opacity 1 :: change s & l in hsl
 */

function getColor(d) {
	var value = d ;
	var s = value * 100 / 4 + 75;
	var v = (1.0 - value * 1.5) * 50 + 50;
	return currentCategory == "footfall" ? "hsl(0, " + s + "%, " + v + "%)"	: 
			currentCategory == "rainfall" ? "hsl(300, " + s + "%, " + v + "%)" :
				currentCategory == "stayduration" ? "hsl(285, " + s + "%, " + v	+ "%)" :
					currentCategory == "freetaxi" ? "hsl(265, " + s + "%, " + v + "%)" :
						currentCategory == "subzoneingress" ? "hsl(195, " + s + "%, " + v	+ "%)" : 
							currentCategory == "subzoneegress" ? "hsl(165, " + s + "%, " + v	+ "%)":
								currentCategory == "planningareaegress" ? "hsl(75, " + s + "%, " + v	+ "%)":
									currentCategory == "odplanningarea" ? "hsl(60, " + s + "%, " + v	+ "%)":
										currentCategory == "model1" ? "hsl(30, " + s + "%, " + v	+ "%)"://45
											currentCategory == "model2" ? "hsl(30, " + s + "%, " + v	+ "%)":
												currentCategory == "model3" ? "hsl(30, " + s + "%, " + v	+ "%)"://330
													"hsl(30, " + s + "%, " + v + "%)";//175
}

function getErrorColor(lowest_error){
    switch (lowest_error) {
        case "lm_rmse":
            return "#9b59b6"
        case "arima_rmse":
            return "#3498db"
        case "egress_rmse":
            return "#1abc9c"
        case "ingress_rmse":
            return "#34495e"
        default:
            return "#ecf0f1"
    }
}


function style(feature) {
    // console.log(feature)
    if(feature.properties.Error){
        return {
            weight : 1,
            opacity : 1,
            color : '#E2E2E2',
            fillOpacity : 1,
            fillColor : getErrorColor(feature.properties.Value)
        };
    }else{
        return {
            weight : 1,
            opacity : 1,
            color : '#E2E2E2',
            fillOpacity : 1,
            fillColor : getColor(feature.properties.Value/ maxValue) //isSelected(feature.properties.Id) ? "#2980b9" : "#95a5a6"
        };
    }
}

function highlightFeature(e) {
    var layer = e.target;
	// console.log(layer)
	layer.setStyle({
		weight : 3,
		color : '#007d80',
		dashArray : '',
		fillOpacity : 0.7
	});

	if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge && currentCategory !== "odplanningarea") {
		layer.bringToFront();
	}

	info.update(layer.feature.properties);
}

function resetHighlight(e) {
	geojson.resetStyle(e.target);
	info.update();
}


function zoomToFeature(e) {
	map.fitBounds(e.target.getBounds());
	map.doubleClickZoom.disable();
}


info.update = function(props) {
    this._div.innerHTML = '<h4><b>Subzone Details<b></h4>'
                + (props ? '<h4><b>Name : </b></h4><b>' + props.Name
                + '</b><br /><h4><b> Zone Id : </b></h4><b>' + props.Id
                + '</b><br /><h4><b> Value: </b></h4><b>' + props.Value
                + '</b><br />' : 'Hover over a grid');
    if(props){
        if(props.Error){
            this._div.innerHTML = '<h4><b>Subzone Details<b></h4>'
                    + (props ? '<h4><b>Name : </b></h4><b>' + props.Name
                    + '</b><br /><h4><b> Zone Id : </b></h4><b>' + props.Id
                    + '</b><br /><h4><b> LM      : </b></h4><b>' + props.lm
                    + '</b><br /><h4><b> ARMA    : </b></h4><b>' + props.arima
                    + '</b><br /><h4><b> EGRESS  : </b></h4><b>' + props.egress
                    + '</b><br /><h4><b> INGRESS : </b></h4><b>' + props.ingress
                    + '</b><br /><h4><b> Value   : </b></h4><b>' + props.Value
                    + '</b><br />' : 'Hover over a grid');
        }
    }
};

function animate(x, z) {
	var y = [ (x[0] + 0.04), (z[1] + 0.04) ];

	var pathOne = L.curve([ 'M', x, 'Q', y, z ], {dashArray: 5, color:'darkblue', animate: {duration: 3000, iterations: Infinity}});//{animate :  {duration: 3000000},  color:'black'});
    
    paths.push(pathOne);
}



function whenClicked(e) {
	if (currentCategory == "odplanningarea" && e.target.feature.properties.selected) {
		origin = e.target.feature.properties.No;
		mapupdatecolor();
	}
}

function onEachFeature(feature, layer) {
	feature.layer = layer;	
	
	layer.on({
		mouseover : highlightFeature,
		mouseout : resetHighlight,
		click : whenClicked

	});

	var popupContent = '<b>' + currentCategory + ' : '
			+ feature.properties.Value + '</b>';
	;

	layer.bindPopup(popupContent);
	feature.layer = layer;

}

function makeActive(id) {
    const selected = $("#distribution").val();
    switch(selected){
        case "0":
            mapupdatecolor(0)
            break;
        case "1":
            mapupdatecolor(1)
            break;
        case "2":
            mapupdatecolor(2)
            break;
        case "3":
            mapupdatecolor(3)
            break;
        case "4":
            mapupdatecolor(4)
            break;
        case "5":
            mapupdatecolor(5)
            break;
        case "6":
            console.log("B");
            break;
        default:
            console.log("C");
    }
}

function selectModel(id) {
	$('#modelBtns').css('visibility', 'visible');
	$('.nav-list').removeClass('active');
	$('#' + id).addClass('active');
}

$(document).ready(function() {
	$("#hourSelection").change(function() {
		currentHour = $("#hourSelection").val();
		mapupdatecolor();
	});
	$("#daySelection").change(function() {		
		currentDay = $("#daySelection").val();		
		mapupdatecolor();
	});
	$("#monthSelection").change(function() {
		currentMonth = $("#monthSelection").val();
		mapupdatecolor();
	});
});

function mapupdatecolor(index) {
    
    for (var i = 0; i < marker.length; i++) {
		map.removeLayer(marker[i]);
	}	
	for (var i = 0; i < paths.length; i++) {
		map.removeLayer(paths[i]);
	}
    
    paths = new Array();
	marker= new Array();
    
    var mapcategory;
	
    mapcategory = campus2;
    maptitle = "Subzone Ingress in Singapore";

    if(index == 0){
        for (i = 0; i < mapcategory['features'].length; i++) {
            mapcategory['features'][i]['properties']['Error'] = false;
            mapcategory['features'][i]['properties']['Value'] = getTripCount(mapcategory['features'][i]['properties']['Id']);
        }
        maxValue = getMaxTripCount();
    } else if(index == 1) {
        for (i = 0; i < mapcategory['features'].length; i++) {
            mapcategory['features'][i]['properties']['Error'] = false;
            mapcategory['features'][i]['properties']['Value'] = getEgressCount(mapcategory['features'][i]['properties']['Id']);
        }
        maxValue = getMaxEgressCount();
    } else if(index == 2) {
        for (i = 0; i < mapcategory['features'].length; i++) {
            mapcategory['features'][i]['properties']['Error'] = false;
            mapcategory['features'][i]['properties']['Value'] = getIngressCount(mapcategory['features'][i]['properties']['Id']);
        }
        maxValue = getMaxIngressCount();
    } else if(index == 3) {
        for (i = 0; i < mapcategory['features'].length; i++) {
            mapcategory['features'][i]['properties']['Error'] = true;
            mapcategory['features'][i]['properties']['lm'] = getSingleRMSE(mapcategory['features'][i]['properties']['Id']).lm_rmse;
            mapcategory['features'][i]['properties']['arima'] = getSingleRMSE(mapcategory['features'][i]['properties']['Id']).arima_rmse;
            mapcategory['features'][i]['properties']['egress'] = getSingleRMSE(mapcategory['features'][i]['properties']['Id']).egress_rmse;
            mapcategory['features'][i]['properties']['ingress'] = getSingleRMSE(mapcategory['features'][i]['properties']['Id']).ingress_rmse;
            mapcategory['features'][i]['properties']['Value'] = getSingleRMSE(mapcategory['features'][i]['properties']['Id']).lowest_error;
        }
    } else if(index == 4) {
        for (i = 0; i < mapcategory['features'].length; i++) {
            mapcategory['features'][i]['properties']['Error'] = true;
            mapcategory['features'][i]['properties']['lm'] = getPeriodRMSE(mapcategory['features'][i]['properties']['Id']).lm_rmse;
            mapcategory['features'][i]['properties']['arima'] = getPeriodRMSE(mapcategory['features'][i]['properties']['Id']).arima_rmse;
            mapcategory['features'][i]['properties']['egress'] = getPeriodRMSE(mapcategory['features'][i]['properties']['Id']).egress_rmse;
            mapcategory['features'][i]['properties']['ingress'] = getPeriodRMSE(mapcategory['features'][i]['properties']['Id']).ingress_rmse;
            mapcategory['features'][i]['properties']['Value'] = getPeriodRMSE(mapcategory['features'][i]['properties']['Id']).lowest_error;
        }
    } else if(index == 5) {
        for (i = 0; i < mapcategory['features'].length; i++) {
            mapcategory['features'][i]['properties']['Error'] = true;
            mapcategory['features'][i]['properties']['lm'] = getDayRMSE(mapcategory['features'][i]['properties']['Id']).lm_rmse;
            mapcategory['features'][i]['properties']['arima'] = getDayRMSE(mapcategory['features'][i]['properties']['Id']).arima_rmse;
            mapcategory['features'][i]['properties']['egress'] = getDayRMSE(mapcategory['features'][i]['properties']['Id']).egress_rmse;
            mapcategory['features'][i]['properties']['ingress'] = getDayRMSE(mapcategory['features'][i]['properties']['Id']).ingress_rmse;
            mapcategory['features'][i]['properties']['Value'] = getDayRMSE(mapcategory['features'][i]['properties']['Id']).lowest_error;
        }
    } else {
        for (i = 0; i < mapcategory['features'].length; i++) {
            mapcategory['features'][i]['properties']['Value'] = 0;
        }
    }
    
    // reset map
    if (geojson) {
        geojson.remove();
    }

    geojson = L.geoJson(mapcategory, {
        style : style,
        onEachFeature : onEachFeature
    });
    
    geojson.addTo(map);
    
    for (var i = 0; i < marker.length; i++) {
        marker[i].addTo(map);
    }
    for (var i = 0; i < paths.length; i++) {
        paths[i].addTo(map);
    }

	if (legend) {
		map.removeControl(legend);
	}		
    
    legend = L.control({position: 'bottomright'});	
    
    legend.onAdd = function (map) {
	    var div = L.DomUtil.create('div', 'info legend'),
	        grades = [0, maxValue*0.1, maxValue*0.2, maxValue*0.3, maxValue*0.4, maxValue*0.5, maxValue*0.6, maxValue*0.7, maxValue*0.8, maxValue*0.9, maxValue],
	        labels = [];
	    for (var i = 0; i < grades.length; i++) {
	        div.innerHTML +=
	            '<i style="background:' + getColor(grades[i]/maxValue) + '"></i> ' +
	           parseInt( grades[i]) + (grades[i + 1] ? '&ndash;' + parseInt(grades[i + 1]) + ' <br>': '+');
	    }
	    return div;
    };
    
    if(index >= 3){
        legend.onAdd = function (map) {
            var div = L.DomUtil.create('div', 'info legend'),
                grades = ["#9b59b6", "#3498db", "#1abc9c", "#34495e", "#ecf0f1"],
                labels = ["LM", "ARIMA", "EGRESS", "INGRESS", "NA"];
            for (var i = 0; i < grades.length; i++) {
                div.innerHTML += `<i style="background:${grades[i]}"></i> ${labels[i]} <br>`;
            }
            return div;
        };
    }

	legend.addTo(map);
}

$(window).on('load', function() {
	mapupdatecolor();
});

info.onAdd = function(map) {

	this._div = L.DomUtil.create('div', 'info'); // create a div with a class
													// "info"
	this.update();
	return this._div;
};

info.addTo(map);
