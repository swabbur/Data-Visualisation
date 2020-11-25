class Graph {

    constructor(container) {

        this.container = container;

        // Configure

        this.dimensions = {
            width: get_dimensions(container).width,
            height: get_dimensions(container).height - 5,
        }
        
        this.margin = {
            top: 25,
            bottom: 25,
            left: 25,
            right: 25,
        }
        
        this.design = {
            color: "red",
            radius: 4,
            interpolation: d3.curveCardinal,
            transition: {
                ease: d3.easeCubicInOut,
                duration: 1000,
            },
        }
        
        // Create graph
        
        this.graph = d3.select(container).append("svg")
            .attr("width", this.dimensions.width)
            .attr("height", this.dimensions.height);
        
        // Create scales
        
        this.xScale = d3.scaleLinear()
            .range([this.margin.left, this.dimensions.width - this.margin.right]);
        
        this.yScale = d3.scaleLinear()
            .range([this.dimensions.height - this.margin.bottom, this.margin.top]);
            
        // Initialize empty

        this.render([])
    }

    load(path) {
        fetch(path)
        .then(response => response.text())
        .then(data => {
            const rows = d3.csvParse(data, d3.autoType);
            this.render(rows);
        });
    }

    render(rows) {

        this.xScale.domain(d3.extent(rows, row => row.year));
        this.yScale.domain(d3.extent(rows, row => row.total));
    
        // Add area
    
        const area = d3.area()
            .curve(this.design.interpolation)
            .x(row => this.xScale(row.year))
            .y0(this.dimensions.height - this.margin.bottom)
            .y1(row => this.yScale(row.total));
    
        this.graph.append("path")
            .attr("stroke", "none")
            .attr("fill", this.design.color)
            .attr("fill-opacity", 0.33)
            .attr("d", area(rows));
    
        // const area2 = d3.area()
        //     .curve(this.design.interpolation)
        //     .x(row => this.xScale(row.year))
        //     .y0(this.dimensions.height - this.margin.bottom)
        //     .y1(row => this.yScale(row.movie));
    
        // this.graph.append("path")
        //     .attr("stroke", "none")
        //     .attr("fill", "red")
        //     .attr("fill-opacity", 0.33)
        //     .attr("d", area2(rows));

        // Add line
    
        const line = d3.line()
            .curve(this.design.interpolation)
            .x(row => this.xScale(row.year))
            .y(row => this.yScale(row.total));
    
        this.graph.append("path")
            .attr("fill", "none")
            .attr("stroke", this.design.color)
            .attr("stroke-width", 2)
            .attr("stroke-opacity", 0.67)
            .attr("d", line(rows));
    
        // const line2 = d3.line()
        //     .curve(this.design.interpolation)
        //     .x(row => this.xScale(row.year))
        //     .y(row => this.yScale(row.movie));
    
        // this.graph.append("path")
        //     .attr("fill", "none")
        //     .attr("stroke", "red")
        //     .attr("stroke-width", 2)
        //     .attr("stroke-opacity", 0.67)
        //     .attr("d", line2(rows));
        
        // Add markers
    
        const markers = this.graph.selectAll("circle").data(rows);
    
        markers.enter()
            .append("circle")
            .attr("fill", this.design.color)
            .attr("r", this.design.radius)
            .attr("cx", row => this.xScale(row.year))
            .attr("cy", row => this.yScale(row.total));
    
        markers
            .transition()
            .duration(this.design.transition.duration)
            .ease(this.design.transition.ease)
            .attr("cx", row => this.xScale(row.year))
            .attr("cy", row => this.yScale(row.total));
    
        markers.exit()
            .remove();
    
        // const markers2 = this.graph.selectAll("rect").data(rows);
    
        // markers2.enter()
        //     .append("rect")
        //     .attr("fill", "red")
        //     .attr("width", this.design.radius * 2)
        //     .attr("height", this.design.radius * 2)
        //     .attr("x", row => this.xScale(row.year) - this.design.radius)
        //     .attr("y", row => this.yScale(row.movie) - this.design.radius);
    
        // markers2
        //     .transition()
        //     .duration(this.design.transition.duration)
        //     .ease(this.design.transition.ease)
        //     .attr("x", row => this.xScale(row.year) - this.design.radius)
        //     .attr("y", row => this.yScale(row.movie) - this.design.radius);
    
        // markers2.exit()
        //     .remove();
        
        // Add x-axis
    
        const xAxis = d3.axisBottom()
            .scale(this.xScale)
            .tickFormat(d3.format("d"));
            
        this.graph.append("g")
            .attr("transform", "translate(0, " + (this.dimensions.height - this.margin.bottom) + ")")
            .call(xAxis);
    }

    destroy() {
        this.container.removeChild(this.graph.node());
    }
}
