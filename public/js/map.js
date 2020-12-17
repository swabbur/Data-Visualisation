export class Map {

    provinces = [];
    municipalities = [];
    districts = [];
    neighbourhoods = [];

    constructor(width, height) {

        this.svg = d3.select("#map").append("svg");

        this.group = this.svg.append("g")
            .attr("cursor", "pointer")
            .attr('stroke', "black");

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

        this.promises = {
            "provinces": d3.json("data/geo/provinces.json"),
            "municipalities": d3.json("data/geo/municipalities.json"),
            "districts": d3.json("data/geo/districts.json"),
            "neighbourhoods": d3.json("data/geo/neighbourhoods.json"),
        }

        this.promises["municipalities"].then(geo_data => {
            this.render_data(geo_data);
        });
    }

    render_data(geo_data) {
        for (const key in geo_data.objects) {
            if (geo_data.objects.hasOwnProperty(key)) {
                const geo_objects = geo_data.objects[key];
                this.render_objects(geo_data, geo_objects);
            }
        }
    }

    render_objects(geo_data, geo_objects) {

        console.log(geo_objects);

        const features = topojson.feature(geo_data, geo_objects);

        this.projection.fitExtent([[0, 0], [this.width, this.height]], features)
    
        // Required due to function overriding "this".
        const self = this;
        function on_click(event, data) {

            self.select(data.id);

            const [[x0, y0], [x1, y1]] = self.path.bounds(data);

            const zoomIdentity = d3.zoomIdentity
                .translate(self.width / 2, self.height / 2)
                .scale(Math.min(40, 0.9 / Math.max((x1 - x0) / self.width, (y1 - y0) / self.height)))
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
    
        this.group
            .selectAll("path")
            .data(features.features)
                .join("path")
                .attr("d", this.path)
                .attr("id", data => data.id)
                .attr("fill", d3.interpolateMagma(0.5))
                .on("click", on_click)
                .on("mouseover", on_mouse_over)
                .on("mouseout", on_mouse_out)
                .append("title")
                    .text(data => data.properties.statnaam);
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.svg.attr("viewBox", [0, 0, width, height]);
    }

    update(preferences, requirements) {

    }

    select(identifier) {

        if (identifier.startsWith("BU")) {
            return;
        }

        d3.json("./data/split/84583NED_84718NED/" + identifier + ".json")
            .then(regions => {
                console.log(regions);
            });
    }
}
