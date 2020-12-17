export class Map {

    constructor(preferences, requirements) {

        this.preferences = preferences;
        this.requirements = requirements;

        this.selection = {
            country: null,
            municipality: null,
            district: null,
            neighbourhood: null,
        };

        this.promises = {
            "provinces": d3.json("data/geo/provinces.json"),
            "municipalities": d3.json("data/geo/municipalities.json"),
            "districts": d3.json("data/geo/districts.json"),
            "neighbourhoods": d3.json("data/geo/neighbourhoods.json"),
        }

        this.setup_renderer();
    }

    setup_renderer() {

        this.svg = d3.select("#map").append("svg");
        this.group = this.svg.append("g")
            .attr("cursor", "pointer")
            .attr('stroke', "black");
        this.groups = {
            "provinces": this.group.append("g"),
            "municipalities": this.group.append("g"),
            "districts": this.group.append("g"),
            "neighbourhoods": this.group.append("g"),
        }

        this.zoom = d3.zoom()
            .scaleExtent([1, 30])
            .on("zoom", event => {
                const { transform } = event;
                this.group.attr("transform", transform);
                this.group.attr("stroke-width", 1 / transform.k);
            });
        this.svg.call(this.zoom);

        this.projection = d3.geoAlbers()
            .rotate([0, 0])
            .parallels([40, 50])
        this.path = d3.geoPath()
            .projection(this.projection);

        this.select("NL00");
        this.render();
    }

    select(identifier) {

        if (identifier.startsWith("NL")) {
            this.selection.country = identifier;
            this.selection.municipality = null;
            this.selection.district = null;
            this.selection.neighbourhood = null;
        }

        if (identifier.startsWith("GM")) {
            this.selection.municipality = identifier;
            this.selection.district = null;
            this.selection.neighbourhood = null;
        }

        if (identifier.startsWith("WK")) {
            this.selection.district = identifier;
            this.selection.neighbourhood = null;
        }

        if (identifier.startsWith("BU")) {
            this.selection.neighbourhood = identifier;
        }

        this.render();
    }

    configure_projection(geo_data, geo_objects) {
        this.projection.fitExtent([[0, 0], [this.width, this.height]], topojson.feature(geo_data, geo_objects))
    }

    render_objects(group, geo_data, geo_objects) {

        // Required due to function overriding "this".
        const self = this;
        function on_click(event, data) {

            self.select(data.id);

            const [[x0, y0], [x1, y1]] = self.path.bounds(data);

            const zoomIdentity = d3.zoomIdentity
                .translate(self.width / 2, self.height / 2)
                .scale(Math.min(100, 0.9 / Math.max((x1 - x0) / self.width, (y1 - y0) / self.height)))
                .translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
        
            self.svg.transition().call(
                self.zoom.transform,
                zoomIdentity
            );

            event.stopPropagation();
        }

        function on_mouse_over(event, data) {
            const hover_color = d3.interpolateMagma(0.5)
            d3.select(this)
                .transition()
                .style("fill", "white");
        }
    
        function on_mouse_out(event, data) {
            d3.select(this)
                .transition()
                .style("fill", d3.interpolateMagma(0.5));
        }
    
        group.selectAll("path")
            .remove();

        group.selectAll("path")
            .data(topojson.feature(geo_data, geo_objects).features)
                .join("path")
                .attr("d", this.path)
                .attr("id", feature => feature.id)
                .attr("fill", d3.interpolateMagma(0.5))
                .on("click", on_click)
                .on("mouseover", on_mouse_over)
                .on("mouseout", on_mouse_out)
                .append("title")
                    .text(feature => feature.properties.statnaam);
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.svg.attr("viewBox", [0, 0, width, height]);
    }

    render() {

        // Select country
        const country = this.selection.country;
        if (country) {

            // Get municipality data
            load(country, municipalities => {
                this.promises["municipalities"].then(geo_country => {
                    var geo_municipalities = get_objects(geo_country);
                    
                    // Configure SVG extent
                    this.configure_projection(geo_country, geo_municipalities);

                    // Filter hidden municipalities
                    const municipality_codes = municipalities.map(municipality => municipality.code);
                    geo_municipalities = select_objects(geo_municipalities, municipality_codes);
                    
                    // Select municipality
                    const municipality = this.selection.municipality;
                    if (municipality) {
                        
                        // Hide selected municipality
                        geo_municipalities = filter_objects(geo_municipalities, municipality);

                        // Get district data
                        load(municipality, districts => {
                            this.promises["districts"].then(geo_municipality => {
                                var geo_districts = get_objects(geo_municipality);

                                // Hide hidden districts
                                const district_codes = districts.map(district => district.code);
                                geo_districts = select_objects(geo_districts, district_codes);
                                
                                // Select district
                                const district = this.selection.district;
                                if (district) {
                                    
                                    // Hide selected district
                                    geo_districts = filter_objects(geo_districts, district);

                                    // Get district data
                                    load(district, neighbourhoods => {
                                        this.promises["neighbourhoods"].then(geo_district => {
                                            var geo_neighbourhoods = get_objects(geo_district);

                                            // Hide hidden districts
                                            const neighbourhood_codes = neighbourhoods.map(neighbourhood => neighbourhood.code);
                                            geo_neighbourhoods = select_objects(geo_neighbourhoods, neighbourhood_codes);
                                            
                                            this.render_objects(this.groups["neighbourhoods"], geo_district, geo_neighbourhoods);
                                        });
                                    });
                                }

                                this.render_objects(this.groups["districts"], geo_municipality, geo_districts);
                            });
                        });
                    }

                    this.render_objects(this.groups["municipalities"], geo_country, geo_municipalities);
                });
            });
        }
    }
}

function load(identifier, callback) {
    d3.json("./data/split/84583NED_84718NED/" + identifier + ".json")
        .then(callback);
}

function get_objects(geo_data) {
    for (const key in geo_data.objects) {
        if (geo_data.objects.hasOwnProperty(key)) {
            return geo_data.objects[key];
        }
    }
}

function filter_objects(geo_objects, exception) {
    return {
        type: geo_objects.type,
        geometries: geo_objects.geometries.filter(geomerty => {
            return geomerty.id != exception;
        })
    }
}

function select_objects(geo_objects, selected) {
    return {
        type: geo_objects.type,
        geometries: geo_objects.geometries.filter(geomerty => {
            return selected.includes(geomerty.id);
        })
    }
}