const width = 500;
const height = 500;


// Create SVG

function reset() {
    // d3.selectAll('.provinces').attr("visibility", "visible")
    d3.selectAll('.gemeente').attr("visibility", "visible")
    d3.selectAll('.buurt').attr("visibility", "hidden")
    d3.selectAll(path).transition().style("fill", null);
    svg.transition().call(
        zoom.transform,
        d3.zoomIdentity,
        d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
    );
}

const svg = d3.select("#map").append("svg")
    .attr("viewBox", [0, 0, width, height])
    .on("click", reset);

const group = svg.append("g");

const projection = d3.geoAlbers()
    .rotate([0, 0])
    .parallels([40, 50])

const path = d3.geoPath()
    .projection(projection);



// Add zoom functionality

function zoomed(event) {

    // if(d3.zoomTransform(this).k<2.5){
    //   // d3.selectAll('.gementee')
    //   //   .attr("visibility", "visible")
    //   d3.selectAll('.provinces')
    //     .attr("visibility", "visible")
    //   d3.selectAll('.gemeente')
    //     .attr("visibility", "hidden")
    //   d3.selectAll('.buurt')
    //     .attr("visibility", "hidden")
    // } else 
    if (d3.zoomTransform(this).k < 5.5) {
        // d3.selectAll('.provinces')
        //   .attr("visibility", "hidden")
        d3.selectAll('.gemeente')
            .attr("visibility", "visible")
        d3.selectAll('.buurt')
            .attr("visibility", "hidden")
    } else if (d3.zoomTransform(this).k >= 7.5) {
        // d3.selectAll('.provinces')
        //   .attr("visibility", "hidden")
        d3.selectAll('.gemeente')
            .attr("visibility", "hidden")
        d3.selectAll('.buurt')
            .attr("visibility", "visible")
    }

    const { transform } = event;
    group.attr("transform", transform);
    group.attr("stroke-width", 1 / transform.k);
}

const zoom = d3.zoom()
    .scaleExtent([1, 30])
    .on("zoom", zoomed);

svg.call(zoom);



// Load data and perform first update

function clicked(event, d) {

    const [[x0, y0], [x1, y1]] = path.bounds(d);
    event.stopPropagation();

    // township.attr('display','block')
    // states = township
    // d3.selectAll('provinces').transition().style("fill", null);

    d3.select(this).transition().style("fill", "null")
        .on("end", () => {

            // a = d.properties.FID
            // d3.select("svg").remove();
            // console.log(d3.selectAll('g'))

            if (d.properties.rubriek == "gemeente") {
                d3.selectAll('.buurt')
                    .attr("visibility", "visible")
                d3.selectAll('.gemeente')
                    .attr("visibility", "hidden")
            } else {
                d3.selectAll('.gemeente')
                    .attr("visibility", "visible")
                d3.selectAll('.provinces')
                    .attr("visibility", "hidden")

            }

            // console.log(d.properties.name)
            // let a=d.properties.name
            // console.log(d3.selectAll('.region').style('display'))
            // if(d3.zoomTransform(this)>1){
            // d3.selectAll('.township').attr("visibility", "visible")
            // d3.selectAll('.region').attr("visibility", "hidden")
            // }
            // township.attr('display','block')
            // d3.select('#'+a).style('display','none'  )
            // d3.selectAll("path").style('display', function(d){ 
            //     var currentID = d3.select(this).attr('id');
            //       return currentID ===a ? 'block' : 'none'
            //     })
        });

    svg.transition().duration(500).call(
        zoom.transform,
        d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(Math.min(40, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
            .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
    );
}

function update() {

    projection.fitExtent([[0, 0], [width, height]], topojson.feature(files[0], files[0].objects.gemeente_2019))

    function handlemouseover(a, b) {
        const hover_color = d3.interpolateMagma(0.5)
        d3.select(this)
            .transition()
            .style("fill", d3.color("white"));
    }

    function handlemouseout(a, b) {
        d3.select(this)
            .transition()
            .style("fill", d3.interpolateMagma(0.5));
    }

    // let provinces = g.append("g")
    //   .attr("class","provinces")
    //   .attr('visibility','hidden')
    //   .attr("fill", "white")
    //   .attr("stroke","black")
    //   .attr("cursor", "pointer")

    //   .selectAll("path")
    //   .data(topojson.feature(topology[0], topology[0].objects.provincie_2019).features)
    //   .join("path")
    //     .on("click", clicked)
    //     .on("mouseover",handlemouseover)
    //     .on("mouseout",handlemouseout)
    //     .attr("d", path)
    //     attr("id",(d)=>{
    //       return d.properties.FID
    //     });

    //  provinces.append("title")
    //  .text(d => d.properties.statnaam);

    let gemeente = group.append("g")
        // .attr('visibility','hidden')
        .attr("class", "gemeente")
        .attr("fill", d3.interpolateMagma(0.5))
        .attr('stroke', 'black')
        .attr("cursor", "pointer")

        .selectAll("path")
        .data(topojson.feature(files[0], files[0].objects.gemeente_2019).features)
        .join("path")
        .on("click", clicked)
        .on("mouseover", handlemouseover)
        .on("mouseout", handlemouseout)
        .attr("d", path)
        .attr("id", (d) => {
            return d.properties.FID
        });
    
    gemeente.append("title")
        .text(d => d.properties.statnaam);

    let buurt = group.append("g")
        .attr('visibility', 'hidden')
        .attr("class", "buurt")
        .attr("fill", d3.interpolateMagma(0.5))
        .attr('stroke', 'black')
        .attr("cursor", "pointer")
        .selectAll("path")
        .data(topojson.feature(files[1], files[1].objects.buurt_2019).features)
        .join("path")
        .on("click", clicked)
        .on("mouseover", handlemouseover)
        .on("mouseout", handlemouseout)
        .attr("d", path)
        .attr("id", (d) => {
            return d.properties.FID
        });
    
    buurt.append("title")
        .text(d => d.properties.statnaam);
};

const promises = [
    d3.json("https://cartomap.github.io/nl/wgs84/gemeente_2019.topojson"),
    d3.json("data/geo.json")
]

var files = [];
Promise
    .all(promises)
    .then(downloads => {
        files = downloads;
        update();
    });
