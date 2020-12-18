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
            "municipalities": d3.json("data/geo/municipalities.json"),
            "districts": d3.json("data/geo/districts.json"),
            "neighbourhoods": d3.json("data/geo/neighbourhoods.json"),
        }

        this.prepare();
    }

    prepare() {

        // Disable context menu
        $("#map").bind("contextmenu", () => false);
        
        // Create SVG hierarchy
        this.svg = d3.select("#map").append("svg");
        this.group = this.svg.append("g")
            .attr("cursor", "pointer")
            .attr('stroke', "black");

        // Prepare zoom functionality
        this.zoom = d3.zoom()
            .scaleExtent([1, 30])
            .on("zoom", event => {
                const { transform } = event;
                this.group.attr("transform", transform);
                this.group.attr("stroke-width", 1 / transform.k);
            });
        this.svg.call(this.zoom);

        // Setup projection and path
        this.projection = d3.geoAlbers()
            .rotate([0, 0])
            .parallels([40, 50])
        this.path = d3.geoPath()
            .projection(this.projection);

        this.select("NL00");

        // Add deselect controls
        $(document).on("keydown", event => {
            if (event.key == "Escape") {
                this.deselect();
            }
        });
    }

    select(identifier) {

        var render_required = false;

        if (identifier.startsWith("NL")) {
            render_required = (this.selection.country != identifier);
            this.selection.country = identifier;
        }

        if (identifier.startsWith("GM")) {
            render_required = (this.selection.municipality != identifier);
            this.selection.municipality = identifier;
        }

        if (identifier.startsWith("WK")) {
            render_required = (this.selection.district != identifier);
            this.selection.district = identifier;
        }

        if (identifier.startsWith("BU")) {
            render_required = (this.selection.neighbourhood != identifier);
            this.selection.neighbourhood = identifier;
        }

        if (render_required) {
            this.render();
        }
    }

    deselect() {

        var render_required = false;
    
        if (this.selection.neighbourhood) {
            this.selection.neighbourhood = null;
            render_required = true;
        } else if (this.selection.district) {
            this.selection.district = null;
            render_required = true;
        } else if (this.selection.municipality) {
            this.selection.municipality = null;
            render_required = true;
        }
    
        if (render_required) {
            this.render();
        }
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.svg.attr("viewBox", [0, 0, width, height]);
    }

    render() {
        if (this.selection.neighbourhood) {
            this.render_neighbourhood(this.selection.district, this.selection.neighbourhood);

        } else if (this.selection.district) {
            this.render_group(this.selection.district, "neighbourhoods");

        } else if (this.selection.municipality) {
            this.render_group(this.selection.municipality, "districts");

        } else if (this.selection.country) {
            this.render_group(this.selection.country, "municipalities");
        }
    }

    render_neighbourhood(district_id, neighbourhood_id) {

        // Load data
        load(district_id, objects => {
            this.promises["neighbourhoods"].then(geo_data => {

                // Select objects
                var geo_objects = get_objects(geo_data);
                geo_objects = select_objects(geo_objects, [neighbourhood_id]);

                // Render objects
                this.render_objects(geo_data, geo_objects, objects);
            });
        });
    }

    render_group(identifier, level) {

        // Load data
        load(identifier, objects => {
            this.promises[level].then(geo_data => {

                // Select objects
                var geo_objects = get_objects(geo_data);
                const codes = objects.map(object => object.code);
                geo_objects = select_objects(geo_objects, codes);

                // Configure projection
                if (level == "municipalities") {
                    this.configure_projection(geo_data, geo_objects);
                }

                // Render objects
                this.render_objects(geo_data, geo_objects, objects);
            });
        });
    }

    configure_projection(geo_data, geo_objects) {
        this.projection.fitExtent([[0, 0], [this.width, this.height]], topojson.feature(geo_data, geo_objects))
    }

    render_objects(geo_data, geo_objects, objects) {

        // Create map of objects
        const object_map = {};
        for (const object of objects) {
            object_map[object.code] = object;
        }

        // "self" required due to on_click and on_mouse_over overriding "this"
        const self = this;

        // Zoom whenever a region is clicked
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

        // Highlight a hovered region
        function on_mouse_over(event, geo_object) {
            d3.select(this)
                .transition()
                .style("fill", "white");
        }
    
        // Re-color a no longer highlighted region
        function on_mouse_out(event, geo_object) {
            const color = self.compute_color(object_map, geo_object)
            d3.select(this)
                .transition()
                .style("fill", color);
        }
    
        // Clear group
        this.group.selectAll("path").remove();

        // Select all paths
        this.group.selectAll("path").data(topojson.feature(geo_data, geo_objects).features)
            .join("path")
            .attr("d", this.path)
            .attr("id", geo_object => geo_object.id)
            .attr("fill", geo_object => this.compute_color(object_map, geo_object))
            .on("click", on_click)
            .on("contextmenu", () => this.deselect())
            .on("mouseover", on_mouse_over)
            .on("mouseout", on_mouse_out)
            .append("title")
                .text(feature => feature.properties.statnaam);
    }

    on_click(event, data) {
        event.stopPropagation();
        this.select(data.id);
        this.focus(data);
    }

    compute_color(object_map, geo_object) {

        // Price, healthcare, and education have low variability at municipality level due to 
        // the averaging between the underlying districts.

        const object = object_map[geo_object.id];

        const price = 1.0 - this.preferences.price * (1.0 - object.price);
        const healthcare = 1.0 - this.preferences.healthcare * (1.0 - object.healthcare);
        const education = 1.0 - this.preferences.education * (1.0 - object.education);
        
        const urbanity = 1.0 - Math.abs(this.preferences.urbanity - object.urbanity);
        
        const value = (urbanity * price * healthcare * education);
        return d3.interpolateMagma(value);
    }

    focus(geo_object) {
        const [[x0, y0], [x1, y1]] = this.path.bounds(geo_object);
        const zoomIdentity = d3.zoomIdentity
            .translate(this.width / 2, this.height / 2)
            .scale(Math.min(100, 0.9 / Math.max((x1 - x0) / this.width, (y1 - y0) / this.height)))
            .translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
        this.svg.transition().call(this.zoom.transform,zoomIdentity);
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

function select_objects(geo_objects, selected) {
    return {
        type: geo_objects.type,
        geometries: geo_objects.geometries.filter(geometry => selected.includes(geometry.id))
    }
}

function select_object(geo_objects, identifier) {
    return {
        type: geo_objects.type,
        geometries: [geo_objects.geometries.find(geometry => geometry.id == identifier)]
    }
}